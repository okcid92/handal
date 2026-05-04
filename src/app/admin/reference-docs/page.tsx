"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  CheckCircle,
  BookOpen,
  Tag,
  User,
  GraduationCap,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { apiFetch } from "@/lib/frontend-api";
import { HandalLogo } from "@/components/HandalLogo";

type StagingMetadata = {
  subjectLabel: string | null;
  techStack: string[];
  topKeywords: string[];
  dominantTheme: string;
  excludedRatio: number;
  authorName: string | null;
  department: string | null;
  academicYear: string | null;
};

type StagingDocument = {
  id: string;
  originalName: string;
  fileSize: string;
  mimeType: string;
  storagePath: string;
  stagingMetadata: StagingMetadata | null;
  createdAt: string;
};

function ReferenceDocCard({ doc }: { doc: StagingDocument }) {
  let meta: StagingMetadata | null = null;
  if (doc.stagingMetadata) {
    if (typeof doc.stagingMetadata === "string") {
      try {
        meta = JSON.parse(doc.stagingMetadata);
      } catch {
        meta = null;
      }
    } else {
      meta = doc.stagingMetadata;
    }
  }

  const fileSizeKb = Math.round(Number(doc.fileSize) / 1024);

  return (
    <div className="rounded-2xl border-2 border-[#7b2438]/15 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[#7b2438]/10 bg-[#faf7f4] px-5 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="h-4 w-4 shrink-0 text-[#7b2438]" />
          <p className="truncate text-sm font-bold text-[#2b1d16]">
            {doc.originalName}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700">
          Indexé
        </span>
      </div>

      <div className="grid gap-0 md:grid-cols-[1fr_180px]">
        <div className="space-y-3 p-5">
          {meta?.subjectLabel && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">Sujet</p>
              <p className="text-sm font-semibold text-[#2b1d16]">{meta.subjectLabel}</p>
            </div>
          )}
          {meta?.techStack && meta.techStack.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">Technologies</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {meta.techStack.slice(0, 4).map((t) => (
                  <span key={t} className="rounded-full border border-[#7b2438]/20 bg-[#f2d9e0] px-2 py-0.5 text-[10px] font-semibold text-[#7b2438]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {meta?.authorName && (
              <div>
                <p className="text-[10px] font-bold uppercase text-[#6c5448]">Auteur</p>
                <p className="text-[#2b1d16]">{meta.authorName}</p>
              </div>
            )}
            {meta?.department && (
              <div>
                <p className="text-[10px] font-bold uppercase text-[#6c5448]">Filière</p>
                <p className="text-[#2b1d16]">{meta.department}</p>
              </div>
            )}
            {meta?.academicYear && (
              <div>
                <p className="text-[10px] font-bold uppercase text-[#6c5448]">Année</p>
                <p className="text-[#2b1d16]">{meta.academicYear}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-l border-[#7b2438]/10 bg-[#faf7f4] p-4">
          <a
            href={`/api/documents/${doc.id}/view`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#7b2438]/20 bg-white p-4 text-center transition hover:border-[#7b2438]/50"
          >
            <Image
              src="/brand/handal-lamp.png"
              alt="PDF"
              width={32}
              height={32}
              className="h-8 w-auto opacity-40 group-hover:opacity-70 transition"
              style={{ height: "auto" }}
            />
            <span className="text-[10px] font-semibold text-[#7b2438]">Ouvrir le PDF</span>
          </a>
          <div className="mt-3 space-y-1 text-[10px] text-[#6c5448]">
            <p><span className="font-semibold">Taille:</span> {fileSizeKb} Ko</p>
            <p><span className="font-semibold">Ajouté:</span> {new Date(doc.createdAt).toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminReferenceDocsPage() {
  const [docs, setDocs] = useState<StagingDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ ok: boolean; documents: StagingDocument[] }>("/api/admin/reference-docs/approved");
      setDocs(data.documents);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "rgba(247,241,232,1)" }}>
      <header className="border-b bg-white px-4 py-3">
        <div className="mx-auto max-w-5xl">
          <HandalLogo subtitle="Base de Référence" href="/admin" variant="dark" />
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2b1d16]">Base de Référence</h1>
              <p className="text-sm text-[#6c5448]">{docs.length} document{docs.length !== 1 ? "s" : ""} indexé{docs.length !== 1 ? "s" : ""}</p>
            </div>
            <a
              href="/admin?view=reference-docs"
              className="rounded-xl border border-[#7b2438]/20 px-4 py-2 text-sm font-bold text-[#7b2438] hover:bg-[#f2d9e0] transition"
            >
              + Importer des documents
            </a>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#7b2438]/20 border-t-[#7b2438]" />
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[#7b2438]/15 py-16 text-center">
              <CheckCircle className="h-10 w-10 text-green-500/60" />
              <div>
                <p className="text-sm font-bold text-[#2b1d16]">Aucun document dans la base</p>
                <p className="mt-1 text-xs text-[#6c5448]">Importez et approuvez des documents pour créer la base de référence.</p>
              </div>
              <a
                href="/admin?view=reference-docs"
                className="rounded-xl bg-[#7b2438] px-4 py-2 text-sm font-bold text-white hover:bg-[#5f1b2a]"
              >
                Importer des documents
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {docs.map((doc) => (
                <ReferenceDocCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}