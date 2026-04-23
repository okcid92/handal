"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  CheckCircle,
  XCircle,
  Edit3,
  BookOpen,
  Tag,
  User,
  GraduationCap,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { apiFetch } from "@/lib/frontend-api";

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

type EditState = {
  subjectLabel: string;
  techStack: string;
  authorName: string;
  department: string;
  academicYear: string;
};

const DEPARTMENTS = [
  "",
  "MIAGE",
  "CCA",
  "AGRO",
  "GI",
  "GC",
  "GM",
  "GE",
  "Autre",
];

function StagingCard({
  doc,
  onApprove,
  onReject,
}: {
  doc: StagingDocument;
  onApprove: (id: string, data: EditState) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const meta = doc.stagingMetadata;
  const [edit, setEdit] = useState<EditState>({
    subjectLabel: meta?.subjectLabel ?? "",
    techStack: meta?.techStack?.join(", ") ?? "",
    authorName: meta?.authorName ?? "",
    department: meta?.department ?? "",
    academicYear: meta?.academicYear ?? "",
  });
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    if (!edit.subjectLabel.trim()) {
      setError("Le sujet est requis pour approuver.");
      return;
    }
    setApproving(true);
    setError(null);
    try {
      await onApprove(doc.id, edit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur approbation");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    setRejecting(true);
    try {
      await onReject(doc.id);
    } finally {
      setRejecting(false);
    }
  }

  const fileSizeKb = Math.round(Number(doc.fileSize) / 1024);

  return (
    <div className="rounded-2xl border-2 border-[#7b2438]/15 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#7b2438]/10 bg-[#faf7f4] px-5 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="h-4 w-4 shrink-0 text-[#7b2438]" />
          <p className="truncate text-sm font-bold text-[#2b1d16]">
            {doc.originalName}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#c98a2f]/40 bg-[#fff6e6] px-2.5 py-0.5 text-[10px] font-bold text-[#755028]">
          En attente
        </span>
      </div>

      <div className="grid gap-0 md:grid-cols-[1fr_220px]">
        {/* Champs éditables */}
        <div className="space-y-4 p-5">
          {/* Sujet */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">
              <Edit3 className="h-3 w-3" /> Sujet du mémoire
            </label>
            <input
              type="text"
              value={edit.subjectLabel}
              onChange={(e) =>
                setEdit((s) => ({ ...s, subjectLabel: e.target.value }))
              }
              placeholder="Ex : Conception d'un système de gestion des stocks"
              className="h-10 w-full rounded-xl border-2 border-[#7b2438]/20 bg-white px-3 text-sm text-[#2b1d16] outline-none transition focus:border-[#7b2438]"
            />
            {meta?.dominantTheme && meta.dominantTheme !== "indéterminé" && (
              <p className="mt-1 text-[10px] text-[#6c5448]">
                NLP détecté :{" "}
                <button
                  type="button"
                  className="font-semibold text-[#7b2438] underline decoration-dotted"
                  onClick={() =>
                    setEdit((s) => ({
                      ...s,
                      subjectLabel: meta.subjectLabel ?? meta.dominantTheme,
                    }))
                  }
                >
                  {meta.subjectLabel ?? meta.dominantTheme}
                </button>
              </p>
            )}
          </div>

          {/* Technologies */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">
              <Tag className="h-3 w-3" /> Technologies (séparées par virgule)
            </label>
            <input
              type="text"
              value={edit.techStack}
              onChange={(e) =>
                setEdit((s) => ({ ...s, techStack: e.target.value }))
              }
              placeholder="Ex : Laravel, MySQL, Docker"
              className="h-10 w-full rounded-xl border-2 border-[#7b2438]/20 bg-white px-3 text-sm text-[#2b1d16] outline-none transition focus:border-[#7b2438]"
            />
            {meta?.techStack && meta.techStack.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {meta.techStack.slice(0, 6).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setEdit((s) => ({
                        ...s,
                        techStack: s.techStack ? `${s.techStack}, ${t}` : t,
                      }))
                    }
                    className="rounded-full border border-[#7b2438]/20 bg-[#f2d9e0] px-2 py-0.5 text-[10px] font-semibold text-[#7b2438] hover:bg-[#7b2438] hover:text-white transition"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auteur + Filière + Année */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">
                <User className="h-3 w-3" /> Auteur
                {meta?.authorName && (
                  <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                    auto
                  </span>
                )}
              </label>
              <input
                type="text"
                value={edit.authorName}
                onChange={(e) =>
                  setEdit((s) => ({ ...s, authorName: e.target.value }))
                }
                placeholder="Nom Prénom"
                className="h-9 w-full rounded-xl border-2 border-[#7b2438]/20 bg-white px-3 text-xs text-[#2b1d16] outline-none transition focus:border-[#7b2438]"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">
                <GraduationCap className="h-3 w-3" /> Filière
                {meta?.department && (
                  <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                    auto
                  </span>
                )}
              </label>
              <select
                value={edit.department}
                onChange={(e) =>
                  setEdit((s) => ({ ...s, department: e.target.value }))
                }
                className="h-9 w-full rounded-xl border-2 border-[#7b2438]/20 bg-white px-3 text-xs text-[#2b1d16] outline-none transition focus:border-[#7b2438]"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d || "Choisir..."}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">
                <Calendar className="h-3 w-3" /> Année
                {meta?.academicYear && (
                  <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                    auto
                  </span>
                )}
              </label>
              <input
                type="text"
                value={edit.academicYear}
                onChange={(e) =>
                  setEdit((s) => ({ ...s, academicYear: e.target.value }))
                }
                placeholder="2024-2025"
                className="h-9 w-full rounded-xl border-2 border-[#7b2438]/20 bg-white px-3 text-xs text-[#2b1d16] outline-none transition focus:border-[#7b2438]"
              />
            </div>
          </div>

          {/* Mots-clés détectés */}
          {meta?.topKeywords && meta.topKeywords.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">
                Mots-clés NLP
              </p>
              <div className="flex flex-wrap gap-1">
                {meta.topKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full border border-[#7b2438]/15 bg-[#faf7f4] px-2 py-0.5 text-[10px] text-[#6c5448]"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving || rejecting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#7b2438] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#5f1b2a] disabled:opacity-50"
            >
              {approving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Approuver et indexer
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={approving || rejecting}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#7b2438]/20 px-4 py-2.5 text-sm font-bold text-[#7b2438] transition hover:bg-[#f2d9e0] disabled:opacity-50"
            >
              {rejecting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#7b2438]/30 border-t-[#7b2438]" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Rejeter
            </button>
          </div>
        </div>

        {/* Aperçu page de garde */}
        <div className="border-l border-[#7b2438]/10 bg-[#faf7f4] p-4 flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">
            Aperçu
          </p>
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
            <span className="text-[10px] font-semibold text-[#7b2438]">
              Ouvrir le PDF
            </span>
          </a>
          <div className="space-y-1 text-[10px] text-[#6c5448]">
            <p>
              <span className="font-semibold">Taille :</span> {fileSizeKb} Ko
            </p>
            <p>
              <span className="font-semibold">Uploadé :</span>{" "}
              {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
            </p>
            {meta?.excludedRatio !== undefined && meta.excludedRatio > 0 && (
              <p>
                <span className="font-semibold">Contenu institutionnel :</span>{" "}
                {meta.excludedRatio}% exclu
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminStagingPanel() {
  const [docs, setDocs] = useState<StagingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ msg: string; ok: boolean } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{
        ok: boolean;
        documents: StagingDocument[];
      }>("/api/admin/reference-docs/staging");
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

  async function handleApprove(id: string, edit: EditState) {
    await apiFetch(`/api/admin/reference-docs/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({
        subjectLabel: edit.subjectLabel,
        techStack: edit.techStack
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        authorName: edit.authorName || null,
        department: edit.department || null,
        academicYear: edit.academicYear || null,
      }),
    });
    setNotice({
      msg: "Document approuvé et indexé comme référence.",
      ok: true,
    });
    setDocs((prev) => prev.filter((d) => d.id !== id));
    setTimeout(() => setNotice(null), 4000);
  }

  async function handleReject(id: string) {
    await apiFetch(`/api/admin/reference-docs/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ subjectLabel: "_rejected_", techStack: [] }),
    }).catch(() => {});
    // Supprimer localement (le document reste en DB mais ne sera pas indexé)
    setDocs((prev) => prev.filter((d) => d.id !== id));
    setNotice({ msg: "Document rejeté.", ok: false });
    setTimeout(() => setNotice(null), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-normal tracking-tight text-[#2b1d16]">
            Staging Area
          </h2>
          <p className="text-sm font-medium text-[#6c5448]">
            Vérifiez et corrigez les métadonnées avant indexation définitive
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="btn-secondary inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold text-[#7b2438] transition disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Actualiser
        </button>
      </div>

      {notice && (
        <div
          className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold ${
            notice.ok
              ? "border-green-400/50 bg-green-50 text-green-800"
              : "border-[#c98a2f]/40 bg-[#fff6e6] text-[#755028]"
          }`}
        >
          {notice.msg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#7b2438]/20 border-t-[#7b2438]" />
        </div>
      ) : docs.length === 0 ? (
        <div className="section-frame flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[#7b2438]/15 py-16 text-center">
          <CheckCircle className="h-10 w-10 text-green-500/60" />
          <div>
            <p className="text-sm font-bold text-[#2b1d16]">
              Aucun document en attente
            </p>
            <p className="mt-1 text-xs text-[#6c5448]">
              Tous les documents uploadés ont été traités.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map((doc) => (
            <StagingCard
              key={doc.id}
              doc={doc}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
