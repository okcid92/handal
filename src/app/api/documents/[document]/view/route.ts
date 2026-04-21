import { constants } from "node:fs";
import { access } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

import { NextRequest, NextResponse } from "next/server";

import { ApiError, errorResponse } from "@/lib/api-errors";
import { guardRole } from "@/lib/route-guards";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function escapeFileName(name: string) {
  return name.replace(/["\\\r\n]/g, "_");
}

function resolveAbsoluteDocumentPath(storagePath: string) {
  const normalizedStoragePath = storagePath.trim().replace(/^\/+/, "");
  return path.join(process.cwd(), normalizedStoragePath);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ document: string }> },
) {
  try {
    guardRole(request, ["TEACHER", "DA", "ADMIN"]);
    const { document } = await params;

    const record = await prisma.document.findUnique({
      where: { id: BigInt(document) },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        storagePath: true,
      },
    });

    if (!record) {
      throw new ApiError("Document not found", 404, "DOCUMENT_NOT_FOUND");
    }

    const absoluteFilePath = resolveAbsoluteDocumentPath(record.storagePath);
    try {
      await access(absoluteFilePath, constants.R_OK);
    } catch {
      return NextResponse.json(
        { error: "Fichier introuvable sur le stockage Handal" },
        { status: 404 },
      );
    }

    const fileStream = createReadStream(absoluteFilePath);
    const webStream = Readable.toWeb(fileStream) as ReadableStream;
    const filename = escapeFileName(
      record.originalName || `document-${record.id}`,
    );

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": record.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(record.originalName || `document-${record.id}`)}`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
