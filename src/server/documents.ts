import {
  Prisma,
  RiskLevel,
  ThemeStatus,
  type Document,
  type Role,
  type SimilarityReport,
} from "@prisma/client";

import { ApiError } from "@/lib/api-errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

type DocumentPayload = {
  themeId: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
};

type ReportSource = {
  name: string;
  url: string;
  similarity: number;
  type: "web" | "repository" | "journal" | "ai";
};

type HighlightedSegment = {
  start: number;
  end: number;
  matchedWith: string;
};

type DocumentWithRelations = Document & {
  theme: {
    id: bigint;
    studentId: bigint;
    status: ThemeStatus;
    finalScore: Prisma.Decimal | null;
  };
  student: { id: bigint; role: Role };
};

type SimilarityReportWithRelations = SimilarityReport & {
  document: {
    id: bigint;
    themeId: bigint;
    studentId: bigint;
    originalName: string;
    storagePath: string;
    mimeType: string;
    fileSize: bigint;
    checksum: string;
    isFinal: boolean;
    submittedAt: Date;
  };
};

function toNumber(value: bigint | Prisma.Decimal | number) {
  return typeof value === "number" ? value : Number(value.toString());
}

export function buildSeed(documentId: bigint) {
  return Number(documentId % BigInt(97));
}

export function simulateScore(seed: number, offset: number) {
  const raw = (seed * (offset + 11) * 17 + offset * 13) % 100;
  return Math.max(3, Math.min(97, raw));
}

export function deriveRiskLevel(globalSimilarity: number): RiskLevel {
  if (globalSimilarity >= 70) {
    return RiskLevel.HIGH;
  }

  if (globalSimilarity >= 40) {
    return RiskLevel.MEDIUM;
  }

  return RiskLevel.LOW;
}

function generateSources(seed: number): ReportSource[] {
  const base = [
    { name: "Archive universitaire", type: "repository" as const },
    { name: "Article académique", type: "journal" as const },
    { name: "Source web", type: "web" as const },
  ];

  return base.map((entry, index) => ({
    name: `${entry.name} ${seed + index + 1}`,
    url: `https://example.org/source/${seed + index + 1}`,
    similarity: simulateScore(seed, index + 1),
    type: entry.type,
  }));
}

function generateHighlightedSegments(seed: number): HighlightedSegment[] {
  return [
    {
      start: seed + 12,
      end: seed + 42,
      matchedWith: "Article académique",
    },
    {
      start: seed + 67,
      end: seed + 93,
      matchedWith: "Archive universitaire",
    },
  ];
}

function serializeDocument(document: DocumentWithRelations) {
  return {
    id: document.id.toString(),
    themeId: document.themeId.toString(),
    studentId: document.studentId.toString(),
    originalName: document.originalName,
    storagePath: document.storagePath,
    mimeType: document.mimeType,
    fileSize: document.fileSize.toString(),
    checksum: document.checksum,
    isFinal: document.isFinal,
    submittedAt: document.submittedAt.toISOString(),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    theme: {
      id: document.theme.id.toString(),
      studentId: document.theme.studentId.toString(),
      status: document.theme.status,
      finalScore: document.theme.finalScore?.toString() ?? null,
    },
    student: {
      id: document.student.id.toString(),
      role: document.student.role,
    },
  };
}

function serializeReport(report: SimilarityReportWithRelations) {
  return {
    id: report.id.toString(),
    documentId: report.documentId.toString(),
    globalSimilarity: report.globalSimilarity.toString(),
    aiScore: report.aiScore?.toString() ?? null,
    riskLevel: report.riskLevel,
    matchedSources: report.matchedSources,
    highlightedSegments: report.highlightedSegments,
    analyzedAt: report.analyzedAt.toISOString(),
    generatedBy: report.generatedBy?.toString() ?? null,
    document: {
      id: report.document.id.toString(),
      themeId: report.document.themeId.toString(),
      studentId: report.document.studentId.toString(),
      originalName: report.document.originalName,
      storagePath: report.document.storagePath,
      mimeType: report.document.mimeType,
      fileSize: report.document.fileSize.toString(),
      checksum: report.document.checksum,
      isFinal: report.document.isFinal,
      submittedAt: report.document.submittedAt.toISOString(),
    },
  };
}

async function loadDocument(documentId: bigint) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      theme: true,
      student: true,
    },
  });

  if (!document) {
    throw new ApiError("Document not found", 404, "DOCUMENT_NOT_FOUND");
  }

  return document as DocumentWithRelations;
}

async function loadReport(reportId: bigint) {
  const report = await prisma.similarityReport.findUnique({
    where: { id: reportId },
    include: {
      document: true,
    },
  });

  if (!report) {
    throw new ApiError("Report not found", 404, "REPORT_NOT_FOUND");
  }

  return report as SimilarityReportWithRelations;
}

