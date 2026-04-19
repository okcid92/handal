import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { errorResponse } from "@/lib/api-errors";
import { guardStudent } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { createDocument, analyzeDocumentInline } from "@/server/documents";
import {
  assertAllowedDocumentSize,
  assertAllowedDocumentType,
  extractTextFromUploadedContent,
} from "@/server/text-extraction";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = guardStudent(request);

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: { code: "MISSING_FILE", message: "File is required" } },
        { status: 400 },
      );
    }

    assertAllowedDocumentType(file.type);
    assertAllowedDocumentSize(file.size);

    const buffer = await file.arrayBuffer();
    const hash = crypto.createHash("sha256").update(Buffer.from(buffer)).digest("hex");
    const checksum = `sha256:${hash}`;
    const rawContent = await file.text();
    const extractedText = extractTextFromUploadedContent(file.name, file.type, rawContent);

    const document = await createDocument(
      { originalName: file.name, mimeType: file.type, fileSize: file.size, checksum, extractedText },
      BigInt(session.userId),
    );

    // Analyse inline immédiate
    let analysis: { globalSimilarity: number; aiScore: number; riskLevel: string; reportId: string } | null = null;
    try {
      analysis = await analyzeDocumentInline(BigInt(document.id));
    } catch {
      // L'analyse a échoué mais le document est créé — on retourne quand même
    }

    return NextResponse.json(
      {
        ok: true,
        document,
        analysis,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
