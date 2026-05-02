import { beforeEach, describe, expect, it, vi } from "vitest";

const { findTheme, findThemeById, countDocuments, createDocument } = vi.hoisted(
  () => ({
    findTheme: vi.fn(),
    findThemeById: vi.fn(),
    countDocuments: vi.fn(),
    createDocument: vi.fn(),
  }),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    theme: {
      findFirst: findTheme,
      findUnique: findThemeById,
    },
    document: {
      count: countDocuments,
      create: createDocument,
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

import { createDocument as createDocumentV2 } from "@/server/documents";

describe("createDocument v2", () => {
  const studentId = BigInt(10);
  const payload = {
    originalName: "memoire.pdf",
    mimeType: "application/pdf",
    fileSize: 1024,
    checksum: "abc123",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when student has no VALIDATED theme", async () => {
    findTheme.mockResolvedValue(null);

    await expect(createDocumentV2(payload, studentId)).rejects.toThrow(
      "VALIDATED theme",
    );
  });

  it("rejects when theme is not VALIDATED", async () => {
    findTheme.mockResolvedValue({ id: BigInt(2) });
    findThemeById.mockResolvedValue({
      id: BigInt(2),
      studentId,
      status: "PENDING_VALIDATION",
    });

    await expect(createDocumentV2(payload, studentId)).rejects.toThrow(
      "VALIDATED",
    );
  });

  it("creates document when theme is VALIDATED", async () => {
    findTheme.mockResolvedValue({ id: BigInt(3) });
    findThemeById.mockResolvedValue({
      id: BigInt(3),
      studentId,
      status: "VALIDATED",
    });
    countDocuments.mockResolvedValue(0);
    createDocument.mockResolvedValue({
      id: BigInt(22),
      themeId: BigInt(3),
      studentId,
      originalName: payload.originalName,
      storagePath: "/tmp",
      mimeType: payload.mimeType,
      fileSize: BigInt(payload.fileSize),
      checksum: payload.checksum,
      extractedText: null,
      analysisStatus: "PENDING",
      analysisQueuedAt: new Date(),
      analysisStartedAt: null,
      analysisCompletedAt: null,
      analysisError: null,
      documentStatus: "SUBMITTED",
      isFinal: true,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      theme: { id: BigInt(3), studentId, status: "VALIDATED" },
      student: { id: studentId, role: "STUDENT" },
      uploadAttempts: 1,
    });

    const result = await createDocumentV2(payload, studentId);

    expect(result.id).toBe("22");
    expect(createDocument).toHaveBeenCalled();
  });
});
