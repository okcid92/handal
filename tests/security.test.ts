import { describe, expect, it, beforeEach } from "vitest";

import { ApiError } from "@/lib/api-errors";
import {
  assertRateLimit,
  assertSameOrigin,
  buildRateLimitKey,
  resetRateLimitStore,
} from "@/lib/security";

describe("security helpers", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("builds a rate-limit key from the client IP", () => {
    const request = new Request("http://localhost/api/login", {
      headers: {
        "x-forwarded-for": "10.0.0.1, 127.0.0.1",
      },
    });

    expect(buildRateLimitKey("login", request)).toBe("login:10.0.0.1");
  });

  it("blocks repeated requests after the configured limit", () => {
    const request = new Request("http://localhost/api/login");
    const key = buildRateLimitKey("login", request);

    assertRateLimit(key, { limit: 2, windowMs: 1000 });
    assertRateLimit(key, { limit: 2, windowMs: 1000 });

    expect(() => assertRateLimit(key, { limit: 2, windowMs: 1000 })).toThrow(
      ApiError,
    );
  });

  it("blocks cross-origin requests", () => {
    const request = new Request("http://localhost/api/login", {
      headers: {
        origin: "https://evil.example",
      },
    });

    expect(() => assertSameOrigin(request)).toThrow(ApiError);
  });

  it("allows same-origin requests", () => {
    const request = new Request("http://localhost/api/login", {
      headers: {
        origin: "http://localhost",
      },
    });

    expect(() => assertSameOrigin(request)).not.toThrow();
  });
});
