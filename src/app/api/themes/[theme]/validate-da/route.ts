import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/api-errors";
import { guardRole } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { validateThemeDa } from "@/server/themes";

const payloadSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  finalScore: z.number().min(0).max(20).optional().nullable(),
  comment: z.string().trim().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ theme: string }> },
) {
  try {
    assertSameOrigin(request);
    const session = guardRole(request, ["DA", "ADMIN"]);
    const { theme } = await params;
    const payload = payloadSchema.parse(await request.json());

    const updatedTheme = await validateThemeDa(
      BigInt(theme),
      BigInt(session.userId),
      payload.decision,
      payload.finalScore ?? null,
      payload.comment ?? null,
    );

    return NextResponse.json({
      ok: true,
      theme: updatedTheme,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
