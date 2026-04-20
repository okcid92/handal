"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Filter, BookOpen, Tag, User, Calendar, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/frontend-api";

type CatalogueEntry = {
  id: string;
  originalName: string;
  subjectLabel: string | null;
  techStack: string[];
  authorName: string | null;
  department: string | null;
  academicYear: string | null;
  topKeywords: string[];
  indexedAt: string;
};

type CatalogueResponse = {
  ok: boolean;
  entries: CatalogueEntry[];
  years: string[];
  total: number;
};

export function ThemeCatalogue() {
  const [entries, setEntries] = useState<CatalogueEntry[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  // Debounce keyword
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.set("year", selectedYear);
      if (debouncedKeyword) params.set("keyword", debouncedKeyword);
      const data = await apiFetch<CatalogueResponse>(
        `/api/themes/catalogue?${params.toString()}`,
      );
      setEntries(data.entries);
      setYears(data.years);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, debouncedKeyword]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: "var(--foreground)" }}>
            Catalogue des Thèmes
          </h2>
          <p className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>
            {entries.length} mémoire{entries.length !== 1 ? "s" : ""} de référence indexé{entries.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-[#7b2438]/20 px-3 py-2 text-xs font-bold text-[#7b2438] transition hover:bg-[#f2d9e0] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        {/* Recherche par mot-clé */}
        <div className="relative flex-1 min-w-48">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-soft)" }}
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Rechercher un thème, technologie, auteur..."
            className="h-10 w-full rounded-xl border-2 bg-white pl-9 pr-4 text-sm outline-none transition"
            style={{ borderColor: "rgba(123,36,56,0.18)", color: "var(--foreground)" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(123,36,56,0.18)"; }}
          />
        </div>

        {/* Filtre année */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-soft)" }} />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-10 rounded-xl border-2 bg-white pl-8 pr-4 text-sm outline-none transition appearance-none"
            style={{ borderColor: "rgba(123,36,56,0.18)", color: "var(--foreground)" }}
          >
            <option value="">Toutes les années</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#7b2438]/20 border-t-[#7b2438]" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[#7b2438]/15 bg-white py-16 text-center">
          <BookOpen className="h-10 w-10 opacity-30" style={{ color: "var(--primary)" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              {keyword || selectedYear ? "Aucun résultat pour ces filtres" : "Aucun mémoire indexé"}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-soft)" }}>
              {keyword || selectedYear
                ? "Modifiez les filtres pour élargir la recherche."
                : "Uploadez des mémoires via l'interface Admin pour alimenter le catalogue."}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 bg-white overflow-hidden" style={{ borderColor: "rgba(123,36,56,0.12)" }}>
          {/* En-tête table */}
          <div
            className="grid grid-cols-[1fr_160px_100px_110px] gap-4 border-b px-5 py-3 text-[10px] font-bold uppercase tracking-widest"
            style={{ borderColor: "var(--line)", color: "var(--text-soft)", background: "var(--surface-2)" }}
          >
            <span>Sujet / Fichier</span>
            <span>Auteur · Filière</span>
            <span>Technologies</span>
            <span>Année</span>
          </div>

          {/* Lignes */}
          <div className="divide-y" style={{ borderColor: "var(--line)" }}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[1fr_160px_100px_110px] gap-4 px-5 py-4 transition hover:bg-[#faf7f4]"
              >
                {/* Sujet */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {entry.subjectLabel ?? entry.originalName}
                  </p>
                  {entry.subjectLabel && (
                    <p className="mt-0.5 truncate text-[10px]" style={{ color: "var(--text-soft)" }}>
                      {entry.originalName}
                    </p>
                  )}
                  {entry.topKeywords.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {entry.topKeywords.slice(0, 4).map((kw) => (
                        <span
                          key={kw}
                          className="rounded-full border px-1.5 py-0.5 text-[9px]"
                          style={{ borderColor: "rgba(123,36,56,0.15)", color: "var(--text-soft)" }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Auteur · Filière */}
                <div className="flex flex-col gap-1 justify-center">
                  {entry.authorName && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 shrink-0" style={{ color: "var(--text-soft)" }} />
                      <span className="truncate text-xs font-medium" style={{ color: "var(--foreground)" }}>
                        {entry.authorName}
                      </span>
                    </div>
                  )}
                  {entry.department && (
                    <span
                      className="inline-block w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{ borderColor: "rgba(123,36,56,0.22)", background: "rgba(123,36,56,0.07)", color: "var(--primary)" }}
                    >
                      {entry.department}
                    </span>
                  )}
                </div>

                {/* Technologies */}
                <div className="flex flex-col gap-1 justify-center">
                  {entry.techStack.slice(0, 3).map((t) => (
                    <div key={t} className="flex items-center gap-1">
                      <Tag className="h-3 w-3 shrink-0 text-[#7b2438]/40" />
                      <span className="truncate text-[11px]" style={{ color: "var(--text-soft)" }}>{t}</span>
                    </div>
                  ))}
                  {entry.techStack.length === 0 && (
                    <span className="text-[10px]" style={{ color: "var(--text-soft)" }}>—</span>
                  )}
                </div>

                {/* Année */}
                <div className="flex items-center gap-1.5 justify-center">
                  <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-soft)" }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                    {entry.academicYear ?? "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
