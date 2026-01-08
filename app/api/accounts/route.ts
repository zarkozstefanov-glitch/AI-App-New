import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { bgnCentsToEurCents } from "@/lib/currency";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";
import { applyDueFixedExpenses } from "@/lib/db/fixed-expenses";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function GET() {
  const requestId = randomUUID();
  try {
    const user = await getCurrentUser();
    await applyDueFixedExpenses(user.id);
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        kind: true,
        currency: true,
        balanceBgnCents: true,
        balanceEurCents: true,
      },
    });

    const data = accounts.map((account) => ({
      ...account,
      balanceBgnCents: account.balanceBgnCents ?? 0,
      balanceEurCents:
        account.balanceEurCents ?? bgnCentsToEurCents(account.balanceBgnCents ?? 0),
    }));

    return NextResponse.json({ ok: true, data, requestId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[accounts] list error", { requestId, error });
    return jsonError(500, "LIST_FAILED", "Failed to load accounts");
  }
}
