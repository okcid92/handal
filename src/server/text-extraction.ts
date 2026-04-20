import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ApiError } from "@/lib/api-errors";

const pdfjsGlobal = globalThis as typeof globalThis & {
  pdfjsWorker?: typeof pdfjsWorker;
};

if (!pdfjsGlobal.pdfjsWorker) {
  pdfjsGlobal.pdfjsWorker = pdfjsWorker;
}

const PDF_STANDARD_FONT_DATA_URL = pathToFileURL(
  path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts/"),
).href;

type LoadedPdfDocument = {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getTextContent: (options?: { maxImageSize?: number }) => Promise<{
      items: Array<{ str?: string }>;
    }>;
    cleanup?: () => unknown;
  }>;
  destroy(): Promise<void>;
};

function buildPdfLoadingOptions(buffer: Buffer) {
  return {
    data: new Uint8Array(buffer.slice(0)),
    cMapUrl: undefined,
    cMapPacked: true,
    disableAutoFetch: true,
    isEvalSupported: false,
    maxImageSize: 1024 * 1024,
    standardFontDataUrl: PDF_STANDARD_FONT_DATA_URL,
  };
}

export async function loadPdfDocument(
  buffer: Buffer,
): Promise<LoadedPdfDocument> {
  const loadingTask = pdfjsLib.getDocument(buildPdfLoadingOptions(buffer));
  return loadingTask.promise as unknown as Promise<LoadedPdfDocument>;
}

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export function assertAllowedDocumentType(mimeType: string) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new ApiError(
      "Only .pdf, .docx and .txt are supported",
      400,
      "INVALID_TYPE",
    );
  }
}

export function assertAllowedDocumentSize(sizeInBytes: number) {
  if (sizeInBytes > 50 * 1024 * 1024) {
    throw new ApiError("File must be less than 50MB", 400, "FILE_TOO_LARGE");
  }
}

/**
 * Extrait le texte de la première page uniquement (fonction Handal-specific).
 * - PDF: Utilise pdfjs-dist de manière server-friendly
 * - DOCX/TXT: Premier 2000 caractères du buffer
 *
 * Lève une ApiError explicite si le PDF est corrompu ou protégé.
 * Limite à 3000 caractères pour éviter les fuites mémoire.
 *
 * @param buffer Contenu du fichier
 * @param mimeType Type MIME du fichier
 * @returns Texte de la première page
 */
export async function extractFirstPageHandal(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  console.log("[EXTRACT] Starting first page extraction", {
    mimeType,
    bufferSize: buffer.length,
  });

  if (mimeType === "application/pdf") {
    console.log("[EXTRACT] File is PDF, using pdfjs-dist");
    const pdf = await loadPdfDocument(buffer);
    try {
      return await extractFirstPageFromLoadedPdf(pdf);
    } finally {
      try {
        await pdf.destroy();
      } catch {
        // Ignore cleanup failures
      }
    }
  }

  // DOCX / TXT: premiers 2000 caractères
  console.log("[EXTRACT] File is non-PDF, extracting first 2000 chars");
  const extracted = buffer
    .toString("utf-8", 0, 2000)
    .replace(/\u0000/g, " ")
    .trim();
  console.log("[EXTRACT] Extraction complete:", { length: extracted.length });
  return extracted;
}

function getPageTextWithTimeout(page: {
  getTextContent: (options?: {
    maxImageSize?: number;
  }) => Promise<{ items: Array<{ str?: string }> }>;
}) {
  const timeoutMs = 10000;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      console.warn("[PDF] Text extraction timeout (10s)");
      reject(new Error("PDF text extraction timeout"));
    }, timeoutMs);
    timeoutHandle.unref?.();
  });

  return Promise.race([
    page.getTextContent({ maxImageSize: 512 * 512 }).finally(() => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }),
    timeoutPromise.finally(() => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }),
  ]);
}

async function extractPdfPageText(page: {
  getTextContent: (options?: {
    maxImageSize?: number;
  }) => Promise<{ items: Array<{ str?: string }> }>;
}) {
  try {
    const textContent = await getPageTextWithTimeout(page);

    return textContent.items
      .map((item) => (item.str ? `${item.str} ` : ""))
      .join("")
      .replace(/\s+/g, " ")
      .trim();
  } catch (err) {
    if (err instanceof Error && err.message === "PDF text extraction timeout") {
      throw new ApiError(
        "Le document est trop lourd pour l'analyse rapide. Réessayez.",
        422,
        "PDF_TIMEOUT",
      );
    }

    throw err;
  }
}

/**
 * Extrait le texte de la première page d'un PDF avec gestion d'erreur robuste.
 * Arrête strictement après la première page pour éviter les fuites mémoire.
 *
 * @param buffer Contenu du fichier PDF
 * @returns Texte de la première page (max 3000 caractères)
 */
