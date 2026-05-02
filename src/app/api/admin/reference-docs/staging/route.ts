import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { guardAdmin } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    assertSameOrigin(request);
    guardAdmin(request);

    const docs = await prisma.document.findMany({
      where: { isReference: false, analysisStatus: "PENDING" },
      select: {
        id: true,
        originalName: true,
        fileSize: true,
        mimeType: true,
        storagePath: true,
        stagingMetadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      ok: true,
      documents: docs.map((doc) => ({
        id: doc.id.toString(),
        originalName: doc.originalName,
        fileSize: doc.fileSize.toString(),
        mimeType: doc.mimeType,
        storagePath: doc.storagePath,
        stagingMetadata: doc.stagingMetadata,
        createdAt: doc.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
