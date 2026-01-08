import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown";
  const limit = rateLimit(`register-${ip}`, { limit: 5, windowMs: 60_000 });
  if (!limit.success) {
    return NextResponse.json(
      {
        messageKey: "errors.tooManyAttempts",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } },
    );
  }

  try {
    const data = await request.json();
    const parsed = registerSchema.parse({
      ...data,
      monthlyBudgetGoal:
        data.monthlyBudgetGoal === null || data.monthlyBudgetGoal === undefined
          ? undefined
          : Number(data.monthlyBudgetGoal),
    });

    const existing = await prisma.user.findUnique({
      where: { email: parsed.email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        {
          messageKey: "errors.emailAlreadyRegistered",
        },
        { status: 400 },
      );
    }

    const passwordHash = await hash(parsed.password, 10);
    await prisma.user.create({
      data: {
        name: `${parsed.firstName} ${parsed.lastName}`.trim(),
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email.toLowerCase(),
        phone: parsed.phone || null,
        passwordHash,
        nickname: parsed.nickname,
        monthlyBudgetGoal: parsed.monthlyBudgetGoal,
        accounts: {
          create: [
            { name: "В брой", kind: "cash", currency: "BGN" },
            { name: "Банкова сметка", kind: "bank", currency: "BGN" },
            { name: "Спестовна сметка", kind: "savings", currency: "BGN" },
          ],
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Register error", error);
    return NextResponse.json(
      { messageKey: "errors.registrationFailed" },
      { status: 400 },
    );
  }
}
