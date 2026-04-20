import { DeliberationDecision } from "@prisma/client";

import { ApiError } from "@/lib/api-errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

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
      document: true,
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
  const result = await createDeliberation(reportId, decidedBy, payload);

  if (payload.decision === "final_validation") {
    await prisma.document.update({
      where: { id: BigInt(result.report.documentId) },
      data: {
        documentStatus: "APPROVED",
        isReference: true,
      },
    });

    logger.info("report.document_promoted_reference", {
      reportId: result.report.id,
      documentId: result.report.documentId,
      decidedBy: decidedBy.toString(),
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
