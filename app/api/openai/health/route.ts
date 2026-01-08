import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";
import { getOpenAI } from "@/lib/openai.server";
import { getOpenAIAssistantId } from "@/lib/env";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function GET() {
  const requestId = randomUUID();
  try {
    await getCurrentUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    return jsonError(500, "AUTH_FAILED", "Authentication failed");
  }

  let openai;
  let assistantId: string;
  try {
    openai = getOpenAI();
    assistantId = getOpenAIAssistantId();
  } catch (error) {
    return jsonError(
      500,
      "OPENAI_NOT_CONFIGURED",
      error instanceof Error ? error.message : "OpenAI not configured",
    );
  }

  try {
    await openai.beta.assistants.retrieve(assistantId);
    return NextResponse.json({ ok: true, requestId });
  } catch (error) {
    console.error("[openai] health error", { requestId, error });
    return jsonError(500, "OPENAI_HEALTH_FAILED", "OpenAI health check failed");
  }
}
