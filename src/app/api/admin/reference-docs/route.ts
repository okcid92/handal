import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { copyFile, mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { ApiError, errorResponse } from "@/lib/api-errors";
import { guardAdmin } from "@/lib/route-guards";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/security";
import {
  assertAllowedDocumentType,
  assertAllowedDocumentSize,
  loadPdfDocument,
  extractUploadedDocumentTextFromPdf,
  extractFirstPageText,
} from "@/server/text-extraction";
import { analyzeTheme } from "@/server/analysis/themeanalysor";
import { filterInstitutionalContent } from "@/server/analysis/content-filter";

const REFERENCE_STORAGE_DIR = path.join(process.cwd(), "storage", "references");
const TMP_STORAGE_DIR = path.join(process.cwd(), "storage", "tmp");

export const runtime = "nodejs";
export const maxDuration = 300;

function sanitizeFileName(fileName: string) {
  return (
    fileName
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "document.pdf"
  );
}

async function moveToReferenceStorage(
  buffer: Buffer,
  originalName: string,
  checksum: string,
) {
  await mkdir(TMP_STORAGE_DIR, { recursive: true });
  await mkdir(REFERENCE_STORAGE_DIR, { recursive: true });

  const safeName = sanitizeFileName(originalName);
  const storedFileName = `${Date.now()}-${checksum.slice(0, 10)}-${safeName}`;
  const tmpFilePath = path.join(
    TMP_STORAGE_DIR,
    `handal-ref-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.tmp`,
  );
  const finalFilePath = path.join(REFERENCE_STORAGE_DIR, storedFileName);

  try {
    await writeFile(tmpFilePath, buffer);
    await copyFile(tmpFilePath, finalFilePath);
    try {
      await unlink(tmpFilePath);
    } catch {
      // ignore cleanup errors after a successful copy
    }
  } catch (error) {
    try {
      await unlink(tmpFilePath);
    } catch {
      // ignore cleanup errors
    }
    const fsError = error as NodeJS.ErrnoException;
    if (fsError.code === "EXDEV") {
      throw new ApiError(
        "Erreur de stockage système : Espace disque insuffisant ou partitions incompatibles sur le serveur Handal.",
        500,
        "STORAGE_TRANSFER_FAILED",
      );
    }
    throw error;
  }

  return {
    absolutePath: finalFilePath,
    relativePath: `storage/references/${storedFileName}`,
  };
}

/**
 * Admin bulk upload endpoint for reference documents
 * POST /api/admin/reference-docs
 *
 * Accepts multipart form data with multiple PDF files.
 * Each file is processed:
 * 1. Validated (type, size)
 * 2. Text extracted from first page
 * 3. Indexed with Handal similarity algorithm
 * 4. Stored in documents table with is_reference=true
 */
export async function POST(request: NextRequest) {
  try {
    console.log(
      "[ADMIN-REF-UPLOAD] Starting bulk reference document upload...",
    );

    assertSameOrigin(request);
    const session = guardAdmin(request);
    const adminId = BigInt(session.userId);

    console.log("[ADMIN-REF-UPLOAD] Admin authenticated:", {
      adminId: adminId.toString(),
    });

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      console.warn("[ADMIN-REF-UPLOAD] No files provided");
      return NextResponse.json(
        {
          ok: false,
          error: { code: "NO_FILES", message: "At least one file is required" },
        },
        { status: 400 },
      );
    }

    console.log("[ADMIN-REF-UPLOAD] Processing", files.length, "files");

    const encoder = new TextEncoder();
    const results: Array<Record<string, unknown>> = [];
    const errors: Array<Record<string, unknown>> = [];
    let controllerRef: {
      enqueue: (chunk: Uint8Array) => void;
      close: () => void;
    } | null = null;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controllerRef = controller as typeof controllerRef;
      },
    });

    const emit = (event: string, data: unknown) => {
      controllerRef?.enqueue(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
      );
    };

    void (async () => {
      try {
        emit("start", {
          ok: true,
          total: files.length,
          message:
            "Document ajouté à la bibliothèque de référence Handal avec succès.",
        });

        for (let i = 0; i < files.length; i += 1) {
          const file = files[i];
          emit("file-start", {
            fileName: file.name,
            fileIndex: i + 1,
            totalFiles: files.length,
          });

          try {
            console.log(
              `[ADMIN-REF-UPLOAD] Processing file ${i + 1}/${files.length}:`,
              {
                name: file.name,
                size: file.size,
                type: file.type,
              },
            );

            try {
              assertAllowedDocumentType(file.type);
              assertAllowedDocumentSize(file.size);
            } catch (error) {
              console.warn(
                `[ADMIN-REF-UPLOAD] Validation failed for ${file.name}:`,
                error,
              );
              const message =
                error instanceof Error
                  ? error.message
                  : "File validation failed";
              errors.push({ fileName: file.name, error: message });
              emit("file-error", {
                fileName: file.name,
                error: message,
              });
              continue;
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const checksum = crypto
              .createHash("sha256")
              .update(buffer)
              .digest("hex");

            console.log(`[ADMIN-REF-UPLOAD] Buffer created for ${file.name}:`, {
              size: buffer.length,
              checksum: checksum.slice(0, 8) + "...",
            });

            let pdfDocument: Awaited<
              ReturnType<typeof loadPdfDocument>
            > | null = null;

            let extractedText = "";
            try {
              if (file.type === "application/pdf") {
                pdfDocument = await loadPdfDocument(buffer);
                const totalPages = pdfDocument.numPages;
                extractedText = await extractUploadedDocumentTextFromPdf(
                  pdfDocument,
                  {
                    timeoutMs: Number(
                      process.env.PDF_PAGE_TIMEOUT_MS ?? 120000,
                    ),
                    onProgress: (progress) => {
                      emit("page-progress", {
                        fileName: file.name,
                        pageIndex: progress.pageIndex,
                        totalPages: progress.totalPages,
                        extractedCharacters: progress.extractedCharacters,
                        totalFiles: files.length,
                        fileIndex: i + 1,
                      });
                    },
                  },
                );
                emit("file-pages", {
                  fileName: file.name,
                  totalPages,
                });
              } else {
                extractedText = await extractFirstPageText(buffer, file.type);
              }
              console.log(
                `[ADMIN-REF-UPLOAD] Text extracted from ${file.name}:`,
                {
                  length: extractedText.length,
                },
              );
            } catch (error) {
              const errorMsg =
                error instanceof Error ? error.message : String(error);
              console.warn(
                `[ADMIN-REF-UPLOAD] Text extraction failed for ${file.name}:`,
                {
                  error: errorMsg,
                  type: file.type,
                  size: buffer.length,
                },
              );
              errors.push({
                fileName: file.name,
                error: `Could not extract text: ${errorMsg}`,
              });
              emit("file-error", {
                fileName: file.name,
                error: `Could not extract text: ${errorMsg}`,
              });
              continue;
            } finally {
              if (pdfDocument) {
                try {
                  await pdfDocument.destroy();
                } catch {
                  // ignore cleanup errors
                }
              }
            }

            let storedFile;
            try {
              storedFile = await moveToReferenceStorage(
                buffer,
                file.name,
                checksum,
              );
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Unexpected error";
              errors.push({ fileName: file.name, error: message });
              emit("file-error", {
                fileName: file.name,
                error: message,
              });
              continue;
            }

            const document = await prisma.document.create({
              data: {
                themeId: null,
                studentId: adminId,
                originalName: file.name,
                storagePath: storedFile.relativePath,
                mimeType: file.type,
                fileSize: BigInt(file.size),
                checksum,
                extractedText,
                documentStatus: "APPROVED",
                isReference: true,
                submittedAt: new Date(),
              },
            });

            console.log(
              `[ADMIN-REF-UPLOAD] Document created for ${file.name}:`,
              { documentId: document.id.toString() },
            );

            // Indexation thématique uniquement — pas d'analyse de similarité
            // Les documents de référence sont des sources de vérité, pas des sujets d'analyse.
            const filtered = filterInstitutionalContent(extractedText);
            const profile = analyzeTheme({
              name: file.name,
              content: filtered.filteredContent,
            });

            const result = {
              fileName: file.name,
              documentId: document.id.toString(),
              dominantTheme: profile.dominantTheme,
              topKeywords: profile.keywords.slice(0, 5).map((k) => k.word),
              excludedRatio: Math.round(filtered.excludedRatio * 100),
            };

            console.log(
              `[ADMIN-REF-UPLOAD] Indexed ${file.name}:`,
              { dominantTheme: profile.dominantTheme },
            );

            results.push(result);
            emit("file-complete", result);
          } catch (error) {
            console.error(
              `[ADMIN-REF-UPLOAD] Unexpected error processing ${file.name}:`,
              error,
            );
            const message =
              error instanceof Error ? error.message : "Unexpected error";
            errors.push({ fileName: file.name, error: message });
            emit("file-error", {
              fileName: file.name,
              error: message,
            });
          }
        }

        emit("done", {
          ok: true,
          uploads: results,
          errors: errors.length > 0 ? errors : undefined,
          summary: {
            total: files.length,
            successful: results.length,
            failed: errors.length,
          },
          message:
            "Document ajouté à la bibliothèque de référence Handal avec succès.",
        });
      } catch (error) {
        console.error("[ADMIN-REF-UPLOAD] Unexpected error:", error);
        emit("fatal", {
          ok: false,
          error: {
            code: error instanceof ApiError ? error.code : "INTERNAL_ERROR",
            message:
              error instanceof Error ? error.message : "Unexpected error",
          },
        });
      } finally {
        if (controllerRef) {
          (controllerRef as { close: () => void }).close();
        }
      }
    })();

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[ADMIN-REF-UPLOAD] Unexpected error:", error);
    return errorResponse(error);
  }
}

/**
 * GET /api/admin/reference-docs
 * List all reference documents (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[ADMIN-REF-LIST] Fetching reference documents list");

    guardAdmin(request);

    const referenceDocuments = await prisma.document.findMany({
      where: { isReference: true },
      select: {
        id: true,
        originalName: true,
        extractedText: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
        documentStatus: true,
        reports: {
          select: {
            globalSimilarity: true,
            riskLevel: true,
          },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    console.log(
      "[ADMIN-REF-LIST] Retrieved",
      referenceDocuments.length,
      "reference documents",
    );

    return NextResponse.json({
      ok: true,
      documents: referenceDocuments.map((doc) => ({
        id: doc.id.toString(),
        name: doc.originalName,
        size: doc.fileSize.toString(),
        type: doc.mimeType,
        uploadedAt: doc.createdAt,
        status: doc.documentStatus,
        similarity: doc.reports[0]?.globalSimilarity || null,
        riskLevel: doc.reports[0]?.riskLevel || null,
      })),
    });
  } catch (error) {
    console.error("[ADMIN-REF-LIST] Error:", error);
    return errorResponse(error);
  }
}