export async function extractFirstPageFromLoadedPdf(
  pdf: LoadedPdfDocument,
): Promise<string> {
  try {
    console.log("[PDF] PDF document loaded successfully:", {
      numPages: pdf.numPages,
    });

    if (pdf.numPages < 1) {
      throw new ApiError("Le PDF ne contient aucune page.", 422, "PDF_EMPTY");
    }

    console.log("[PDF] Getting page 1...");
    const firstPage = await pdf.getPage(1);
    console.log("[PDF] Page 1 retrieved successfully");

    const pageText = await extractPdfPageText(firstPage);
    const cleanText = pageText.slice(0, 3000);

    console.log("[PDF] Text extraction completed:", {
      rawLength: pageText.length,
      cleanLength: cleanText.length,
    });

    if (!cleanText) {
      throw new ApiError(
        "Impossible d'extraire le texte du PDF. Le document pourrait être vide ou sans texte.",
        422,
        "PDF_NO_TEXT",
      );
    }

    return cleanText;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message.toLowerCase() : "";
    const fullErrorMsg = err instanceof Error ? err.message : String(err);

    console.error("[PDF] Error during PDF extraction:", {
      errorMsg: fullErrorMsg,
      type: err instanceof Error ? err.constructor.name : typeof err,
      isApiError: err instanceof ApiError,
    });

    if (errorMsg.includes("encrypted") || errorMsg.includes("password")) {
      console.warn("[PDF] PDF is password protected");
      throw new ApiError(
        "Le document PDF est protégé par mot de passe. Veuillez soumettre une version non protégée.",
        422,
        "PDF_ENCRYPTED",
      );
    }

    if (
      errorMsg.includes("invalid") ||
      errorMsg.includes("corrupt") ||
      errorMsg.includes("unexpected eof") ||
      errorMsg.includes("bad xref") ||
      errorMsg.includes("malformed")
    ) {
      console.warn("[PDF] PDF appears corrupted or malformed");
      throw new ApiError(
        "Le fichier PDF semble corrompu. Veuillez vérifier votre document.",
        422,
        "PDF_CORRUPT",
      );
    }

    if (err instanceof ApiError) {
      throw err;
    }

    console.error("[PDF] Unhandled PDF parsing error:", {
      message: fullErrorMsg,
      stack: err instanceof Error ? err.stack : undefined,
    });

    throw new ApiError(
      "Erreur technique lors de la lecture du document. Réessayez ou contactez le support.",
      500,
      "PDF_PARSE_ERROR",
    );
  }
}

/**
 * Alias pour compatibilité avec le code existant.
 * Utilise la nouvelle fonction Handal.
 */
export async function extractFirstPageText(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  return extractFirstPageHandal(buffer, mimeType);
}

export async function extractUploadedDocumentText(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (mimeType === "application/pdf") {
    const pdf = await loadPdfDocument(buffer);
    try {
      return await extractUploadedDocumentTextFromPdf(pdf);
    } finally {
      try {
        await pdf.destroy();
      } catch {
        // ignore
      }
    }
  }

  if (mimeType === "text/plain") {
    return buffer
      .toString("utf-8")
      .replace(/\u0000/g, " ")
      .trim();
  }

  // DOCX: on garde le comportement de secours existant pour éviter une nouvelle dépendance.
  return buffer
    .toString("utf-8")
    .replace(/\u0000/g, " ")
    .trim();
}

export async function extractUploadedDocumentTextFromPdf(
  pdf: LoadedPdfDocument,
): Promise<string> {
  console.log("[EXTRACT] Extracting full PDF text for upload");

  const pageCount = Math.min(
    pdf.numPages,
    Number(process.env.PDF_FULL_TEXT_MAX_PAGES ?? 40),
  );
  const chunks: string[] = [];

  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex += 1) {
    console.log("[PDF] Extracting page", pageIndex, "of", pageCount);
    const page = await pdf.getPage(pageIndex);
    const pageText = await extractPdfPageText(page);

    if (pageText) {
      chunks.push(pageText);
    }

    try {
      await page.cleanup?.();
    } catch {
      // ignore
    }
  }

  const cleanText = chunks.join(" \n").replace(/\s+/g, " ").trim();

  if (!cleanText) {
    throw new ApiError(
      "Impossible d'extraire le texte du PDF. Le document pourrait être vide ou sans texte.",
      422,
      "PDF_NO_TEXT",
    );
  }

  if (pdf.numPages > pageCount) {
    console.warn("[PDF] Full extraction truncated by page limit:", {
      numPages: pdf.numPages,
      pageCount,
    });
  }

  return cleanText;
}

/**
 * Vérifie que le titre du thème validé apparaît sur la première page.
 * Retourne le score de correspondance (0-100).
 * Seuil recommandé : 80%.
 */
export function firstPageTitleScore(
  firstPageText: string,
  themeTitle: string,
): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(
        /[^\w\s\u00e0\u00e2\u00e9\u00e8\u00ea\u00eb\u00ee\u00ef\u00f4\u00f9\u00fb\u00fc\u00e7]/g,
        " ",
      )
      .replace(/\s+/g, " ")
      .trim();

  const pageNorm = normalize(firstPageText);
  const titleNorm = normalize(themeTitle);

  if (!titleNorm) return 0;

  // Correspondance exacte (insensible casse)
  if (pageNorm.includes(titleNorm)) return 100;

  // Score bigramme: proportion des bigrammes du titre présents dans la page
  const bigrams = (s: string): Set<string> => {
    const grams = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) grams.add(s.slice(i, i + 2));
    return grams;
  };

  const titleGrams = bigrams(titleNorm);
  if (titleGrams.size === 0) return 0;

  let matches = 0;
  titleGrams.forEach((g) => {
    if (pageNorm.includes(g)) matches++;
  });

  return Math.round((matches / titleGrams.size) * 100);
}

export function extractTextFromUploadedContent(
  fileName: string,
  mimeType: string,
  rawContent: string,
) {
  const normalized = rawContent.replace(/\u0000/g, " ").trim();

  if (!normalized) {
    throw new ApiError(
      `No readable content extracted from ${fileName} (${mimeType})`,
      422,
      "EMPTY_EXTRACTED_TEXT",
    );
  }

  return normalized;
}
