"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  ShieldCheck,
  FileSearch,
  Archive,
  LayoutDashboard,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  FileText,
  Eye,
} from "lucide-react";
import type { CdView } from "./CDLayout";
import { apiFetch } from "@/lib/frontend-api";

type ThemeSummary = {
  id: string;
  theme_id: string;
  theme_title: string;
  student_name: string;
  student_firstname: string;
  student_department: string | null;
  similarity_score: string;
  submitted_at: string;
  status: string;
  description: string;
};

type ReportSummary = {
  id: string;
  documentId: string;
  globalSimilarity: string;
  riskLevel: string;
  analyzedAt: string;
  uploadAttempts?: number;
  document: {
    id: string;
    title: string;
    originalName: string;
    storagePath: string;
    mimeType: string;
  };
};

// ── Atoms ──────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div
      className="flex items-center gap-3 border-b pb-5"
      style={{ borderColor: "var(--line)" }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: "rgba(123,36,56,0.08)" }}
      >
        <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
      </div>
      <div>
        <h2
          className="text-xl font-extrabold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-xs font-medium"
            style={{ color: "var(--text-soft)" }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toUpperCase();

  if (normalized === "PENDING_VALIDATION") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
        style={{
          borderColor: "rgba(201,138,47,0.45)",
          background: "#fff6e6",
          color: "#9a6a28",
        }}
      >
        <CheckCircle className="h-3 w-3" /> Validé par l&apos;algo
      </span>
    );
  }

  if (normalized.includes("REJECTED"))
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
        <XCircle className="h-3 w-3" /> Rejeté
      </span>
    );

  if (normalized.includes("VALIDATED") || normalized.includes("APPROVED"))
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-700">
        <CheckCircle className="h-3 w-3" /> Validé
      </span>
    );

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
      style={{
        borderColor: "rgba(123,36,56,0.25)",
        background: "rgba(123,36,56,0.07)",
        color: "var(--primary)",
      }}
    >
      <Clock className="h-3 w-3" /> En attente
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const l = level.toLowerCase();
  if (l === "high" || l === "élevé")
    return (
      <span className="rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
        Risque élevé
      </span>
    );
  if (l === "medium" || l === "moyen")
    return (
      <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-700">
        Risque moyen
      </span>
    );
  return (
    <span className="rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-700">
      Risque faible
    </span>
  );
}

function Banner({
  children,
  ok = true,
}: {
  children: React.ReactNode;
  ok?: boolean;
}) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium"
      style={
        ok
          ? {
              borderColor: "rgba(201,138,47,0.40)",
              background: "#fff6e6",
              color: "#755028",
            }
          : {
              borderColor: "rgba(220,38,38,0.30)",
              background: "#fef2f2",
              color: "#b91c1c",
            }
      }
    >
      {ok ? (
        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c98a2f]" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      )}
      <span>{children}</span>
    </div>
  );
}

