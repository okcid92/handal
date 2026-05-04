import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-errors";
import { guardTeacher } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { analyzeDocument } from "@/server/documents";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const session = guardTeacher(request);
    const { id } = await params;

    const result = await analyzeDocument(
      BigInt(id),
      BigInt(session.userId),
    );

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
