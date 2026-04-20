import {
  AnalysisStatus,
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
import { analyzePlagiarism } from "@/server/analysis/plagiadetectoralgo";
import { analyzeTheme } from "@/server/analysis/themeanalysor";

type DocumentPayload = {
  themeId?: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  extractedText?: string;
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

type DocumentWithRelations = Omit<Document, "themeId"> & {
  themeId: bigint | null;
  theme: {
    id: bigint;
    studentId: bigint;
    status: ThemeStatus;
    finalScore: Prisma.Decimal | null;
  } | null;
  student: { id: bigint; role: Role };
  uploadAttempts: number;
};

type SimilarityReportWithRelations = SimilarityReport & {
  document: {
    id: bigint;
    themeId: bigint | null;
    studentId: bigint;
    originalName: string;
    storagePath: string;
    mimeType: string;
    fileSize: bigint;
    checksum: string;
    extractedText: string | null;
    analysisStatus: AnalysisStatus;
    analysisQueuedAt: Date | null;
    analysisStartedAt: Date | null;
    analysisCompletedAt: Date | null;
    analysisError: string | null;
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
    themeId: document.themeId?.toString() ?? null,
    studentId: document.studentId.toString(),
    originalName: document.originalName,
    storagePath: document.storagePath,
    mimeType: document.mimeType,
    fileSize: document.fileSize.toString(),
    checksum: document.checksum,
    extractedText: document.extractedText,
    analysisStatus: document.analysisStatus,
    analysisQueuedAt: document.analysisQueuedAt?.toISOString() ?? null,
    analysisStartedAt: document.analysisStartedAt?.toISOString() ?? null,
    analysisCompletedAt: document.analysisCompletedAt?.toISOString() ?? null,
    analysisError: document.analysisError,
    isFinal: document.isFinal,
    uploadAttempts: document.uploadAttempts,
    submittedAt: document.submittedAt.toISOString(),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    theme: document.theme
      ? {
          id: document.theme.id.toString(),
          studentId: document.theme.studentId.toString(),
          status: document.theme.status,
          finalScore: document.theme.finalScore?.toString() ?? null,
        }
      : null,
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
      themeId: report.document.themeId?.toString() ?? null,
      studentId: report.document.studentId.toString(),
      originalName: report.document.originalName,
      storagePath: report.document.storagePath,
      mimeType: report.document.mimeType,
      fileSize: report.document.fileSize.toString(),
      checksum: report.document.checksum,
      extractedText: report.document.extractedText,
      analysisStatus: report.document.analysisStatus,
      analysisQueuedAt: report.document.analysisQueuedAt?.toISOString() ?? null,
      analysisStartedAt:
        report.document.analysisStartedAt?.toISOString() ?? null,
      analysisCompletedAt:
        report.document.analysisCompletedAt?.toISOString() ?? null,
      analysisError: report.document.analysisError,
      isFinal: report.document.isFinal,
      uploadAttempts:
        (report.document as unknown as { uploadAttempts: number })
          .uploadAttempts ?? 1,
      submittedAt: report.document.submittedAt.toISOString(),
    },
  };
}

function normalizeThemeTitle(title: string) {
  return title.trim().toLowerCase();
}

function toDisplayThemeTitle(raw: string) {
  return raw
    .trim()
    .split(/\s+/)
    .map((word) =>
      word.length > 1
        ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
        : word.toUpperCase(),
    )
    .join(" ");
}

function collectTopKeywords(
  keywords: Array<{ word: string; score: number }>,
  limit = 6,
) {
  const seen = new Set<string>();
  const top: string[] = [];

  for (const item of [...keywords].sort((a, b) => b.score - a.score)) {
    const normalized = item.word.trim().toLowerCase();
    if (normalized.length < 3 || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    top.push(normalized);
    if (top.length >= limit) {
      break;
    }
  }

  return top;
}

function extractDeclaredThemeTitle(extractedText: string) {
  const normalized = extractedText
    .replace(/\r/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n+/g, " ")
    .trim();

  if (!normalized) {
    return null;
  }

  const markerMatch = normalized.match(
    /(?:^|\b)(?:th[èe]me|theme)\s*[:\-]\s*(.+)$/i,
  );
  if (!markerMatch) {
    return null;
  }

  const tail = markerMatch[1].trim();
  const stopRegex =
    /\b(?:pr[ée]sent[ée]?\s+par|ma[iî]tre\s+de\s+stage|directeur(?:\s+de\s+rapport)?|encadrant|ann[ée]e\s+acad[ée]mique|p[ée]riode\s+de\s+stage)\b/i;
  const stopIndex = tail.search(stopRegex);

  const candidate = (stopIndex >= 0 ? tail.slice(0, stopIndex) : tail)
    .replace(/\s+/g, " ")
    .replace(/^[\s'"«»]+|[\s'"«»]+$/g, "")
    .trim();

  if (candidate.length < 8 || candidate.length > 240) {
    return null;
  }

  return candidate;
}

function buildExtractedThemeTitle(
  dominantTheme: string,
  originalName: string,
  extractedText: string,
  keywords: Array<{ word: string; score: number }>,
) {
  const declaredTheme = extractDeclaredThemeTitle(extractedText);
  if (declaredTheme) {
    return declaredTheme;
  }

  const normalizedDominant = dominantTheme.trim();
  if (normalizedDominant.length >= 8) {
    return toDisplayThemeTitle(normalizedDominant);
  }

  const topKeywords = collectTopKeywords(keywords, 3);
  if (topKeywords.length >= 2) {
    return toDisplayThemeTitle(
      `etude de ${topKeywords[0]} et ${topKeywords[1]}`,
    );
  }

  const fromFileName = originalName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
  if (fromFileName.length >= 8) {
    return toDisplayThemeTitle(fromFileName);
  }

  return null;
}

function buildExtractedThemeDescription(
  documentName: string,
  dominantTheme: string,
  keywords: string[],
) {
  const keywordsPart =
    keywords.length > 0 ? keywords.join(", ") : "non disponibles";
  const dominantPart =
    dominantTheme.trim().length > 0 ? dominantTheme.trim() : "non defini";
  return [
    `Theme extrait automatiquement depuis le document ${documentName}.`,
    `Theme dominant: ${dominantPart}.`,
    `Mots-cles principaux: ${keywordsPart}.`,
  ].join(" ");
}

async function persistExtractedThemeFromAnalyzedDocument(
  document: DocumentWithRelations,
) {
  if (!document.extractedText || document.themeId !== null) {
    return;
  }

  const profile = analyzeTheme({
    name: document.originalName,
    content: document.extractedText,
  });

  const title = buildExtractedThemeTitle(
    profile.dominantTheme,
    document.originalName,
    document.extractedText,
    profile.keywords.map((k) => ({ word: k.word, score: k.score })),
  );
  if (!title) {
    logger.warn(
      "theme.extracted.skipped",
      "skipping theme insertion due to weak profile",
      {
        documentId: document.id.toString(),
        reason: "weak_theme_profile",
      },
    );
    return;
  }

  const topKeywords = collectTopKeywords(
    profile.keywords.map((k) => ({ word: k.word, score: k.score })),
  );
  const titleNormalized = normalizeThemeTitle(title);

  const existing = await prisma.theme.findUnique({
    where: { titleNormalized },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  const description = buildExtractedThemeDescription(
    document.originalName,
    profile.dominantTheme,
    topKeywords,
  );

  try {
    const created = await prisma.theme.create({
      data: {
        studentId: document.studentId,
        title,
        titleNormalized,
        description,
        status: ThemeStatus.VALIDATED,
        themeSignature: {
          documentName: profile.documentName,
          dominantTheme: profile.dominantTheme,
          keywords: profile.keywords,
          themeVector: profile.themeVector,
          stats: profile.stats,
          analyzedAt: profile.analyzedAt.toISOString(),
        } as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    logger.info("theme.extracted.inserted", {
      themeId: created.id.toString(),
      documentId: document.id.toString(),
      source: document.isReference ? "reference_document" : "uploaded_document",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return;
    }
    throw error;
  }
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

  return document as unknown as DocumentWithRelations;
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

export async function createAnalysisHistory(data: {
  studentId: bigint;
  documentId?: bigint | null;
  reportId?: bigint | null;
  fileName: string;
  detectedTitle?: string | null;
  titleScore: number;
  similarityScore?: number | null;
  blocked: boolean;
  titleMismatch: boolean;
  attemptNumber: number;
}) {
  try {
    const entry = await (
      prisma as unknown as {
        analysisHistory: {
          create: (args: {
            data: Record<string, unknown>;
          }) => Promise<{ id: bigint; analyzedAt: Date }>;
        };
      }
    ).analysisHistory.create({
      data: {
        studentId: data.studentId,
        documentId: data.documentId ?? null,
        reportId: data.reportId ?? null,
        fileName: data.fileName,
        detectedTitle: data.detectedTitle ?? null,
        titleScore: data.titleScore,
        similarityScore:
          data.similarityScore != null
            ? new Prisma.Decimal(data.similarityScore)
            : null,
        blocked: data.blocked,
        titleMismatch: data.titleMismatch,
        attemptNumber: data.attemptNumber,
        analyzedAt: new Date(),
      },
    });
    return entry;
  } catch {
    // Table pas encore migrée — ne pas bloquer le flux
    return null;
  }
}

export async function listAnalysisHistory(studentId: bigint) {
  try {
    const rows = await (
      prisma as unknown as {
        analysisHistory: {
          findMany: (args: Record<string, unknown>) => Promise<
            Array<{
              id: bigint;
              documentId: bigint | null;
              reportId: bigint | null;
              fileName: string;
              detectedTitle: string | null;
              titleScore: number;
              similarityScore: { toString(): string } | null;
              blocked: boolean;
              titleMismatch: boolean;
              attemptNumber: number;
              analyzedAt: Date;
            }>
          >;
        };
      }
    ).analysisHistory.findMany({
      where: { studentId },
      orderBy: { analyzedAt: "desc" },
      take: 50,
    });
    return rows.map((r) => ({
      id: r.id.toString(),
      documentId: r.documentId?.toString() ?? null,
      reportId: r.reportId?.toString() ?? null,
      fileName: r.fileName,
      detectedTitle: r.detectedTitle,
      titleScore: r.titleScore,
      similarityScore: r.similarityScore
        ? parseFloat(r.similarityScore.toString())
        : null,
      blocked: r.blocked,
      titleMismatch: r.titleMismatch,
      attemptNumber: r.attemptNumber,
      analyzedAt: r.analyzedAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function getValidatedThemeForStudent(studentId: bigint) {
  const theme = await prisma.theme.findFirst({
    where: {
      studentId,
      status: { in: [ThemeStatus.VALIDATED, ThemeStatus.VALIDATED_DA] },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, status: true },
  });

  if (!theme) {
    throw new ApiError(
      "Student has no validated theme",
      403,
      "THEME_NOT_VALIDATED",
    );
  }

  return theme;
}

export async function createDocument(
  payload: DocumentPayload,
  studentId: bigint,
) {
  const themeId = payload.themeId
    ? BigInt(payload.themeId)
    : (
        await prisma.theme.findFirst({
          where: {
            studentId,
            status: { in: [ThemeStatus.VALIDATED, ThemeStatus.VALIDATED_DA] },
          },
          orderBy: { updatedAt: "desc" },
          select: { id: true },
        })
      )?.id;

  if (!themeId) {
    throw new ApiError(
      "Student has no validated theme",
      403,
      "THEME_NOT_VALIDATED",
    );
  }

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

  if (
    theme.status !== ThemeStatus.VALIDATED &&
    theme.status !== ThemeStatus.VALIDATED_DA
  ) {
    throw new ApiError(
      "Theme must be validated before final upload",
      409,
      "THEME_NOT_READY_FOR_UPLOAD",
    );
  }

  const storagePath = `/storage/final/${themeId.toString()}/${Date.now()}-${payload.originalName}`;

  // Compter les tentatives précédentes pour ce thème
  const previousCount = await prisma.document.count({
    where: { themeId, studentId },
  });
  const uploadAttempts = previousCount + 1;

  const created = await prisma.document.create({
    data: {
      themeId,
      studentId,
      originalName: payload.originalName.trim(),
      storagePath,
      mimeType: payload.mimeType.trim(),
      fileSize: BigInt(payload.fileSize),
      checksum: payload.checksum.trim(),
      extractedText: payload.extractedText?.trim() || null,
      analysisStatus: AnalysisStatus.PENDING,
      analysisQueuedAt: new Date(),
      isFinal: true,
      submittedAt: new Date(),
    },
    include: {
      theme: true,
      student: true,
    },
  });
  // Mettre à jour uploadAttempts après création (migration peut ne pas être appliquée en dev)
  try {
    await (prisma.document as unknown as { update: Function }).update({
      where: { id: created.id },
      data: { uploadAttempts },
    });
  } catch {
    /* champ pas encore migré */
  }
  (created as unknown as { uploadAttempts: number }).uploadAttempts =
    uploadAttempts;

  logger.info("document.uploaded", {
    documentId: created.id.toString(),
    themeId: created.themeId?.toString() ?? null,
    studentId: created.studentId.toString(),
  });

  return serializeDocument(created as unknown as DocumentWithRelations);
}

export async function queueDocumentForAnalysis(documentId: bigint) {
  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      analysisStatus: AnalysisStatus.PENDING,
      analysisQueuedAt: new Date(),
      analysisStartedAt: null,
      analysisCompletedAt: null,
      analysisError: null,
    },
    include: {
      theme: true,
      student: true,
    },
  });

  return serializeDocument(updated as unknown as DocumentWithRelations);
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

  if (!document.theme) {
    throw new ApiError("Document has no theme", 409, "DOCUMENT_THEME_MISSING");
  }

  if (document.theme.status !== ThemeStatus.VALIDATED_DA) {
    throw new ApiError(
      "Theme must be VALIDATED_DA for official analysis",
      409,
      "THEME_NOT_VALIDATED_DA",
    );
  }

  if (!document.extractedText) {
    throw new ApiError(
      "Document has no extracted text to analyze",
      409,
      "DOCUMENT_TEXT_MISSING",
    );
  }

  try {
    await prisma.document.update({
      where: { id: document.id },
      data: {
        analysisStatus: AnalysisStatus.PROCESSING,
        analysisStartedAt: new Date(),
        analysisError: null,
      },
    });

    const referenceDocs = await prisma.referenceDocument.findMany({
      select: {
        id: true,
        originalName: true,
        extractedText: true,
      },
    });

    const peerDocs = await prisma.document.findMany({
      where: {
        id: { not: document.id },
        isReference: false, // Only compare against student submissions, not reference docs
        extractedText: { not: null },
      },
      select: {
        id: true,
        originalName: true,
        extractedText: true,
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    const comparisonCorpus = [
      ...referenceDocs.map((doc) => ({
        name: `reference:${doc.id.toString()}:${doc.originalName}`,
        content: doc.extractedText,
      })),
      ...peerDocs
        .filter((doc) => Boolean(doc.extractedText))
        .map((doc) => ({
          name: `student:${doc.id.toString()}:${doc.originalName}`,
          content: doc.extractedText as string,
        })),
    ];

    const plagiarism = analyzePlagiarism(
      {
        name: document.originalName,
        content: document.extractedText,
      },
      comparisonCorpus,
    );

    const aiScoreRaw = plagiarism.avgSimilarity * 100;
    const globalSimilarityRaw = plagiarism.maxSimilarity * 100;
    const aiScore = Number(aiScoreRaw.toFixed(2));
    const globalSimilarity = Number(globalSimilarityRaw.toFixed(2));
    const riskLevel = deriveRiskLevel(globalSimilarity);
    const matchedSources = plagiarism.results.slice(0, 8).map((result) => ({
      name: result.name,
      url: "",
      similarity: Number((result.combined * 100).toFixed(2)),
      type: result.name.startsWith("reference:") ? "repository" : "journal",
    }));
    const highlightedSegments = plagiarism.results
      .flatMap((result) =>
        result.commonPhrases.map((phrase, index) => ({
          start: index * 20,
          end: index * 20 + phrase.length,
          matchedWith: result.name,
        })),
      )
      .slice(0, 25);

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

    await prisma.document.update({
      where: { id: document.id },
      data: {
        analysisStatus: AnalysisStatus.COMPLETED,
        analysisCompletedAt: new Date(),
        analysisError: null,
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
        comparedAgainst: comparisonCorpus.length,
        aiScore,
        globalSimilarity,
        riskLevel,
        matchedSources,
        highlightedSegments,
      },
    };
  } catch (error) {
    await prisma.document.update({
      where: { id: document.id },
      data: {
        analysisStatus: AnalysisStatus.FAILED,
        analysisCompletedAt: new Date(),
        analysisError:
          error instanceof Error
            ? error.message.slice(0, 1900)
            : "Unknown analysis failure",
      },
    });
    throw error;
  }
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

/**
 * Analyse inline déclenchée immédiatement après l'upload étudiant.
 * Pas de restriction de rôle (appelé en interne depuis la route upload).
 * Compare contre tous les documents existants + références.
 */
export async function analyzeDocumentInline(documentId: bigint): Promise<{
  globalSimilarity: number;
  riskLevel: RiskLevel;
  reportId: string;
  blocked: boolean;
  uploadAttempts: number;
}> {
  const document = await loadDocument(documentId);

  if (!document.extractedText) {
    return {
      globalSimilarity: 0,
      riskLevel: RiskLevel.LOW,
      reportId: "",
      blocked: false,
      uploadAttempts: document.uploadAttempts,
    };
  }

  await prisma.document.update({
    where: { id: document.id },
    data: {
      analysisStatus: AnalysisStatus.PROCESSING,
      analysisStartedAt: new Date(),
      analysisError: null,
    },
  });

  try {
    const [referenceDocs, peerDocs] = await Promise.all([
      prisma.referenceDocument.findMany({
        select: { id: true, originalName: true, extractedText: true },
      }),
      prisma.document.findMany({
        where: { id: { not: document.id }, extractedText: { not: null } },
        select: { id: true, originalName: true, extractedText: true },
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const corpus = [
      ...referenceDocs.map((d) => ({
        name: `reference:${d.id}:${d.originalName}`,
        content: d.extractedText,
      })),
      ...peerDocs
        .filter((d) => d.extractedText)
        .map((d) => ({
          name: `student:${d.id}:${d.originalName}`,
          content: d.extractedText as string,
        })),
    ];

    const plagiarism = analyzePlagiarism(
      { name: document.originalName, content: document.extractedText },
      corpus,
    );

    const globalSimilarity = Number(
      (plagiarism.maxSimilarity * 100).toFixed(2),
    );
    const riskLevel = deriveRiskLevel(globalSimilarity);

    const matchedSources = plagiarism.results.slice(0, 8).map((r) => ({
      name: r.name,
      url: "",
      similarity: Number((r.combined * 100).toFixed(2)),
      type: r.name.startsWith("reference:") ? "repository" : "journal",
    }));

    const highlightedSegments = plagiarism.results
      .flatMap((r) =>
        r.commonPhrases.map((phrase, i) => ({
          start: i * 20,
          end: i * 20 + phrase.length,
          matchedWith: r.name,
        })),
      )
      .slice(0, 25);

    const created = await prisma.similarityReport.create({
      data: {
        documentId: document.id,
        globalSimilarity: new Prisma.Decimal(globalSimilarity),
        riskLevel,
        matchedSources: matchedSources as unknown as Prisma.InputJsonValue,
        highlightedSegments:
          highlightedSegments as unknown as Prisma.InputJsonValue,
        analyzedAt: new Date(),
      },
      select: { id: true },
    });

    await prisma.document.update({
      where: { id: document.id },
      data: {
        analysisStatus: AnalysisStatus.COMPLETED,
        analysisCompletedAt: new Date(),
      },
    });

    await persistExtractedThemeFromAnalyzedDocument(document);

    logger.info("document.analyzed.inline", {
      documentId: document.id.toString(),
      globalSimilarity,
      riskLevel,
    });

    return {
      globalSimilarity,
      riskLevel,
      reportId: created.id.toString(),
      blocked: globalSimilarity > 50,
      uploadAttempts: document.uploadAttempts,
    };
  } catch (error) {
    await prisma.document.update({
      where: { id: document.id },
      data: {
        analysisStatus: AnalysisStatus.FAILED,
        analysisCompletedAt: new Date(),
        analysisError:
          error instanceof Error
            ? error.message.slice(0, 1900)
            : "Unknown error",
      },
    });
    throw error;
  }
}
