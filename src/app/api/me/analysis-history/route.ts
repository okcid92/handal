import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { guardStudent } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { listAnalysisHistory } from "@/server/documents";

export async function GET(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = guardStudent(request);
    const history = await listAnalysisHistory(BigInt(session.userId));
    return NextResponse.json({ ok: true, history });
  } catch (error) {
    return errorResponse(error);
  }
}
