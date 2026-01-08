import { NextResponse } from "next/server";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";
import { cleanupUserData } from "@/lib/db/transactions";
import { randomUUID } from "crypto";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function DELETE() {
  const requestId = randomUUID();
  if (process.env.NODE_ENV !== "production") {
    console.log(`[cleanup] requestId=${requestId}`);
  }
  try {
    const user = await getCurrentUser();
    const result = await cleanupUserData(user.id);
    return NextResponse.json({ ok: true, deleted: result, requestId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[cleanup] error", { requestId, error });
    return jsonError(500, "CLEANUP_FAILED", "Failed to cleanup user data");
  }
}
