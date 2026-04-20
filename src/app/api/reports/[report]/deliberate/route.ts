import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/api-errors";
import { guardRole } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import {
  createDeliberation,
  validateReportByChefDept,
} from "@/server/deliberations";

const payloadSchema = z.object({
  decision: z.enum(["final_validation", "sanction", "rewrite_required"]),
  notes: z.string().trim().optional().nullable(),
  committee: z.string().trim().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ report: string }> },
) {
  try {
    assertSameOrigin(request);
    const session = guardRole(request, ["DA", "ADMIN"]);
    const { report } = await params;
    const payload = payloadSchema.parse(await request.json());

    const result =
      payload.decision === "final_validation"
        ? await validateReportByChefDept(
            BigInt(report),
            BigInt(session.userId),
            payload,
          )
        : await createDeliberation(
            BigInt(report),
            BigInt(session.userId),
            payload,
          );

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
