import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  resolveTotalsCents,
  bgnCentsToEurCents,
  toCents,
} from "@/lib/currency";
import { recurringCategoryDefault } from "@/lib/recurring";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  try {
    const user = await getCurrentUser();
    const params = request.nextUrl.searchParams;
    const from = params.get("from");
    const to = params.get("to");
    const category = params.get("category");
    const accountId = params.get("accountId");

    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo = now;
    const fromDate = from ? new Date(from) : defaultFrom;
    const toDate = to ? new Date(to) : defaultTo;
    if (fromDate) {
      fromDate.setHours(0, 1, 0, 0);
    }
    if (toDate) {
      toDate.setHours(23, 59, 0, 0);
    }

    const where: Record<string, unknown> = {
      userId: user.id,
      transactionDate: { gte: fromDate, lte: toDate },
      transactionType: "expense",
    };
    if (accountId) where.accountId = accountId;
    if (category) where.category = category;

    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        totalEur: true,
        totalBgn: true,
        totalOriginal: true,
        currencyOriginal: true,
        category: true,
        merchantName: true,
        sourceType: true,
        transactionDate: true,
        isFixed: true,
      },
    });
    const userBudget = await prisma.user.findFirst({
      where: { id: user.id },
      select: { monthlyBudgetGoal: true },
    });
    const recurringTemplates = await prisma.recurringTemplate.findMany({
      where: { userId: user.id, isActive: true, ...(accountId ? { accountId } : {}) },
      select: {
        name: true,
        amount: true,
        category: true,
        subCategory: true,
        paymentDay: true,
      },
    });

    const totals = transactions.reduce(
      (acc, tx) => {
        const resolved = resolveTotalsCents(tx);
        acc.eurCents += resolved.eurCents ?? 0;
        acc.bgnCents += resolved.bgnCents ?? 0;
        return acc;
      },
      { eurCents: 0, bgnCents: 0 },
    );

    const byCategoryMap = new Map<
      string,
      { eurCents: number; bgnCents: number; count: number }
    >();
    const merchantsMap = new Map<string, { eurCents: number; bgnCents: number }>();

    for (const tx of transactions) {
      const resolved = resolveTotalsCents(tx);
      const key = tx.category;
      const current = byCategoryMap.get(key) ?? { eurCents: 0, bgnCents: 0, count: 0 };
      current.eurCents += resolved.eurCents ?? 0;
      current.bgnCents += resolved.bgnCents ?? 0;
      current.count += 1;
      byCategoryMap.set(key, current);

      const merchant = tx.merchantName?.trim() || "";
      const merchantTotals = merchantsMap.get(merchant) ?? { eurCents: 0, bgnCents: 0 };
      merchantTotals.eurCents += resolved.eurCents ?? 0;
      merchantTotals.bgnCents += resolved.bgnCents ?? 0;
      merchantsMap.set(merchant, merchantTotals);
    }

    let unpaidRecurringBgnCents = 0;
    for (const template of recurringTemplates) {
      const categoryKey =
        template.subCategory || template.category || recurringCategoryDefault;
      const templateBgnCents = toCents(template.amount);
      const hasMatch = transactions.some(
        (tx) =>
          (tx.merchantName || "").trim() === template.name.trim() &&
          tx.category === categoryKey,
      );
      if (!hasMatch) {
        unpaidRecurringBgnCents += templateBgnCents;
      }
    }

    const byCategory = Array.from(byCategoryMap.entries())
      .map(([categoryKey, value]) => ({ category: categoryKey, ...value }))
      .sort((a, b) => b.eurCents - a.eurCents);

    const topMerchants = Array.from(merchantsMap.entries())
      .map(([merchant, value]) => ({ merchant, ...value }))
      .sort((a, b) => b.eurCents - a.eurCents)
      .slice(0, 5);

    const monthlyBudgetBgnCents =
      userBudget?.monthlyBudgetGoal != null
        ? Math.round(userBudget.monthlyBudgetGoal * 100)
        : null;
    const monthlyBudgetEurCents =
      monthlyBudgetBgnCents != null ? bgnCentsToEurCents(monthlyBudgetBgnCents) : null;

    const dayMs = 24 * 60 * 60 * 1000;
    const startOfDay = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOfMonth = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const totalDaysInMonth = Math.max(
      1,
      Math.floor(
        (startOfDay(monthEnd).getTime() - startOfDay(monthStart).getTime()) /
          dayMs,
      ) + 1,
    );
    const elapsedDaysInMonth = Math.max(1, now.getDate());

    const monthTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        transactionType: "expense",
        transactionDate: { gte: monthStart, lte: monthEnd },
        ...(accountId ? { accountId } : {}),
      },
      select: {
        totalEur: true,
        totalBgn: true,
        totalOriginal: true,
        currencyOriginal: true,
        isFixed: true,
        transactionDate: true,
      },
    });

    const activeMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        transactionType: "expense",
        transactionDate: { gte: monthStart, lte: now },
        ...(accountId ? { accountId } : {}),
      },
      select: {
        totalEur: true,
        totalBgn: true,
        totalOriginal: true,
        currencyOriginal: true,
        isFixed: true,
      },
    });

    const fixedSpentBgnCents = activeMonthTransactions.reduce((acc, tx) => {
      if (!tx.isFixed) return acc;
      const resolved = resolveTotalsCents(tx);
      return acc + (resolved.bgnCents ?? 0);
    }, 0);

    const variableSpentBgnCents = activeMonthTransactions.reduce((acc, tx) => {
      if (tx.isFixed) return acc;
      const resolved = resolveTotalsCents(tx);
      return acc + (resolved.bgnCents ?? 0);
    }, 0);

    const averageDailyVariableBgn = variableSpentBgnCents / elapsedDaysInMonth;
    const remainingDaysInMonth = Math.max(0, totalDaysInMonth - elapsedDaysInMonth);

    const todayStart = startOfDay(now);
    const upcomingFixedBgnCents = monthTransactions.reduce((acc, tx) => {
      if (!tx.isFixed) return acc;
      if (!tx.transactionDate || tx.transactionDate < todayStart) return acc;
      const resolved = resolveTotalsCents(tx);
      return acc + (resolved.bgnCents ?? 0);
    }, 0);

    const fixedPlannedBgnCents = monthTransactions.reduce((acc, tx) => {
      if (!tx.isFixed) return acc;
      const resolved = resolveTotalsCents(tx);
      return acc + (resolved.bgnCents ?? 0);
    }, 0);
    const totalFixedBgnCents = fixedPlannedBgnCents + unpaidRecurringBgnCents;
    const projectedBgnCents =
      Math.round(averageDailyVariableBgn * remainingDaysInMonth) +
      variableSpentBgnCents +
      totalFixedBgnCents;
    const projectedEurCents = bgnCentsToEurCents(projectedBgnCents);

    const spentToDateBgnCents = fixedSpentBgnCents + variableSpentBgnCents;
    const remainingBgnCents =
      monthlyBudgetBgnCents != null
        ? monthlyBudgetBgnCents - spentToDateBgnCents
        : null;
    const remainingEurCents =
      remainingBgnCents != null ? bgnCentsToEurCents(remainingBgnCents) : null;

    const toSaveBgnCents =
      monthlyBudgetBgnCents != null
        ? monthlyBudgetBgnCents -
          (variableSpentBgnCents +
            Math.round(averageDailyVariableBgn * remainingDaysInMonth) +
            totalFixedBgnCents)
        : null;
    const toSaveEurCents =
      toSaveBgnCents != null ? bgnCentsToEurCents(toSaveBgnCents) : null;

    return NextResponse.json({
      ok: true,
      totals,
      byCategory,
      topMerchants,
      monthlyBudget: {
        eurCents: monthlyBudgetEurCents,
        bgnCents: monthlyBudgetBgnCents,
      },
      remainingBudget: {
        eurCents: remainingEurCents,
        bgnCents: remainingBgnCents,
      },
      upcomingFixedBgnCents,
      projectedTotal: {
        eurCents: projectedEurCents,
        bgnCents: projectedBgnCents,
      },
      toSave: {
        eurCents: toSaveEurCents,
        bgnCents: toSaveBgnCents,
      },
      remainingDaysInMonth,
      requestId,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[analytics] summary error", { requestId, error });
    return jsonError(500, "SUMMARY_FAILED", "Failed to load analytics summary");
  }
}
