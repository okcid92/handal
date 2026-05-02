import {
  Prisma,
  ThemeStatus,
  DocumentStatus,
  type Role,
  type Theme,
} from "@prisma/client";

import { ApiError } from "@/lib/api-errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  analyzeTheme,
  compareOneToMany,
} from "@/server/analysis/themeanalysor";
import { listReferenceProfiles } from "@/server/reference-documents";

const THEME_REFERENCE_SIMILARITY_BLOCK_THRESHOLD = 0.65;

export type ThemeDecision = "approved" | "rejected";

export type ThemeSummary = {
  id: string;
  studentId: string;
  title: string;
  description: string;
  status: ThemeStatus;
  moderationComment: string | null;
  finalScore: string | null;
  themeSimilarityScore?: string | null;
  themeSimilarityLabel?: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    ine: string | null;
    email: string | null;
    department: string | null;
    role: Role;
  };
  theme_id: string;
  theme_title: string;
  student_name: string;
  student_firstname: string;
  student_department: string | null;
  similarity_score: string;
  submitted_at: string;
};

type ThemePayload = {
  title: string;
  description: string;
};

export function normalizeThemeTitle(title: string) {
  return title.trim().toLowerCase();
}

/**
 * Nettoie un titre de thème : trim, espaces doubles, première lettre majuscule.
 */
export function sanitizeThemeTitle(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(.)/, (c) => c.toUpperCase());
}

/**
 * Find-or-create pour les thèmes de documents de référence (upload admin).
 * Contrairement à createTheme(), ne vérifie pas la similarité ni le statut étudiant.
 * Retourne l'ID du thème existant ou créé.
 */
export async function findOrCreateReferenceTheme(
  title: string,
  adminId: bigint,
  description?: string,
): Promise<bigint> {
  const cleaned = sanitizeThemeTitle(title || "Sujet non classé");
  const normalized = normalizeThemeTitle(cleaned);

  // 1. Chercher un thème existant (correspondance exacte normalisée)
  const existing = await prisma.theme.findUnique({
    where: { titleNormalized: normalized },
    select: { id: true },
  });
  if (existing) {
    logger.info("theme.reference.found", { themeId: existing.id.toString(), title: cleaned });
    return existing.id;
  }

  // 2. Créer le thème avec statut VALIDATED (référence officielle)
  try {
    const created = await prisma.theme.create({
      data: {
        studentId: adminId,
        title: cleaned,
        titleNormalized: normalized,
        description: description ?? `Thème extrait automatiquement depuis un document de référence IBAM : ${cleaned}.`,
        status: ThemeStatus.VALIDATED,
      },
      select: { id: true },
    });
    logger.info("theme.reference.created", { themeId: created.id.toString(), title: cleaned });
    return created.id;
  } catch (err) {
    // Race condition : un autre processus a créé le même thème entre le findUnique et le create
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const retry = await prisma.theme.findUnique({
        where: { titleNormalized: normalized },
        select: { id: true },
      });
      if (retry) return retry.id;
    }
    throw err;
  }
}

function serializeTheme(
  theme: Theme & {
    student?: {
      id: bigint;
      name: string;
      ine: string | null;
      email: string | null;
      department: string | null;
      role: Role;
    };
  },
) {
  const fullName = theme.student?.name?.trim() ?? "";
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") || firstName;
  const similarityScoreValue =
    theme.themeSimilarityScore?.toString() !== undefined &&
    theme.themeSimilarityScore !== null
      ? `${theme.themeSimilarityScore.toString()}%`
      : "0%";
  const submittedAt = theme.createdAt.toISOString().slice(0, 10);

  return {
    id: theme.id.toString(),
    studentId: theme.studentId.toString(),
    title: theme.title,
    description: theme.description,
    status: theme.status,
    moderationComment: theme.moderationComment ?? null,
    finalScore: theme.finalScore?.toString() ?? null,
    themeSimilarityScore: theme.themeSimilarityScore?.toString() ?? null,
    themeSimilarityLabel: theme.themeSimilarityLabel ?? null,
    createdAt: theme.createdAt.toISOString(),
    updatedAt: theme.updatedAt.toISOString(),
    student: theme.student
      ? {
          id: theme.student.id.toString(),
          name: theme.student.name,
          firstName,
          lastName,
          ine: theme.student.ine,
          email: theme.student.email,
          department: theme.student.department,
          role: theme.student.role,
        }
      : undefined,
    theme_id: theme.id.toString(),
    theme_title: theme.title,
    student_name: lastName || fullName,
    student_firstname: firstName,
    student_department: theme.student?.department ?? null,
    similarity_score: similarityScoreValue,
    submitted_at: submittedAt,
  };
}

