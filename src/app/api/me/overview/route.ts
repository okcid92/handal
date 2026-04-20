import { NextRequest, NextResponse } from "next/server";

import { ApiError, errorResponse } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { readSessionFromRequest } from "@/lib/session";

const THEME_STATUS_PRIORITY: Record<string, number> = {
  VALIDATED: 5,
  VALIDATED_DA: 5,
  VALIDATED_CD: 4,
  DOCUMENT_SUBMITTED: 4,
  ANALYSIS_PENDING: 4,
  APPROVED: 4,
  APPROVED_WITH_MENTION: 4,
  CONDITIONAL_APPROVAL: 4,
  REQUESTED_REVIEW: 4,
  FLAGGED_PLAGIARISM: 4,
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
                teacherApproval: true,
                daApproval: true,
                // champs legacy v1
                validatedCdBy: true,
                validatedDaBy: true,
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
        activeTheme: activeTheme
          ? {
              id: activeTheme.id.toString(),
              title: activeTheme.title,
              status: activeTheme.status,
              // v2 : votes simultanés
              teacherApproval: activeTheme.teacherApproval,
              daApproval: activeTheme.daApproval,
              // v1 legacy : validé séquentiellement
              validatedCd: activeTheme.validatedCdBy !== null,
              validatedDa: activeTheme.validatedDaBy !== null,
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
