import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-errors";
import { guardRole } from "@/lib/route-guards";
import { getReport } from "@/server/documents";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ report: string }> },
) {
  try {
    guardRole(request, ["TEACHER", "DA", "ADMIN"]);
    const { report } = await params;

    const result = await getReport(BigInt(report));

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
