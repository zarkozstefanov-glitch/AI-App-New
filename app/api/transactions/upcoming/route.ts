import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";
import { resolveTotalsCents } from "@/lib/currency";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function GET() {
  const requestId = randomUUID();
  try {
    const user = await getCurrentUser();
    const today = startOfDay(new Date());
    const end = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endOfDay = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
      23,
      59,
      59,
      999,
    );

    const rows = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        isFixed: true,
        transactionDate: { gte: today, lte: endOfDay },
      },
      orderBy: { transactionDate: "asc" },
    });

    const data = rows.map((tx) => {
      const totals = resolveTotalsCents(tx);
      return {
        id: tx.id,
        merchantName: tx.merchantName,
        category: tx.category,
        transactionDate: tx.transactionDate,
        totalEurCents: totals.eurCents ?? 0,
        totalBgnCents: totals.bgnCents ?? 0,
        transactionType: tx.transactionType,
        isFixed: tx.isFixed,
      };
    });

    return NextResponse.json({ ok: true, data, requestId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[transactions] upcoming error", { requestId, error });
    return jsonError(500, "UPCOMING_FAILED", "Failed to load upcoming payments");
  }
}
