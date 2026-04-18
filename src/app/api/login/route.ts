import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, errorResponse } from "@/lib/api-errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { assertRateLimit, assertSameOrigin, buildRateLimitKey } from "@/lib/security";
import { setSessionCookie } from "@/lib/session";

const loginPayloadSchema = z
  .object({
    ine: z.string().trim().optional(),
    email: z.email().trim().optional(),
    password: z.string().min(1, "password is required"),
  })
  .refine((data) => Boolean(data.ine || data.email), {
    message: "ine or email is required",
  });

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    assertRateLimit(buildRateLimitKey("login", request), { limit: 8, windowMs: 60_000 });
    const payload = loginPayloadSchema.parse(await request.json());

    const user = payload.ine
      ? await prisma.user.findFirst({ where: { ine: payload.ine } })
      : await prisma.user.findFirst({ where: { email: payload.email } });

    if (!user) {
      throw new ApiError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const isValidPassword = await bcrypt.compare(
      payload.password,
      user.password,
    );
    if (!isValidPassword) {
      throw new ApiError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    if (payload.ine && user.role !== "STUDENT") {
      throw new ApiError(
        "INE login is only allowed for students",
        403,
        "INVALID_LOGIN_CHANNEL",
      );
    }

    if (payload.email && user.role === "STUDENT") {
      throw new ApiError(
        "Student must login with INE",
        403,
        "INVALID_LOGIN_CHANNEL",
      );
    }

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id.toString(),
        name: user.name,
        role: user.role,
        ine: user.ine,
        email: user.email,
        department: user.department,
      },
    });

    setSessionCookie(response, {
      userId: user.id.toString(),
      role: user.role,
    });

    logger.info("auth.login.success", {
      userId: user.id.toString(),
      role: user.role,
    });

    return response;
  } catch (error) {
    logger.error(
      "auth.login.failed",
      error instanceof Error ? error.message : "unknown",
      {},
    );
    return errorResponse(error);
  }
}
