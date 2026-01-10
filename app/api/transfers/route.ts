import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";
import { convertCents, fromCents, toCents } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { applyBalanceDelta, expenseDelta, incomeDelta } from "@/lib/db/account-balances";

export const runtime = "nodejs";

const transferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["BGN", "EUR"]).default("BGN"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().optional().nullable(),
});

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  try {
    const user = await getCurrentUser();
    const body = await request.json().catch(() => null);
    const parsed = transferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_INPUT",
            message: "Invalid transfer payload",
            details: parsed.error.flatten(),
          },
          requestId,
        },
        { status: 400 },
      );
    }
    if (parsed.data.fromAccountId === parsed.data.toAccountId) {
      return jsonError(400, "INVALID_ACCOUNTS", "Accounts must be different");
    }

    const owned = await prisma.account.findMany({
      where: {
        userId: user.id,
        id: { in: [parsed.data.fromAccountId, parsed.data.toAccountId] },
      },
      select: { id: true },
    });
    if (owned.length !== 2) {
      return jsonError(403, "INVALID_ACCOUNTS", "Invalid account selection");
    }

    const amountCents = toCents(parsed.data.amount);
    const totals = convertCents(amountCents, parsed.data.currency);
    const date = new Date();

    const transfer = await prisma.$transaction(async (db) => {
      const created = await db.transaction.create({
        data: {
          userId: user.id,
          accountId: parsed.data.fromAccountId,
          transferAccountId: parsed.data.toAccountId,
          sourceType: "transfer",
          transactionType: "transfer",
          isFixed: false,
          isBalanceApplied: true,
          merchantName: "Transfer",
          paymentMethod: null,
          transactionDate: date,
          totalBgnCents: totals.bgnCents,
          totalEurCents: totals.eurCents,
          currencyOriginal: parsed.data.currency,
          totalBgn: fromCents(totals.bgnCents),
          totalEur: fromCents(totals.eurCents),
          totalOriginalCents: amountCents,
          totalOriginal: fromCents(amountCents),
          category: "transfer",
          categoryConfidence: 1,
          overallConfidence: 1,
          notes: parsed.data.note ?? undefined,
        },
      });
      await applyBalanceDelta(
        expenseDelta(parsed.data.fromAccountId, totals.bgnCents, totals.eurCents),
        db,
      );
      await applyBalanceDelta(
        incomeDelta(parsed.data.toAccountId, totals.bgnCents, totals.eurCents),
        db,
      );
      return created;
    });

    return NextResponse.json({ ok: true, data: transfer, requestId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[transfers] create error", { requestId, error });
    return jsonError(500, "TRANSFER_FAILED", "Failed to create transfer");
  }
}
