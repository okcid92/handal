import { NextRequest, NextResponse } from "next/server";

import { ApiError, errorResponse } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { readSessionFromRequest } from "@/lib/session";

const THEME_STATUS_PRIORITY: Record<string, number> = {
  VALIDATED: 5,
  PENDING_VALIDATION: 2,
  PENDING: 1,
};

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

    // Thème actif de l'étudiant (le plus récent non rejeté)
    const activeTheme =
      session.role === "STUDENT"
        ? await prisma.theme
            .findMany({
              where: {
                studentId: BigInt(session.userId),
                status: { not: "REJECTED" },
              },
              select: {
                id: true,
                title: true,
                status: true,
                teacherVote: true,
                daVote: true,
                updatedAt: true,
                createdAt: true,
              },
            })
            .then(
              (themes) =>
                themes.sort((left, right) => {
                  const leftPriority = THEME_STATUS_PRIORITY[left.status] ?? 0;
                  const rightPriority =
                    THEME_STATUS_PRIORITY[right.status] ?? 0;

                  if (rightPriority !== leftPriority) {
                    return rightPriority - leftPriority;
                  }

                  return right.updatedAt.getTime() - left.updatedAt.getTime();
                })[0] ?? null,
            )
        : null;

    const latestDeliberation = await prisma.finalAppreciation.findFirst({
      where: {
        document: {
          studentId: BigInt(session.userId),
        },
        teacherDecision: { not: null },
        daDecision: { not: null },
        finalDecision: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        finalDecision: true,
      },
    });

    return NextResponse.json(
      {
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
        hasDeliberationStep: latestDeliberation !== null,
        activeTheme: activeTheme
          ? {
              id: activeTheme.id.toString(),
              title: activeTheme.title,
              status: activeTheme.status,
              teacherVote: activeTheme.teacherVote,
              daVote: activeTheme.daVote,
              teacherApproval:
                activeTheme.teacherVote === "approved"
                  ? true
                  : activeTheme.teacherVote === "rejected"
                    ? false
                    : null,
              daApproval:
                activeTheme.daVote === "approved"
                  ? true
                  : activeTheme.daVote === "rejected"
                    ? false
                    : null,
              validatedCd: activeTheme.teacherVote === "approved",
              validatedDa: activeTheme.daVote === "approved",
            }
          : null,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
