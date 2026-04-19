import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/api-errors";
import { guardRole } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { createTheme } from "@/server/themes";

const payloadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(8, "Theme title must contain at least 8 characters"),
  description: z.string().trim().min(1, "Theme description is required"),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = guardRole(request, ["STUDENT"]);
    const payload = payloadSchema.parse(await request.json());

    const theme = await createTheme(BigInt(session.userId), payload);

    return NextResponse.json(
      {
        ok: true,
        theme,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[propose] raw error:", error);
    return errorResponse(error);
  }
}
