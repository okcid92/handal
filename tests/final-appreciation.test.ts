import { beforeEach, describe, expect, it, vi } from "vitest";

const { findDocument, createAppreciation, updateAppreciation, updateDocument } =
  vi.hoisted(() => ({
    findDocument: vi.fn(),
    createAppreciation: vi.fn(),
    updateAppreciation: vi.fn(),
    updateDocument: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    document: {
      findUnique: findDocument,
      update: updateDocument,
    },
    finalAppreciation: {
      create: createAppreciation,
      update: updateAppreciation,
    },
  },
}));

vi.mock("@/lib/security", () => ({
  assertSameOrigin: vi.fn(),
}));

vi.mock("@/lib/route-guards", () => ({
  guardRole: vi.fn(() => ({ userId: "5", role: "TEACHER" })),
}));

import { POST } from "@/app/api/documents/[id]/final-appreciation/route";

describe("final appreciation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records teacher decision when first vote arrives", async () => {
    findDocument.mockResolvedValue({
      id: BigInt(10),
      studentId: BigInt(2),
      documentStatus: "CLEAN",
      similarityReport: null,
      finalAppreciation: null,
      student: { id: BigInt(2) },
    });
    createAppreciation.mockResolvedValue({
      id: BigInt(1),
      documentId: BigInt(10),
      teacherDecision: null,
      daDecision: null,
    });
    updateAppreciation.mockResolvedValue({
      id: BigInt(1),
      documentId: BigInt(10),
      teacherDecision: "APPROVED",
      daDecision: null,
    });

    const response = await POST(
      new Request("http://localhost/api/documents/10/final-appreciation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "APPROVED", comment: "Excellent" }),
      }) as never,
      { params: { id: "10" } },
    );

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.teacherDecision).toBe("APPROVED");
  });

  it("finalizes decision when both votes exist", async () => {
    findDocument.mockResolvedValue({
      id: BigInt(11),
      studentId: BigInt(2),
      documentStatus: "CLEAN",
      similarityReport: null,
      finalAppreciation: { id: BigInt(2), teacherDecision: "APPROVED", daDecision: null },
      student: { id: BigInt(2) },
    });
    updateAppreciation
      .mockResolvedValueOnce({
        id: BigInt(2),
        documentId: BigInt(11),
        teacherDecision: "APPROVED",
        daDecision: "APPROVED",
      })
      .mockResolvedValueOnce({
        id: BigInt(2),
        documentId: BigInt(11),
        finalDecision: "APPROVED",
      });

    const response = await POST(
      new Request("http://localhost/api/documents/11/final-appreciation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "APPROVED" }),
      }) as never,
      { params: { id: "11" } },
    );

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.finalDecision).toBe("APPROVED");
    expect(updateDocument).toHaveBeenCalled();
  });
});
