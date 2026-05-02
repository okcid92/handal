import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, errorResponse } from "@/lib/api-errors";
import { guardRole } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { prisma } from "@/lib/prisma";
import { AppreciationDecision, DocumentStatus } from "@prisma/client";

const payloadSchema = z.object({
  decision: z.nativeEnum(AppreciationDecision),
  comment: z.string().trim().optional().nullable(),
  mention: z.string().trim().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    assertSameOrigin(request);
    const session = guardRole(request, ["TEACHER", "DA", "ADMIN"]);
    const { decision, comment, mention } = payloadSchema.parse(
      await request.json(),
    );

    const documentId = BigInt(params.id);

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { similarityReport: true, finalAppreciation: true, student: true },
    });

    if (!document) {
      throw new ApiError("Document not found", 404, "DOCUMENT_NOT_FOUND");
    }

    if (!["CLEAN", "FLAGGED_PLAGIARISM"].includes(document.documentStatus)) {
      throw new ApiError(
        `Cannot appreciate document with status ${document.documentStatus}`,
        409,
        "DOCUMENT_STATUS_INVALID",
      );
    }

    let appreciation = document.finalAppreciation;
    if (!appreciation) {
      appreciation = await prisma.finalAppreciation.create({
        data: { documentId },
      });
    }

    const isTeacher =
      session.role === "TEACHER" ||
      (session.role === "ADMIN" && !appreciation.teacherDecision);
    const isDA =
      session.role === "DA" ||
      (session.role === "ADMIN" && !appreciation.daDecision);

    if (!isTeacher && !isDA) {
      throw new ApiError(
        "No pending appreciation slot available",
        409,
        "APPRECIATION_ALREADY_RECORDED",
      );
    }

    const updateData: any = {};

    if (isTeacher || session.role === "ADMIN") {
      updateData.teacherId = BigInt(session.userId);
      updateData.teacherDecision = decision;
      updateData.teacherComment = comment || null;
      updateData.teacherDecidedAt = new Date();
    }

    if (isDA || session.role === "ADMIN") {
      updateData.daId = BigInt(session.userId);
      updateData.daDecision = decision;
      updateData.daComment = comment || null;
      updateData.daDecidedAt = new Date();
    }

    const updatedAppreciation = await prisma.finalAppreciation.update({
      where: { id: appreciation.id },
      data: updateData,
    });

    if (updatedAppreciation.teacherDecision && updatedAppreciation.daDecision) {
      const canApprove =
        updatedAppreciation.teacherDecision === AppreciationDecision.APPROVED &&
        updatedAppreciation.daDecision === AppreciationDecision.APPROVED;

      const finalDecision = canApprove
        ? AppreciationDecision.APPROVED
        : updatedAppreciation.teacherDecision === AppreciationDecision.REJECTED ||
            updatedAppreciation.daDecision === AppreciationDecision.REJECTED
          ? AppreciationDecision.REJECTED
          : decision;

      const finalAppreciation = await prisma.finalAppreciation.update({
        where: { id: appreciation.id },
        data: {
          finalDecision,
          mention: mention || null,
          finalizedAt: new Date(),
        },
      });

      const newDocumentStatus = canApprove ? DocumentStatus.APPROVED : DocumentStatus.REJECTED;
      await prisma.document.update({
        where: { id: documentId },
        data: { documentStatus: newDocumentStatus },
      });

      await notifyStudent(document.studentId, {
        type: newDocumentStatus === DocumentStatus.APPROVED ? "APPRECIATION_APPROVED" : "APPRECIATION_REJECTED",
        documentId,
        message: newDocumentStatus === DocumentStatus.APPROVED
          ? `Votre mémoire a été approuvé. Vous êtes autorisé à faire la soutenance.`
          : `Votre mémoire a été rejeté. Veuillez contacter le jury pour les détails.`,
        mention: mention || null,
      });

      return NextResponse.json({ ok: true, data: finalAppreciation });
    }

    return NextResponse.json({ ok: true, data: updatedAppreciation });
  } catch (error) {
    return errorResponse(error);
  }
}

async function notifyStudent(
  studentId: bigint,
  payload: { type: string; documentId: bigint; message: string; mention?: string | null },
) {
  // Implementation simple de notification (logger)
  console.log(`Notification to student ${studentId}: ${payload.message}`);
}
