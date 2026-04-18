import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() AS now`;

    return NextResponse.json({
      ok: true,
      mysql: "connected",
      serverTime: rows[0]?.now?.toISOString() ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        mysql: "disconnected",
        error: message,
      },
      { status: 500 },
    );
  }
}
