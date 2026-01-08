import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";
import { extractionSchema, type ExtractionResult } from "@/lib/extraction/schema";
import { createFromExtraction } from "@/lib/db/transactions";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  extraction: extractionSchema.optional(),
  draftId: z.string().optional(),
  imageRef: z.string().optional(),
  accountId: z.string().min(1),
  isFixed: z.boolean().optional().default(false),
});

function jsonError(status: number, code: string, message: string, details?: string) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  if (process.env.NODE_ENV !== "production") {
    console.log(`[transactions] from-extraction requestId=${requestId}`);
  }
  try {
    const user = await getCurrentUser();
    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, "INVALID_JSON", "Invalid JSON body");
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_INPUT",
            message: "Invalid extraction payload",
            details: parsed.error.flatten(),
          },
          requestId,
        },
        { status: 400 },
      );
    }
    let extraction = parsed.data.extraction as ExtractionResult | undefined;
    let draftImageRef: string | null = null;
    if (!extraction && parsed.data.draftId) {
      const draft = await prisma.extractionDraft.findFirst({
        where: { id: parsed.data.draftId, userId: user.id },
      });
      if (!draft) {
        return jsonError(404, "DRAFT_NOT_FOUND", "Draft extraction not found");
      }
      try {
        extraction = JSON.parse(draft.extractionJson) as ExtractionResult;
      } catch {
        return jsonError(500, "DRAFT_INVALID", "Draft extraction is invalid");
      }
      draftImageRef = draft.originalImageUrl ?? null;
    }
    if (!extraction) {
      return jsonError(400, "MISSING_EXTRACTION", "Missing extraction data");
    }

    const account = await prisma.account.findFirst({
      where: { id: parsed.data.accountId, userId: user.id },
      select: { id: true },
    });
    if (!account) {
      return jsonError(403, "INVALID_ACCOUNT", "Account not found");
    }

    const transaction = await createFromExtraction({
      userId: user.id,
      extraction,
      accountId: parsed.data.accountId,
      isFixed: parsed.data.isFixed ?? false,
      imageRef: parsed.data.imageRef ?? draftImageRef ?? null,
    });
    if (parsed.data.draftId) {
      await prisma.extractionDraft.deleteMany({
        where: { id: parsed.data.draftId, userId: user.id },
      });
    }
    return NextResponse.json({ ok: true, transaction, requestId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[transactions] from-extraction error", { requestId, error });
    return jsonError(
      500,
      "EXTRACTION_SAVE_FAILED",
      "Failed to save extraction",
      error instanceof Error ? error.message : String(error),
    );
  }
}
