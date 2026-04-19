import { NextResponse, type NextRequest } from "next/server";

import { readSessionFromRequest } from "@/lib/session";

const publicPaths = [
  "/",
  "/api/ping",
  "/api/login",
  "/api/logout",
  "/api/db-test",
];

const studentPaths = ["/student"];
const teacherPaths = ["/teacher"];
const daPaths = ["/da"];
const adminPaths = ["/admin"];

export function isPublicPath(pathname: string) {
  if (publicPaths.includes(pathname)) {
    return true;
  }

  if (pathname.startsWith("/brand/")) {
    return true;
  }

  if (pathname.startsWith("/_next")) {
    return true;
  }

  if (pathname.startsWith("/favicon")) {
    return true;
  }

  return false;
}

export function roleIsAllowed(pathname: string, role: string) {
  if (studentPaths.some((path) => pathname.startsWith(path))) {
    return role === "STUDENT" || role === "ADMIN";
  }

  if (teacherPaths.some((path) => pathname.startsWith(path))) {
    return role === "TEACHER" || role === "ADMIN";
  }

  if (daPaths.some((path) => pathname.startsWith(path))) {
    return role === "DA" || role === "ADMIN";
  }

  if (adminPaths.some((path) => pathname.startsWith(path))) {
    return role === "ADMIN";
  }

  return true;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const session = readSessionFromRequest(request);

  if (!session) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "UNAUTHENTICATED", message: "Unauthenticated" },
        },
        { status: 401 },
      );
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!roleIsAllowed(pathname, session.role)) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Forbidden" } },
        { status: 403 },
      );
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
