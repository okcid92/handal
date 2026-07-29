import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueTheme, updateTheme, findUser } = vi.hoisted(() => ({
  findUniqueTheme: vi.fn(),
  updateTheme: vi.fn(),
  findUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    theme: {
      findUnique: findUniqueTheme,
      update: updateTheme,
    },
    user: {
      findUnique: findUser,
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { validateThemeVotingV2 } from "@/server/themes";

describe("validateThemeVotingV2", () => {
  const themeId = BigInt(12);
  const studentId = BigInt(1);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets VALIDATED immediately when teacher approves", async () => {
    findUniqueTheme.mockResolvedValue({
      id: themeId,
      status: "PENDING_VALIDATION",
      studentId,
      title: "Data Mining",
    });
    findUser.mockResolvedValue({ id: BigInt(2), role: "TEACHER" });
    updateTheme
      .mockResolvedValueOnce({
        id: themeId,
        status: "PENDING_VALIDATION",
        studentId,
        teacherVote: "approved",
        daVote: null,
      })
      .mockResolvedValueOnce({
        id: themeId,
        status: "VALIDATED",
        studentId,
        teacherVote: "approved",
      });

    const result = await validateThemeVotingV2(
      themeId,
      BigInt(2),
      "approved",
      "Bon travail",
    );

    expect(result.teacherVote).toBe("approved");
    expect(result.status).toBe("VALIDATED");
  });

  it("sets VALIDATED when both teacher and DA approve", async () => {
    findUniqueTheme.mockResolvedValue({
      id: themeId,
      status: "PENDING_VALIDATION",
      studentId,
      title: "AI in Education",
    });
    findUser.mockResolvedValue({ id: BigInt(3), role: "DA" });
    updateTheme
      .mockResolvedValueOnce({
        id: themeId,
        status: "PENDING_VALIDATION",
        studentId,
        teacherVote: "approved",
        daVote: "approved",
      })
      .mockResolvedValueOnce({
        id: themeId,
        status: "VALIDATED",
        studentId,
      });

    const result = await validateThemeVotingV2(
      themeId,
      BigInt(3),
      "approved",
      "",
    );

    expect(result.status).toBe("VALIDATED");
  });

  it("sets REJECTED when any vote rejects", async () => {
    findUniqueTheme.mockResolvedValue({
      id: themeId,
      status: "PENDING_VALIDATION",
      studentId,
      title: "Network Security",
    });
    findUser.mockResolvedValue({ id: BigInt(4), role: "DA" });
    updateTheme
      .mockResolvedValueOnce({
        id: themeId,
        status: "PENDING_VALIDATION",
        studentId,
        teacherVote: "approved",
        daVote: "rejected",
      })
      .mockResolvedValueOnce({
        id: themeId,
        status: "REJECTED",
        studentId,
      });

    const result = await validateThemeVotingV2(
      themeId,
      BigInt(4),
      "rejected",
      "Not original",
    );

    expect(result.status).toBe("REJECTED");
  });
});
