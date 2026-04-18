import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-errors";
import { guardRole } from "@/lib/route-guards";
import { listReports } from "@/server/documents";

export async function GET(request: NextRequest) {
  try {
    guardRole(request, ["TEACHER", "DA", "ADMIN"]);

    const reports = await listReports();

    return NextResponse.json({
      ok: true,
      reports,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
