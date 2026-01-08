import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultAccounts = [
  { name: "В брой", kind: "cash", currency: "BGN" },
  { name: "Банкова сметка", kind: "bank", currency: "BGN" },
  { name: "Спестовна сметка", kind: "savings", currency: "BGN" },
];

async function ensureAccounts(userId) {
  const existing = await prisma.account.findMany({ where: { userId } });
  if (existing.length >= 3) {
    return existing;
  }
  const created = await prisma.account.createMany({
    data: defaultAccounts.map((acc) => ({ ...acc, userId })),
  });
  if (created.count > 0) {
    return prisma.account.findMany({ where: { userId } });
  }
  return existing;
}

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const user of users) {
    const accounts = await ensureAccounts(user.id);
    const cashAccount = accounts.find((acc) => acc.kind === "cash") ?? accounts[0];
    if (!cashAccount) continue;


    await prisma.transaction.updateMany({
      where: { userId: user.id, sourceType: "recurring", isFixed: false },
      data: { isFixed: true },
    });

    await prisma.account.updateMany({
      where: { userId: user.id },
      data: { balanceBgnCents: 0, balanceEurCents: 0 },
    });

    const txs = await prisma.transaction.findMany({
      where: { userId: user.id },
      select: {
        accountId: true,
        transferAccountId: true,
        transactionType: true,
        totalBgnCents: true,
        totalEurCents: true,
      },
    });
    for (const tx of txs) {
      const bgn = tx.totalBgnCents ?? 0;
      const eur = tx.totalEurCents ?? 0;
      if (tx.transactionType === "income") {
        await prisma.account.update({
          where: { id: tx.accountId },
          data: {
            balanceBgnCents: { increment: bgn },
            balanceEurCents: { increment: eur },
          },
        });
      } else if (tx.transactionType === "transfer" && tx.transferAccountId) {
        await prisma.account.update({
          where: { id: tx.accountId },
          data: {
            balanceBgnCents: { decrement: bgn },
            balanceEurCents: { decrement: eur },
          },
        });
        await prisma.account.update({
          where: { id: tx.transferAccountId },
          data: {
            balanceBgnCents: { increment: bgn },
            balanceEurCents: { increment: eur },
          },
        });
      } else {
        await prisma.account.update({
          where: { id: tx.accountId },
          data: {
            balanceBgnCents: { decrement: bgn },
            balanceEurCents: { decrement: eur },
          },
        });
      }
    }
  }
}

main()
  .catch((error) => {
    console.error("Backfill accounts failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
