import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-errors";
import { guardRole } from "@/lib/route-guards";
import { getReport } from "@/server/documents";
import { getReportDeliberations } from "@/server/deliberations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ report: string }> },
) {
  try {
    guardRole(request, ["TEACHER", "DA", "ADMIN"]);
    const { report } = await params;

    const [result, deliberations] = await Promise.all([
      getReport(BigInt(report)),
      getReportDeliberations(BigInt(report)),
    ]);

    return NextResponse.json({
      ok: true,
      ...result,
      deliberations: deliberations.deliberations,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
