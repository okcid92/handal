import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { guardRole } from "@/lib/route-guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    guardRole(request, ["TEACHER", "ADMIN"]);

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
        const meta = (doc.stagingMetadata ?? {}) as Meta;
        return {
          id: doc.id.toString(),
          originalName: doc.originalName,
          subjectLabel: meta.subjectLabel ?? null,
          techStack: meta.techStack ?? [],
          authorName: meta.authorName ?? doc.student.name,
          department: meta.department ?? doc.student.department ?? null,
          academicYear: meta.academicYear ?? null,
          topKeywords: meta.topKeywords ?? [],
          indexedAt: doc.createdAt.toISOString(),
        };
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
    const years = [
      ...new Set(
        docs
          .map((d) => ((d.stagingMetadata as Meta)?.academicYear) ?? null)
          .filter((y): y is string => y !== null),
      ),
    ].sort((a, b) => b.localeCompare(a));

    return NextResponse.json({ ok: true, entries, years, total: entries.length });
  } catch (error) {
    return errorResponse(error);
  }
}
