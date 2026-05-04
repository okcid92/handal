// DeliberationDecision enum was removed from Prisma client schema; use string literals instead
import { constants } from "node:fs";
import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { ApiError } from "@/lib/api-errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { analyzeTheme } from "@/server/analysis/themeanalysor";
import { filterInstitutionalContent } from "@/server/analysis/content-filter";
import { extractCoverMetadata } from "@/server/analysis/cover-extractor";
import { findOrCreateReferenceTheme } from "@/server/themes";

export type DeliberationPayload = {
  committee?: string | null;
  decision: "final_validation" | "sanction" | "rewrite_required";
  notes?: string | null;
};

function normalizeDecision(decision: DeliberationPayload["decision"]) {
  switch (decision) {
    case "final_validation":
      return "FINAL_VALIDATION";
    case "sanction":
      return "SANCTION";
    case "rewrite_required":
      return "REWRITE_REQUIRED";
    default:
      throw new ApiError(
        "Invalid deliberation decision",
        422,
        "INVALID_DELIBERATION_DECISION",
      );
  }
}

async function loadReport(reportId: bigint) {
  const report = await prisma.similarityReport.findUnique({
    where: { id: reportId },
    include: {
      document: {
        include: {
          theme: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  if (!report) {
    throw new ApiError("Report not found", 404, "REPORT_NOT_FOUND");
  }

  // Deliberations are stored in a separate table; fetch them explicitly
  // Deliberations table exists in DB but may not be exposed in Prisma client types.
  // Query via raw SQL and join the decider (user) for the caller.
  const rawDeliberations: any[] = await prisma.$queryRaw`
    SELECT d.*, u.id AS decider_id, u.name AS decider_name, u.role AS decider_role
    FROM deliberations d
    LEFT JOIN users u ON u.id = d.decided_by
    WHERE d.similarity_report_id = ${report.id}
    ORDER BY d.decided_at DESC
  `;

  const deliberations = rawDeliberations.map((row) => ({
    id: BigInt(row.id),
    similarityReportId: BigInt(row.similarity_report_id),
    decidedBy: BigInt(row.decided_by),
    committee: row.committee,
    decision: row.decision,
    notes: row.notes,
    decidedAt: new Date(row.decided_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    decider: row.decider_id
      ? {
          id: BigInt(row.decider_id),
          name: row.decider_name,
          role: row.decider_role,
        }
      : undefined,
  }));

  (report as any).deliberations = deliberations;

  return report as any;
}

function buildReferenceStagingMetadata(
  extractedText: string,
  fallbackTitle?: string | null,
) {
  const filtered = filterInstitutionalContent(extractedText);
  const profile = analyzeTheme({
    name: "validated-report",
    content: filtered.filteredContent,
  });
  const cover = extractCoverMetadata(extractedText);

  return {
    subjectLabel:
      fallbackTitle?.trim() ||
      cover.subjectLabel ||
      profile.subjectLabel ||
      null,
    techStack: profile.techStack ?? [],
    authorName: cover.authorName ?? null,
    department: cover.department ?? null,
    academicYear: cover.academicYear ?? null,
    dominantTheme: profile.dominantTheme ?? null,
    topKeywords: profile.keywords.slice(0, 8).map((k) => k.word),
    excludedRatio: Math.round(filtered.excludedRatio * 100),
    approvedAt: new Date().toISOString(),
    source: "cd_final_validation",
  };
}

function normalizeStoredPath(storagePath: string) {
  const trimmed = storagePath.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (path.isAbsolute(trimmed)) {
    return trimmed;
  }

  return path.join(process.cwd(), trimmed.replace(/^\/+/, ""));
}

function sanitizeReferenceName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function moveToReferenceStorage(document: {
  storagePath: string;
  originalName: string;
  checksum: string;
}) {
  const sourcePath = normalizeStoredPath(document.storagePath);
  await access(sourcePath, constants.R_OK);

  const checksumToken = document.checksum.replace(/^sha256:/, "").slice(0, 10);
  const safeName = sanitizeReferenceName(document.originalName);
  const targetRelativePath = `storage/references/${Date.now()}-${checksumToken}-${safeName}`;
  const targetAbsolutePath = path.join(process.cwd(), targetRelativePath);

  await mkdir(path.dirname(targetAbsolutePath), { recursive: true });
  await copyFile(sourcePath, targetAbsolutePath);

  return targetRelativePath;
}

function serializeDeliberation(deliberation: {
  id: bigint;
  similarityReportId: bigint;
  decidedBy: bigint;
  committee: string | null;
  decision: string;
  notes: string | null;
  decidedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  decider?: { id: bigint; name: string; role: string };
}) {
  return {
    id: deliberation.id.toString(),
    similarityReportId: deliberation.similarityReportId.toString(),
    decidedBy: deliberation.decidedBy.toString(),
    committee: deliberation.committee,
    decision: deliberation.decision,
    notes: deliberation.notes,
    decidedAt: deliberation.decidedAt.toISOString(),
    createdAt: deliberation.createdAt.toISOString(),
    updatedAt: deliberation.updatedAt.toISOString(),
    decider: deliberation.decider
      ? {
          id: deliberation.decider.id.toString(),
          name: deliberation.decider.name,
          role: deliberation.decider.role,
        }
      : null,
  };
}

export async function createDeliberation(
  reportId: bigint,
  decidedBy: bigint,
  payload: DeliberationPayload,
) {
  const report = await loadReport(reportId);

  if (!Array.isArray(report.deliberations)) {
    throw new ApiError(
      "Report deliberations unavailable",
      500,
      "DELIBERATION_STATE_INVALID",
    );
  }

  const decidedAt = new Date();
  const decision = normalizeDecision(payload.decision);
  const committee = payload.committee?.trim() || null;
  const notes = payload.notes?.trim() || null;

  // Use raw SQL since Deliberation model is not exposed in Prisma client
  await prisma.$executeRaw`
    INSERT INTO deliberations (similarity_report_id, decided_by, committee, decision, notes, decided_at, created_at, updated_at)
    VALUES (${report.id}, ${decidedBy}, ${committee}, ${decision}, ${notes}, ${decidedAt}, ${decidedAt}, ${decidedAt})
  `;

  // Fetch the created deliberation with decider info
  const rawCreated: any[] = await prisma.$queryRaw`
    SELECT d.*, u.id AS decider_id, u.name AS decider_name, u.role AS decider_role
    FROM deliberations d
    LEFT JOIN users u ON u.id = d.decided_by
    WHERE d.similarity_report_id = ${report.id} AND d.decided_by = ${decidedBy} AND d.decided_at = ${decidedAt}
    ORDER BY d.created_at DESC
    LIMIT 1
  `;

  if (!rawCreated || rawCreated.length === 0) {
    throw new ApiError(
      "Failed to create deliberation",
      500,
      "DELIBERATION_CREATE_FAILED",
    );
  }

  const row = rawCreated[0];
  const created = {
    id: BigInt(row.id),
    similarityReportId: BigInt(row.similarity_report_id),
    decidedBy: BigInt(row.decided_by),
    committee: row.committee,
    decision: row.decision,
    notes: row.notes,
    decidedAt: new Date(row.decided_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    decider: row.decider_id
      ? { id: BigInt(row.decider_id), name: row.decider_name, role: row.decider_role }
      : undefined,
  };

  logger.info("report.deliberated", {
    reportId: report.id.toString(),
    decidedBy: decidedBy.toString(),
    decision: created.decision,
  });

  return {
    report: {
      id: report.id.toString(),
      documentId: report.documentId.toString(),
      globalSimilarity: report.globalSimilarity.toString(),
      aiScore: report.aiScore?.toString() ?? null,
      riskLevel: report.riskLevel,
      analyzedAt: report.analyzedAt.toISOString(),
    },
    deliberation: serializeDeliberation(created),
  };
}

export async function validateReportByChefDept(
  reportId: bigint,
  decidedBy: bigint,
  payload: DeliberationPayload,
) {
  const loadedReport = await loadReport(reportId);
  const result = await createDeliberation(reportId, decidedBy, payload);

  if (payload.decision === "final_validation") {
    const extractedText = loadedReport.document.extractedText ?? "";
    const metadata = extractedText
      ? buildReferenceStagingMetadata(
          extractedText,
          loadedReport.document.theme?.title ?? null,
        )
      : null;

    let themeId = loadedReport.document.themeId;
    if (metadata?.subjectLabel) {
      themeId = await findOrCreateReferenceTheme(
        metadata.subjectLabel,
        decidedBy,
      );
    }

    let promotedStoragePath: string | null = null;
    try {
      promotedStoragePath = await moveToReferenceStorage({
        storagePath: loadedReport.document.storagePath,
        originalName: loadedReport.document.originalName,
        checksum: loadedReport.document.checksum,
      });
    } catch (error) {
      logger.warn(
        "report.reference_copy_failed",
        "unable to copy approved document into storage/references",
        {
          reportId: result.report.id,
          documentId: result.report.documentId,
          sourceStoragePath: loadedReport.document.storagePath,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }

    await prisma.document.update({
      where: { id: BigInt(result.report.documentId) },
      data: {
        documentStatus: "APPROVED",
        isReference: true,
        ...(promotedStoragePath ? { storagePath: promotedStoragePath } : {}),
        ...(themeId ? { themeId } : {}),
        ...(metadata
          ? {
              stagingMetadata:
                typeof metadata === "string"
                  ? metadata
                  : JSON.stringify(metadata),
            }
          : {}),
      },
    });

    logger.info("report.document_promoted_reference", {
      reportId: result.report.id,
      documentId: result.report.documentId,
      decidedBy: decidedBy.toString(),
      themeId: themeId?.toString() ?? null,
      subjectLabel: metadata?.subjectLabel ?? null,
    });
  }

  return result;
}

export async function getReportDeliberations(reportId: bigint) {
  const report = await loadReport(reportId);

  return {
    report: {
      id: report.id.toString(),
      documentId: report.documentId.toString(),
      globalSimilarity: report.globalSimilarity.toString(),
      aiScore: report.aiScore?.toString() ?? null,
      riskLevel: report.riskLevel,
      analyzedAt: report.analyzedAt.toISOString(),
    },
    deliberations: report.deliberations.map(serializeDeliberation),
  };
}