export async function createDocument(
  payload: DocumentPayload,
  studentId: bigint,
) {
  const themeId = BigInt(payload.themeId);

  const theme = await prisma.theme.findUnique({
    where: { id: themeId },
    select: {
      id: true,
      studentId: true,
      status: true,
      finalScore: true,
    },
  });

  if (!theme) {
    throw new ApiError("Theme not found", 404, "THEME_NOT_FOUND");
  }

  if (theme.studentId !== studentId) {
    throw new ApiError(
      "Theme must belong to the current student",
      403,
      "THEME_OWNER_FORBIDDEN",
    );
  }

  if (theme.status !== ThemeStatus.VALIDATED_DA) {
    throw new ApiError(
      "Theme must be VALIDATED_DA before final upload",
      409,
      "THEME_NOT_READY_FOR_UPLOAD",
    );
  }

  if (theme.finalScore === null) {
    throw new ApiError(
      "Final score is required before upload",
      409,
      "THEME_FINAL_SCORE_REQUIRED",
    );
  }

  const storagePath = `/storage/final/${themeId.toString()}/${Date.now()}-${payload.originalName}`;

  const created = await prisma.document.create({
    data: {
      themeId,
      studentId,
      originalName: payload.originalName.trim(),
      storagePath,
      mimeType: payload.mimeType.trim(),
      fileSize: BigInt(payload.fileSize),
      checksum: payload.checksum.trim(),
      isFinal: true,
      submittedAt: new Date(),
    },
    include: {
      theme: true,
      student: true,
    },
  });

  logger.info("document.uploaded", {
    documentId: created.id.toString(),
    themeId: created.themeId.toString(),
    studentId: created.studentId.toString(),
  });

  return serializeDocument(created as DocumentWithRelations);
}

export async function autoTestDocument(documentId: bigint, studentId: bigint) {
  const document = await loadDocument(documentId);

  if (document.studentId !== studentId) {
    throw new ApiError(
      "Document must belong to the current student",
      403,
      "DOCUMENT_OWNER_FORBIDDEN",
    );
  }

  const seed = buildSeed(document.id);
  const localShingle = simulateScore(seed, 1);
  const webSearch = simulateScore(seed, 2);
  const aiDetection = simulateScore(seed, 3);
  const globalSimilarity = Math.round(
    (localShingle + webSearch + aiDetection) / 3,
  );
  const riskLevel = deriveRiskLevel(globalSimilarity);

  logger.info("document.auto_tested", {
    documentId: document.id.toString(),
    studentId: studentId.toString(),
    globalSimilarity,
    riskLevel,
  });

  return {
    document: serializeDocument(document),
    autoTest: {
      localShingle,
      webSearch,
      aiDetection,
      globalSimilarity,
      riskLevel,
      generatedAt: new Date().toISOString(),
    },
  };
}

export async function analyzeDocument(documentId: bigint, analystId: bigint) {
  const document = await loadDocument(documentId);

  if (!document.isFinal) {
    throw new ApiError("Document must be final", 409, "DOCUMENT_NOT_FINAL");
  }

  if (document.theme.status !== ThemeStatus.VALIDATED_DA) {
    throw new ApiError(
      "Theme must be VALIDATED_DA for official analysis",
      409,
      "THEME_NOT_VALIDATED_DA",
    );
  }

  const seed = buildSeed(document.id);
  const localShingle = simulateScore(seed, 4);
  const webSearch = simulateScore(seed, 5);
  const aiScore = simulateScore(seed, 6);
  const globalSimilarity = Math.round(
    localShingle * 0.45 + webSearch * 0.35 + aiScore * 0.2,
  );
  const riskLevel = deriveRiskLevel(globalSimilarity);
  const matchedSources = generateSources(seed);
  const highlightedSegments = generateHighlightedSegments(seed);

  const created = await prisma.similarityReport.create({
    data: {
      documentId: document.id,
      globalSimilarity: new Prisma.Decimal(globalSimilarity),
      aiScore: new Prisma.Decimal(aiScore),
      riskLevel,
      matchedSources: matchedSources as unknown as Prisma.InputJsonValue,
      highlightedSegments:
        highlightedSegments as unknown as Prisma.InputJsonValue,
      analyzedAt: new Date(),
      generatedBy: analystId,
    },
    include: {
      document: true,
    },
  });

  logger.info("document.analyzed", {
    documentId: document.id.toString(),
    analystId: analystId.toString(),
    reportId: created.id.toString(),
    globalSimilarity,
    riskLevel,
  });

  return {
    report: serializeReport(created as SimilarityReportWithRelations),
    analysis: {
      localShingle,
      webSearch,
      aiScore,
      globalSimilarity,
      riskLevel,
      matchedSources,
      highlightedSegments,
    },
  };
}

export async function listReports() {
  const reports = await prisma.similarityReport.findMany({
    orderBy: { analyzedAt: "desc" },
    include: {
      document: true,
    },
  });

  return reports.map((report) =>
    serializeReport(report as SimilarityReportWithRelations),
  );
}

export async function getReport(reportId: bigint) {
  const report = await loadReport(reportId);
  const sources = Array.isArray(report.matchedSources)
    ? (report.matchedSources as ReportSource[])
    : [];
  const sourceDistribution = sources.reduce<Record<string, number>>(
    (acc, source) => {
      acc[source.type] = (acc[source.type] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return {
    report: serializeReport(report),
    aggregate: {
      globalSimilarity: toNumber(report.globalSimilarity),
      riskLevel: report.riskLevel,
      aiScore: report.aiScore ? toNumber(report.aiScore) : null,
      sourceCount: sources.length,
    },
    sourceDistribution,
  };
}
