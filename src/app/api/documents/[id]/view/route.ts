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

const STORAGE_ROOT = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  "storage",
);

function escapeFileName(name: string) {
  return name.replace(/["\\\r\n]/g, "_");
}

function resolveAbsoluteDocumentPath(storagePath: string) {
  if (path.isAbsolute(storagePath)) {
    return storagePath;
  }

  const normalizedStoragePath = storagePath.trim().replace(/^\/+/, "");
  return path.join(
    STORAGE_ROOT,
    normalizedStoragePath.replace(/^storage\//, ""),
  );
}

async function firstReadablePath(candidates: string[]) {
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.R_OK);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

function buildStorageCandidates(storagePath: string) {
  const normalized = storagePath.trim().replace(/\\/g, "/");
  const baseName = path.basename(normalized);

  const rawCandidates = [
    resolveAbsoluteDocumentPath(storagePath),
    path.join(STORAGE_ROOT, "references", baseName),
    path.join(STORAGE_ROOT, "tmp", baseName),
  ];

  if (/^\/?storage\/final\//.test(normalized)) {
    const asReference = normalized.replace(
      /^\/?storage\/final\/[^/]+\//,
      "storage/references/",
    );
    rawCandidates.push(resolveAbsoluteDocumentPath(asReference));
  }

  return [...new Set(rawCandidates)];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = guardRole(request, ["TEACHER", "DA", "ADMIN", "STUDENT"]);
    const { id } = await params;
    const docId = BigInt(id);

    const record = await prisma.document.findUnique({
      where: { id: docId },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        storagePath: true,
        checksum: true,
        isReference: true,
        studentId: true,
      },
    });

    if (!record) {
      throw new ApiError("Document not found", 404, "DOCUMENT_NOT_FOUND");
    }

    // Students can only view reference documents or their own documents
    if (session.role === "STUDENT" && !record.isReference && record.studentId !== BigInt(session.userId)) {
      throw new ApiError("Forbidden", 403, "FORBIDDEN");
    }

    const candidates = buildStorageCandidates(record.storagePath);
    let absoluteFilePath = await firstReadablePath(candidates);

    // Legacy fallback: reuse an equivalent reference doc with same checksum.
    if (!absoluteFilePath && record.isReference && record.checksum) {
      const sibling = await prisma.document.findFirst({
        where: {
          id: { not: record.id },
          isReference: true,
          checksum: record.checksum,
        },
        orderBy: { updatedAt: "desc" },
        select: { storagePath: true },
      });

      if (sibling?.storagePath) {
        absoluteFilePath = await firstReadablePath(
          buildStorageCandidates(sibling.storagePath),
        );
      }
    }

    if (!absoluteFilePath) {
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
