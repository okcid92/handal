import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-errors";
import { guardStudent } from "@/lib/route-guards";
import { autoTestDocument } from "@/server/documents";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ document: string }> },
) {
  try {
    const session = guardStudent(request);
    const { document } = await params;

    const result = await autoTestDocument(BigInt(document), BigInt(session.userId));

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
