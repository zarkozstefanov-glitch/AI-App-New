import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";
import { createManualTransaction, listTransactions } from "@/lib/db/transactions";
import { toCents } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { applyDueFixedExpenses } from "@/lib/db/fixed-expenses";

const manualSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  accountId: z.string().min(1),
  transactionType: z.enum(["expense", "income"]),
  isFixed: z.boolean().optional().default(false),
  merchant: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["BGN", "EUR"]),
  paymentMethod: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  if (process.env.NODE_ENV !== "production") {
    console.log(`[transactions] list requestId=${requestId}`);
  }
  try {
    const user = await getCurrentUser();
    await applyDueFixedExpenses(user.id);
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const data = await listTransactions(user.id, params);
    return NextResponse.json({ ok: true, data, requestId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[transactions] list error", { requestId, error });
    return jsonError(500, "LIST_FAILED", "Failed to load transactions");
  }
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  if (process.env.NODE_ENV !== "production") {
    console.log(`[transactions] create requestId=${requestId}`);
  }
  try {
    const user = await getCurrentUser();
    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, "INVALID_JSON", "Invalid JSON body");
    }
    const parsed = manualSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_INPUT",
            message: "Invalid manual transaction payload",
            details: parsed.error.flatten(),
          },
          requestId,
        },
        { status: 400 },
      );
    }
    const account = await prisma.account.findFirst({
      where: { id: parsed.data.accountId, userId: user.id },
      select: { id: true },
    });
    if (!account) {
      return jsonError(403, "INVALID_ACCOUNT", "Account not found");
    }
    const transaction = await createManualTransaction({
      userId: user.id,
      date: parsed.data.date,
      accountId: parsed.data.accountId,
      transactionType: parsed.data.transactionType,
      isFixed: parsed.data.isFixed ?? false,
      merchant: parsed.data.merchant,
      category: parsed.data.category,
      amountCents: toCents(parsed.data.amount),
      currency: parsed.data.currency,
      paymentMethod: parsed.data.paymentMethod ?? "unknown",
      note: parsed.data.note ?? undefined,
    });
    return NextResponse.json({ ok: true, transaction, requestId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[transactions] create error", { requestId, error });
    return jsonError(500, "CREATE_FAILED", "Failed to create transaction");
  }
}
