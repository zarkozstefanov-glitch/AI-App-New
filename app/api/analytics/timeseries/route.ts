import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { resolveTotalsCents } from "@/lib/currency";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

function formatDateKey(date: Date, range: "month" | "year") {
  if (range === "year") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  try {
    const user = await getCurrentUser();
    const params = request.nextUrl.searchParams;
    const range = (params.get("range") === "year" ? "year" : "month") as
      | "month"
      | "year";
    const from = params.get("from");
    const to = params.get("to");
    const category = params.get("category");
    const accountId = params.get("accountId");

    const now = new Date();
    const defaultFrom =
      range === "year"
        ? new Date(now.getFullYear(), now.getMonth() - 11, 1)
        : new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo =
      range === "year"
        ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
        : now;
    const fromDate = from ? new Date(from) : defaultFrom;
    const toDate = to ? new Date(to) : defaultTo;
    if (fromDate) {
      fromDate.setHours(0, 1, 0, 0);
    }
    if (toDate) {
      toDate.setHours(23, 59, 0, 0);
    }

    const where: Record<string, unknown> = {
      userId: user.id,
      transactionDate: { gte: fromDate, lte: toDate },
      transactionType: "expense",
    };
    if (accountId) where.accountId = accountId;
    if (category) where.category = category;

    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        transactionDate: true,
        createdAt: true,
        totalEur: true,
        totalBgn: true,
        totalOriginalCents: true,
        totalOriginal: true,
        currencyOriginal: true,
      },
    });

    const buckets = new Map<string, { eurCents: number; bgnCents: number }>();

    for (const tx of transactions) {
      const resolved = resolveTotalsCents(tx);
      const date = tx.transactionDate ?? tx.createdAt;
      const key = formatDateKey(date, range);
      const current = buckets.get(key) ?? { eurCents: 0, bgnCents: 0 };
      current.eurCents += resolved.eurCents ?? 0;
      current.bgnCents += resolved.bgnCents ?? 0;
      buckets.set(key, current);
    }

    if (range === "month") {
      const dayMs = 24 * 60 * 60 * 1000;
      const start = startOfDay(fromDate);
      const end = startOfDay(toDate);
      for (
        let cursor = start;
        cursor.getTime() <= end.getTime();
        cursor = new Date(cursor.getTime() + dayMs)
      ) {
        const key = formatDateKey(cursor, range);
        if (!buckets.has(key)) {
          buckets.set(key, { eurCents: 0, bgnCents: 0 });
        }
      }
    }

    const data = Array.from(buckets.entries())
      .map(([date, value]) => ({ date, ...value }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    return NextResponse.json({ ok: true, range, data, requestId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[analytics] timeseries error", { requestId, error });
    return jsonError(500, "TIMESERIES_FAILED", "Failed to load analytics timeseries");
  }
}
