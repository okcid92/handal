import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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

    return NextResponse.json({ ok: true, users });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to fetch users" }, { status: 500 });
  }
}