import { prisma } from "@/lib/prisma";
import { convertCents, fromCents, resolveTotalsCents } from "@/lib/currency";
import type { ExtractionResult } from "@/lib/extraction/schema";
import { mapAssistantCategory } from "@/lib/extraction/category-map";
import { applyBalanceDelta, expenseDelta, incomeDelta } from "@/lib/db/account-balances";
import { isBalanceEffective } from "@/lib/db/balance-logic";

export type ManualTransactionInput = {
  userId: string;
  date: string | null;
  accountId: string;
  transactionType: "expense" | "income";
  isFixed: boolean;
  merchant: string;
  category: string;
  amountCents: number;
  currency: "BGN" | "EUR";
  paymentMethod: string;
  note?: string | null;
};

export type ExtractionTransactionInput = {
  userId: string;
  extraction: ExtractionResult;
  accountId: string;
  isFixed: boolean;
  imageRef?: string | null;
};

function normalizeCategory(category: string | null) {
  return category?.trim() || "other";
}

export async function createManualTransaction(input: ManualTransactionInput) {
  const totals = convertCents(input.amountCents, input.currency);
  const transactionDate = input.date ? new Date(input.date) : new Date();
  const shouldApplyBalance = isBalanceEffective(input.isFixed, transactionDate);
  return prisma.$transaction(async (db) => {
    const transaction = await db.transaction.create({
      data: {
        user: { connect: { id: input.userId } },
        account: { connect: { id: input.accountId } },
        sourceType: "manual",
        transactionType: input.transactionType,
        isFixed: input.isFixed,
        isBalanceApplied: shouldApplyBalance,
        merchantName: input.merchant,
        paymentMethod: input.paymentMethod,
        transactionDate,
        totalBgnCents: totals.bgnCents,
        totalEurCents: totals.eurCents,
        currencyOriginal: input.currency,
        totalBgn: fromCents(totals.bgnCents),
        totalEur: fromCents(totals.eurCents),
        totalOriginalCents: input.amountCents,
        totalOriginal: fromCents(input.amountCents),
        category: normalizeCategory(input.category),
        categoryConfidence: 1,
        overallConfidence: 1,
        notes: input.note ?? undefined,
      },
    });
    if (shouldApplyBalance) {
      if (input.transactionType === "income") {
        await applyBalanceDelta(
          incomeDelta(input.accountId, totals.bgnCents, totals.eurCents),
          db,
        );
      } else {
        await applyBalanceDelta(
          expenseDelta(input.accountId, totals.bgnCents, totals.eurCents),
          db,
        );
      }
    }
    return transaction;
  });
}

export async function createFromExtraction(input: ExtractionTransactionInput) {
  const { extraction } = input;
  if (extraction.status !== "success" || !extraction.data) {
    throw new Error("Extraction did not return success data");
  }
  const totalBgnCents = Math.round(extraction.data.total_sum_bgn * 100);
  const totalEurCents = Math.round(extraction.data.total_sum_eur * 100);
  const category = normalizeCategory(
    mapAssistantCategory(extraction.data.items[0]?.category ?? null),
  );

  return prisma.$transaction(async (db) => {
    const transactionDate = extraction.data.date
      ? new Date(extraction.data.date)
      : new Date();
    const shouldApplyBalance = isBalanceEffective(input.isFixed, transactionDate);
    const transaction = await db.transaction.create({
      data: {
        user: { connect: { id: input.userId } },
        account: { connect: { id: input.accountId } },
        sourceType: "receipt",
        transactionType: "expense",
        isFixed: input.isFixed,
        isBalanceApplied: shouldApplyBalance,
        originalImageUrl: input.imageRef ?? undefined,
        merchantName: extraction.data.merchant_name,
        paymentMethod: null,
        transactionDate,
        totalBgnCents,
        totalEurCents,
        currencyOriginal: "BGN",
        totalBgn: extraction.data.total_sum_bgn,
        totalEur: extraction.data.total_sum_eur,
        totalOriginalCents: totalBgnCents,
        totalOriginal: extraction.data.total_sum_bgn,
        category,
        categoryConfidence: 1,
        aiExtractedJson: JSON.stringify(extraction),
        overallConfidence: 1,
        lineItems:
          extraction.data.items.length > 0
            ? {
                createMany: {
                  data: extraction.data.items.map((item) => ({
                    name: item.name_en,
                    quantity: undefined,
                    priceOriginal: item.price_bgn,
                    priceBgn: item.price_bgn,
                    priceEur: item.price_eur,
                    priceOriginalCents: Math.round(item.price_bgn * 100),
                    priceBgnCents: Math.round(item.price_bgn * 100),
                    priceEurCents: Math.round(item.price_eur * 100),
                  })),
                },
              }
            : undefined,
      },
    });
    if (shouldApplyBalance) {
      await applyBalanceDelta(
        expenseDelta(input.accountId, totalBgnCents, totalEurCents),
        db,
      );
    }
    return transaction;
  });
}

