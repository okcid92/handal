import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/security";
import { guardRole } from "@/lib/route-guards";

/**
 * Teacher & DA read-only reference library endpoint
 * GET /api/reference-library?search=title&subject=filiere
 *
 * Returns a list of reference documents indexed by the Handal algorithm
 * Used for manual verification and comparison
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[REF-LIBRARY] Fetching reference library");

    assertSameOrigin(request);
    guardRole(request, ["STUDENT", "TEACHER", "DA", "ADMIN"]);
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const subject = url.searchParams.get("subject") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "20"),
      100,
    );

    const skip = (page - 1) * limit;

    // Build search query
    const where: any = {
      isReference: true,
      extractedText: { not: null },
    };

    if (search) {
      where.originalName = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (subject) {
      where.extractedText = {
        contains: subject,
        mode: "insensitive",
      };
    }

    console.log("[REF-LIBRARY] Query params:", {
      search,
      subject,
      page,
      limit,
    });

    // Fetch reference documents with pagination
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        select: {
          id: true,
          originalName: true,
          fileSize: true,
          mimeType: true,
          extractedText: true,
          createdAt: true,
          documentStatus: true,
          themeId: true,
          stagingMetadata: true,
          reports: {
            select: {
              globalSimilarity: true,
              riskLevel: true,
              matchedSources: true,
              analyzedAt: true,
            },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          student: {
            select: {
              name: true,
              ine: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    console.log(
      "[REF-LIBRARY] Retrieved",
      documents.length,
      "documents out of",
      total,
    );

    return NextResponse.json({
      ok: true,
      documents: documents.map((doc) => {
        const meta = doc.stagingMetadata as Record<string, unknown> | null;
        const isAdminUpload = doc.themeId === null;
        return {
          id: doc.id.toString(),
          title: (meta?.subjectLabel as string) || doc.originalName,
          originalName: doc.originalName,
          documentId: doc.id.toString(),
          size: doc.fileSize.toString(),
          type: doc.mimeType,
          preview: doc.extractedText ? doc.extractedText.slice(0, 200) : "",
          uploadedAt: doc.createdAt,
          status: doc.documentStatus,
          source: isAdminUpload ? "admin" : "student",
          authorName: isAdminUpload
            ? ((meta?.authorName as string) || null)
            : (doc.student?.name || null),
          department: isAdminUpload
            ? ((meta?.department as string) || null)
            : null,
          academicYear: isAdminUpload
            ? ((meta?.academicYear as string) || null)
            : null,
          techStack: isAdminUpload
            ? ((meta?.techStack as string[]) || [])
            : [],
          similarity: doc.reports[0]?.globalSimilarity || null,
          riskLevel: doc.reports[0]?.riskLevel || null,
          matchedSources: doc.reports[0]?.matchedSources || [],
          analyzedAt: doc.reports[0]?.analyzedAt || null,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[REF-LIBRARY] Error:", error);
    return errorResponse(error);
  }
}

/**
 * GET /api/reference-library/[id]
 * Fetch a single reference document for viewing
 */
export async function HEAD(request: NextRequest) {
  // Verify access before returning file
  try {
    guardRole(request, ["STUDENT", "TEACHER", "DA", "ADMIN"]);
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 403 });
  }
}
