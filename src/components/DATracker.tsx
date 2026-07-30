"use client";

import { useState, useMemo } from "react";
import {
  Search,
  FileSearch,
  Scale,
  LayoutDashboard,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import type { DaView } from "./DALayout";
import { apiFetch } from "@/lib/frontend-api";
import { ReferenceLibraryViewer } from "./reference-library-viewer";
import { ScoreRing } from "./shared/ScoreRing";
import { RiskBadge as RiskBadgeComponent, getRiskLevel } from "./shared/RiskBadge";

type ReportRow = {
  id: string;
  documentId: string;
  globalSimilarity: string;
  riskLevel: string;
  analyzedAt: string;
  student?: {
    name: string;
    firstName: string;
    lastName: string;
    department: string | null;
  };
  document?: {
    originalName: string;
    title: string;
  };
  uploadAttempts?: number;
};

// ── Atoms ──────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block text-xs font-bold uppercase tracking-wider"
        style={{ color: "var(--foreground)" }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border-2 bg-white px-4 text-sm outline-none transition"
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
    </label>
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
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      )}
      <span>{children}</span>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const l = level.toLowerCase();
  if (l === "high")
    return (
      <span className="rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
        Élevé
      </span>
    );
  if (l === "medium")
    return (
      <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-700">
        Moyen
      </span>
    );
  return (
    <span className="rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-700">
      Faible
    </span>
  );
}

