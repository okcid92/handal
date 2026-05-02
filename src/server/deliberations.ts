import { DeliberationDecision } from "@prisma/client";
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
      return DeliberationDecision.FINAL_VALIDATION;
    case "sanction":
      return DeliberationDecision.SANCTION;
    case "rewrite_required":
      return DeliberationDecision.REWRITE_REQUIRED;
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
      deliberations: {
        orderBy: { decidedAt: "desc" },
        include: {
          decider: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!report) {
    throw new ApiError("Report not found", 404, "REPORT_NOT_FOUND");
  }

  return report;
}

function buildReferenceStagingMetadata(extractedText: string, fallbackTitle?: string | null) {
  const filtered = filterInstitutionalContent(extractedText);
  const profile = analyzeTheme({
    name: "validated-report",
    content: filtered.filteredContent,
  });
  const cover = extractCoverMetadata(extractedText);

  return {
    subjectLabel:
      fallbackTitle?.trim() || cover.subjectLabel || profile.subjectLabel || null,
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
  decision: DeliberationDecision;
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

  const created = await prisma.deliberation.create({
    data: {
      similarityReportId: report.id,
      decidedBy,
      committee: payload.committee?.trim() || null,
      decision: normalizeDecision(payload.decision),
      notes: payload.notes?.trim() || null,
      decidedAt: new Date(),
    },
    include: {
      decider: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

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
      themeId = await findOrCreateReferenceTheme(metadata.subjectLabel, decidedBy);
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
