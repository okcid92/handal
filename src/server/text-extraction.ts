import { ApiError } from "@/lib/api-errors";
import pdfParse from "pdf-parse";

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
 * Extrait le texte de la première page uniquement.
 * Pour les PDF : utilise pdf-parse avec pagerender limité à 1 page.
 * Pour les autres formats : retourne les 2000 premiers caractères.
 */
export async function extractFirstPageText(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (mimeType === "application/pdf") {
    try {
      let firstPageText = "";
      const options = {
        max: 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pagerender: (pageData: any) => {
          return pageData.getTextContent().then((textContent: any) => {
            const text = textContent.items
              .map((item: any) => item.str)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim();
            firstPageText = text;
            return text;
          });
        },
      };
      await pdfParse(buffer, options);
      return firstPageText || (await pdfParse(buffer, { max: 1 })).text.slice(0, 2000);
    } catch {
      // fallback : texte brut des 2000 premiers caractères
      return buffer.toString("utf-8", 0, 2000).replace(/\u0000/g, " ").trim();
    }
  }
  // DOCX / TXT : premiers 2000 caractères
  return buffer.toString("utf-8", 0, 2000).replace(/\u0000/g, " ").trim();
}

/**
 * Vérifie que le titre du thème validé apparaît sur la première page.
 * Retourne le score de correspondance (0-100).
 * Seuil : 80% de correspondance bigramme.
 */
export function firstPageTitleScore(firstPageText: string, themeTitle: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^\w\sàâéèêëîïôùûüç]/g, " ").replace(/\s+/g, " ").trim();

  const pageNorm = normalize(firstPageText);
  const titleNorm = normalize(themeTitle);

  // Correspondance exacte (insensible casse)
  if (pageNorm.includes(titleNorm)) return 100;

  // Score bigramme entre le titre et le texte de la page
  const bigrams = (s: string): Set<string> => {
    const grams = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) grams.add(s.slice(i, i + 2));
    return grams;
  };

  const titleGrams = bigrams(titleNorm);
  if (titleGrams.size === 0) return 0;

  let matches = 0;
  titleGrams.forEach((g) => { if (pageNorm.includes(g)) matches++; });

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
