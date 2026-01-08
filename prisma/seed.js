/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("demo1234", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@demo.com" },
    update: {},
    create: {
      name: "Демо Потребител",
      firstName: "Демо",
      lastName: "Потребител",
      email: "demo@demo.com",
      phone: "+359888000000",
      passwordHash,
      nickname: "AI Финанси",
      monthlyBudgetGoal: 2000,
      storeOriginalImage: false,
    },
  });

  await prisma.lineItem.deleteMany({});
  await prisma.transaction.deleteMany({ where: { userId: user.id } });

  const toCents = (amount) => Math.round(amount * 100);
  const eurToBgnCents = (eurCents) => Math.round(eurCents * 1.95583);
  const bgnToEurCents = (bgnCents) => Math.round(bgnCents / 1.95583);

  const txData = [
    {
      merchantName: "Kaufland",
      transactionDate: new Date(),
      totalOriginal: 48.2,
      currencyOriginal: "BGN",
      category: "food_supermarket",
      categoryConfidence: 0.92,
      overallConfidence: 0.88,
      sourceType: "receipt",
      lineItems: [
        { name: "Плодове", quantity: 3, priceOriginal: 12.5 },
        { name: "Хляб", quantity: 2, priceOriginal: 3.4 },
      ],
    },
    {
      merchantName: "Raffy",
      transactionDate: new Date(),
      totalOriginal: 62.5,
      currencyOriginal: "BGN",
      category: "restaurants_cafe",
      categoryConfidence: 0.86,
      overallConfidence: 0.84,
      sourceType: "receipt",
      lineItems: [{ name: "Обяд", quantity: 2, priceOriginal: 31.25 }],
    },
    {
      merchantName: "Lime",
      transactionDate: new Date(),
      totalOriginal: 28,
      currencyOriginal: "EUR",
      category: "transport",
      categoryConfidence: 0.8,
      overallConfidence: 0.8,
      sourceType: "bank",
      lineItems: [],
    },
  ];

  for (const tx of txData) {
    const totalOriginalCents = toCents(tx.totalOriginal);
    const totals =
      tx.currencyOriginal === "EUR"
        ? { eurCents: totalOriginalCents, bgnCents: eurToBgnCents(totalOriginalCents) }
        : { bgnCents: totalOriginalCents, eurCents: bgnToEurCents(totalOriginalCents) };
    await prisma.transaction.create({
      data: {
        userId: user.id,
        sourceType: tx.sourceType,
        merchantName: tx.merchantName,
        transactionDate: tx.transactionDate,
        totalOriginalCents,
        currencyOriginal: tx.currencyOriginal,
        totalBgnCents: totals.bgnCents,
        totalEurCents: totals.eurCents,
        category: tx.category,
        categoryConfidence: tx.categoryConfidence,
        aiExtractedJson: JSON.stringify({ seeded: true, merchant: tx.merchantName }),
        overallConfidence: tx.overallConfidence,
        lineItems: tx.lineItems?.length
          ? {
              createMany: {
                data: tx.lineItems.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  priceOriginalCents:
                    item.priceOriginal !== undefined && item.priceOriginal !== null
                      ? toCents(item.priceOriginal)
                      : null,
                  priceBgnCents:
                    item.priceOriginal !== undefined && item.priceOriginal !== null
                      ? (tx.currencyOriginal === "EUR"
                          ? eurToBgnCents(toCents(item.priceOriginal))
                          : toCents(item.priceOriginal))
                      : null,
                  priceEurCents:
                    item.priceOriginal !== undefined && item.priceOriginal !== null
                      ? (tx.currencyOriginal === "EUR"
                          ? toCents(item.priceOriginal)
                          : bgnToEurCents(toCents(item.priceOriginal)))
                      : null,
                })),
              },
            }
          : undefined,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
