import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/route-guards";
import { prisma } from "@/lib/prisma";

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

    return NextResponse.json({ ok: true, users });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to fetch users" }, { status: 500 });
  }
}