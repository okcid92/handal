import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/api-errors";
import { guardRole } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { validateThemeVotingV2 } from "@/server/themes";

const payloadSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  comment: z.string().trim().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ theme: string }> },
) {
  try {
    assertSameOrigin(request);
    const session = guardRole(request, ["TEACHER", "ADMIN"]);
    const { theme } = await params;
    const payload = payloadSchema.parse(await request.json());

    const updatedTheme = await validateThemeVotingV2(
      BigInt(theme),
      BigInt(session.userId),
      payload.decision,
      payload.comment ?? "",
    );

    return NextResponse.json({
      ok: true,
      theme: updatedTheme,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
