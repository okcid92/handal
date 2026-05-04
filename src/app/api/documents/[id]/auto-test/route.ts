import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-errors";
import { guardStudent } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { autoTestDocument } from "@/server/documents";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const session = guardStudent(request);
    const { id } = await params;

    const result = await autoTestDocument(
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
