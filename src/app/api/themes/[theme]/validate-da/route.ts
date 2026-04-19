import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { ApiError } from "@/lib/api-errors";
import { assertSameOrigin } from "@/lib/security";

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    throw new ApiError(
      "La validation des thèmes est assurée uniquement par le Chef de Département. La DA intervient à l'étape Délibération.",
      403,
      "DA_THEME_VALIDATION_DISABLED",
    );
  } catch (error) {
    return errorResponse(error);
  }
}