function bigramSet(text: string) {
  const normalized = normalizeThemeTitle(text).replace(/\s+/g, " ").trim();
  const grams = new Set<string>();
  if (normalized.length < 2) {
    return grams;
  }

  for (let i = 0; i < normalized.length - 1; i += 1) {
    grams.add(normalized.slice(i, i + 2));
  }

  return grams;
}

function titleSimilarityScore(a: string, b: string) {
  const setA = bigramSet(a);
  const setB = bigramSet(b);
  if (setA.size === 0 || setB.size === 0) {
    return 0;
  }

  let intersection = 0;
  setA.forEach((gram) => {
    if (setB.has(gram)) {
      intersection += 1;
    }
  });

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

async function assertThemeSimilarityAccepted(title: string) {
  const existingThemes = await prisma.theme.findMany({
    select: {
      id: true,
      title: true,
    },
    take: 250,
    orderBy: { createdAt: "desc" },
  });

  const matches = existingThemes
    .map((theme) => {
      const score = titleSimilarityScore(title, theme.title);
      return {
        id: theme.id.toString(),
        title: theme.title,
        score,
      };
    })
    .filter((item) => item.score >= 0.7)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (matches.length > 0) {
    const details = matches
      .map((match) => `"${match.title}" (${(match.score * 100).toFixed(1)}%)`)
      .join(", ");
    throw new ApiError(
      `Ce theme est trop similaire a un theme deja existant. Themes proches detectes: ${details}`,
      422,
      "THEME_SIMILARITY_TOO_HIGH",
    );
  }
}

async function ensureThemeTitleAvailable(title: string) {
  const existing = await prisma.theme.findUnique({
    where: { titleNormalized: normalizeThemeTitle(title) },
    select: { id: true },
  });

  if (existing) {
    throw new ApiError("Theme title already exists", 409, "THEME_TITLE_EXISTS");
  }
}

export async function createTheme(studentId: bigint, payload: ThemePayload) {
  const title = payload.title.trim();
  const description = payload.description.trim();

  if (title.length < 8) {
    throw new ApiError(
      "Theme title must contain at least 8 characters",
      422,
      "THEME_TITLE_TOO_SHORT",
    );
  }

  if (!description) {
    throw new ApiError(
      "Theme description is required",
      422,
      "THEME_DESCRIPTION_REQUIRED",
    );
  }

  await ensureThemeTitleAvailable(title);
  await assertThemeSimilarityAccepted(title);

  const candidateProfile = analyzeTheme({
    name: `student-${studentId.toString()}-theme`,
    content: `${title}. ${description}`,
  });
  const referenceProfiles = await listReferenceProfiles();
  const comparisons = compareOneToMany(candidateProfile, referenceProfiles);
  const topComparison = comparisons[0];

  if (
    topComparison &&
    topComparison.thematicSimilarity >=
      THEME_REFERENCE_SIMILARITY_BLOCK_THRESHOLD
  ) {
    const similarityPct = (topComparison.thematicSimilarity * 100).toFixed(2);
    throw new ApiError(
      `Soumission refusee: similarite de ${similarityPct}% avec un document de reference (${topComparison.documentB}). Merci de proposer un theme plus distinct.`,
      422,
      "THEME_REFERENCE_SIMILARITY_TOO_HIGH",
    );
  }

  const similarityScore = topComparison
    ? Number((topComparison.thematicSimilarity * 100).toFixed(2))
    : null;
  const similarityLabel = topComparison?.proximityLevel ?? null;

  const serializableProfile = {
    ...candidateProfile,
    analyzedAt:
      candidateProfile.analyzedAt instanceof Date
        ? candidateProfile.analyzedAt.toISOString()
        : candidateProfile.analyzedAt,
  };

  let created;
  try {
    created = await prisma.theme.create({
      data: {
        studentId,
        title,
        titleNormalized: normalizeThemeTitle(title),
        description,
        status: ThemeStatus.PENDING_VALIDATION,
        themeSignature: JSON.stringify(serializableProfile),
        themeSimilarityScore:
          similarityScore !== null ? new Prisma.Decimal(similarityScore) : null,
        themeSimilarityLabel: similarityLabel,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            ine: true,
            email: true,
            department: true,
            role: true,
          },
        },
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ApiError(
        "Theme title already exists",
        409,
        "THEME_TITLE_EXISTS",
      );
    }
    logger.error("theme.create.failed", "prisma create error", {
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  logger.info("theme.created", {
    themeId: created.id.toString(),
    studentId: created.studentId.toString(),
  });

  return serializeTheme(created);
}

export async function listPendingThemes() {
  const themes = await prisma.theme.findMany({
    where: {
      // Only themes already accepted by the algorithm are routed to CD moderation.
      status: ThemeStatus.PENDING_VALIDATION,
    },
    orderBy: { createdAt: "asc" },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          ine: true,
          email: true,
          department: true,
          role: true,
        },
      },
    },
  });

  return themes.map(serializeTheme);
}

async function loadTheme(themeId: bigint) {
  const theme = await prisma.theme.findUnique({
    where: { id: themeId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          ine: true,
          email: true,
          department: true,
          role: true,
        },
      },
    },
  });

  if (!theme) {
    throw new ApiError("Theme not found", 404, "THEME_NOT_FOUND");
  }

  return theme;
}

