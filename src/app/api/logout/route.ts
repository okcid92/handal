import { NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/security";
import { clearSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  assertSameOrigin(request);
  const response = NextResponse.json({ ok: true, message: "Logged out" });
  clearSessionCookie(response);
  return response;
}
