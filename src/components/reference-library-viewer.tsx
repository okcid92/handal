"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/frontend-api";

interface ReferenceDocument {
  id: string;
  documentId: string;
  title: string;
  originalName: string;
  size: string;
  type: string;
  preview: string;
  uploadedAt: string;
  status: string;
  source: "admin" | "student";
  authorName: string | null;
  department: string | null;
  academicYear: string | null;
  techStack: string[];
  similarity: number | null;
  riskLevel: string | null;
  matchedSources: unknown[];
  analyzedAt: string | null;
}

function toSimilarity(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === "object" && value !== null && "toString" in value) {
    const parsed = Number.parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function ReferenceLibraryViewer() {
  const [documents, setDocuments] = useState<ReferenceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (subject) params.append("subject", subject);
      params.append("page", page.toString());
      params.append("limit", "10");

      const data = (await apiFetch(`/api/reference-library?${params}`)) as any;
      if (!data.ok) {
        setError(data.error?.message || "Failed to load documents");
        return;
      }

      const normalizedDocuments: ReferenceDocument[] = (
        data.documents || []
      ).map((doc: ReferenceDocument & { similarity?: unknown }) => ({
        ...doc,
        similarity: toSimilarity(doc.similarity),
      }));

      setDocuments(normalizedDocuments);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      console.error("Error loading reference documents:", err);
      setError("Erreur lors du chargement des documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, subject]);

  useEffect(() => {
    loadDocuments();
  }, [search, subject, page]);

const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size > 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + " MB";
    if (size > 1024) return (size / 1024).toFixed(1) + " KB";
    return size + " B";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div
        className="rounded-2xl border bg-white p-4"
        style={{ borderColor: "rgba(123,36,56,0.12)" }}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Rechercher par titre ou nom de fichier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border-2 bg-white px-4 text-sm outline-none transition"
            style={{ borderColor: "rgba(123,36,56,0.18)", color: "var(--foreground)" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(123,36,56,0.18)"; }}
          />
          <input
            type="text"
            placeholder="Filtrer par filière ou sujet..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-10 w-full rounded-xl border-2 bg-white px-4 text-sm outline-none transition"
            style={{ borderColor: "rgba(123,36,56,0.18)", color: "var(--foreground)" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(123,36,56,0.18)"; }}
          />
        </div>
        {(search || subject) && (
          <button
            type="button"
            onClick={() => { setSearch(""); setSubject(""); }}
            className="mt-2 text-xs font-semibold"
            style={{ color: "var(--primary)" }}
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7b2438]/20 border-t-[#7b2438]" />
        </div>
      )}

      {/* Table */}
      {!loading && documents.length > 0 && (
        <>
          <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "rgba(123,36,56,0.12)" }}>
            <div className="w-full overflow-x-auto">
              <table className="min-w-[640px] w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(123,36,56,0.04)", borderBottom: "1px solid rgba(123,36,56,0.10)" }}>
                    {["Titre / Fichier", "Source", "Auteur", "Filière", "Taille", "Date", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, i) => (
                    <tr
                      key={doc.id}
                      style={{ borderBottom: i < documents.length - 1 ? "1px solid rgba(123,36,56,0.07)" : "none" }}
                      className="transition hover:bg-[rgba(123,36,56,0.02)]"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                          {doc.title}
                        </p>
                        {doc.title !== doc.originalName && (
                          <p className="text-[11px]" style={{ color: "var(--text-soft)" }}>
                            {doc.originalName}
                          </p>
                        )}
                        {doc.techStack.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {doc.techStack.slice(0, 3).map((t) => (
                              <span key={t} className="rounded-full border px-1.5 py-0.5 text-[10px] font-medium" style={{ borderColor: "rgba(123,36,56,0.15)", color: "var(--text-soft)" }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {doc.source === "admin" ? (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold" style={{ borderColor: "rgba(123,36,56,0.22)", background: "rgba(123,36,56,0.07)", color: "var(--primary)" }}>
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                            Étudiant
                          </span>
                        )}
                        {doc.academicYear && (
                          <p className="mt-1 text-[10px]" style={{ color: "var(--text-soft)" }}>{doc.academicYear}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-soft)" }}>
                        {doc.authorName || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {doc.department ? (
                          <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ borderColor: "rgba(123,36,56,0.22)", background: "rgba(123,36,56,0.07)", color: "var(--primary)" }}>
                            {doc.department}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--text-soft)" }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-soft)" }}>
                        {formatFileSize(doc.size)}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-soft)" }}>
                        {formatDate(doc.uploadedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/api/documents/${doc.documentId}/view`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold transition hover:underline"
                          style={{ color: "var(--primary)" }}
                        >
                          Consulter
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-40 hover:opacity-75"
                style={{ borderColor: "rgba(123,36,56,0.22)", color: "var(--primary)" }}
              >
                Précédent
              </button>
              <span className="text-sm font-semibold" style={{ color: "var(--text-soft)" }}>
                Page {page} / {pagination.pages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                disabled={page === pagination.pages}
                className="rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-40 hover:opacity-75"
                style={{ borderColor: "rgba(123,36,56,0.22)", color: "var(--primary)" }}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty */}
      {!loading && documents.length === 0 && (
        <div
          className="rounded-2xl border-2 bg-white p-12 text-center text-sm"
          style={{ borderColor: "rgba(123,36,56,0.10)", color: "var(--text-soft)" }}
        >
          {search || subject
            ? `Aucun document ne correspond à vos critères`
            : "Aucun document de référence disponible"}
        </div>
      )}
    </div>
  );
}
