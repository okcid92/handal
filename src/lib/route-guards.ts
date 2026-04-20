import type { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-errors";
import { requireRole, requireSession, type AppRole } from "@/lib/authz";

export function guardSession(request: NextRequest) {
  return requireSession(request);
}

export function guardRole(request: NextRequest, allowedRoles: AppRole[]) {
  return requireRole(request, allowedRoles);
}

export function guardStudent(request: NextRequest) {
  return guardRole(request, ["STUDENT"]);
}

export function guardTeacher(request: NextRequest) {
  return guardRole(request, ["TEACHER", "ADMIN"]);
}

export function guardDa(request: NextRequest) {
  return guardRole(request, ["DA", "ADMIN"]);
}

export function guardAdmin(request: NextRequest) {
  return guardRole(request, ["ADMIN"]);
}

export function assertSameUserOrAdmin(
  requestUserId: string,
  targetUserId: string,
  role: AppRole,
) {
  if (role !== "ADMIN" && requestUserId !== targetUserId) {
    throw new ApiError("Forbidden", 403, "FORBIDDEN");
  }
}
