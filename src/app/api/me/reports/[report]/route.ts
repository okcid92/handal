import { NextRequest, NextResponse } from "next/server";
import { errorResponse, ApiError } from "@/lib/api-errors";
import { guardStudent } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { prisma } from "@/lib/prisma";

type RawSource = {
  name: string;
  similarity: number;
  type: string;
  sourceId: string | null;
  sourceLabel: string | null;
};

async function resolveSourceTitles(sources: RawSource[]) {
  if (sources.length === 0) return sources;
  
  const ids = sources
    .map((s) => s.sourceId)
    .filter((id): id is string => id !== null);

  if (ids.length === 0) {
    return sources.map((s) => ({
      ...s,
      sourceLabel: s.sourceLabel || s.name || "Source inconnue",
    }));
  }

  const bigIds = ids.map((id) => BigInt(id));
  const [refDocs, valDocs] = await Promise.all([
    prisma.referenceDocument.findMany({
      where: { id: { in: bigIds } },
      select: { id: true, originalName: true },
    }),
    prisma.document.findMany({
      where: { id: { in: bigIds } },
      select: {
        id: true,
        originalName: true,
        theme: { select: { title: true } },
      },
    }),
  ]);

  const titleMap = new Map<string, string>();
  refDocs.forEach((d) => {
    titleMap.set(
      d.id.toString(),
      d.originalName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim(),
    );
  });
  valDocs.forEach((d) => {
    titleMap.set(
      d.id.toString(),
      d.theme?.title ??
        d.originalName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim(),
    );
  });

  return sources.map((s) => ({
    ...s,
    sourceLabel:
      s.sourceId && titleMap.has(s.sourceId)
        ? titleMap.get(s.sourceId)!
        : s.sourceLabel,
    // sourceDocumentId pour construire le lien /api/documents/[id]/view
    sourceDocumentId: s.sourceId ?? null,
  }));
}

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
            extractedText: true,
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

    const rawSources = typeof row.matchedSources === "string" 
      ? JSON.parse(row.matchedSources || "[]") 
      : Array.isArray(row.matchedSources)
        ? (row.matchedSources as RawSource[])
        : [];

    const enrichedSources = await resolveSourceTitles(rawSources);

    const rawSegments = typeof row.highlightedSegments === "string" 
      ? JSON.parse(row.highlightedSegments || "[]") 
      : row.highlightedSegments ?? [];

    console.log("[DEBUG] Report ID:", row.id.toString());
    console.log("[DEBUG] rawSources:", JSON.stringify(rawSources).slice(0, 500));
    console.log("[DEBUG] rawSegments:", JSON.stringify(rawSegments).slice(0, 300));

    return NextResponse.json({
      ok: true,
      report: {
        id: row.id.toString(),
        documentId: row.documentId.toString(),
        globalSimilarity: row.globalSimilarity.toString(),
        riskLevel: row.riskLevel,
        matchedSources: enrichedSources,
        highlightedSegments: rawSegments,
        analyzedAt: row.analyzedAt.toISOString(),
        document: {
          id: row.document.id.toString(),
          originalName: row.document.originalName,
          title: row.document.theme?.title ?? row.document.originalName,
          extractedText: row.document.extractedText ?? "",
        },
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
