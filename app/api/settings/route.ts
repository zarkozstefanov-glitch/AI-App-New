import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validators";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { messageKey: "errors.unauthorized" },
      { status: 401 },
    );
  }

  try {
    const data = await request.json();
    const parsed = settingsSchema.parse(data);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        phone: parsed.phone,
        nickname: parsed.nickname,
        monthlyBudgetGoal: parsed.monthlyBudgetGoal ?? undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error", error);
    return NextResponse.json(
      {
        messageKey: "errors.settingsSaveFailed",
      },
      { status: 400 },
    );
  }
}
