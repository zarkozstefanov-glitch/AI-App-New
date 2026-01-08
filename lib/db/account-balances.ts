import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

type BalanceDelta = {
  accountId: string;
  bgnCents: number;
  eurCents: number;
};

type DbClient = Prisma.TransactionClient | PrismaClient;

export async function applyBalanceDelta(
  delta: BalanceDelta,
  db: DbClient = prisma,
) {
  await db.account.update({
    where: { id: delta.accountId },
    data: {
      balanceBgnCents: { increment: delta.bgnCents },
      balanceEurCents: { increment: delta.eurCents },
    },
  });
}

export function expenseDelta(accountId: string, bgnCents: number, eurCents: number) {
  return { accountId, bgnCents: -Math.abs(bgnCents), eurCents: -Math.abs(eurCents) };
}

export function incomeDelta(accountId: string, bgnCents: number, eurCents: number) {
  return { accountId, bgnCents: Math.abs(bgnCents), eurCents: Math.abs(eurCents) };
}
