import { AppreciationDecision, DocumentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, errorResponse } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { guardRole } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";

const payloadSchema = z.object({
  decision: z.enum(["final_validation", "sanction", "rewrite_required"]),
  committee: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
});

function mapDecision(decision: "final_validation" | "sanction" | "rewrite_required") {
  if (decision === "final_validation") {
    return {
      appreciationDecision: AppreciationDecision.APPROVED,
      documentStatus: DocumentStatus.APPROVED,
      isReference: true,
    };
  }
  if (decision === "sanction") {
    return {
      appreciationDecision: AppreciationDecision.REJECTED,
      documentStatus: DocumentStatus.REJECTED,
      isReference: false,
    };
  }
  return {
    appreciationDecision: AppreciationDecision.REQUESTED_REVIEW,
    documentStatus: DocumentStatus.REQUESTED_REVIEW,
    isReference: false,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ report: string }> },
) {
  try {
    assertSameOrigin(request);
    const session = guardRole(request, ["TEACHER", "DA", "ADMIN"]);
    const { report } = await params;
    const reportId = BigInt(report);
    const payload = payloadSchema.parse(await request.json());

    const reportRow = await prisma.similarityReport.findUnique({
      where: { id: reportId },
      select: { id: true, documentId: true },
    });

    if (!reportRow) {
      throw new ApiError("Report not found", 404, "REPORT_NOT_FOUND");
    }

    const document = await prisma.document.findUnique({
      where: { id: reportRow.documentId },
      include: { appreciation: true },
    });

    if (!document) {
      throw new ApiError("Document not found", 404, "DOCUMENT_NOT_FOUND");
    }

    const mapped = mapDecision(payload.decision);
    const actorId = BigInt(session.userId);
    const decisionComment = [payload.committee?.trim(), payload.notes?.trim()]
      .filter(Boolean)
      .join(" | ") || null;
    const now = new Date();

    if (!document.appreciation) {
      await prisma.finalAppreciation.create({
        data: {
          documentId: document.id,
          teacherId: actorId,
          teacherDecision: mapped.appreciationDecision,
          teacherComment: decisionComment,
          teacherDecidedAt: now,
          daId: actorId,
          daDecision: mapped.appreciationDecision,
          daComment: decisionComment,
          daDecidedAt: now,
          finalDecision: mapped.appreciationDecision,
          mention: payload.committee?.trim() || null,
          finalizedAt: now,
        },
      });
    } else {
      await prisma.finalAppreciation.update({
        where: { id: document.appreciation.id },
        data: {
          teacherId: actorId,
          teacherDecision: mapped.appreciationDecision,
          teacherComment: decisionComment,
          teacherDecidedAt: now,
          daId: actorId,
          daDecision: mapped.appreciationDecision,
          daComment: decisionComment,
          daDecidedAt: now,
          finalDecision: mapped.appreciationDecision,
          mention: payload.committee?.trim() || null,
          finalizedAt: now,
        },
      });
    }

    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: {
        documentStatus: mapped.documentStatus,
        isReference: mapped.isReference,
      },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      deliberation: {
        id: updatedDocument.id.toString(),
        decision: payload.decision.toUpperCase(),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
