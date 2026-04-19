import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-errors";
import { guardDa } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { createReferenceDocument } from "@/server/reference-documents";
import {
  assertAllowedDocumentSize,
  assertAllowedDocumentType,
  extractTextFromUploadedContent,
} from "@/server/text-extraction";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = guardDa(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "MISSING_FILE", message: "File is required" },
        },
        { status: 400 },
      );
    }

    assertAllowedDocumentType(file.type);
    assertAllowedDocumentSize(file.size);

    const buffer = await file.arrayBuffer();
    const hash = crypto
      .createHash("sha256")
      .update(Buffer.from(buffer))
      .digest("hex");
    const checksum = `sha256:${hash}`;

    const rawContent = await file.text();
    const extractedText = extractTextFromUploadedContent(
      file.name,
      file.type,
      rawContent,
    );

    const referenceDocument = await createReferenceDocument(
      {
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        checksum,
        extractedText,
      },
      BigInt(session.userId),
    );

    return NextResponse.json(
      {
        ok: true,
        referenceDocument,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
