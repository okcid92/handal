import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, compare, loggerInfo, loggerWarn, loggerError } = vi.hoisted(
  () => ({
    findFirst: vi.fn(),
    compare: vi.fn(),
    loggerInfo: vi.fn(),
    loggerWarn: vi.fn(),
    loggerError: vi.fn(),
  }),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare,
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: loggerInfo,
    warn: loggerWarn,
    error: loggerError,
  },
}));

import { POST } from "@/app/api/login/route";

describe("login route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = "test-secret";
  });

  it("creates a session for a valid student login", async () => {
    findFirst.mockResolvedValue({
      id: 1n,
      name: "Student Demo",
      email: null,
      ine: "N01331820231",
      role: "STUDENT",
      passwordHash: "$2b$10$demo",
    });
    compare.mockResolvedValue(true);

    const response = await POST(
      new Request("http://localhost/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ine: "N01331820231", password: "mon926732" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("origina_session=");

    const body = (await response.json()) as {
      ok: boolean;
      user: { role: string };
    };

    expect(body.ok).toBe(true);
    expect(body.user.role).toBe("STUDENT");
  });
});