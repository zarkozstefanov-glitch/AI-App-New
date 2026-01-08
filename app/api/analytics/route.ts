import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "DEPRECATED",
        message: "Use /api/analytics/summary and /api/analytics/timeseries",
      },
    },
    { status: 410 },
  );
}
