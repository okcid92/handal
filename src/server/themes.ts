import { Prisma, ThemeStatus, type Role, type Theme } from "@prisma/client";

import { ApiError } from "@/lib/api-errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  analyzeTheme,
  compareOneToMany,
} from "@/server/analysis/themeanalysor";
import { listReferenceProfiles } from "@/server/reference-documents";

const THEME_REFERENCE_SIMILARITY_BLOCK_THRESHOLD = 0.65;

type ThemePayload = {
  title: string;
  description: string;
};

export type ThemeSummary = {
  id: string;
  studentId: string;
  title: string;
  description: string;
  status: ThemeStatus;
  themeSimilarityScore?: string | null;
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

export type ThemeSimilarityMatch = {
  themeId: string;
  title: string;
  similarity: number;
};

export function normalizeThemeTitle(title: string) {
  return title.trim().toLowerCase();
}

function sanitizeThemeTitle(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(.)/, (c) => c.toUpperCase());
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
    theme.themeSimilarityScore !== null && theme.themeSimilarityScore !== undefined
      ? `${theme.themeSimilarityScore.toString()}%`
      : "0%";

  return {
    id: theme.id.toString(),
    studentId: theme.studentId.toString(),
    title: theme.title,
    description: theme.description,
    status: theme.status,
    themeSimilarityScore: theme.themeSimilarityScore?.toString() ?? null,
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
    submitted_at: theme.createdAt.toISOString().slice(0, 10),
  };
}

function bigramSet(text: string) {
  const normalized = normalizeThemeTitle(text).replace(/\s+/g, " ").trim();
  const grams = new Set<string>();
  if (normalized.length < 2) return grams;
  for (let i = 0; i < normalized.length - 1; i += 1) {
    grams.add(normalized.slice(i, i + 2));
  }
  return grams;
}

function titleSimilarityScore(a: string, b: string) {
  const setA = bigramSet(a);
  const setB = bigramSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  setA.forEach((gram) => {
    if (setB.has(gram)) intersection += 1;
  });

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

async function assertThemeSimilarityAccepted(title: string) {
  const existingThemes = await prisma.theme.findMany({
    select: { id: true, title: true },
    take: 250,
    orderBy: { createdAt: "desc" },
  });

  const matches = existingThemes
    .map((theme) => {
      const score = titleSimilarityScore(title, theme.title);
      return { id: theme.id.toString(), title: theme.title, score };
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
      throw new ApiError("Theme title already exists", 409, "THEME_TITLE_EXISTS");
    }
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
    where: { status: ThemeStatus.PENDING_VALIDATION },
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

export async function validateThemeVotingV2(
  themeId: bigint,
  voterId: bigint,
  decision: "approved" | "rejected",
  comment: string,
): Promise<Theme> {
  const theme = await loadTheme(themeId);

  if (theme.status !== ThemeStatus.PENDING_VALIDATION) {
    throw new ApiError(
      `Cannot vote on theme with status ${theme.status}`,
      409,
      "THEME_STATUS_INVALID",
    );
  }

  const voter = await prisma.user.findUnique({ where: { id: voterId } });
  if (!voter || !["TEACHER", "DA", "ADMIN"].includes(voter.role)) {
    throw new ApiError("Only TEACHER or DA can vote", 403, "FORBIDDEN");
  }

  const updatedTheme = await prisma.theme.update({
    where: { id: themeId },
    data:
      voter.role === "TEACHER"
        ? {
            teacherVote: decision,
            teacherComment: comment,
            teacherVotedAt: new Date(),
          }
        : {
            daVote: decision,
            daComment: comment,
            daVotedAt: new Date(),
          },
  });

  if (updatedTheme.teacherVote && updatedTheme.daVote) {
    const finalStatus =
      updatedTheme.teacherVote === "approved" &&
      updatedTheme.daVote === "approved"
        ? ThemeStatus.VALIDATED
        : ThemeStatus.REJECTED;

    const finalTheme = await prisma.theme.update({
      where: { id: themeId },
      data: { status: finalStatus },
    });

    await notifyStudent(theme.studentId, {
      type: finalStatus === ThemeStatus.VALIDATED ? "THEME_VALIDATED" : "THEME_REJECTED",
      themeId,
      message:
        finalStatus === ThemeStatus.VALIDATED
          ? `Votre thème "${theme.title}" a été validé. Vous pouvez déposer votre mémoire.`
          : `Votre thème "${theme.title}" a été rejeté.`,
    });

    return finalTheme;
  }

  return updatedTheme;
}

export async function checkThemeSimilarity(
  title: string,
): Promise<ThemeSimilarityMatch[]> {
  const existingThemes = await prisma.theme.findMany({
    select: { id: true, title: true },
    take: 250,
    orderBy: { createdAt: "desc" },
  });

  return existingThemes
    .map((theme) => ({
      themeId: theme.id.toString(),
      title: theme.title,
      similarity: Number((titleSimilarityScore(title, theme.title) * 100).toFixed(2)),
    }))
    .filter((match) => match.similarity >= 50)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}

export async function findOrCreateReferenceTheme(
  title: string,
  adminId: bigint,
  description?: string,
): Promise<bigint> {
  const cleaned = sanitizeThemeTitle(title || "Sujet non classe");
  const normalized = normalizeThemeTitle(cleaned);

  const existing = await prisma.theme.findUnique({
    where: { titleNormalized: normalized },
    select: { id: true },
  });
  if (existing) return existing.id;

  try {
    const created = await prisma.theme.create({
      data: {
        studentId: adminId,
        title: cleaned,
        titleNormalized: normalized,
        description:
          description ??
          `Theme extrait automatiquement depuis un document de reference IBAM : ${cleaned}.`,
        status: ThemeStatus.VALIDATED,
        teacherVote: "approved",
        daVote: "approved",
        teacherVotedAt: new Date(),
        daVotedAt: new Date(),
      },
      select: { id: true },
    });
    return created.id;
  } catch (err) {
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

async function notifyStudent(
  studentId: bigint,
  payload: { type: string; themeId: bigint; message: string },
) {
  logger.info("theme.notification", {
    studentId: studentId.toString(),
    type: payload.type,
    themeId: payload.themeId.toString(),
  });
}
