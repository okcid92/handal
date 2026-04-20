import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { errorResponse } from "@/lib/api-errors";
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
import { analyzeDocumentInline } from "@/server/documents";

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

    const results = [];
    const errors = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(
          `[ADMIN-REF-UPLOAD] Processing file ${i + 1}/${files.length}:`,
          {
            name: file.name,
            size: file.size,
            type: file.type,
          },
        );

        // Validate file type and size
        try {
          assertAllowedDocumentType(file.type);
          assertAllowedDocumentSize(file.size);
        } catch (error) {
          console.warn(
            `[ADMIN-REF-UPLOAD] Validation failed for ${file.name}:`,
            error,
          );
          errors.push({
            fileName: file.name,
            error:
              error instanceof Error ? error.message : "File validation failed",
          });
          continue;
        }

        // Convert to buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        const checksum = crypto
          .createHash("sha256")
          .update(buffer)
          .digest("hex");

        console.log(`[ADMIN-REF-UPLOAD] Buffer created for ${file.name}:`, {
          size: buffer.length,
          checksum: checksum.slice(0, 8) + "...",
        });

        let pdfDocument: Awaited<ReturnType<typeof loadPdfDocument>> | null =
          null;

        // Extract text
        let extractedText = "";
        try {
          if (file.type === "application/pdf") {
            pdfDocument = await loadPdfDocument(buffer);
            extractedText =
              await extractUploadedDocumentTextFromPdf(pdfDocument);
          } else {
            extractedText = await extractFirstPageText(buffer, file.type);
          }
          console.log(`[ADMIN-REF-UPLOAD] Text extracted from ${file.name}:`, {
            length: extractedText.length,
          });
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

        // Create reference document in database with is_reference = true
        const document = await prisma.document.create({
          data: {
            themeId: null,
            studentId: adminId, // Admin owns reference documents
            originalName: file.name,
            storagePath: `/reference/${Date.now()}-${checksum.slice(0, 8)}.pdf`,
            mimeType: file.type,
            fileSize: BigInt(file.size),
            checksum,
            extractedText,
            documentStatus: "APPROVED", // Reference docs are pre-approved
            isReference: true, // Mark as reference document
            submittedAt: new Date(),
          },
        });

        console.log(`[ADMIN-REF-UPLOAD] Document created for ${file.name}:`, {
          documentId: document.id.toString(),
        });

        // Analyze with Handal plagiarism algorithm
        try {
          const analysis = await analyzeDocumentInline(document.id);

          console.log(
            `[ADMIN-REF-UPLOAD] Analysis completed for ${file.name}:`,
            {
              globalSimilarity: analysis.globalSimilarity,
              riskLevel: analysis.riskLevel,
            },
          );

          results.push({
            fileName: file.name,
            documentId: document.id.toString(),
            similarity: analysis.globalSimilarity,
            riskLevel: analysis.riskLevel,
          });
        } catch (error) {
          console.warn(
            `[ADMIN-REF-UPLOAD] Analysis failed for ${file.name}:`,
            error,
          );
          // Continue without analysis - document is still created
          results.push({
            fileName: file.name,
            documentId: document.id.toString(),
            warning:
              "Analysis failed, document indexed without similarity scores",
          });
        }
      } catch (error) {
        console.error(
          `[ADMIN-REF-UPLOAD] Unexpected error processing ${file.name}:`,
          error,
        );
        errors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : "Unexpected error",
        });
      }
    }

    console.log("[ADMIN-REF-UPLOAD] Bulk upload complete:", {
      successful: results.length,
      failed: errors.length,
    });

    return NextResponse.json(
      {
        ok: true,
        uploads: results,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total: files.length,
          successful: results.length,
          failed: errors.length,
        },
      },
      { status: 201 },
    );
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
