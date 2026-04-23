"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { apiFetch } from "@/lib/frontend-api";

interface ReferenceDocument {
  id: string;
  documentId: string;
  title: string;
  size: string;
  type: string;
  preview: string;
  uploadedAt: string;
  status: string;
  similarity: number | null;
  riskLevel: string | null;
  matchedSources: any[];
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

  const getRiskColor = (riskLevel: string | null) => {
    if (!riskLevel) return "bg-[#f8f2e8] text-[#6c5448]";
    if (riskLevel === "HIGH") return "bg-red-100 text-red-700";
    if (riskLevel === "MEDIUM") return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

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
    <div className="app-shell min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header with Logo */}
        <div className="section-frame mb-8 flex items-center gap-4 rounded-2xl p-6">
          <Image
            src="/brand/handal-lamp.png"
            alt="Handal"
            width={56}
            height={56}
            className="h-14 w-auto object-contain"
            style={{ height: "auto" }}
          />
          <div>
            <h1 className="font-serif text-4xl font-normal tracking-tight text-[#7b2438]">
              Bibliothèque de Référence
            </h1>
            <p className="text-sm text-[#5f483e]">
              Consultation des mémoires archivés pour vérification et
              comparaison
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="section-frame mb-6 space-y-4 rounded-2xl p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#4f3a30]">
                Rechercher par titre
              </label>
              <input
                type="text"
                placeholder="Titre du document..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#7b2438]/20 bg-white/90 px-4 py-2 text-[#2b1d16] outline-none focus:border-[#7b2438] focus:ring-1 focus:ring-[#7b2438]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#4f3a30]">
                Filtrer par sujet/filière
              </label>
              <input
                type="text"
                placeholder="Informatique, Sciences..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-[#7b2438]/20 bg-white/90 px-4 py-2 text-[#2b1d16] outline-none focus:border-[#7b2438] focus:ring-1 focus:ring-[#7b2438]"
              />
            </div>
          </div>
          {(search || subject) && (
            <button
              onClick={() => {
                setSearch("");
                setSubject("");
              }}
              className="text-sm font-semibold text-[#7b2438] hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-2xl border-l-4 border-red-500 bg-red-50 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7b2438]/20 border-t-[#7b2438]" />
          </div>
        )}

        {/* Documents Table */}
        {!loading && documents.length > 0 && (
          <>
            <div className="mb-6 overflow-hidden rounded-2xl border border-[#7b2438]/12 bg-white/95 shadow-[0_10px_28px_rgba(81,50,28,0.08)]">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[720px] w-full text-sm">
                  <thead className="border-b border-[#7b2438]/12 bg-[#f8f2e8]">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-[#5f483e]">
                        Titre
                      </th>
                      <th className="hidden px-6 py-3 text-left font-bold text-[#5f483e] md:table-cell">
                        Taille
                      </th>
                      <th className="hidden px-6 py-3 text-left font-bold text-[#5f483e] md:table-cell">
                        Date
                      </th>
                      <th className="hidden px-6 py-3 text-left font-bold text-[#5f483e] lg:table-cell">
                        Similarité
                      </th>
                      <th className="hidden px-6 py-3 text-left font-bold text-[#5f483e] lg:table-cell">
                        Risque
                      </th>
                      <th className="px-6 py-3 text-left font-bold text-[#5f483e]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr
                        key={doc.id}
                        className="border-b border-[#7b2438]/10 transition-colors hover:bg-[#faf5ee]"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-[#2b1d16]">
                              {doc.title}
                            </p>
                            {doc.preview && (
                              <p className="text-xs text-[#6c5448] line-clamp-1">
                                {doc.preview}...
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="hidden px-6 py-4 text-[#6c5448] md:table-cell">
                          {formatFileSize(doc.size)}
                        </td>
                        <td className="hidden px-6 py-4 text-[#6c5448] md:table-cell">
                          {formatDate(doc.uploadedAt)}
                        </td>
                        <td className="hidden px-6 py-4 lg:table-cell">
                          {(() => {
                            const similarityValue = toSimilarity(
                              (doc as { similarity?: unknown }).similarity,
                            );

                            if (similarityValue === null) {
                              return <span className="text-[#6c5448]">-</span>;
                            }

                            return (
                              <span className="font-semibold text-[#2b1d16]">
                                {similarityValue.toFixed(1)}%
                              </span>
                            );
                          })()}
                        </td>
                        <td className="hidden px-6 py-4 lg:table-cell">
                          {doc.riskLevel && (
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getRiskColor(
                                doc.riskLevel,
                              )}`}
                            >
                              {doc.riskLevel === "HIGH"
                                ? "Élevé"
                                : doc.riskLevel === "MEDIUM"
                                  ? "Moyen"
                                  : "Faible"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`/api/documents/${doc.documentId}/view`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-[#7b2438] transition-colors hover:text-[#5f1b2a] hover:underline"
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
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-[#7b2438]/20 bg-white px-4 py-2 font-semibold text-[#7b2438] transition-all disabled:opacity-50 hover:bg-[#f8f2e8]"
                >
                  Précédent
                </button>
                <div className="text-sm font-semibold text-[#5f483e]">
                  Page {page} / {pagination.pages}
                </div>
                <button
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                  className="rounded-lg border border-[#7b2438]/20 bg-white px-4 py-2 font-semibold text-[#7b2438] transition-all disabled:opacity-50 hover:bg-[#f8f2e8]"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && documents.length === 0 && (
          <div className="section-frame rounded-2xl p-12 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-[#c7b6a3]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-[#6c5448]">
              {search || subject
                ? "Aucun document ne correspond à vos critères"
                : "Aucun document de référence disponible"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
