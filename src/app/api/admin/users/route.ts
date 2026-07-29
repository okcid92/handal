import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-errors";
import { guardAdmin } from "@/lib/route-guards";
import { prisma } from "@/lib/prisma";

function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function GET(request: NextRequest) {
  try {
    guardAdmin(request);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        ine: true,
        email: true,
        role: true,
        department: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, users: serialize(users) });
  } catch (error) {
    return errorResponse(error);
  }
}