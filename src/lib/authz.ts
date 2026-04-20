import type { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-errors";
import { readSessionFromRequest } from "@/lib/session";

export type AppRole = "STUDENT" | "TEACHER" | "DA" | "ADMIN";

export function requireSession(request: NextRequest) {
  const session = readSessionFromRequest(request);
  if (!session) {
    throw new ApiError("Unauthenticated", 401, "UNAUTHENTICATED");
  }

  return session;
}

export function requireRole(request: NextRequest, allowedRoles: AppRole[]) {
  const session = requireSession(request);
  if (!allowedRoles.includes(session.role)) {
    throw new ApiError(
      `Access denied for role ${session.role}. Allowed roles: ${allowedRoles.join(", ")}`,
      403,
      "FORBIDDEN",
    );
  }

  return session;
}

export function hasAnyRole(role: AppRole, allowedRoles: AppRole[]) {
  return allowedRoles.includes(role);
}
