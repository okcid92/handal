import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-errors";
import { guardRole } from "@/lib/route-guards";
import { listReferenceDocuments } from "@/server/reference-documents";

export async function GET(request: NextRequest) {
  try {
    guardRole(request, ["DA", "TEACHER", "ADMIN"]);

    const documents = await listReferenceDocuments();

    return NextResponse.json({
      ok: true,
      documents,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
