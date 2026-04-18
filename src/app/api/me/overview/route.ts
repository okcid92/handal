import { NextRequest, NextResponse } from "next/server";

import { ApiError, errorResponse } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { readSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = readSessionFromRequest(request);
    if (!session) {
      throw new ApiError("Unauthenticated", 401, "UNAUTHENTICATED");
    }

    const user = await prisma.user.findUnique({
      where: { id: BigInt(session.userId) },
      select: {
        id: true,
        name: true,
        role: true,
        ine: true,
        email: true,
        department: true,
      },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "USER_NOT_FOUND");
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id.toString(),
        name: user.name,
        role: user.role,
        ine: user.ine,
        email: user.email,
        department: user.department,
      },
      overview: {
        role: user.role,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
