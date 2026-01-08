import { prisma } from "@/lib/prisma";
import { applyBalanceDelta, expenseDelta, incomeDelta } from "@/lib/db/account-balances";

export async function applyDueFixedExpenses(userId: string) {
  const now = new Date();
  return prisma.$transaction(async (db) => {
    await db.transaction.updateMany({
      where: {
        userId,
        isFixed: true,
        isBalanceApplied: true,
        transactionDate: { gt: now },
      },
      data: { isBalanceApplied: false },
    });

    const legacyCandidates = await db.transaction.findMany({
      where: {
        userId,
        isFixed: true,
        isBalanceApplied: true,
        transactionDate: { lte: now },
      },
      select: { id: true, createdAt: true, transactionDate: true },
    });
    const legacyIds = legacyCandidates
      .filter((tx) => tx.transactionDate && tx.createdAt < tx.transactionDate)
      .map((tx) => tx.id);
    if (legacyIds.length > 0) {
      await db.transaction.updateMany({
        where: { id: { in: legacyIds } },
        data: { isBalanceApplied: false },
      });
    }

    const due = await db.transaction.findMany({
      where: {
        userId,
        isFixed: true,
        isBalanceApplied: false,
        transactionDate: { lte: now },
      },
      select: {
        id: true,
        accountId: true,
        transferAccountId: true,
        transactionType: true,
        totalBgnCents: true,
        totalEurCents: true,
      },
    });

    for (const tx of due) {
      const updated = await db.transaction.updateMany({
        where: { id: tx.id, isBalanceApplied: false },
        data: { isBalanceApplied: true },
      });
      if (updated.count === 0) continue;
      const bgn = tx.totalBgnCents ?? 0;
      const eur = tx.totalEurCents ?? 0;
      if (tx.transactionType === "income") {
        await applyBalanceDelta(incomeDelta(tx.accountId, bgn, eur), db);
      } else if (tx.transactionType === "transfer" && tx.transferAccountId) {
        await applyBalanceDelta(expenseDelta(tx.accountId, bgn, eur), db);
        await applyBalanceDelta(incomeDelta(tx.transferAccountId, bgn, eur), db);
      } else {
        await applyBalanceDelta(expenseDelta(tx.accountId, bgn, eur), db);
      }
    }

    return due.length;
  });
}
