import { NextRequest, NextResponse } from "next/server";
import { errorResponse, ApiError } from "@/lib/api-errors";
import { guardStudent } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ report: string }> },
) {
  try {
    assertSameOrigin(request);
    const session = guardStudent(request);
    const studentId = BigInt(session.userId);
    const { report } = await params;
    const reportId = BigInt(report);

    const row = await prisma.similarityReport.findUnique({
      where: { id: reportId },
      include: {
        document: {
          select: {
            id: true,
            studentId: true,
            originalName: true,
            theme: { select: { title: true } },
          },
        },
      },
    });

    if (!row) {
      throw new ApiError("Report not found", 404, "REPORT_NOT_FOUND");
    }

    if (row.document.studentId !== studentId) {
      throw new ApiError("Forbidden", 403, "FORBIDDEN");
    }

    return NextResponse.json({
      ok: true,
      report: {
        id: row.id.toString(),
        documentId: row.documentId.toString(),
        globalSimilarity: row.globalSimilarity.toString(),
        aiScore: row.aiScore?.toString() ?? null,
        riskLevel: row.riskLevel,
        matchedSources: row.matchedSources,
        highlightedSegments: row.highlightedSegments,
        analyzedAt: row.analyzedAt.toISOString(),
        document: {
          id: row.document.id.toString(),
          originalName: row.document.originalName,
          title: row.document.theme?.title ?? row.document.originalName,
        },
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
