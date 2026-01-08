import { NextResponse } from "next/server";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";
import { getOpenAI } from "@/lib/openai.server";
import { getOpenAIAssistantId } from "@/lib/env";
import { buildExtractionPrompts } from "@/lib/extraction/prompt";
import { parseExtraction } from "@/lib/extraction/parse";
import { extractionSchema } from "@/lib/extraction/schema";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function jsonError(status: number, code: string, message: string, details?: string) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  if (process.env.NODE_ENV !== "production") {
    console.log(`[extract] requestId=${requestId}`);
  }
  let userId: string;
  try {
    const user = await getCurrentUser();
    userId = user.id;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    return jsonError(500, "AUTH_FAILED", "Authentication failed");
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const storeOriginalImage = formData.get("storeOriginalImage") === "true";
  if (!file || !(file instanceof File)) {
    return jsonError(400, "MISSING_FILE", "Missing image file");
  }

  if (file.size > MAX_BYTES) {
    return jsonError(400, "FILE_TOO_LARGE", "Image exceeds 10MB");
  }

  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return jsonError(400, "UNSUPPORTED_TYPE", "Unsupported image type");
  }

  let openai;
  try {
    openai = getOpenAI();
  } catch (error) {
    return jsonError(
      500,
      "OPENAI_NOT_CONFIGURED",
      "Server misconfigured: OPENAI_API_KEY missing/invalid",
      error instanceof Error ? error.message : String(error),
    );
  }
  if (!openai?.files?.create || !openai?.beta?.threads?.create || !openai?.beta?.threads?.runs?.createAndPoll) {
    return jsonError(
      500,
      "OPENAI_CLIENT_INVALID",
      "OpenAI client is not initialized correctly",
    );
  }

  const sourceHint =
    (formData.get("sourceType") as string) === "receipt"
      ? "receipt"
      : (formData.get("sourceType") as string) === "bank"
        ? "bank"
        : "unknown";

  const { system, user } = buildExtractionPrompts(sourceHint);

  let assistantId: string;
  try {
    assistantId = getOpenAIAssistantId();
  } catch (error) {
    return jsonError(
      500,
      "OPENAI_NOT_CONFIGURED",
      "Server misconfigured: OPENAI_ASSISTANT_ID missing/invalid",
      error instanceof Error ? error.message : String(error),
    );
  }

  const started = Date.now();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const tmpDir = path.join(os.tmpdir(), "expense-ai");
  const ext = path.extname(file.name || "") || ".png";
  const tmpPath = path.join(tmpDir, `${requestId}${ext}`);
  await mkdir(tmpDir, { recursive: true });
  await writeFile(tmpPath, buffer);
  let storedImageUrl: string | null = null;
  if (storeOriginalImage) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const storedPath = path.join(uploadsDir, `${requestId}${ext}`);
    await writeFile(storedPath, buffer);
    storedImageUrl = `/uploads/${requestId}${ext}`;
  }

  let uploadedFileId: string | null = null;
  let content = "";
  try {
    const uploaded = await openai.files.create({
      file: createReadStream(tmpPath),
      purpose: "vision",
    });
    uploadedFileId = uploaded.id;

    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${system} ${user}` },
            { type: "image_file", image_file: { file_id: uploadedFileId } },
          ],
        },
      ],
    });

    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistantId,
      response_format: { type: "json_object" },
    });

    if (run.status !== "completed") {
      console.error("[extract] assistant run not completed", {
        requestId,
        status: run.status,
      });
      return jsonError(
        500,
        "ASSISTANT_RUN_FAILED",
        "Assistant run did not complete",
      );
    }

    const messages = await openai.beta.threads.messages.list(thread.id, {
      limit: 10,
    });
    const assistantMessage = messages.data.find(
      (msg) => msg.role === "assistant",
    );
    const textParts =
      assistantMessage?.content
        ?.filter((part) => part.type === "text")
        .map((part) => part.text?.value ?? "") ?? [];
    content = textParts.join("\n").trim();
    if (!content) {
      return jsonError(
        500,
        "ASSISTANT_EMPTY_RESPONSE",
        "Assistant returned an empty response",
      );
    }
  } catch (error) {
    console.error("[extract] OpenAI error", { requestId, error });
    return jsonError(
      500,
      "OPENAI_REQUEST_FAILED",
      "Failed to call OpenAI",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    try {
      await unlink(tmpPath);
    } catch {
      // ignore temp cleanup errors
    }
  }

  let parsed = parseExtraction(content);
  if (!parsed.ok) {
    console.error("[extract] parse error", {
      requestId,
      error: parsed.error,
      sample: parsed.raw?.slice(0, 500),
    });
  }

  if (!parsed.ok) {
    console.error("[extract] parse error", { requestId, error: parsed.error });
    return jsonError(500, "EXTRACTION_PARSE_FAILED", parsed.error, parsed.raw);
  }

  const validated = extractionSchema.safeParse(parsed.data);
  if (!validated.success) {
    console.error("[extract] validation error", { requestId, error: validated.error });
    return jsonError(500, "EXTRACTION_INVALID", "Extraction schema mismatch");
  }

  if (validated.data.status === "error") {
    return jsonError(
      422,
      "ASSISTANT_REPORTED_ERROR",
      validated.data.error_message ?? "Assistant reported an error",
    );
  }

  const draft = await prisma.extractionDraft.create({
    data: {
      userId,
      extractionJson: JSON.stringify(validated.data),
      originalImageUrl: storedImageUrl ?? undefined,
    },
  });

  const elapsedMs = Date.now() - started;
  return NextResponse.json({
    ok: true,
    extraction: validated.data,
    draftId: draft.id,
    requestId,
    debug:
      process.env.NODE_ENV !== "production"
        ? { model: "assistant", elapsedMs }
        : undefined,
  });
}
