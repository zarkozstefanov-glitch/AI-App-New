import { NextResponse } from "next/server";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";
import { prisma } from "@/lib/prisma";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> } // Дефинираме го като Promise
) {
  try {
    const { id } = await params; // Трябва да добавиш await тук
    const user = await getCurrentUser(); // Взимаме потребителя правилно

    if (!user) {
      return jsonError(401, "UNAUTHORIZED", "User not found");
    }

    const rows = await prisma.transactionHistory.findMany({
      where: { 
        transactionId: id, // Използваме 'id', което вече сме изчакали (await)
        userId: user.id 
      },
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