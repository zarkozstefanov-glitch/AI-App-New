import { NextResponse } from "next/server";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";
import { prisma } from "@/lib/prisma";
import { resolveTotalsCents } from "@/lib/currency";
import { applyBalanceDelta } from "@/lib/db/account-balances";
import { isBalanceCurrentlyApplied } from "@/lib/db/balance-logic";
import { updateTransactionWithHistory } from "@/lib/db/transaction-edit";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

type BalanceMap = Map<string, { bgnCents: number; eurCents: number }>;

function addDelta(map: BalanceMap, accountId: string, bgnCents: number, eurCents: number) {
  const current = map.get(accountId) ?? { bgnCents: 0, eurCents: 0 };
  current.bgnCents += bgnCents;
  current.eurCents += eurCents;
  map.set(accountId, current);
}

function buildBalanceMap(
  tx: {
  accountId: string;
  transferAccountId: string | null;
  transactionType: string;
  isFixed: boolean;
  transactionDate: Date | null;
  isBalanceApplied: boolean;
  totalBgnCents: number;
  totalEurCents: number;
  },
  isApplied: boolean,
) {
  const map: BalanceMap = new Map();
  if (!isApplied) {
    return map;
  }
  const bgn = tx.totalBgnCents ?? 0;
  const eur = tx.totalEurCents ?? 0;
  if (tx.transactionType === "income") {
    addDelta(map, tx.accountId, bgn, eur);
  } else if (tx.transactionType === "transfer" && tx.transferAccountId) {
    addDelta(map, tx.accountId, -bgn, -eur);
    addDelta(map, tx.transferAccountId, bgn, eur);
  } else {
    addDelta(map, tx.accountId, -bgn, -eur);
  }
  return map;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const existing = await prisma.transaction.findFirst({
      where: { id: id, userId: user.id },
    });
    if (!existing) {
      return jsonError(404, "NOT_FOUND", "Transaction not found");
    }
    const balanceMap = buildBalanceMap(
      {
        accountId: existing.accountId,
        transferAccountId: existing.transferAccountId,
        transactionType: existing.transactionType,
        isFixed: existing.isFixed,
        transactionDate: existing.transactionDate,
        isBalanceApplied: existing.isBalanceApplied,
        totalBgnCents: existing.totalBgnCents,
        totalEurCents: existing.totalEurCents,
      },
      isBalanceCurrentlyApplied(
        existing.isFixed,
        existing.transactionDate,
        existing.isBalanceApplied,
      ),
    );
    await prisma.$transaction(async (db) => {
      for (const [accountId, delta] of balanceMap.entries()) {
        await applyBalanceDelta(
          {
            accountId,
            bgnCents: -delta.bgnCents,
            eurCents: -delta.eurCents,
          },
          db,
        );
      }
      await db.lineItem.deleteMany({ where: { transactionId: id } });
      await db.transactionHistory.deleteMany({
        where: { transactionId: id, userId: user.id },
      });
      await db.transaction.deleteMany({ where: { id: id, userId: user.id } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    return jsonError(500, "DELETE_FAILED", "Failed to delete transaction");
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const tx = await prisma.transaction.findFirst({
      where: { id: id, userId: user.id },
      include: { lineItems: true },
    });
    if (!tx) {
      return jsonError(404, "NOT_FOUND", "Transaction not found");
    }
    const totals = resolveTotalsCents(tx);
    return NextResponse.json({
      ok: true,
      data: {
        ...tx,
        totalEurCents: totals.eurCents ?? 0,
        totalBgnCents: totals.bgnCents ?? 0,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    return jsonError(500, "GET_FAILED", "Failed to load transaction");
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    let data: any = null;
    try {
      data = await request.json();
    } catch {
      return jsonError(400, "INVALID_JSON", "Invalid JSON body");
    }
    const updated = await updateTransactionWithHistory(user.id, id, data);
    if (!updated) {.
      return jsonError(404, "NOT_FOUND", "Transaction not found");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    return jsonError(500, "UPDATE_FAILED", "Failed to update transaction");
  }
}
