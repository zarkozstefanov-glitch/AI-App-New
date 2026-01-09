/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { hashSync } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = hashSync("password123", 10);
  const usersToSeed = [
    {
      email: "test@example.com",
      firstName: "Демо",
      lastName: "Потребител",
      nickname: "AI Финанси",
    },
    {
      email: "demo@demo.com",
      firstName: "Демо",
      lastName: "Потребител",
      nickname: "AI Финанси",
    },
  ];

  await prisma.lineItem.deleteMany({});

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

  for (const userMeta of usersToSeed) {
    const user = await prisma.user.upsert({
      where: { email: userMeta.email },
      update: { passwordHash },
      create: {
        name: "Демо Потребител",
        firstName: userMeta.firstName,
        lastName: userMeta.lastName,
        email: userMeta.email,
        phone: "+359888000000",
        passwordHash,
        nickname: userMeta.nickname,
        monthlyBudgetGoal: 2000,
        storeOriginalImage: false,
      },
    });

    await prisma.transaction.deleteMany({ where: { userId: user.id } });
    await prisma.account.deleteMany({ where: { userId: user.id } });

    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Main Bank",
        kind: "checking",
        currency: "BGN",
        balanceBgnCents: 0,
        balanceEurCents: 0,
      },
    });

    for (const tx of txData) {
      const totalOriginalCents = toCents(tx.totalOriginal);
      const totals =
        tx.currencyOriginal === "EUR"
          ? { eurCents: totalOriginalCents, bgnCents: eurToBgnCents(totalOriginalCents) }
          : { bgnCents: totalOriginalCents, eurCents: bgnToEurCents(totalOriginalCents) };
      await prisma.transaction.create({
        data: {
          user: { connect: { id: user.id } },
          account: { connect: { id: account.id } },
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
}

main()
  .then(async () => {
    console.log("Seeded user logins:", {
      test: { email: "test@example.com", password: "password123" },
      demo: { email: "demo@demo.com", password: "password123" },
    });
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
