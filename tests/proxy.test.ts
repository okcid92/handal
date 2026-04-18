import { describe, expect, it } from "vitest";

import { proxy, isPublicPath, roleIsAllowed } from "@/proxy";

describe("proxy access control", () => {
  it("treats public paths as open", () => {
    expect(isPublicPath("/api/login")).toBe(true);
    expect(isPublicPath("/student")).toBe(false);
  });

  it("allows only the configured roles per dashboard path", () => {
    expect(roleIsAllowed("/student", "STUDENT")).toBe(true);
    expect(roleIsAllowed("/teacher", "STUDENT")).toBe(false);
    expect(roleIsAllowed("/admin", "ADMIN")).toBe(true);
  });

  it("redirects unauthenticated users away from protected pages", () => {
    const response = proxy({
      nextUrl: new URL("http://localhost/student"),
      url: "http://localhost/student",
      cookies: { get: () => undefined },
    } as never);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });
});