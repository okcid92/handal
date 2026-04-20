import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, ApiError } from "@/lib/api-errors";
import { guardAdmin } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const approveSchema = z.object({
  subjectLabel: z.string().trim().min(3).max(300),
  techStack: z.array(z.string().trim()).max(10).default([]),
  authorName: z.string().trim().max(120).nullable().optional(),
  department: z.string().trim().max(80).nullable().optional(),
  academicYear: z.string().trim().max(20).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    guardAdmin(request);
    const { id } = await params;
    const documentId = BigInt(id);

    const body = approveSchema.parse(await request.json());

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, documentStatus: true, isReference: true },
    });

    if (!doc) {
      throw new ApiError("Document not found", 404, "DOCUMENT_NOT_FOUND");
    }

    if (doc.documentStatus !== "PENDING_ADMIN_REVIEW") {
      throw new ApiError(
        "Document is not in staging",
        409,
        "NOT_IN_STAGING",
      );
    }

    const finalMetadata = {
      subjectLabel: body.subjectLabel,
      techStack: body.techStack,
      authorName: body.authorName ?? null,
      department: body.department ?? null,
      academicYear: body.academicYear ?? null,
      approvedAt: new Date().toISOString(),
    };

    await prisma.document.update({
      where: { id: documentId },
      data: {
        documentStatus: "APPROVED",
        isReference: true,
        analysisStatus: "PENDING",
        stagingMetadata: finalMetadata,
      },
    });

    logger.info("admin.reference.approved", {
      documentId: id,
      subjectLabel: body.subjectLabel,
      techStack: body.techStack,
    });

    return NextResponse.json({
      ok: true,
      documentId: id,
      message: `Document approuvé et indexé comme référence Handal.`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
