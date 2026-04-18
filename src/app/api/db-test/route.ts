import { NextResponse } from "next/server";

import { getDbPool } from "@/lib/db";

export async function GET() {
  let connection;

  try {
    const dbPool = getDbPool();
    connection = await dbPool.getConnection();
    const [rows] = await connection.query("SELECT NOW() AS now");

    return NextResponse.json({
      ok: true,
      mysql: "connected",
      serverTime: (rows as Array<{ now: string }>)[0]?.now ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        mysql: "disconnected",
        error: message,
      },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}