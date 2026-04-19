import { ApiError } from "@/lib/api-errors";

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

export function extractTextFromUploadedContent(
  fileName: string,
  mimeType: string,
  rawContent: string,
) {
  // We keep extraction deterministic and safe for now.
  // PDF/DOCX binary extraction can be swapped for a dedicated parser later.
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
