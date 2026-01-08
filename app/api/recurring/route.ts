import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";
import { recurringCategoryDefault } from "@/lib/recurring";

export const runtime = "nodejs";

const templateSchema = z.object({
  accountId: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().optional(),
  subCategory: z.string().min(1),
  paymentDay: z.number().int().min(1).max(31),
  note: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

export async function GET() {
  const requestId = randomUUID();
  try {
    const user = await getCurrentUser();
    const templates = await prisma.recurringTemplate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        transactionDate: { gte: monthStart, lte: monthEnd },
      },
      select: { merchantName: true, category: true, accountId: true },
    });
    const data = templates.map((template) => {
      const paid = transactions.some(
        (tx) =>
          (tx.merchantName || "").trim() === template.name.trim() &&
          tx.category === template.subCategory &&
          tx.accountId === template.accountId,
      );
      return { ...template, status: paid ? "paid" : "unpaid" };
    });
    return NextResponse.json({ ok: true, data, requestId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[recurring] list error", { requestId, error });
    return jsonError(500, "LIST_FAILED", "Failed to load recurring templates");
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const user = await getCurrentUser();
    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, "INVALID_JSON", "Invalid JSON body");
    }
    const parsed = templateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "INVALID_INPUT", "Invalid template payload", parsed.error.flatten());
    }

    const template = await prisma.recurringTemplate.create({
      data: {
        userId: user.id,
        accountId: parsed.data.accountId,
        name: parsed.data.name,
        amount: parsed.data.amount,
        category: parsed.data.category ?? recurringCategoryDefault,
        subCategory: parsed.data.subCategory,
        paymentDay: parsed.data.paymentDay,
        note: parsed.data.note ?? undefined,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ ok: true, data: template, requestId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[recurring] create error", { requestId, error });
    return jsonError(500, "CREATE_FAILED", "Failed to create recurring template");
  }
}