function ScoreBar({ value }: { value: number }) {
  const pct = Math.min(value, 100);
  const color = value >= 70 ? "#b91c1c" : value >= 40 ? "#c98a2f" : "#16a34a";
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full"
        style={{ background: "rgba(123,36,56,0.10)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold" style={{ color }}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

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

function KpiCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  const toneStyles = {
    neutral: {
      borderColor: "rgba(123,36,56,0.12)",
      background: "rgba(123,36,56,0.07)",
      color: "var(--foreground)",
    },
    ok: {
      borderColor: "rgba(22,163,74,0.24)",
      background: "rgba(22,163,74,0.08)",
      color: "#166534",
    },
    warn: {
      borderColor: "rgba(201,138,47,0.28)",
      background: "rgba(201,138,47,0.14)",
      color: "#9a6a28",
    },
    danger: {
      borderColor: "rgba(220,38,38,0.22)",
      background: "rgba(220,38,38,0.10)",
      color: "#b91c1c",
    },
  }[tone];

  return (
    <div
      className="rounded-2xl border-2 px-4 py-3"
      style={{
        borderColor: toneStyles.borderColor,
        background: toneStyles.background,
      }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: "var(--text-soft)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-extrabold"
        style={{ color: toneStyles.color }}
      >
        {value}
      </p>
    </div>
  );
}

// ── Main DATracker ─────────────────────────────────────────────

function reportLabel(r: ReportRow): string {
  if (r.student) return `${r.student.firstName} ${r.student.lastName}`;
  if (r.document?.title && r.document.title.length > 3) return r.document.title;
  if (r.document?.originalName) return r.document.originalName.replace(/\.[^.]+$/, "");
  return `Rapport #${r.id}`;
}

function reportSubLabel(r: ReportRow): string {
  if (r.document?.title && r.document.title !== r.document?.originalName)
    return r.document.title;
  return new Date(r.analyzedAt).toLocaleDateString("fr-FR");
}
export function DATracker({
  view,
  reports,
  onNotify,
  onDeliberated,
}: {
  view: DaView;
  reports: ReportRow[];
  onNotify: (msg: string, ok?: boolean) => void;
  onDeliberated?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [deliberatedIds, setDeliberatedIds] = useState<Set<string>>(new Set());
  const [reportFilter, setReportFilter] = useState<"all" | "high" | "low">("all");

  // Délibération
  const [deliberationDecision, setDeliberationDecision] = useState<
    "final_validation" | "sanction" | "rewrite_required"
  >("final_validation");
  const [committee, setCommittee] = useState("");
  const [notes, setNotes] = useState("");
  const [directReportId, setDirectReportId] = useState("");

  const filtered = useMemo(() => {
    let result = reports;
    
    // Apply search filter
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (r) =>
          (r.student?.firstName ?? "").toLowerCase().includes(q) ||
          (r.student?.lastName ?? "").toLowerCase().includes(q) ||
          (r.student?.department ?? "").toLowerCase().includes(q) ||
          r.id.includes(q),
      );
    }
    
    // Apply risk filter
    if (reportFilter === "high") {
      result = result.filter((r) => r.riskLevel === "HIGH");
    } else if (reportFilter === "low") {
      result = result.filter((r) => r.riskLevel === "LOW");
    }
    
    return result;
  }, [reports, search, reportFilter]);

  const highRiskCount = reports.filter((r) => r.riskLevel === "HIGH").length;
  const mediumRiskCount = reports.filter(
    (r) => r.riskLevel === "MEDIUM",
  ).length;
  const lowRiskCount = reports.filter((r) => r.riskLevel === "LOW").length;

  async function deliberate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReport) {
      onNotify("Aucun rapport sélectionné pour la délibération.", false);
      return;
    }
    try {
      await apiFetch<{
        deliberation: { id: string; decision: string };
      }>(`/api/reports/${selectedReport.id}/deliberate`, {
        method: "POST",
        body: JSON.stringify({ decision: deliberationDecision, committee, notes }),
      });
      const decisionLabel =
        deliberationDecision === "final_validation" ? "Validation finale" :
        deliberationDecision === "sanction" ? "Sanction" : "Réécriture requise";
      onNotify(`Délibération enregistrée : ${decisionLabel} pour ${reportLabel(selectedReport)}`);
      setDeliberatedIds((prev) => new Set([...prev, selectedReport.id]));
      setSelectedReport(null);
      setCommittee("");
      setNotes("");
      onDeliberated?.();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Erreur délibération", false);
    }
  }

  async function deliberateByReportId(e: React.FormEvent) {
    e.preventDefault();
    const reportId = directReportId.trim();
    if (!reportId) {
      onNotify("Renseignez un ID de rapport.", false);
      return;
    }

    try {
      await apiFetch<{
        deliberation: { id: string; decision: string };
      }>(`/api/reports/${reportId}/deliberate`, {
        method: "POST",
        body: JSON.stringify({ decision: deliberationDecision, committee, notes }),
      });
      const decisionLabel =
        deliberationDecision === "final_validation"
          ? "Validation finale"
          : deliberationDecision === "sanction"
            ? "Sanction"
            : "Réécriture requise";
      onNotify(`Délibération enregistrée : ${decisionLabel} pour le rapport #${reportId}`);
      setDirectReportId("");
      setCommittee("");
      setNotes("");
      onDeliberated?.();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Erreur délibération", false);
    }
  }

  const showSearch = view === "reports" || view === "dashboard";

  // Group reports by student and get best report (lowest similarity)
  const reportsByStudent = useMemo(() => {
    const grouped: Record<string, { studentName: string; reports: ReportRow[]; bestReport: ReportRow }> = {};
    
    for (const report of reports) {
      const studentId = report.documentId;
      const studentName = report.student 
        ? `${report.student.firstName} ${report.student.lastName}`
        : report.document?.title || report.document?.originalName || "Inconnu";
      
      if (!grouped[studentId]) {
        grouped[studentId] = { studentName, reports: [], bestReport: report };
      }
      grouped[studentId].reports.push(report);
      
      // Keep the one with lowest similarity
      const currSim = parseFloat(report.globalSimilarity) || 0;
      const bestSim = parseFloat(grouped[studentId].bestReport.globalSimilarity) || 0;
      if (currSim < bestSim) {
        grouped[studentId].bestReport = report;
      }
    }
    
    // Sort students by their best report similarity (lowest first = best for deliberation)
    return Object.values(grouped).sort((a, b) => 
      (parseFloat(a.bestReport.globalSimilarity) || 0) - (parseFloat(b.bestReport.globalSimilarity) || 0)
    );
  }, [reports]);

  const recentActivity = useMemo(() => {
    return reports
      .slice()
      .sort(
        (a, b) =>
          new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime(),
      )
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        color:
          r.riskLevel === "HIGH"
            ? "#7D1C2A"
            : r.riskLevel === "MEDIUM"
              ? "#c98a2f"
              : "#16a34a",
        text: `${r.student ? `${r.student.firstName} ${r.student.lastName}` : r.document?.title ?? r.document?.originalName?.replace(/\.[^.]+$/, "") ?? `Rapport #${r.id}`} — ${r.riskLevel}`,
        risk: r.riskLevel,
        when: new Date(r.analyzedAt),
      }));
  }, [reports]);

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div
        className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-8 sm:py-4"
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
            {view === "dashboard" && "Tableau de bord"}
            {view === "reports" && "Rapports finaux"}
            {view === "deliberation" && "Délibérations"}
          </h1>
        </div>
        {showSearch && (
          <div className="relative w-full sm:w-72">
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

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* ── Dashboard ── */}
          {view === "dashboard" && (
            <div className="space-y-5">
              <SectionHeader
                icon={LayoutDashboard}
                title="Vue d'ensemble DA"
                subtitle="Suivi des rapports et délibérations en attente"
              />

              <div
                className="rounded-2xl border bg-white px-4 py-3"
                style={{ borderColor: "rgba(123,36,56,0.14)" }}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#2A1A12]">
                      {reports.length} rapport{reports.length > 1 ? "s" : ""} à traiter
                    </p>
                    <p className="text-xs text-[#6c5448]">
                      Priorisez les dossiers à risque élevé, puis les moyens.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedReport(filtered[0] ?? null)}
                    disabled={filtered.length === 0}
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-[#7b2438]/5 disabled:opacity-40"
                    style={{
                      borderColor: "rgba(123,36,56,0.25)",
                      color: "var(--primary)",
                    }}
                  >
                    Délibérer maintenant
                  </button>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard
                  label="Rapports totaux"
                  value={String(reports.length)}
                  tone={reports.length > 0 ? "warn" : "ok"}
                />
                <KpiCard
                  label="Risque élevé"
                  value={String(highRiskCount)}
                  tone={highRiskCount > 0 ? "danger" : "ok"}
                />
                <KpiCard
                  label="Risque moyen"
                  value={String(mediumRiskCount)}
                  tone={mediumRiskCount > 0 ? "warn" : "ok"}
                />
                <KpiCard
                  label="Risque faible"
                  value={String(lowRiskCount)}
                  tone="ok"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                <div className="space-y-3 rounded-2xl border bg-white p-4" style={{ borderColor: "rgba(123,36,56,0.12)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">
                    Étudiants à traiter (meilleur rapport en premier)
                  </p>
                  {reportsByStudent.length === 0 ? (
                    <div
                      className="rounded-xl border bg-[#faf7f4] p-6 text-center text-sm"
                      style={{ borderColor: "rgba(123,36,56,0.10)", color: "var(--text-soft)" }}
                    >
                      Aucun rapport disponible.
                    </div>
                  ) : (
                    reportsByStudent.map((group) => (
                      <StudentReportCard
                        key={group.studentName}
                        studentName={group.studentName}
                        bestReport={group.bestReport}
                        totalReports={group.reports.length}
                        onClick={() => setSelectedReport(group.bestReport)}
                      />
                    ))
                  )}
                </div>

                <div className="space-y-4">
                  <div
                    className="rounded-2xl border bg-white"
                    style={{ borderColor: "#DDD4C8" }}
                  >
                    <div
                      className="border-b px-4 py-3"
                      style={{ borderColor: "#DDD4C8" }}
                    >
                      <h3 className="text-xs font-semibold text-[#2A1A12]">
                        Activité récente
                      </h3>
                    </div>
                    <div>
                      {recentActivity.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-[#8A7A6E]">
                          Aucune activité récente.
                        </p>
                      ) : (
                        recentActivity.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-start gap-2 border-b px-4 py-2.5 last:border-b-0"
                            style={{ borderColor: "#EEE5DA" }}
                          >
                            <span
                              className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: entry.color }}
                            />
                            <p className="flex-1 text-[11px] text-[#5A4A3A]">
                              {entry.text}
                            </p>
                            <span className="text-[10px] text-[#B4A89A]">
                              {entry.when.toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Rapports finaux ── */}
          {view === "reports" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-[#2A1A12]">Rapports finaux</h1>
                  <p className="text-sm text-[#6c5448]">
                    {filtered.length} rapport{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {[
                    { key: "all", label: "Tous", color: "#6c5448" },
                    { key: "high", label: "Risque élevé", color: "#dc2626" },
                    { key: "low", label: "Risque faible", color: "#16a34a" },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setReportFilter(filter.key as typeof reportFilter)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        reportFilter === filter.key 
                          ? "text-white" 
                          : "bg-white border border-[#6c5448]/20 text-[#6c5448]"
                      }`}
                      style={{
                        background: reportFilter === filter.key ? filter.color : undefined,
                      }}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tableau */}
              {filtered.length === 0 ? (
                <div
                  className="rounded-2xl border-2 bg-white p-10 text-center text-sm"
                  style={{
                    borderColor: "rgba(123,36,56,0.10)",
                    color: "var(--text-soft)",
                  }}
                >
                  {search
                    ? `Aucun résultat pour « ${search} »`
                    : "Aucun rapport disponible."}
                </div>
              ) : (
                <div
                  className="rounded-2xl border-2 bg-white overflow-hidden"
                  style={{ borderColor: "rgba(123,36,56,0.12)" }}
                >
                  <div className="w-full overflow-x-auto">
                    {/* En-tête tableau */}
                    <div
                      className="grid min-w-[640px] grid-cols-[2fr_1fr_auto] gap-4 border-b px-5 py-3 md:grid-cols-[2fr_1fr_1fr_auto] lg:min-w-[760px] lg:grid-cols-[2fr_1fr_1fr_auto_auto]"
                      style={{
                        borderColor: "rgba(123,36,56,0.10)",
                        background: "rgba(123,36,56,0.04)",
                      }}
                    >
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: "var(--text-soft)" }}
                      >
                        Étudiant
                      </span>
                      <span
                        className="hidden text-[10px] font-bold uppercase tracking-widest md:block"
                        style={{ color: "var(--text-soft)" }}
                      >
                        Filière
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: "var(--text-soft)" }}
                      >
                        Score Plagiat
                      </span>
                      <span
                        className="hidden text-[10px] font-bold uppercase tracking-widest lg:block"
                        style={{ color: "var(--text-soft)" }}
                      >
                        Tentatives
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: "var(--text-soft)" }}
                      />
                    </div>
                    {/* Lignes */}
                    {filtered.map((r, i) => {
                      const plagiat = parseFloat(r.globalSimilarity) || 0;
                      const isLast = i === filtered.length - 1;
                      return (
                        <div
                          key={r.id}
                          className="grid min-w-[640px] grid-cols-[2fr_1fr_auto] items-center gap-4 px-5 py-4 transition hover:bg-[rgba(123,36,56,0.03)] cursor-pointer md:grid-cols-[2fr_1fr_1fr_auto] lg:min-w-[760px] lg:grid-cols-[2fr_1fr_1fr_auto_auto]"
                          style={{
                            borderBottom: isLast
                              ? "none"
                              : "1px solid rgba(123,36,56,0.07)",
                          }}
                          onClick={() => setSelectedReport(r)}
                        >
                          {/* Étudiant */}
                          <div>
                            <p
                              className="text-sm font-extrabold"
                              style={{ color: "var(--foreground)" }}
                            >
                              {reportLabel(r)}
                            </p>
                            <div className="flex items-center gap-2">
                              <p
                                className="text-xs"
                                style={{ color: "var(--text-soft)" }}
                              >
                                {r.document?.title && r.document.title !== r.document.originalName
                                  ? r.document.title
                                  : new Date(r.analyzedAt).toLocaleDateString("fr-FR")}
                              </p>
                              {deliberatedIds.has(r.id) && (
                                <span className="rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                  Délibéré
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Filière */}
                          <div className="hidden md:block">
                            {r.student?.department ? (
                              <span
                                className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                style={{
                                  borderColor: "rgba(123,36,56,0.22)",
                                  background: "rgba(123,36,56,0.07)",
                                  color: "var(--primary)",
                                }}
                              >
                                {r.student.department}
                              </span>
                            ) : (
                              <span
                                className="text-xs"
                                style={{ color: "var(--text-soft)" }}
                              >
                                —
                              </span>
                            )}
                          </div>
                          {/* Score Plagiat */}
                          <div className="flex items-center gap-1.5">
                            <TrendingUp
                              className="h-3.5 w-3.5 shrink-0"
                              style={{
                                color:
                                  plagiat >= 20
                                    ? "#b91c1c"
                                    : "var(--text-soft)",
                              }}
                            />
                            <ScoreBar value={plagiat} />
                          </div>
                          {/* Tentatives */}
                          <div className="hidden lg:block">
                            {(r.uploadAttempts ?? 1) > 1 ? (
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${(r.uploadAttempts ?? 1) > 5 ? "border-red-300 bg-red-50 text-red-700" : "border-[#7b2438]/25 bg-[#f2d9e0] text-[#7b2438]"}`}
                              >
                                {r.uploadAttempts}×
                              </span>
                            ) : (
                              <span
                                className="text-xs"
                                style={{ color: "var(--text-soft)" }}
                              >
                                1×
                              </span>
                            )}
                          </div>
                          {/* Action */}
                          <ChevronRight
                            className="h-4 w-4 shrink-0"
                            style={{ color: "rgba(123,36,56,0.35)" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Panneau délibération inline */}
              {selectedReport && (
                <div
                  className="rounded-2xl border-2 bg-white p-6"
                  style={{ borderColor: "rgba(123,36,56,0.18)" }}
                >
                  <div
                    className="mb-5 flex items-start justify-between gap-4 border-b pb-4"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-widest mb-1"
                        style={{ color: "var(--text-soft)" }}
                      >
                        Délibération
                      </p>
                      <p
                        className="text-base font-extrabold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {reportLabel(selectedReport)}
                      </p>
                      {selectedReport.document?.title && selectedReport.student && (
                        <p className="mt-0.5 text-xs line-clamp-1" style={{ color: "var(--text-soft)" }}>
                          {selectedReport.document.title}
                        </p>
                      )}
                      {selectedReport.student?.department && (
                        <span
                          className="mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase"
                          style={{
                            borderColor: "rgba(123,36,56,0.22)",
                            background: "rgba(123,36,56,0.07)",
                            color: "var(--primary)",
                          }}
                        >
                          {selectedReport.student.department}
                        </span>
                      )}
                      <div className="mt-2 flex gap-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "var(--text-soft)" }}
                          >
                            Plagiat :
                          </span>
                          <ScoreBar
                            value={
                              parseFloat(selectedReport.globalSimilarity) || 0
                            }
                          />
                        </div>
                        <RiskBadge level={selectedReport.riskLevel} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedReport(null)}
                      className="shrink-0 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition hover:opacity-75"
                      style={{
                        borderColor: "rgba(123,36,56,0.22)",
                        color: "var(--primary)",
                      }}
                    >
                      ← Retour
                    </button>
                  </div>
                  <form onSubmit={deliberate} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span
                          className="mb-1.5 block text-xs font-bold uppercase tracking-wider"
                          style={{ color: "var(--foreground)" }}
                        >
                          Décision
                        </span>
                        <select
                          value={deliberationDecision}
                          onChange={(e) =>
                            setDeliberationDecision(
                              e.target.value as typeof deliberationDecision,
                            )
                          }
                          className="h-11 w-full rounded-xl border-2 bg-white px-4 text-sm outline-none"
                          style={{
                            borderColor: "rgba(123,36,56,0.18)",
                            color: "var(--foreground)",
                          }}
                        >
                          <option value="final_validation">
                            Validation finale
                          </option>
                          <option value="sanction">Sanction</option>
                          <option value="rewrite_required">
                            Réécriture requise
                          </option>
                        </select>
                      </label>
                      <Field
                        label="Commission"
                        value={committee}
                        onChange={setCommittee}
                        placeholder="Commission pédagogique"
                      />
                    </div>
                    <Field
                      label="Notes"
                      value={notes}
                      onChange={setNotes}
                      placeholder="Observations et décision motivée..."
                    />
                    <button
                      type="submit"
                      className="btn-primary h-11 w-full rounded-xl font-bold text-white transition"
                    >
                      Enregistrer la délibération
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ── Délibérations (accès direct par ID) ── */}
          {view === "deliberation" && (
            <div className="space-y-5">
              <SectionHeader
                icon={Scale}
                title="Délibération directe"
                subtitle="Saisie par ID de rapport"
              />
              <div
                className="rounded-2xl border-2 bg-white p-6"
                style={{ borderColor: "rgba(123,36,56,0.12)" }}
              >
                <p
                  className="mb-4 text-sm"
                  style={{ color: "var(--text-soft)" }}
                >
                  Préférez la vue <strong>Rapports finaux</strong> pour
                  délibérer directement depuis le tableau. Ce formulaire permet
                  une saisie manuelle par ID.
                </p>
                <form
                  onSubmit={deliberateByReportId}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                      label="Report ID"
                      value={directReportId}
                      onChange={setDirectReportId}
                      placeholder="Ex: 11"
                    />
                    <label className="block">
                      <span
                        className="mb-1.5 block text-xs font-bold uppercase tracking-wider"
                        style={{ color: "var(--foreground)" }}
                      >
                        Décision
                      </span>
                      <select
                        value={deliberationDecision}
                        onChange={(e) =>
                          setDeliberationDecision(
                            e.target.value as typeof deliberationDecision,
                          )
                        }
                        className="h-11 w-full rounded-xl border-2 bg-white px-4 text-sm outline-none"
                        style={{
                          borderColor: "rgba(123,36,56,0.18)",
                          color: "var(--foreground)",
                        }}
                      >
                        <option value="final_validation">
                          Validation finale
                        </option>
                        <option value="sanction">Sanction</option>
                        <option value="rewrite_required">
                          Réécriture requise
                        </option>
                      </select>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                      label="Commission"
                      value={committee}
                      onChange={setCommittee}
                      placeholder="Commission pédagogique"
                    />
                    <Field
                      label="Notes"
                      value={notes}
                      onChange={setNotes}
                      placeholder="Observations..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary h-11 w-full rounded-xl font-bold text-white transition"
                  >
                    Enregistrer la délibération
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Base de Référence ── */}
          {view === "reference-library" && (
            <div className="space-y-5">
              <SectionHeader
                icon={BookOpen}
                title="Base de Référence"
                subtitle="Bibliothèque des mémoires de référence"
              />
              <ReferenceLibraryViewer />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ReportCard (dashboard) ─────────────────────────────────────
function ReportCard({
  report,
  onClick,
}: {
  report: ReportRow;
  onClick: () => void;
}) {
  const plagiat = parseFloat(report.globalSimilarity) || 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border-2 bg-white p-5 text-left transition hover:shadow-md"
      style={{ borderColor: "rgba(123,36,56,0.12)" }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(123,36,56,0.08)" }}
          >
            <FileText className="h-4 w-4" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <p
              className="text-sm font-extrabold"
              style={{ color: "var(--foreground)" }}
            >
              {reportLabel(report)}
            </p>
            {report.document?.title && report.student && (
              <p className="mt-0.5 text-xs line-clamp-1" style={{ color: "var(--text-soft)" }}>
                {report.document.title}
              </p>
            )}
            {report.student?.department && (
              <span
                className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{
                  borderColor: "rgba(123,36,56,0.22)",
                  background: "rgba(123,36,56,0.07)",
                  color: "var(--primary)",
                }}
              >
                {report.student.department}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: "var(--text-soft)" }}
            >
              Plagiat
            </p>
            <ScoreBar value={plagiat} />
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0"
            style={{ color: "rgba(123,36,56,0.35)" }}
          />
        </div>
      </div>
    </button>
  );
}

// ── StudentReportCard (grouped by student) ────────────────────────
function StudentReportCard({
  studentName,
  bestReport,
  totalReports,
  onClick,
}: {
  studentName: string;
  bestReport: ReportRow;
  totalReports: number;
  onClick: () => void;
}) {
  const similarity = parseFloat(bestReport.globalSimilarity) || 0;
  const riskLevel = getRiskLevel(similarity);
  
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border-2 bg-white p-4 text-left transition hover:shadow-md flex items-center gap-4"
      style={{ borderColor: "rgba(123,36,56,0.12)" }}
    >
      <ScoreRing value={similarity} size={56} strokeWidth={5} />
      <div className="flex-1">
        <p className="text-sm font-bold text-[#2A1A12]">{studentName}</p>
        <p className="text-xs text-[#6c5448] mt-1">
          {totalReports} tentative{totalReports > 1 ? "s" : ""} · {bestReport.document?.title || bestReport.document?.originalName || "Document"}
        </p>
      </div>
      <RiskBadgeComponent level={riskLevel} size="md" />
    </button>
  );
}
