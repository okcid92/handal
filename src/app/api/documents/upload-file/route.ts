import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import { errorResponse } from "@/lib/api-errors";
import { guardStudent } from "@/lib/route-guards";
import { assertSameOrigin } from "@/lib/security";
import {
  createDocument,
  analyzeDocumentInline,
  getValidatedThemeForStudent,
  createAnalysisHistory,
} from "@/server/documents";
import {
  assertAllowedDocumentSize,
  assertAllowedDocumentType,
  extractFirstPageText,
  firstPageTitleScore,
  loadPdfDocument,
  extractFirstPageFromLoadedPdf,
  extractUploadedDocumentTextFromPdf,
  extractUploadedDocumentText,
} from "@/server/text-extraction";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const TITLE_MATCH_THRESHOLD = 80;

const STORAGE_ROOT = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  "storage",
);

function resolveAbsoluteDocumentPath(storagePath: string) {
  const normalizedStoragePath = storagePath.trim().replace(/^\/+/, "");
  if (path.isAbsolute(storagePath)) {
    return storagePath;
  }

  return path.join(
    STORAGE_ROOT,
    normalizedStoragePath.replace(/^storage\//, ""),
  );
}

function cleanDetectedTitle(text: string): string {
  return text
    .replace(
      /^\s*(?:suivant|pr[eé]c[eé]dent|page\s*\d+|titre|chapitre)\s*[:\-]?\s*/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    console.log("[UPLOAD] Starting file upload processing...");

    assertSameOrigin(request);
    const session = guardStudent(request);
    const studentId = BigInt(session.userId);
    console.log("[UPLOAD] Student authenticated:", {
      studentId: studentId.toString(),
    });

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.warn("[UPLOAD] No file provided in request");
      return NextResponse.json(
        {
          ok: false,
          error: { code: "MISSING_FILE", message: "File is required" },
        },
        { status: 400 },
      );
    }

    console.log("[UPLOAD] File received:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Valider le type et la taille
    try {
      assertAllowedDocumentType(file.type);
      assertAllowedDocumentSize(file.size);
    } catch (err) {
      console.warn(
        "[UPLOAD] File validation failed:",
        err instanceof Error ? err.message : err,
      );
      return errorResponse(err);
    }

    // Convertir en buffer
    console.log("[UPLOAD] Converting file to buffer...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    const checksum = `sha256:${hash}`;
    console.log("[UPLOAD] Buffer created:", { size: buffer.length, checksum });

    // Récupérer le thème validé
    console.log("[UPLOAD] Fetching validated theme for student...");
    let theme;
    try {
      theme = await getValidatedThemeForStudent(studentId);
      console.log("[UPLOAD] Theme retrieved:", {
        themeId: theme.id,
        title: theme.title,
      });
    } catch (err) {
      console.error(
        "[UPLOAD] Failed to get validated theme:",
        err instanceof Error ? err.message : err,
      );
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "NO_VALIDATED_THEME",
            message:
              "Aucun thème validé trouvé. Veuillez proposer et faire valider un thème d'abord.",
          },
        },
        { status: 400 },
      );
    }

    let pdfDocument: Awaited<ReturnType<typeof loadPdfDocument>> | null = null;

    // Extraire la première page
    console.log("[UPLOAD] Extracting first page text...");
    let firstPageText;
    try {
      if (file.type === "application/pdf") {
        pdfDocument = await loadPdfDocument(buffer);
        firstPageText = await extractFirstPageFromLoadedPdf(pdfDocument);
      } else {
        firstPageText = await extractFirstPageText(buffer, file.type);
      }
      console.log("[UPLOAD] First page extracted:", {
        length: firstPageText.length,
        preview: firstPageText.slice(0, 100),
      });
    } catch (err) {
      if (pdfDocument) {
        try {
          await pdfDocument.destroy();
        } catch {
          // ignore cleanup errors
        }
        pdfDocument = null;
      }
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[UPLOAD] Text extraction failed:", {
        error: errorMsg,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      if (
        err instanceof Error &&
        (err as Error & { code?: string }).code === "PDF_TIMEOUT"
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Le document est trop lourd pour l'analyse rapide. Réessayez.",
          },
          { status: 422 },
        );
      }
      return errorResponse(err);
    }

    // Vérifier le titre
    console.log("[UPLOAD] Calculating title score...");
    const titleScore = firstPageTitleScore(firstPageText, theme.title);
    console.log("[UPLOAD] Title score calculated:", {
      titleScore,
      threshold: TITLE_MATCH_THRESHOLD,
    });

    if (titleScore < TITLE_MATCH_THRESHOLD) {
      console.warn("[UPLOAD] Title mismatch detected:", {
        titleScore,
        expectedTitle: theme.title,
        foundText: firstPageText.slice(0, 200),
      });

      // Enregistrer la tentative échouée
      try {
        const detectedTitle = cleanDetectedTitle(
          firstPageText.slice(0, 200) || "",
        );
        await createAnalysisHistory({
          studentId,
          fileName: file.name,
          detectedTitle: detectedTitle || null,
          titleScore,
          similarityScore: null,
          blocked: false,
          titleMismatch: true,
          attemptNumber: 1,
        });
      } catch (histErr) {
        console.warn(
          "[UPLOAD] Failed to log failed attempt:",
          histErr instanceof Error ? histErr.message : histErr,
        );
      }

      return NextResponse.json(
        {
          ok: false,
          titleMismatch: true,
          titleScore,
          validatedTitle: theme.title,
          error: {
            code: "TITLE_MISMATCH",
            message:
              "Erreur : Le titre détecté sur votre document ne correspond pas au thème validé par le Chef de département.",
          },
        },
        { status: 422 },
      );
    }

    console.log("[UPLOAD] Title validation passed, extracting full content...");

    let extractedText;
    try {
      if (file.type === "application/pdf") {
        if (!pdfDocument) {
          pdfDocument = await loadPdfDocument(buffer);
        }
        extractedText = await extractUploadedDocumentTextFromPdf(pdfDocument);
      } else {
        extractedText = await extractUploadedDocumentText(buffer, file.type);
      }
      console.log("[UPLOAD] Full content extracted:", {
        length: extractedText.length,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("trop lourd")) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Le document est trop lourd pour l'analyse rapide. Réessayez.",
          },
          { status: 422 },
        );
      }
      console.error(
        "[UPLOAD] Content extraction failed:",
        err instanceof Error ? err.message : err,
      );
      return errorResponse(err);
    } finally {
      if (pdfDocument) {
        try {
          await pdfDocument.destroy();
        } catch {
          // ignore cleanup errors
        }
      }
    }

    // Créer le document
    console.log("[UPLOAD] Creating document in database...");
    let document;
    try {
      document = await createDocument(
        {
          originalName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          checksum,
          extractedText,
        },
        studentId,
      );
      console.log("[UPLOAD] Document created:", { documentId: document.id });

      // Persister le binaire sur disque pour l'endpoint /api/documents/[id]/view.
      const absoluteFilePath = resolveAbsoluteDocumentPath(
        document.storagePath,
      );
      await mkdir(path.dirname(absoluteFilePath), { recursive: true });
      await writeFile(absoluteFilePath, buffer);
      console.log("[UPLOAD] File persisted:", { absoluteFilePath });
    } catch (err) {
      // En cas d'erreur d'écriture disque après création DB, nettoyer l'entrée document.
      if (document?.id) {
        try {
          await prisma.document.delete({ where: { id: BigInt(document.id) } });
        } catch {
          // ignore cleanup error
        }
      }
      console.error(
        "[UPLOAD] Failed to create document:",
        err instanceof Error ? err.message : err,
      );
      return errorResponse(err);
    }

    // Analyse inline immédiate
    console.log("[UPLOAD] Starting inline plagiarism analysis...");
    let analysis: {
      globalSimilarity: number;
      riskLevel: string;
      reportId: string;
      blocked: boolean;
      uploadAttempts: number;
      topReferenceSource: {
        sourceId: string | null;
        sourceLabel: string | null;
        sourceSimilarity: number | null;
      };
    } | null = null;

    try {
      analysis = await analyzeDocumentInline(BigInt(document.id));
      console.log("[UPLOAD] Analysis completed:", {
        similarity: analysis?.globalSimilarity,
        riskLevel: analysis?.riskLevel,
      });
    } catch (err) {
      console.warn(
        "[UPLOAD] Inline analysis failed (document still saved):",
        err instanceof Error ? err.message : err,
      );
    }

    // Enregistrer dans l'historique
    console.log("[UPLOAD] Recording analysis history...");
    try {
      const detectedTitle = cleanDetectedTitle(
        firstPageText.slice(0, 200) || "",
      );
      await createAnalysisHistory({
        studentId,
        documentId: BigInt(document.id),
        reportId: analysis?.reportId ? BigInt(analysis.reportId) : null,
        fileName: file.name,
        detectedTitle: detectedTitle || null,
        titleScore,
        similarityScore: analysis?.globalSimilarity ?? null,
        blocked: analysis?.blocked ?? false,
        titleMismatch: false,
        attemptNumber: analysis?.uploadAttempts ?? 1,
      });
      console.log("[UPLOAD] History recorded successfully");
    } catch (err) {
      console.error(
        "[UPLOAD] Failed to record history:",
        err instanceof Error ? err.message : err,
      );
    }

    console.log("[UPLOAD] Upload processing completed successfully");

    return NextResponse.json(
      { ok: true, document, analysis, titleScore },
      { status: 201 },
    );
  } catch (error) {
    console.error("[UPLOAD] Unexpected error during upload:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
    return errorResponse(error);
  }
}