function assertRoleCanModerate(theme: Theme, expectedStatus: ThemeStatus) {
  if (theme.status !== expectedStatus) {
    throw new ApiError(
      `Theme must be ${expectedStatus} before this action`,
      409,
      "THEME_STATUS_INVALID",
    );
  }
}

export async function validateThemeCd(
  themeId: bigint,
  moderatorId: bigint,
  decision: ThemeDecision,
  comment?: string | null,
) {
  const theme = await loadTheme(themeId);

  if (theme.status !== ThemeStatus.PENDING_VALIDATION) {
    throw new ApiError(
      `Theme must be PENDING_VALIDATION (algorithm-approved) before CD validation`,
      409,
      "THEME_STATUS_INVALID",
    );
  }

  // Le Chef de Département est le seul validateur du thème.
  // Approbation → VALIDATED directement (dépôt document débloqué).
  const finalStatus =
    decision === "approved" ? ThemeStatus.VALIDATED : ThemeStatus.REJECTED;

  const updated = await prisma.theme.update({
    where: { id: themeId },
    data: {
      moderatedBy: moderatorId,
      moderatedAt: new Date(),
      moderationComment: comment?.trim() || null,
      status: finalStatus,
      teacherApproval: decision === "approved",
      teacherComment: comment?.trim() || null,
      teacherValidatedAt: new Date(),
      validatedCdBy: decision === "approved" ? moderatorId : null,
      validatedCdAt: decision === "approved" ? new Date() : null,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          ine: true,
          email: true,
          department: true,
          role: true,
        },
      },
    },
  });

  logger.info("theme.validated.cd", {
    themeId: updated.id.toString(),
    moderatorId: moderatorId.toString(),
    decision,
  });

  return serializeTheme(updated);
}

export async function validateThemeDa(
  themeId: bigint,
  validatorId: bigint,
  decision: ThemeDecision,
  finalScore?: number | null,
  comment?: string | null,
) {
  const theme = await loadTheme(themeId);

  // Accepte VALIDATED_CD (v1) et PENDING_VALIDATION (v2 — DA peut voter sans attendre CD)
  if (
    theme.status !== ThemeStatus.VALIDATED_CD &&
    theme.status !== ThemeStatus.PENDING_VALIDATION
  ) {
    throw new ApiError(
      `Theme must be VALIDATED_CD or PENDING_VALIDATION before DA validation`,
      409,
      "THEME_STATUS_INVALID",
    );
  }

  // En v2 (PENDING_VALIDATION), la note finale n'est plus requise à cette étape
  const isV2 = theme.status === ThemeStatus.PENDING_VALIDATION;

  if (!isV2 && decision === "approved") {
    if (
      finalScore === null ||
      finalScore === undefined ||
      Number.isNaN(finalScore)
    ) {
      throw new ApiError(
        "Final score is required",
        422,
        "FINAL_SCORE_REQUIRED",
      );
    }
    if (finalScore < 0 || finalScore > 20) {
      throw new ApiError(
        "Final score must be between 0 and 20",
        422,
        "FINAL_SCORE_INVALID",
      );
    }
  }

  // En v2 : statut final = VALIDATED si les deux ont approuvé, sinon REJECTED
  const teacherApproved =
    theme.teacherApproval === true || theme.validatedCdBy !== null;
  const finalStatus = isV2
    ? decision === "approved" && teacherApproved
      ? ThemeStatus.VALIDATED
      : ThemeStatus.REJECTED
    : decision === "approved"
      ? ThemeStatus.VALIDATED_DA
      : ThemeStatus.REJECTED;

  const updated = await prisma.theme.update({
    where: { id: themeId },
    data: {
      validatedDaBy: validatorId,
      validatedDaAt: new Date(),
      status: finalStatus,
      moderationComment: comment?.trim() || null,
      daApproval: decision === "approved",
      daComment: comment?.trim() || null,
      daValidatedAt: new Date(),
      ...(!isV2 && decision === "approved"
        ? {
            finalScore: new Prisma.Decimal(finalScore as number),
            finalScoreAssignedAt: new Date(),
          }
        : !isV2
          ? { finalScore: null, finalScoreAssignedAt: null }
          : {}),
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          ine: true,
          email: true,
          department: true,
          role: true,
        },
      },
    },
  });

  logger.info("theme.validated.da", {
    themeId: updated.id.toString(),
    validatorId: validatorId.toString(),
    decision,
    finalScore: updated.finalScore?.toString() ?? null,
  });

  return serializeTheme(updated);
}
