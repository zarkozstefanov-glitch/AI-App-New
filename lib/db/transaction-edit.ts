import { prisma } from "@/lib/prisma";
import { applyBalanceDelta } from "@/lib/db/account-balances";
import { isBalanceCurrentlyApplied, isBalanceEffective } from "@/lib/db/balance-logic";
import { convertCents, toCents } from "@/lib/currency";

type BalanceMap = Map<string, { bgnCents: number; eurCents: number }>;

type TransactionCore = {
  accountId: string;
  transferAccountId: string | null;
  transactionType: string;
  isFixed: boolean;
  transactionDate: Date | null;
  isBalanceApplied: boolean;
  totalBgnCents: number;
  totalEurCents: number;
};

export type EditTransactionPayload = {
  accountId?: string;
  transferAccountId?: string | null;
  merchantName?: string;
  paymentMethod?: string | null;
  category?: string;
  notes?: string | null;
  transactionDate?: string | null;
  transactionType?: string;
  isFixed?: boolean;
  totalOriginal?: number;
  currencyOriginal?: string;
};

function addDelta(map: BalanceMap, accountId: string, bgnCents: number, eurCents: number) {
  const current = map.get(accountId) ?? { bgnCents: 0, eurCents: 0 };
  current.bgnCents += bgnCents;
  current.eurCents += eurCents;
  map.set(accountId, current);
}

function buildBalanceMap(tx: TransactionCore, isApplied: boolean) {
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

function buildUpdatePayload(data: EditTransactionPayload) {
  const update: Record<string, unknown> = {};
  if (data.merchantName !== undefined) update.merchantName = data.merchantName;
  if (data.paymentMethod !== undefined) update.paymentMethod = data.paymentMethod;
  if (data.category !== undefined) update.category = data.category;
  if (data.notes !== undefined) update.notes = data.notes;
  if (data.accountId !== undefined) update.accountId = data.accountId;
  if (data.transactionType !== undefined) update.transactionType = data.transactionType;
  if (data.isFixed !== undefined) update.isFixed = data.isFixed;
  if (data.transferAccountId !== undefined) {
    update.transferAccountId = data.transferAccountId;
  }
  if (data.transactionDate !== undefined) {
    update.transactionDate = data.transactionDate
      ? new Date(data.transactionDate)
      : new Date();
  }
  if (data.totalOriginal !== undefined && data.currencyOriginal) {
    const numericTotal = Number(data.totalOriginal);
    if (Number.isFinite(numericTotal)) {
      const amountCents = toCents(numericTotal);
      const totals = convertCents(amountCents, data.currencyOriginal);
      update.totalOriginalCents = amountCents;
      update.currencyOriginal = data.currencyOriginal;
      update.totalBgnCents = totals.bgnCents;
      update.totalEurCents = totals.eurCents;
      update.totalBgn = totals.bgnCents / 100;
      update.totalEur = totals.eurCents / 100;
      update.totalOriginal = amountCents / 100;
    }
  }
  update.isEdited = true;
  return update;
}

export async function updateTransactionWithHistory(
  userId: string,
  id: string,
  payload: EditTransactionPayload,
) {
  if (payload.accountId !== undefined && !payload.accountId) {
    throw new Error("Account is required");
  }
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!existing) return null;
  const nextDate =
    payload.transactionDate !== undefined
      ? payload.transactionDate
        ? new Date(payload.transactionDate)
        : new Date()
      : existing.transactionDate;
  const nextIsFixed = payload.isFixed ?? existing.isFixed;
  const shouldApplyBalance = isBalanceEffective(nextIsFixed, nextDate);
  const update = buildUpdatePayload(payload);
  update.isBalanceApplied = shouldApplyBalance;
  const previousTotals = {
    totalBgnCents: existing.totalBgnCents,
    totalEurCents: existing.totalEurCents,
  };

  return prisma.$transaction(async (db) => {
    const rawHistory = JSON.stringify({
      accountId: existing.accountId,
      transferAccountId: existing.transferAccountId,
      transactionType: existing.transactionType,
      merchantName: existing.merchantName,
      category: existing.category,
      isFixed: existing.isFixed,
      notes: existing.notes,
      transactionDate: existing.transactionDate,
      totalBgnCents: existing.totalBgnCents,
      totalEurCents: existing.totalEurCents,
      totalOriginalCents: existing.totalOriginalCents,
      currencyOriginal: existing.currencyOriginal,
    });
    const safeHistory = rawHistory.length > 60000 ? rawHistory.slice(0, 60000) : rawHistory;

    await db.transactionHistory.create({
      data: {
        userId,
        transactionId: existing.id,
        oldData: safeHistory,
      },
    });

    const updated = await db.transaction.update({
      where: { id },
      data: update,
    });

    const beforeMap = buildBalanceMap({
      accountId: existing.accountId,
      transferAccountId: existing.transferAccountId,
      transactionType: existing.transactionType,
      isFixed: existing.isFixed,
      transactionDate: existing.transactionDate,
      isBalanceApplied: existing.isBalanceApplied,
      totalBgnCents: previousTotals.totalBgnCents,
      totalEurCents: previousTotals.totalEurCents,
    }, isBalanceCurrentlyApplied(
      existing.isFixed,
      existing.transactionDate,
      existing.isBalanceApplied,
    ));
    const afterMap = buildBalanceMap({
      accountId: updated.accountId,
      transferAccountId: updated.transferAccountId,
      transactionType: updated.transactionType,
      isFixed: updated.isFixed,
      transactionDate: updated.transactionDate,
      isBalanceApplied: updated.isBalanceApplied,
      totalBgnCents: updated.totalBgnCents,
      totalEurCents: updated.totalEurCents,
    }, updated.isBalanceApplied);

    const accountIds = new Set<string>([
      ...Array.from(beforeMap.keys()),
      ...Array.from(afterMap.keys()),
    ]);
    for (const accountId of accountIds) {
      const before = beforeMap.get(accountId) ?? { bgnCents: 0, eurCents: 0 };
      const after = afterMap.get(accountId) ?? { bgnCents: 0, eurCents: 0 };
      const delta = {
        accountId,
        bgnCents: after.bgnCents - before.bgnCents,
        eurCents: after.eurCents - before.eurCents,
      };
      if (delta.bgnCents !== 0 || delta.eurCents !== 0) {
        await applyBalanceDelta(delta, db);
      }
    }

    return updated;
  });
}
