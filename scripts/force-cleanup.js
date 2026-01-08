const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.lineItem.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.extractionDraft.deleteMany({});
  await prisma.recurringTemplate.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("Database wiped successfully.");
}

main()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
