import { Prisma, ThemeStatus, type Role, type Theme } from "@prisma/client";

import { ApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export type ThemeDecision = "approved" | "rejected";

export type ThemeSummary = {
  id: string;
  studentId: string;
  title: string;
  description: string;
  status: ThemeStatus;
  moderationComment: string | null;
  finalScore: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    ine: string | null;
    email: string | null;
    role: Role;
  };
};

type ThemePayload = {
  title: string;
  description: string;
};

function normalizeTitle(title: string) {
  return title.trim().toLowerCase();
}

function serializeTheme(
  theme: Theme & {
    student?: {
      id: bigint;
      name: string;
      ine: string | null;
      email: string | null;
      role: Role;
    };
  },
) {
  return {
    id: theme.id.toString(),
    studentId: theme.studentId.toString(),
    title: theme.title,
    description: theme.description,
    status: theme.status,
    moderationComment: theme.moderationComment ?? null,
    finalScore: theme.finalScore?.toString() ?? null,
    createdAt: theme.createdAt.toISOString(),
    updatedAt: theme.updatedAt.toISOString(),
    student: theme.student
      ? {
          id: theme.student.id.toString(),
          name: theme.student.name,
          ine: theme.student.ine,
          email: theme.student.email,
          role: theme.student.role,
        }
      : undefined,
  };
}

async function ensureThemeTitleAvailable(title: string) {
  const existing = await prisma.theme.findUnique({
    where: { titleNormalized: normalizeTitle(title) },
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

  const created = await prisma.theme.create({
    data: {
      studentId,
      title,
      titleNormalized: normalizeTitle(title),
      description,
      status: ThemeStatus.PENDING,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          ine: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return serializeTheme(created);
}

export async function listPendingThemes() {
  const themes = await prisma.theme.findMany({
    where: { status: ThemeStatus.PENDING },
    orderBy: { createdAt: "asc" },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          ine: true,
          email: true,
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
  assertRoleCanModerate(theme, ThemeStatus.PENDING);

  const updated = await prisma.theme.update({
    where: { id: themeId },
    data: {
      moderatedBy: moderatorId,
      moderatedAt: new Date(),
      moderationComment: comment?.trim() || null,
      status:
        decision === "approved"
          ? ThemeStatus.VALIDATED_CD
          : ThemeStatus.REJECTED,
      ...(decision === "approved"
        ? { validatedCdBy: moderatorId, validatedCdAt: new Date() }
        : {}),
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          ine: true,
          email: true,
          role: true,
        },
      },
    },
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
  assertRoleCanModerate(theme, ThemeStatus.VALIDATED_CD);

  if (decision === "approved") {
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

  const updated = await prisma.theme.update({
    where: { id: themeId },
    data: {
      validatedDaBy: validatorId,
      validatedDaAt: new Date(),
      status:
        decision === "approved"
          ? ThemeStatus.VALIDATED_DA
          : ThemeStatus.REJECTED,
      moderationComment: comment?.trim() || null,
      ...(decision === "approved"
        ? {
            finalScore: new Prisma.Decimal(finalScore as number),
            finalScoreAssignedAt: new Date(),
          }
        : { finalScore: null, finalScoreAssignedAt: null }),
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          ine: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return serializeTheme(updated);
}
