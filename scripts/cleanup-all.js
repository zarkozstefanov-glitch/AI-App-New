const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const lineItems = await prisma.lineItem.deleteMany();
  const transactions = await prisma.transaction.deleteMany();
  const drafts = await prisma.extractionDraft.deleteMany();
  const recurring = await prisma.recurringTemplate.deleteMany();
  const users = await prisma.user.deleteMany();

  console.log("Deleted:", {
    lineItems: lineItems.count,
    transactions: transactions.count,
    extractionDrafts: drafts.count,
    recurringTemplates: recurring.count,
    users: users.count,
  });
}

main()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
