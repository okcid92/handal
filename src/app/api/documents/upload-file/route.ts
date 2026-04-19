import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { errorResponse } from "@/lib/api-errors";
import { guardStudent } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import { createDocument, analyzeDocumentInline, getValidatedThemeForStudent } from "@/server/documents";
import {
  assertAllowedDocumentSize,
  assertAllowedDocumentType,
  extractTextFromUploadedContent,
  extractFirstPageText,
  firstPageTitleScore,
} from "@/server/text-extraction";

const TITLE_MATCH_THRESHOLD = 80;

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    const checksum = `sha256:${hash}`;

    // Verification de la premiere page avant tout
    const theme = await getValidatedThemeForStudent(BigInt(session.userId));
    const firstPageText = await extractFirstPageText(buffer, file.type);
    const titleScore = firstPageTitleScore(firstPageText, theme.title);

    if (titleScore < TITLE_MATCH_THRESHOLD) {
      return NextResponse.json(
        {
          ok: false,
          titleMismatch: true,
          titleScore,
          validatedTitle: theme.title,
          error: {
            code: "TITLE_MISMATCH",
            message:
              "Erreur : Le titre detecte sur votre document ne correspond pas au theme valide par le Chef de departement.",
          },
        },
        { status: 422 },
      );
    }

    const rawContent = buffer.toString("utf-8").replace(/\u0000/g, " ");
    const extractedText = extractTextFromUploadedContent(file.name, file.type, rawContent);

    const document = await createDocument(
      { originalName: file.name, mimeType: file.type, fileSize: file.size, checksum, extractedText },
      BigInt(session.userId),
    );

    // Analyse inline immediate
    let analysis: {
      globalSimilarity: number;
      riskLevel: string;
      reportId: string;
      blocked: boolean;
      uploadAttempts: number;
    } | null = null;
    try {
      analysis = await analyzeDocumentInline(BigInt(document.id));
    } catch {
      // L'analyse a echoue mais le document est cree - on retourne quand meme
    }

    return NextResponse.json(
      { ok: true, document, analysis, titleScore },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