export async function listTransactions(userId: string, filters: Record<string, string>) {
  const where: Record<string, unknown> = { userId };
  const take = filters.limit ? Math.max(1, Number(filters.limit)) : undefined;
  if (filters.category) where.category = filters.category;
  if (filters.accountId) where.accountId = filters.accountId;
  if (filters.transactionType) where.transactionType = filters.transactionType;
  if (filters.expenseType === "fixed") where.isFixed = true;
  if (filters.expenseType === "variable") where.isFixed = false;
  if (filters.merchant) where.merchantName = { contains: filters.merchant };
  if (filters.search) {
    where.OR = [
      { merchantName: { contains: filters.search } },
      { notes: { contains: filters.search } },
    ];
  }
  if (filters.from || filters.to) {
    const range: Record<string, Date> = {};
    if (filters.from) range.gte = new Date(`${filters.from}T00:00:00`);
    if (filters.to) range.lte = new Date(`${filters.to}T23:59:59.999`);
    where.transactionDate = range;
  }
  if (filters.min || filters.max) {
    const totalFilter: Record<string, number> = {};
    if (filters.min) totalFilter.gte = Math.round(Number(filters.min) * 100);
    if (filters.max) totalFilter.lte = Math.round(Number(filters.max) * 100);
    where.totalEurCents = totalFilter;
  }
  const rows = await prisma.transaction.findMany({
    where,
    include: { lineItems: true },
    orderBy: { transactionDate: "desc" },
    ...(take ? { take } : {}),
  });
  return rows.map((tx) => {
    const totals = resolveTotalsCents({
      totalEurCents: tx.totalEurCents,
      totalBgnCents: tx.totalBgnCents,
      totalEur: tx.totalEur,
      totalBgn: tx.totalBgn,
      totalOriginalCents: tx.totalOriginalCents,
      totalOriginal: tx.totalOriginal,
      currencyOriginal: tx.currencyOriginal,
    });
    return {
      ...tx,
      totalEurCents: totals.eurCents ?? 0,
      totalBgnCents: totals.bgnCents ?? 0,
    };
  });
}

export async function deleteTransaction(userId: string, id: string) {
  await prisma.lineItem.deleteMany({ where: { transactionId: id } });
  return prisma.transaction.deleteMany({ where: { id, userId } });
}

export async function cleanupUserData(userId: string) {
  const ids = await prisma.transaction.findMany({
    where: { userId },
    select: { id: true },
  });
  const txIds = ids.map((t) => t.id);
  const lineItems = await prisma.lineItem.deleteMany({
    where: { transactionId: { in: txIds } },
  });
  const transactions = await prisma.transaction.deleteMany({
    where: { userId },
  });
  const drafts = await prisma.extractionDraft.deleteMany({
    where: { userId },
  });
  return {
    lineItems: lineItems.count,
    transactions: transactions.count,
    extractionDrafts: drafts.count,
  };
}
