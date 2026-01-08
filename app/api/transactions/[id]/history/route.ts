import { NextResponse } from "next/server";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";
import { prisma } from "@/lib/prisma";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    const rows = await prisma.transactionHistory.findMany({
      where: { transactionId: params.id, userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    const data = rows.map((row) => ({
      ...row,
      oldData: row.oldData ? JSON.parse(row.oldData) : null,
    }));
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    return jsonError(500, "HISTORY_FAILED", "Failed to load transaction history");
  }
}