// ── ThemeCard ──────────────────────────────────────────────────
function ThemeCard({
  theme,
  selected,
  onClick,
}: {
  theme: ThemeSummary;
  selected: boolean;
  onClick: () => void;
}) {
  const simScore = parseFloat(theme.similarity_score) || 0;
  const highSim = simScore >= 70;
  const isAlgoValidated =
    theme.status.trim().toUpperCase() === "PENDING_VALIDATION";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border-2 bg-white p-5 text-left transition-all hover:shadow-md"
      style={{
        borderColor: selected ? "var(--primary)" : "rgba(123,36,56,0.12)",
        boxShadow: selected ? "0 0 0 3px rgba(123,36,56,0.12)" : undefined,
      }}
    >
      {/* Ligne 1 : Étudiant + filière + statut */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span
          className="text-sm font-extrabold"
          style={{ color: "var(--foreground)" }}
        >
          {theme.student_firstname} {theme.student_name}
        </span>
        {theme.student_department && (
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{
              borderColor: "rgba(123,36,56,0.22)",
              background: "rgba(123,36,56,0.07)",
              color: "var(--primary)",
            }}
          >
            {theme.student_department}
          </span>
        )}
        <StatusBadge status={theme.status} />
      </div>

      {/* Ligne 2 : Titre du thème */}
      <p
        className="text-sm font-semibold leading-snug mb-2"
        style={{ color: "var(--text-soft)" }}
      >
        {theme.theme_title}
      </p>

      {isAlgoValidated && (
        <p
          className="mb-2 text-[11px] font-semibold"
          style={{ color: "#9a6a28" }}
        >
          Validé par l&apos;algo • en attente de validation chef de département
        </p>
      )}

      {/* Ligne 3 : Score similarité + date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp
            className="h-3.5 w-3.5"
            style={{ color: highSim ? "#b91c1c" : "var(--text-soft)" }}
          />
          <span
            className="text-xs font-bold"
            style={{ color: highSim ? "#b91c1c" : "var(--text-soft)" }}
          >
            Similarité : {theme.similarity_score}
          </span>
          {highSim && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
        </div>
        <span className="text-xs" style={{ color: "rgba(108,84,72,0.55)" }}>
          {theme.submitted_at}
        </span>
      </div>

      <ChevronRight
        className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-30"
        style={{ color: "var(--primary)" }}
      />
    </button>
  );
}

// ── ReportCard ─────────────────────────────────────────────────
function ReportCard({
  report,
  onOpen,
  isOpening,
}: {
  report: ReportSummary;
  onOpen: (report: ReportSummary) => void;
  isOpening: boolean;
}) {
  const sim = parseFloat(report.globalSimilarity) || 0;
  return (
    <div
      className="group rounded-2xl border-2 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ borderColor: "rgba(123,36,56,0.12)" }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="min-w-0 truncate text-sm font-extrabold"
              style={{ color: "var(--foreground)" }}
              title={report.document.title}
            >
              {report.document.title}
            </p>
            <RiskBadge level={report.riskLevel} />
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--text-soft)" }}>
            {report.document.originalName} · Rapport #{report.id}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpen(report)}
          disabled={isOpening}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            borderColor: "rgba(99,25,38,0.25)",
            color: "#631926",
            background: "rgba(99,25,38,0.05)",
          }}
        >
          {isOpening ? (
            <>
              <Image
                src="/brand/handal-lamp.png"
                alt="Handal"
                width={14}
                height={14}
                className="h-3.5 w-3.5 animate-spin object-contain"
                style={{ height: "auto" }}
              />
              Ouverture...
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              Ouvrir le document
            </>
          )}
        </button>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" style={{ color: "var(--text-soft)" }} />
          <span className="text-xs" style={{ color: "var(--text-soft)" }}>
            Analysé le {new Date(report.analyzedAt).toLocaleDateString("fr-FR")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(report.uploadAttempts ?? 1) > 1 && (
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${(report.uploadAttempts ?? 1) > 5 ? "border-red-300 bg-red-50 text-red-700" : "border-[#7b2438]/25 bg-[#f2d9e0] text-[#7b2438]"}`}
            >
              {report.uploadAttempts} tentatives
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-2 flex-1 w-32 rounded-full overflow-hidden"
            style={{ background: "rgba(123,36,56,0.10)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(sim, 100)}%`,
                background:
                  sim >= 70 ? "#b91c1c" : sim >= 40 ? "#c98a2f" : "#16a34a",
              }}
            />
          </div>
          <span
            className="text-xs font-bold"
            style={{ color: "var(--foreground)" }}
          >
            {report.globalSimilarity}%
          </span>
        </div>
        <span className="text-xs" style={{ color: "rgba(108,84,72,0.55)" }}>
          {new Date(report.analyzedAt).toLocaleDateString("fr-FR")}
        </span>
      </div>
    </div>
  );
}

// ── Main CDTracker ─────────────────────────────────────────────
export function CDTracker({
  view,
  themes,
  reports,
  onThemesRefresh,
  onReportsRefresh,
  onNotify,
}: {
  view: CdView;
  themes: ThemeSummary[];
  reports: ReportSummary[];
  onThemesRefresh: (t: ThemeSummary[]) => void;
  onReportsRefresh: (r: ReportSummary[]) => void;
  onNotify: (msg: string, ok?: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<ThemeSummary | null>(null);
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(
    null,
  );

  // Validation
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [avis, setAvis] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Analyse
  const [analysisDocId, setAnalysisDocId] = useState("");
  const [analysisMsg, setAnalysisMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return themes;
    return themes.filter(
      (t) =>
        t.student_firstname.toLowerCase().includes(q) ||
        t.student_name.toLowerCase().includes(q) ||
        (t.student_department ?? "").toLowerCase().includes(q) ||
        t.theme_title.toLowerCase().includes(q),
    );
  }, [themes, search]);

  function selectTheme(t: ThemeSummary) {
    setSelectedTheme(t);
    setDecision("approved");
    setAvis("");
  }

  async function moderateTheme(
    e: React.FormEvent,
    forcedDecision?: "approved" | "rejected",
  ) {
    e.preventDefault();
    if (!selectedTheme) return;
    const finalDecision = forcedDecision ?? decision;
    setSubmitting(true);
    try {
      const result = await apiFetch<{ theme: { id: string; status: string } }>(
        `/api/themes/${selectedTheme.theme_id}/validate-cd`,
        {
          method: "PATCH",
          body: JSON.stringify({ decision: finalDecision, comment: avis }),
        },
      );
      onNotify(`Thème ${result.theme.id} → ${result.theme.status}`);
      setSelectedTheme(null);
      setAvis("");
      const refreshed = await apiFetch<{ themes: ThemeSummary[] }>(
        "/api/themes/pending",
      );
      onThemesRefresh(refreshed.themes);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Erreur modération", false);
    } finally {
      setSubmitting(false);
    }
  }

  async function analyzeDocument(e: React.FormEvent) {
    e.preventDefault();
    setAnalysisMsg(null);
    try {
      await apiFetch(`/api/documents/${analysisDocId}/analyze`, {
        method: "POST",
      });
      setAnalysisMsg("Analyse lancée avec succès.");
      setAnalysisDocId("");
      const refreshed = await apiFetch<{ reports: ReportSummary[] }>(
        "/api/reports",
      );
      onReportsRefresh(refreshed.reports);
    } catch (err) {
      setAnalysisMsg(err instanceof Error ? err.message : "Erreur analyse");
    }
  }

  async function openDocument(report: ReportSummary) {
    if (loadingDocumentId) return;

    const previewWindow = window.open("about:blank", "_blank");
    if (!previewWindow) {
      onNotify(
        "Impossible d'ouvrir le document. Autorisez les fenêtres pop-up.",
        false,
      );
      return;
    }

    setLoadingDocumentId(report.id);
    try {
      const response = await fetch(`/api/documents/${report.documentId}/view`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("HANDAL_DOCUMENT_VIEW_FAILED");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      previewWindow.location.href = objectUrl;
      previewWindow.focus();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      previewWindow.close();
      onNotify("Erreur : Le fichier source est corrompu ou déplacé.", false);
    } finally {
      setLoadingDocumentId(null);
    }
  }

  const showSearch = view === "themes" || view === "dashboard";

  return (
    <div className="flex flex-col h-full">
      {/* ── Topbar ── */}
      <div
        className="sticky top-0 z-10 flex items-center gap-4 border-b px-8 py-4"
        style={{
          borderColor: "var(--line)",
          background: "rgba(247,241,232,0.94)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex-1">
          <h1
            className="text-lg font-extrabold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {view === "dashboard" && "Tableau de Bord"}
            {view === "themes" && "Thèmes à Valider"}
            {view === "reports" && "Rapports d'Analyse"}
            {view === "archives" && "Archives"}
          </h1>
        </div>
        {showSearch && (
          <div className="relative w-72">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-soft)" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, prénom ou filière..."
              className="h-10 w-full rounded-xl border-2 bg-white pl-9 pr-4 text-sm outline-none transition"
              style={{
                borderColor: "rgba(123,36,56,0.18)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(123,36,56,0.18)";
              }}
            />
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* ── Dashboard ── */}
          {view === "dashboard" && (
            <div className="space-y-6">
              <SectionHeader icon={LayoutDashboard} title="Vue d'ensemble" />

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    label: "Thèmes en attente",
                    value: themes.length,
                    urgent: themes.length > 0,
                  },
                  {
                    label: "Rapports disponibles",
                    value: reports.length,
                    urgent: false,
                  },
                  { label: "Session", value: "Active", urgent: false },
                ].map(({ label, value, urgent }) => (
                  <div
                    key={label}
                    className="rounded-2xl border-2 bg-white p-5"
                    style={{ borderColor: "rgba(123,36,56,0.12)" }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-widest mb-2"
                      style={{ color: "var(--text-soft)" }}
                    >
                      {label}
                    </p>
                    <p
                      className="text-3xl font-extrabold"
                      style={{
                        color: urgent ? "var(--primary)" : "var(--foreground)",
                      }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Thèmes récents */}
              {filtered.length > 0 && (
                <div className="space-y-3">
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "var(--text-soft)" }}
                  >
                    Thèmes récents
                  </p>
                  <div className="relative grid gap-3">
                    {filtered.slice(0, 3).map((t) => (
                      <ThemeCard
                        key={t.theme_id}
                        theme={t}
                        selected={selectedTheme?.theme_id === t.theme_id}
                        onClick={() => selectTheme(t)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Rapports récents */}
              {reports.length > 0 && (
                <div className="space-y-3">
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "var(--text-soft)" }}
                  >
                    Derniers rapports
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {reports.slice(0, 2).map((r) => (
                      <ReportCard
                        key={r.id}
                        report={r}
                        onOpen={openDocument}
                        isOpening={loadingDocumentId === r.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Thèmes ── */}
          {view === "themes" && (
            <div className="space-y-5">
              <SectionHeader
                icon={ShieldCheck}
                title="Thèmes à Valider"
                subtitle={`${filtered.length} thème${filtered.length > 1 ? "s" : ""} en attente`}
              />

              {/* Liste */}
              {!selectedTheme && (
                <>
                  {filtered.length === 0 && (
                    <div
                      className="rounded-2xl border-2 bg-white p-10 text-center text-sm"
                      style={{
                        borderColor: "rgba(123,36,56,0.10)",
                        color: "var(--text-soft)",
                      }}
                    >
                      {search
                        ? `Aucun résultat pour « ${search} »`
                        : "Aucun thème en attente de validation."}
                    </div>
                  )}
                  <div className="relative grid gap-3 lg:grid-cols-2">
                    {filtered.map((t) => (
                      <ThemeCard
                        key={t.theme_id}
                        theme={t}
                        selected={false}
                        onClick={() => selectTheme(t)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Formulaire de validation */}
              {selectedTheme && (
                <div
                  className="rounded-2xl border-2 bg-white p-6"
                  style={{ borderColor: "rgba(123,36,56,0.15)" }}
                >
                  {/* En-tête thème */}
                  <div
                    className="mb-5 flex items-start justify-between gap-4 border-b pb-5"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <div className="space-y-1">
                      <p
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: "var(--text-soft)" }}
                      >
                        Thème sélectionné
                      </p>
                      {/* Étudiant : Nom & Prénom */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="text-base font-extrabold"
                          style={{ color: "var(--foreground)" }}
                        >
                          {selectedTheme.student_firstname}{" "}
                          {selectedTheme.student_name}
                        </span>
                        {/* Filière */}
                        {selectedTheme.student_department && (
                          <span
                            className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                            style={{
                              borderColor: "rgba(123,36,56,0.22)",
                              background: "rgba(123,36,56,0.07)",
                              color: "var(--primary)",
                            }}
                          >
                            {selectedTheme.student_department}
                          </span>
                        )}
                      </div>
                      {/* Titre */}
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-soft)" }}
                      >
                        {selectedTheme.theme_title}
                      </p>
                      {/* Score similarité algo */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <TrendingUp
                          className="h-3.5 w-3.5"
                          style={{ color: "var(--primary)" }}
                        />
                        <span
                          className="text-xs font-bold"
                          style={{ color: "var(--primary)" }}
                        >
                          Score algo : {selectedTheme.similarity_score}
                        </span>
                      </div>
                      {selectedTheme.status.trim().toUpperCase() ===
                        "PENDING_VALIDATION" && (
                        <div className="pt-2">
                          <Banner>
                            Ce thème est validé par l&apos;algorithme et attend
                            la validation du chef de département.
                          </Banner>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTheme(null)}
                      className="shrink-0 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition hover:opacity-75"
                      style={{
                        borderColor: "rgba(123,36,56,0.22)",
                        color: "var(--primary)",
                      }}
                    >
                      ← Retour
                    </button>
                  </div>

                  {/* Description */}
                  {selectedTheme.description && (
                    <div
                      className="mb-5 rounded-xl border-2 p-4 text-sm leading-relaxed"
                      style={{
                        borderColor: "rgba(123,36,56,0.08)",
                        background: "var(--surface-2)",
                        color: "var(--text-soft)",
                      }}
                    >
                      <p
                        className="mb-1 text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: "var(--primary)" }}
                      >
                        Description du thème
                      </p>
                      <p className="line-clamp-5">
                        {selectedTheme.description}
                      </p>
                    </div>
                  )}

                  {/* Formulaire */}
                  <form
                    onSubmit={(e) => moderateTheme(e)}
                    className="space-y-5"
                  >
                    {/* Avis pédagogique */}
                    <div>
                      <label
                        className="mb-1.5 block text-xs font-bold uppercase tracking-wider"
                        style={{ color: "var(--foreground)" }}
                      >
                        Avis Pédagogique
                      </label>
                      <textarea
                        value={avis}
                        onChange={(e) => setAvis(e.target.value)}
                        rows={4}
                        placeholder="Rédigez votre avis pédagogique sur ce thème : pertinence, originalité, faisabilité..."
                        className="w-full resize-none rounded-xl border-2 bg-white px-4 py-3 text-sm outline-none transition"
                        style={{
                          borderColor: "rgba(123,36,56,0.18)",
                          color: "var(--foreground)",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "var(--primary)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(123,36,56,0.18)";
                        }}
                      />
                    </div>

                    {/* Boutons Approuver / Rejeter */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={(e) =>
                          moderateTheme(
                            e as unknown as React.FormEvent,
                            "approved",
                          )
                        }
                        className="flex h-12 items-center justify-center gap-2 rounded-xl font-bold text-white transition disabled:opacity-50"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--primary), var(--primary-strong))",
                          boxShadow: "0 4px 14px rgba(123,36,56,0.25)",
                        }}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approuver
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={(e) =>
                          moderateTheme(
                            e as unknown as React.FormEvent,
                            "rejected",
                          )
                        }
                        className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 font-bold transition disabled:opacity-50 hover:opacity-80"
                        style={{
                          borderColor: "rgba(123,36,56,0.30)",
                          color: "var(--primary)",
                          background: "rgba(123,36,56,0.05)",
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                        Rejeter
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ── Rapports ── */}
          {view === "reports" && (
            <div className="space-y-5">
              <SectionHeader
                icon={FileSearch}
                title="Rapports d'Analyse"
                subtitle={`${reports.length} rapport${reports.length > 1 ? "s" : ""} disponible${reports.length > 1 ? "s" : ""}`}
              />

              {/* Lancer une analyse */}
              <div
                className="rounded-2xl border-2 bg-white p-5"
                style={{ borderColor: "rgba(123,36,56,0.12)" }}
              >
                <p
                  className="mb-3 text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-soft)" }}
                >
                  Lancer une analyse
                </p>
                <form onSubmit={analyzeDocument} className="flex gap-3">
                  <input
                    type="text"
                    value={analysisDocId}
                    onChange={(e) => setAnalysisDocId(e.target.value)}
                    placeholder="ID du document..."
                    className="h-10 flex-1 rounded-xl border-2 bg-white px-4 text-sm outline-none transition"
                    style={{
                      borderColor: "rgba(123,36,56,0.18)",
                      color: "var(--foreground)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(123,36,56,0.18)";
                    }}
                  />
                  <button
                    type="submit"
                    className="h-10 rounded-xl px-5 text-sm font-bold text-white transition"
                    style={{ background: "var(--primary)" }}
                  >
                    Analyser
                  </button>
                </form>
                {analysisMsg && (
                  <div className="mt-3">
                    <Banner ok={!analysisMsg.toLowerCase().includes("erreur")}>
                      {analysisMsg}
                    </Banner>
                  </div>
                )}
              </div>

              {/* Liste des rapports */}
              {reports.length === 0 ? (
                <div
                  className="rounded-2xl border-2 bg-white p-10 text-center text-sm"
                  style={{
                    borderColor: "rgba(123,36,56,0.10)",
                    color: "var(--text-soft)",
                  }}
                >
                  Aucun rapport disponible.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {reports.map((r) => (
                    <ReportCard
                      key={r.id}
                      report={r}
                      onOpen={openDocument}
                      isOpening={loadingDocumentId === r.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Archives ── */}
          {view === "archives" && (
            <div className="space-y-5">
              <SectionHeader
                icon={Archive}
                title="Archives"
                subtitle="Anciens mémoires de la filière"
              />
              <div
                className="rounded-2xl border-2 bg-white p-10 text-center text-sm"
                style={{
                  borderColor: "rgba(123,36,56,0.10)",
                  color: "var(--text-soft)",
                }}
              >
                Les archives seront disponibles prochainement.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
