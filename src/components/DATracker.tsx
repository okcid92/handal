"use client";

import { useState, useMemo } from "react";
import {
  Search, FileSearch, Scale, LayoutDashboard,
  CheckCircle, AlertCircle, TrendingUp, FileText, ChevronRight,
} from "lucide-react";
import type { DaView } from "./DALayout";
import { apiFetch } from "@/lib/frontend-api";

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
  };
  uploadAttempts?: number;
};

// ── Atoms ──────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
        {label}
      </span>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-11 w-full rounded-xl border-2 bg-white px-4 text-sm outline-none transition"
        style={{ borderColor: "rgba(123,36,56,0.18)", color: "var(--foreground)" }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(123,36,56,0.18)"; }}
      />
    </label>
  );
}

function Banner({ children, ok = true }: { children: React.ReactNode; ok?: boolean }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium"
      style={ok
        ? { borderColor: "rgba(201,138,47,0.40)", background: "#fff6e6", color: "#755028" }
        : { borderColor: "rgba(220,38,38,0.30)", background: "#fef2f2", color: "#b91c1c" }}>
      {ok ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c98a2f]" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
      <span>{children}</span>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const l = level.toLowerCase();
  if (l === "high") return <span className="rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700">Élevé</span>;
  if (l === "medium") return <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-700">Moyen</span>;
  return <span className="rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-700">Faible</span>;
}

