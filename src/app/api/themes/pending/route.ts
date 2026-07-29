import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-errors";
import { guardRole } from "@/lib/route-guards";
import { listPendingThemes } from "@/server/themes";

export async function GET(request: NextRequest) {
  try {
    guardRole(request, ["TEACHER", "DA", "ADMIN"]);

    const themes = await listPendingThemes();

    return NextResponse.json({
      ok: true,
      themes,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
