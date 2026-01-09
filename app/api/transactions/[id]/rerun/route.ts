import { NextResponse } from "next/server";
import path from "path";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";
import { getOpenAI } from "@/lib/openai.server";
import { getOpenAIAssistantId } from "@/lib/env";
import { buildExtractionPrompts } from "@/lib/extraction/prompt";
import { parseExtraction } from "@/lib/extraction/parse";
import { extractionSchema } from "@/lib/extraction/schema";
import { prisma } from "@/lib/prisma";
import { mapAssistantCategory } from "@/lib/extraction/category-map";
import { randomUUID } from "crypto";
import { createReadStream } from "fs";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string, details?: string) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }, // ПРОМЯНА 1: Дефинираме го като Promise
) {
  const requestId = randomUUID();
  if (process.env.NODE_ENV !== "production") {
    console.log(`[rerun] requestId=${requestId}`);
  }
  try {
    const { id } = await params; // ПРОМЯНА 2: Извличаме ID-то с await
    const user = await getCurrentUser();
    
    // ПРОМЯНА 3: Използваме директно 'id' вместо 'params.id'
    const existing = await prisma.transaction.findFirst({
      where: { id: id, userId: user.id },
    });
    
    if (!existing) {
      return jsonError(404, "NOT_FOUND", "Transaction not found");
    }
    if (!existing.originalImageUrl) {
      return jsonError(400, "NO_IMAGE", "No stored image to re-run");
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
        "Server misconfigured: OPENAI_API_KEY missing/invalid",
        error instanceof Error ? error.message : String(error),
      );
    }
    const { system, user: userPrompt } = buildExtractionPrompts("receipt");

    const filePath = path.join(process.cwd(), "public", existing.originalImageUrl);
    const uploaded = await openai.files.create({
      file: createReadStream(filePath),
      purpose: "vision",
    });

    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${system} ${userPrompt}` },
            { type: "image_file", image_file: { file_id: uploaded.id } },
          ],
        },
      ],
    });

    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistantId,
      response_format: { type: "json_object" },
    });
    if (run.status !== "completed") {
      return jsonError(500, "ASSISTANT_RUN_FAILED", "Assistant run did not complete");
    }

    const messages = await openai.beta.threads.messages.list(thread.id, {
      limit: 10,
    });
    const assistantMessage = messages.data.find((msg) => msg.role === "assistant");
    const textParts =
      assistantMessage?.content
        ?.filter((part) => part.type === "text")
        .map((part) => part.text?.value ?? "") ?? [];
    const content = textParts.join("\n").trim();
    const parsed = parseExtraction(content);
    if (!parsed.ok) {
      return jsonError(500, "EXTRACTION_PARSE_FAILED", parsed.error, parsed.raw);
    }
    const validated = extractionSchema.safeParse(parsed.data);
    if (!validated.success) {
      return jsonError(500, "EXTRACTION_INVALID", "Extraction schema mismatch");
    }

    if (validated.data.status === "error") {
      return jsonError(
        422,
        "ASSISTANT_REPORTED_ERROR",
        validated.data.error_message ?? "Assistant reported an error",
      );
    }
    if (!validated.data.data) {
      return jsonError(500, "MISSING_DATA", "Missing extraction data");
    }
    const totalBgnCents = Math.round(validated.data.data.total_sum_bgn * 100);
    const totalEurCents = Math.round(validated.data.data.total_sum_eur * 100);
    const category = mapAssistantCategory(
      validated.data.data.items[0]?.category ?? null,
    );

    await prisma.lineItem.deleteMany({ where: { transactionId: existing.id } });
    const updated = await prisma.transaction.update({
      where: { id: existing.id },
      data: {
        sourceType: "receipt",
        merchantName: validated.data.data.merchant_name,
        paymentMethod: null,
        transactionDate: validated.data.data.date
          ? new Date(validated.data.data.date)
          : new Date(), 
        totalBgnCents,
        totalEurCents,
        currencyOriginal: "BGN",
        totalBgn: validated.data.data.total_sum_bgn,
        totalEur: validated.data.data.total_sum_eur,
        totalOriginalCents: totalBgnCents,
        totalOriginal: validated.data.data.total_sum_bgn,
        category,
        categoryConfidence: 1,
        aiExtractedJson: JSON.stringify(validated.data),
        overallConfidence: 1,
        lineItems:
          validated.data.data.items.length > 0
            ? {
                createMany: {
                  data: validated.data.data.items.map((item) => ({
                    name: item.name_en,
                    quantity: undefined,
                    priceOriginal: item.price_bgn,
                    priceBgn: item.price_bgn,
                    priceEur: item.price_eur,
                    priceOriginalCents: Math.round(item.price_bgn * 100),
                    priceBgnCents: Math.round(item.price_bgn * 100),
                    priceEurCents: Math.round(item.price_eur * 100),
                  })),
                },
              }
            : undefined,
      },
      include: { lineItems: true },
    });

    return NextResponse.json({ ok: true, data: updated, extraction: validated.data });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[rerun] error", { requestId, error });
    return jsonError(500, "RERUN_FAILED", "Failed to re-run extraction");
  }
}
