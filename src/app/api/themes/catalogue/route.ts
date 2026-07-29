import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { guardRole } from "@/lib/route-guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    guardRole(request, ["TEACHER", "DA", "ADMIN"]);

    const { searchParams } = request.nextUrl;
    const year = searchParams.get("year")?.trim() || null;
    const keyword = searchParams.get("keyword")?.trim().toLowerCase() || null;

    // Récupérer tous les documents de référence approuvés avec leurs métadonnées
    const docs = await prisma.document.findMany({
      where: {
        isReference: true,
        documentStatus: "APPROVED",
      },
      select: {
        id: true,
        originalName: true,
        stagingMetadata: true,
        createdAt: true,
        student: { select: { name: true, department: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    type Meta = {
      subjectLabel?: string | null;
      techStack?: string[];
      authorName?: string | null;
      department?: string | null;
      academicYear?: string | null;
      topKeywords?: string[];
    };

    const entries = docs
      .map((doc) => {
        let meta: Meta = {};
        try {
          if (doc.stagingMetadata && typeof doc.stagingMetadata === "string") {
            meta = JSON.parse(doc.stagingMetadata) as Meta;
          } else if (doc.stagingMetadata && typeof doc.stagingMetadata === "object") {
            meta = doc.stagingMetadata as unknown as Meta;
          }
        } catch {
          // ignore parse errors
        }
        return {
          id: doc.id.toString(),
          originalName: doc.originalName,
          subjectLabel: meta.subjectLabel ?? null,
          techStack: meta.techStack ?? [],
          authorName: meta.authorName ?? null,
          department: meta.department ?? null,
          academicYear: meta.academicYear ?? null,
          topKeywords: meta.topKeywords ?? [],
          indexedAt: doc.createdAt.toISOString(),
        };
      })
      // Only show documents with valid metadata (from staging approval)
      .filter((e) => {
        if (!e.subjectLabel || !e.authorName) return false;
        return true;
      })
      .filter((e) => {
        if (year && e.academicYear !== year) return false;
        if (keyword) {
          const haystack = [
            e.subjectLabel ?? "",
            e.techStack.join(" "),
            e.topKeywords.join(" "),
            e.authorName ?? "",
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(keyword)) return false;
        }
        return true;
      });

    // Années disponibles pour le filtre
    const allMeta: Meta[] = [];
    for (const doc of docs) {
      try {
        if (doc.stagingMetadata && typeof doc.stagingMetadata === "string") {
          allMeta.push(JSON.parse(doc.stagingMetadata) as Meta);
        }
      } catch {
        // ignore
      }
    }
    const years = [...new Set(allMeta.map(m => m.academicYear).filter((y): y is string => y !== null))].sort((a, b) => b.localeCompare(a));

    return NextResponse.json({ ok: true, entries, years, total: entries.length });
  } catch (error) {
    return errorResponse(error);
  }
}
