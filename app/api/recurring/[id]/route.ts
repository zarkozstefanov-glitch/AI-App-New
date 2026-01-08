import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/server-session";

export const runtime = "nodejs";

const updateSchema = z.object({
  accountId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  category: z.string().optional(),
  subCategory: z.string().min(1).optional(),
  paymentDay: z.number().int().min(1).max(31).optional(),
  note: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID();
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const template = await prisma.recurringTemplate.findFirst({
      where: { id, userId: user.id },
    });
    if (!template) {
      return jsonError(404, "NOT_FOUND", "Recurring template not found");
    }
    return NextResponse.json({ ok: true, data: template, requestId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[recurring] get error", { requestId, error });
    return jsonError(500, "GET_FAILED", "Failed to load recurring template");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID();
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, "INVALID_JSON", "Invalid JSON body");
    }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "INVALID_INPUT", "Invalid template payload", parsed.error.flatten());
    }

    const template = await prisma.recurringTemplate.updateMany({
      where: { id, userId: user.id },
      data: {
        ...parsed.data,
        note: parsed.data.note === null ? null : parsed.data.note,
      },
    });

    if (template.count === 0) {
      return jsonError(404, "NOT_FOUND", "Recurring template not found");
    }

    return NextResponse.json({ ok: true, requestId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[recurring] update error", { requestId, error });
    return jsonError(500, "UPDATE_FAILED", "Failed to update recurring template");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID();
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    await prisma.recurringTemplate.deleteMany({
      where: { id, userId: user.id },
    });
    return NextResponse.json({ ok: true, requestId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(401, error.code, error.message);
    }
    console.error("[recurring] delete error", { requestId, error });
    return jsonError(500, "DELETE_FAILED", "Failed to delete recurring template");
  }
}