function ScoreBar({ value }: { value: number }) {
  const pct = Math.min(value, 100);
  const color = value >= 70 ? "#b91c1c" : value >= 40 ? "#c98a2f" : "#16a34a";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full" style={{ background: "rgba(123,36,56,0.10)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{value.toFixed(1)}%</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 border-b pb-5" style={{ borderColor: "var(--line)" }}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(123,36,56,0.08)" }}>
        <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
      </div>
      <div>
        <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>{title}</h2>
        {subtitle && <p className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Main DATracker ─────────────────────────────────────────────
export function DATracker({
  view, reports, onNotify,
}: {
  view: DaView;
  reports: ReportRow[];
  onNotify: (msg: string, ok?: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);

  // Délibération
  const [deliberationDecision, setDeliberationDecision] = useState<"final_validation" | "sanction" | "rewrite_required">("final_validation");
  const [committee, setCommittee] = useState("");
  const [notes, setNotes] = useState("");


  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return reports;
    return reports.filter((r) =>
      (r.student?.firstName ?? "").toLowerCase().includes(q) ||
      (r.student?.lastName ?? "").toLowerCase().includes(q) ||
      (r.student?.department ?? "").toLowerCase().includes(q) ||
      r.id.includes(q),
    );
  }, [reports, search]);

  async function deliberate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReport) return;
    try {
      const result = await apiFetch<{ deliberation: { id: string; decision: string } }>(
        `/api/reports/${selectedReport.id}/deliberate`,
        { method: "POST", body: JSON.stringify({ decision: deliberationDecision, committee, notes }) },
      );
      onNotify(`Délibération enregistrée : ${result.deliberation.decision}`);
      setSelectedReport(null);
      setCommittee(""); setNotes("");
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Erreur délibération", false);
    }
  }


  const showSearch = view === "reports" || view === "dashboard";

  return (
    <div className="flex flex-col h-full">

      {/* Topbar */}
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b px-8 py-4"
        style={{ borderColor: "var(--line)", background: "rgba(247,241,232,0.94)", backdropFilter: "blur(12px)" }}>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
            {view === "dashboard" && "Tableau de bord"}
            {view === "reports" && "Rapports finaux"}
            {view === "deliberation" && "Délibérations"}
          </h1>
        </div>
        {showSearch && (
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-soft)" }} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, prénom ou filière..."
              className="h-10 w-full rounded-xl border-2 bg-white pl-9 pr-4 text-sm outline-none transition"
              style={{ borderColor: "rgba(123,36,56,0.18)", color: "var(--foreground)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(123,36,56,0.18)"; }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* ── Dashboard ── */}
          {view === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Rapports à traiter", value: reports.length, urgent: reports.length > 0 },
                  { label: "Résultats filtrés", value: filtered.length, urgent: false },
                  { label: "Session", value: "Active", urgent: false },
                ].map(({ label, value, urgent }) => (
                  <div key={label} className="rounded-2xl border-2 bg-white p-5" style={{ borderColor: "rgba(123,36,56,0.12)" }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-soft)" }}>{label}</p>
                    <p className="text-3xl font-extrabold" style={{ color: urgent ? "var(--primary)" : "var(--foreground)" }}>{value}</p>
                  </div>
                ))}
              </div>
              {filtered.slice(0, 3).map((r) => (
                <ReportCard key={r.id} report={r} onClick={() => { setSelectedReport(r); onNotify(""); }} />
              ))}
            </div>
          )}

          {/* ── Rapports finaux ── */}
          {view === "reports" && (
            <div className="space-y-5">
              <SectionHeader icon={FileSearch} title="Rapports finaux d'analyse"
                subtitle={`${filtered.length} rapport${filtered.length > 1 ? "s" : ""} disponible${filtered.length > 1 ? "s" : ""}`} />

              {/* Tableau */}
              {filtered.length === 0 ? (
                <div className="rounded-2xl border-2 bg-white p-10 text-center text-sm" style={{ borderColor: "rgba(123,36,56,0.10)", color: "var(--text-soft)" }}>
                  {search ? `Aucun résultat pour « ${search} »` : "Aucun rapport disponible."}
                </div>
              ) : (
                <div className="rounded-2xl border-2 bg-white overflow-hidden" style={{ borderColor: "rgba(123,36,56,0.12)" }}>
                  {/* En-tête tableau */}
                  <div className="grid grid-cols-[2fr_1fr_1fr_auto_auto] gap-4 border-b px-5 py-3"
                    style={{ borderColor: "rgba(123,36,56,0.10)", background: "rgba(123,36,56,0.04)" }}>
                    {["Étudiant", "Filière", "Score Plagiat", "Tentatives", ""].map((h) => (
                      <span key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>{h}</span>
                    ))}
                  </div>
                  {/* Lignes */}
                  {filtered.map((r, i) => {
                    const plagiat = parseFloat(r.globalSimilarity) || 0;
                    const isLast = i === filtered.length - 1;
                    return (
                      <div
                        key={r.id}
                        className="grid grid-cols-[2fr_1fr_1fr_auto_auto] items-center gap-4 px-5 py-4 transition hover:bg-[rgba(123,36,56,0.03)] cursor-pointer"
                        style={{ borderBottom: isLast ? "none" : "1px solid rgba(123,36,56,0.07)" }}
                        onClick={() => setSelectedReport(r)}
                      >
                        {/* Étudiant */}
                        <div>
                          <p className="text-sm font-extrabold" style={{ color: "var(--foreground)" }}>
                            {r.student ? `${r.student.firstName} ${r.student.lastName}` : `Rapport #${r.id}`}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-soft)" }}>
                            Doc #{r.documentId} · {new Date(r.analyzedAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        {/* Filière */}
                        <div>
                          {r.student?.department ? (
                            <span className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                              style={{ borderColor: "rgba(123,36,56,0.22)", background: "rgba(123,36,56,0.07)", color: "var(--primary)" }}>
                              {r.student.department}
                            </span>
                          ) : <span className="text-xs" style={{ color: "var(--text-soft)" }}>—</span>}
                        </div>
                        {/* Score Plagiat */}
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 shrink-0" style={{ color: plagiat >= 20 ? "#b91c1c" : "var(--text-soft)" }} />
                          <ScoreBar value={plagiat} />
                        </div>
                        {/* Tentatives */}
                        <div>
                          {(r.uploadAttempts ?? 1) > 1 ? (
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${(r.uploadAttempts ?? 1) > 5 ? "border-red-300 bg-red-50 text-red-700" : "border-[#7b2438]/25 bg-[#f2d9e0] text-[#7b2438]"}`}>
                              {r.uploadAttempts}×
                            </span>
                          ) : <span className="text-xs" style={{ color: "var(--text-soft)" }}>1×</span>}
                        </div>
                        {/* Action */}
                        <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "rgba(123,36,56,0.35)" }} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Panneau délibération inline */}
              {selectedReport && (
                <div className="rounded-2xl border-2 bg-white p-6" style={{ borderColor: "rgba(123,36,56,0.18)" }}>
                  <div className="mb-5 flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--line)" }}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-soft)" }}>Délibération — Rapport #{selectedReport.id}</p>
                      <p className="text-base font-extrabold" style={{ color: "var(--foreground)" }}>
                        {selectedReport.student ? `${selectedReport.student.firstName} ${selectedReport.student.lastName}` : `Document #${selectedReport.documentId}`}
                      </p>
                      {selectedReport.student?.department && (
                        <span className="mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase"
                          style={{ borderColor: "rgba(123,36,56,0.22)", background: "rgba(123,36,56,0.07)", color: "var(--primary)" }}>
                          {selectedReport.student.department}
                        </span>
                      )}
                      <div className="mt-2 flex gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold" style={{ color: "var(--text-soft)" }}>Plagiat :</span>
                          <ScoreBar value={parseFloat(selectedReport.globalSimilarity) || 0} />
                        </div>
                        <RiskBadge level={selectedReport.riskLevel} />
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedReport(null)}
                      className="shrink-0 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition hover:opacity-75"
                      style={{ borderColor: "rgba(123,36,56,0.22)", color: "var(--primary)" }}>
                      ← Retour
                    </button>
                  </div>
                  <form onSubmit={deliberate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>Décision</span>
                        <select value={deliberationDecision}
                          onChange={(e) => setDeliberationDecision(e.target.value as typeof deliberationDecision)}
                          className="h-11 w-full rounded-xl border-2 bg-white px-4 text-sm outline-none"
                          style={{ borderColor: "rgba(123,36,56,0.18)", color: "var(--foreground)" }}>
                          <option value="final_validation">Validation finale</option>
                          <option value="sanction">Sanction</option>
                          <option value="rewrite_required">Réécriture requise</option>
                        </select>
                      </label>
                      <Field label="Commission" value={committee} onChange={setCommittee} placeholder="Commission pédagogique" />
                    </div>
                    <Field label="Notes" value={notes} onChange={setNotes} placeholder="Observations et décision motivée..." />
                    <button type="submit" className="btn-primary h-11 w-full rounded-xl font-bold text-white transition">
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
              <SectionHeader icon={Scale} title="Délibération directe" subtitle="Saisie par ID de rapport" />
              <div className="rounded-2xl border-2 bg-white p-6" style={{ borderColor: "rgba(123,36,56,0.12)" }}>
                <p className="mb-4 text-sm" style={{ color: "var(--text-soft)" }}>
                  Préférez la vue <strong>Rapports finaux</strong> pour délibérer directement depuis le tableau. Ce formulaire permet une saisie manuelle par ID.
                </p>
                <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Report ID" value="" onChange={() => {}} placeholder="Ex: 11" />
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>Décision</span>
                      <select className="h-11 w-full rounded-xl border-2 bg-white px-4 text-sm outline-none"
                        style={{ borderColor: "rgba(123,36,56,0.18)", color: "var(--foreground)" }}>
                        <option value="final_validation">Validation finale</option>
                        <option value="sanction">Sanction</option>
                        <option value="rewrite_required">Réécriture requise</option>
                      </select>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Commission" value="" onChange={() => {}} placeholder="Commission pédagogique" />
                    <Field label="Notes" value="" onChange={() => {}} placeholder="Observations..." />
                  </div>
                  <button type="submit" className="btn-primary h-11 w-full rounded-xl font-bold text-white transition">
                    Enregistrer
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Références (retiré du menu DA) ── */}

        </div>
      </div>
    </div>
  );
}

// ── ReportCard (dashboard) ─────────────────────────────────────
function ReportCard({ report, onClick }: { report: ReportRow; onClick: () => void }) {
  const plagiat = parseFloat(report.globalSimilarity) || 0;
  return (
    <button type="button" onClick={onClick}
      className="w-full rounded-2xl border-2 bg-white p-5 text-left transition hover:shadow-md"
      style={{ borderColor: "rgba(123,36,56,0.12)" }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(123,36,56,0.08)" }}>
            <FileText className="h-4 w-4" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <p className="text-sm font-extrabold" style={{ color: "var(--foreground)" }}>
              {report.student ? `${report.student.firstName} ${report.student.lastName}` : `Rapport #${report.id}`}
            </p>
            {report.student?.department && (
              <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{ borderColor: "rgba(123,36,56,0.22)", background: "rgba(123,36,56,0.07)", color: "var(--primary)" }}>
                {report.student.department}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-soft)" }}>Plagiat</p>
            <ScoreBar value={plagiat} />
          </div>
          <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "rgba(123,36,56,0.35)" }} />
        </div>
      </div>
    </button>
  );
}
