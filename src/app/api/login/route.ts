import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, errorResponse } from "@/lib/api-errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  assertRateLimit,
  assertSameOrigin,
  buildRateLimitKey,
} from "@/lib/security";
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

function getLoginRateLimitConfig() {
  const defaultLimit = process.env.NODE_ENV === "production" ? 8 : 100;
  const envLimit = Number(process.env.LOGIN_RATE_LIMIT);
  const envWindowMs = Number(process.env.LOGIN_RATE_WINDOW_MS);

  return {
    limit:
      Number.isFinite(envLimit) && envLimit > 0
        ? Math.floor(envLimit)
        : defaultLimit,
    windowMs:
      Number.isFinite(envWindowMs) && envWindowMs > 0
        ? Math.floor(envWindowMs)
        : 60_000,
  };
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    assertRateLimit(
      buildRateLimitKey("login", request),
      getLoginRateLimitConfig(),
    );
    const payload = loginPayloadSchema.parse(await request.json());

    const user = payload.ine
      ? await prisma.user.findFirst({ where: { ine: payload.ine.trim() } })
      : await prisma.user.findFirst({ where: { email: payload.email!.trim().toLowerCase() } });

    if (!user) {
      logger.warn("auth.login.failed", "user not found", {
        identifier: payload.ine ?? payload.email,
        reason: "USER_NOT_FOUND",
      });
      throw new ApiError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const isValidPassword = await bcrypt.compare(
      payload.password,
      user.password,
    );
    if (!isValidPassword) {
      logger.warn("auth.login.failed", "wrong password", {
        userId: user.id.toString(),
        role: user.role,
        reason: "WRONG_PASSWORD",
      });
      throw new ApiError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    if (payload.ine && user.role !== "STUDENT") {
      logger.warn("auth.login.failed", "wrong login channel", {
        userId: user.id.toString(),
        role: user.role,
        reason: "INE_NON_STUDENT",
      });
      throw new ApiError(
        "INE login is only allowed for students",
        403,
        "INVALID_LOGIN_CHANNEL",
      );
    }

    if (payload.email && user.role === "STUDENT") {
      logger.warn("auth.login.failed", "wrong login channel", {
        userId: user.id.toString(),
        role: user.role,
        reason: "EMAIL_STUDENT",
      });
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
    if (!(error instanceof ApiError)) {
      logger.error(
        "auth.login.unexpected",
        error instanceof Error ? error.message : "unknown",
        {},
      );
    }
    return errorResponse(error);
  }
}
