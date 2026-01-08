/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const EUR_RATE = 1.95583;

const toCents = (amount) => Math.round(Number(amount) * 100);
const eurToBgnCents = (eurCents) => Math.round(eurCents * EUR_RATE);
const bgnToEurCents = (bgnCents) => Math.round(bgnCents / EUR_RATE);

async function backfillTransactions() {
  const transactions = await prisma.transaction.findMany({
    select: {
      id: true,
      currencyOriginal: true,
      totalOriginal: true,
      totalBgn: true,
      totalEur: true,
      totalOriginalCents: true,
      totalBgnCents: true,
      totalEurCents: true,
    },
  });

  for (const tx of transactions) {
    let totalOriginalCents = tx.totalOriginalCents;
    let totalBgnCents = tx.totalBgnCents;
    let totalEurCents = tx.totalEurCents;

    if (tx.totalOriginal != null && (!totalOriginalCents || !totalBgnCents || !totalEurCents)) {
      totalOriginalCents = toCents(tx.totalOriginal);
      if (tx.currencyOriginal === "EUR") {
        totalEurCents = totalOriginalCents;
        totalBgnCents = eurToBgnCents(totalOriginalCents);
      } else {
        totalBgnCents = totalOriginalCents;
        totalEurCents = bgnToEurCents(totalOriginalCents);
      }
    } else if ((tx.totalBgn != null || tx.totalEur != null) && (!totalBgnCents || !totalEurCents)) {
      if (tx.totalBgn != null) {
        totalBgnCents = toCents(tx.totalBgn);
        totalEurCents = bgnToEurCents(totalBgnCents);
      } else if (tx.totalEur != null) {
        totalEurCents = toCents(tx.totalEur);
        totalBgnCents = eurToBgnCents(totalEurCents);
      }
    }

    if (totalOriginalCents && totalBgnCents && totalEurCents) {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          totalOriginalCents,
          totalBgnCents,
          totalEurCents,
        },
      });
    }
  }
}

async function backfillLineItems() {
  const items = await prisma.lineItem.findMany({
    select: {
      id: true,
      priceOriginal: true,
      priceBgn: true,
      priceEur: true,
      priceOriginalCents: true,
      priceBgnCents: true,
      priceEurCents: true,
    },
  });

  for (const item of items) {
    const data = {};
    if (item.priceOriginal != null && !item.priceOriginalCents) {
      data.priceOriginalCents = toCents(item.priceOriginal);
    }
    if (item.priceBgn != null && !item.priceBgnCents) {
      data.priceBgnCents = toCents(item.priceBgn);
    }
    if (item.priceEur != null && !item.priceEurCents) {
      data.priceEurCents = toCents(item.priceEur);
    }
    if (Object.keys(data).length > 0) {
      await prisma.lineItem.update({ where: { id: item.id }, data });
    }
  }
}

async function main() {
  await backfillTransactions();
  await backfillLineItems();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Backfill complete");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
