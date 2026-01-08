import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return jsonError(404, "NOT_FOUND", "Not found");
  }

  try {
    await getCurrentUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    return jsonError(500, "AUTH_FAILED", "Authentication failed");
  }

  const lineItems = await prisma.lineItem.deleteMany();
  const transactions = await prisma.transaction.deleteMany();
  const drafts = await prisma.extractionDraft.deleteMany();
  const recurring = await prisma.recurringTemplate.deleteMany();
  const users = await prisma.user.deleteMany();

  return NextResponse.json({
    ok: true,
    deleted: {
      lineItems: lineItems.count,
      transactions: transactions.count,
      extractionDrafts: drafts.count,
      recurringTemplates: recurring.count,
      users: users.count,
    },
  });
}
