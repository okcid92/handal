import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-errors";
import { guardTeacher } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { analyzeDocument } from "@/server/documents";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ document: string }> },
) {
  try {
    assertSameOrigin(request);
    const session = guardTeacher(request);
    const { document } = await params;

    const result = await analyzeDocument(
      BigInt(document),
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
