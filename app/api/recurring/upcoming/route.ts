import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";
import { recurringCategoryDefault } from "@/lib/recurring";
import { applyBalanceDelta, expenseDelta } from "@/lib/db/account-balances";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function nextDueDate(paymentDay: number, from: Date) {
  const year = from.getFullYear();
  const month = from.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(paymentDay, daysInMonth);
  const candidate = new Date(year, month, day);
  if (candidate >= startOfDay(from)) {
    return candidate;
  }
  const nextMonth = new Date(year, month + 1, 1);
  const nextDaysInMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
  const nextDay = Math.min(paymentDay, nextDaysInMonth);
  return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextDay);
}

export async function GET() {
  const requestId = randomUUID();
  try {
    const user = await getCurrentUser();
    const templates = await prisma.recurringTemplate.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { paymentDay: "asc" },
    });

    const today = startOfDay(new Date());
    const end = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const existingTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        transactionDate: { gte: monthStart, lte: monthEnd },
      },
      select: {
        merchantName: true,
        category: true,
        transactionDate: true,
        accountId: true,
      },
    });

    const upcoming = templates
      .map((template) => {
        const dueDate = nextDueDate(template.paymentDay, today);
        return {
          ...template,
          dueDate: dueDate.toISOString().slice(0, 10),
        };
      })
      .map((template) => {
        const paid = existingTransactions.some(
          (tx) =>
            (tx.merchantName || "").trim() === template.name.trim() &&
            tx.category === template.subCategory &&
            tx.accountId === template.accountId &&
            tx.transactionDate &&
            tx.transactionDate.toISOString().slice(0, 10) === template.dueDate,
        );
        return { ...template, paid };
      })
      .filter((template) => {
        const due = new Date(template.dueDate);
        return due >= today && due <= end;
      })
      .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));

    const pastDue = templates
      .map((template) => {
        const dueDate = nextDueDate(template.paymentDay, monthStart);
        return { ...template, dueDate };
      })
      .filter((template) => template.dueDate < today);

    for (const template of pastDue) {
      const dueKey = template.dueDate.toISOString().slice(0, 10);
      const exists = existingTransactions.some(
        (tx) =>
          (tx.merchantName || "").trim() === template.name.trim() &&
          tx.category === template.subCategory &&
          tx.accountId === template.accountId &&
          tx.transactionDate &&
          tx.transactionDate.toISOString().slice(0, 10) === dueKey,
      );
      if (exists) continue;
      const amountCents = Math.round(template.amount * 100);
      const totals = {
        bgnCents: amountCents,
        eurCents: Math.round(amountCents / 1.95583),
      };
      await prisma.$transaction(async (db) => {
        await db.transaction.create({
          data: {
            userId: user.id,
            accountId: template.accountId,
            sourceType: "recurring",
            transactionType: "expense",
            isFixed: true,
            isBalanceApplied: true,
            merchantName: template.name,
            transactionDate: template.dueDate,
            totalBgnCents: totals.bgnCents,
            totalEurCents: totals.eurCents,
            totalBgn: template.amount,
            totalEur: totals.eurCents / 100,
            currencyOriginal: "BGN",
            totalOriginalCents: amountCents,
            totalOriginal: template.amount,
            category: template.subCategory,
            categoryConfidence: 1,
            overallConfidence: 1,
            notes: template.note ?? undefined,
          },
        });
        await applyBalanceDelta(
          expenseDelta(template.accountId, totals.bgnCents, totals.eurCents),
          db,
        );
      });
    }

    return NextResponse.json({
      ok: true,
      data: upcoming.map((template) => ({
        id: template.id,
        name: template.name,
        amount: template.amount,
        category: template.category ?? recurringCategoryDefault,
        subCategory: template.subCategory,
        paymentDay: template.paymentDay,
        note: template.note,
        dueDate: template.dueDate,
        status: template.paid ? "paid" : "unpaid",
      })),
      requestId,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[recurring] upcoming error", { requestId, error });
    return jsonError(500, "UPCOMING_FAILED", "Failed to load upcoming payments");
  }
}
