"use client";

import { useMemo } from "react";
import {
  LayoutDashboard,
  Library,
  ShieldCheck,
  FileSearch,
  Users,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Globe,
  Server,
  ChevronRight,
} from "lucide-react";
import type { AdminView } from "./AdminLayout";
import { AdminReferenceBulkUpload } from "./admin-reference-bulk-upload";
import { AdminStagingPanel } from "./admin-staging-panel";

type ThemeSummary = { id: string; status: string };
type ReportSummary = { id: string; riskLevel: string };

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
    <div className="flex items-center gap-3 border-b pb-5" style={{ borderColor: "var(--line)" }}>
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: "rgba(123,36,56,0.08)" }}
      >
        <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
      </div>
      <div>
        <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>
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
    neutral: { borderColor: "rgba(123,36,56,0.12)", background: "rgba(123,36,56,0.07)", color: "var(--foreground)" },
    ok: { borderColor: "rgba(22,163,74,0.24)", background: "rgba(22,163,74,0.08)", color: "#166534" },
    warn: { borderColor: "rgba(201,138,47,0.28)", background: "rgba(201,138,47,0.14)", color: "#9a6a28" },
    danger: { borderColor: "rgba(220,38,38,0.22)", background: "rgba(220,38,38,0.10)", color: "#b91c1c" },
  }[tone];

  return (
    <div
      className="rounded-2xl border-2 px-4 py-3"
      style={{ borderColor: toneStyles.borderColor, background: toneStyles.background }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold" style={{ color: toneStyles.color }}>
        {value}
      </p>
    </div>
  );
}

function Shortcut({
  href,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  href?: string;
  title: string;
  description: string;
  icon: React.ElementType;
  onClick?: () => void;
}) {
  const cls =
    "group flex items-start justify-between rounded-2xl border bg-white/88 p-4 transition hover:-translate-y-0.5 hover:border-[#c98a2f]/55 hover:bg-[#fffaf2]";
  const style = { borderColor: "rgba(123,36,56,0.14)" };
  const inner = (
    <>
      <div className="flex gap-3">
        <div className="mt-0.5 rounded-lg bg-[#f6e7ea] p-2 text-[#7b2438]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="font-semibold text-[#2b1d16]">{title}</div>
          <div className="mt-1 text-sm text-[#6c5448]">{description}</div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-[#6c5448] transition group-hover:translate-x-1 group-hover:text-[#7b2438]" />
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls} style={style}>
        {inner}
      </button>
    );
  }
  return (
    <a href={href} className={cls} style={style}>
      {inner}
    </a>
  );
}

export function AdminTracker({
  view,
  onViewChange,
  themes,
  reports,
  onNotify,
}: {
  view: AdminView;
  onViewChange: (v: AdminView) => void;
  themes: ThemeSummary[];
  reports: ReportSummary[];
  onNotify: (msg: string, ok?: boolean) => void;
}) {
  const highRiskCount = useMemo(() => reports.filter((r) => r.riskLevel === "HIGH").length, [reports]);
  const mediumRiskCount = useMemo(() => reports.filter((r) => r.riskLevel === "MEDIUM").length, [reports]);
  const lowRiskCount = useMemo(() => reports.filter((r) => r.riskLevel === "LOW").length, [reports]);

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
          <h1 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
            {view === "dashboard" && "Tableau de bord"}
            {view === "reference-docs" && "Documents de référence"}
            {view === "staging" && "Zone de staging"}
            {view === "reports" && "Rapports système"}
            {view === "users" && "Utilisateurs"}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* ── Dashboard ── */}
          {view === "dashboard" && (
            <div className="space-y-6">
              <SectionHeader
                icon={LayoutDashboard}
                title="Supervision globale"
                subtitle="Vue d'ensemble de la plateforme Handal"
              />

              {/* Alert banner */}
              <div
                className="rounded-2xl px-5 py-4 text-white"
                style={{ background: "#7D1C2A" }}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "rgba(255,255,255,0.14)" }}
                  >
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold">
                      {themes.length + highRiskCount} élément(s) nécessitent votre attention
                    </h2>
                    <p className="text-xs text-white/75">
                      {themes.length} thèmes en attente · {highRiskCount} rapports à risque élevé · {reports.length} rapports totaux
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewChange("reports")}
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                    style={{ borderColor: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.14)" }}
                  >
                    Voir les rapports
                  </button>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard label="Thèmes en attente" value={String(themes.length)} tone={themes.length > 0 ? "warn" : "ok"} />
                <KpiCard label="Rapports totaux" value={String(reports.length)} />
                <KpiCard label="Risque élevé" value={String(highRiskCount)} tone={highRiskCount > 0 ? "danger" : "ok"} />
                <KpiCard label="Session admin" value="Active" tone="ok" />
              </div>

              {/* Shortcuts + Status */}
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "rgba(123,36,56,0.12)" }}>
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>
                    Accès rapides
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Shortcut
                      icon={Library}
                      title="Documents de référence"
                      description="Importer et valider la base de référence"
                      onClick={() => onViewChange("reference-docs")}
                    />
                    <Shortcut
                      icon={ShieldCheck}
                      title="Zone de staging"
                      description="Contrôler la qualité avant indexation"
                      onClick={() => onViewChange("staging")}
                    />
                    <Shortcut
                      icon={FileSearch}
                      title="Rapports système"
                      description="Superviser les analyses de plagiat"
                      onClick={() => onViewChange("reports")}
                    />
                    <Shortcut
                      icon={Globe}
                      title="Flux étudiant"
                      description="Voir le parcours étudiant"
                      href="/student"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "rgba(123,36,56,0.12)" }}>
                    <div className="mb-3 flex items-center gap-2">
                      <Server className="h-4 w-4" style={{ color: "var(--primary)" }} />
                      <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>État du serveur</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: "API", status: "Opérationnelle", ok: true },
                        { label: "Base de données", status: "Connectée", ok: true },
                        { label: "Stockage", status: "Disponible", ok: true },
                      ].map(({ label, status, ok }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span style={{ color: "var(--text-soft)" }}>{label}</span>
                          <span
                            className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                            style={{
                              background: ok ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)",
                              color: ok ? "#166534" : "#b91c1c",
                            }}
                          >
                            <CheckCircle className="h-3 w-3" /> {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "rgba(123,36,56,0.12)" }}>
                    <div className="mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" style={{ color: "var(--primary)" }} />
                      <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Points d'attention</p>
                    </div>
                    <ul className="space-y-2 text-xs" style={{ color: "var(--text-soft)" }}>
                      <li className="rounded-xl border border-[#7b2438]/12 bg-white/85 px-3 py-2">
                        Vérifier les rapports à risque élevé avant délibération finale.
                      </li>
                      <li className="rounded-xl border border-[#7b2438]/12 bg-white/85 px-3 py-2">
                        Contrôler la qualité de la base de référence dans la staging area.
                      </li>
                      <li className="rounded-xl border border-[#7b2438]/12 bg-white/85 px-3 py-2">
                        Superviser la cohérence des flux étudiant, enseignant et DA.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Distribution des risques */}
              <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "rgba(123,36,56,0.12)" }}>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>
                  Distribution des risques
                </p>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded-xl border bg-red-50 p-3" style={{ borderColor: "rgba(220,38,38,0.22)" }}>
                    <p className="text-2xl font-extrabold text-red-700">{highRiskCount}</p>
                    <p className="mt-1 text-red-600">Risque élevé</p>
                  </div>
                  <div className="rounded-xl border bg-orange-50 p-3" style={{ borderColor: "rgba(201,138,47,0.28)" }}>
                    <p className="text-2xl font-extrabold text-orange-700">{mediumRiskCount}</p>
                    <p className="mt-1 text-orange-600">Risque moyen</p>
                  </div>
                  <div className="rounded-xl border bg-green-50 p-3" style={{ borderColor: "rgba(22,163,74,0.24)" }}>
                    <p className="text-2xl font-extrabold text-green-700">{lowRiskCount}</p>
                    <p className="mt-1 text-green-600">Risque faible</p>
                  </div>
                </div>
                {reports.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-[10px]" style={{ color: "var(--text-soft)" }}>
                      <span>Répartition globale</span>
                      <span>{reports.length} rapports</span>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full" style={{ background: "rgba(123,36,56,0.08)" }}>
                      {highRiskCount > 0 && (
                        <div className="h-full bg-red-500" style={{ width: `${(highRiskCount / reports.length) * 100}%` }} />
                      )}
                      {mediumRiskCount > 0 && (
                        <div className="h-full bg-orange-400" style={{ width: `${(mediumRiskCount / reports.length) * 100}%` }} />
                      )}
                      {lowRiskCount > 0 && (
                        <div className="h-full bg-green-500" style={{ width: `${(lowRiskCount / reports.length) * 100}%` }} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Documents de référence ── */}
          {view === "reference-docs" && (
            <div className="space-y-5">
              <SectionHeader
                icon={Library}
                title="Documents de référence"
                subtitle="Importez les mémoires des années précédentes"
              />
              <AdminReferenceBulkUpload onUploadDone={() => onNotify("Documents importés avec succès.")} />
            </div>
          )}

          {/* ── Staging ── */}
          {view === "staging" && (
            <div className="space-y-5">
              <SectionHeader
                icon={ShieldCheck}
                title="Zone de staging"
                subtitle="Vérifiez et corrigez les métadonnées avant indexation"
              />
              <AdminStagingPanel hideTabs />
            </div>
          )}

          {/* ── Rapports système ── */}
          {view === "reports" && (
            <div className="space-y-5">
              <SectionHeader
                icon={FileSearch}
                title="Rapports système"
                subtitle={`${reports.length} rapport${reports.length > 1 ? "s" : ""} disponible${reports.length > 1 ? "s" : ""}`}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiCard label="Total" value={String(reports.length)} />
                <KpiCard label="Risque élevé" value={String(highRiskCount)} tone={highRiskCount > 0 ? "danger" : "ok"} />
                <KpiCard label="Risque moyen" value={String(mediumRiskCount)} tone={mediumRiskCount > 0 ? "warn" : "ok"} />
                <KpiCard label="Risque faible" value={String(lowRiskCount)} tone="ok" />
              </div>
              <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "rgba(123,36,56,0.12)" }}>
                <div
                  className="grid grid-cols-3 gap-4 border-b px-5 py-3"
                  style={{ borderColor: "rgba(123,36,56,0.10)", background: "rgba(123,36,56,0.04)" }}
                >
                  {["ID Rapport", "Niveau de risque", "Action"].map((h) => (
                    <span key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>
                      {h}
                    </span>
                  ))}
                </div>
                {reports.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-soft)" }}>
                    Aucun rapport disponible.
                  </p>
                ) : (
                  reports.map((r, i) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-3 items-center gap-4 px-5 py-3"
                      style={{ borderBottom: i < reports.length - 1 ? "1px solid rgba(123,36,56,0.07)" : "none" }}
                    >
                      <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        #{r.id}
                      </span>
                      <span>
                        {r.riskLevel === "HIGH" && (
                          <span className="rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700">Élevé</span>
                        )}
                        {r.riskLevel === "MEDIUM" && (
                          <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-700">Moyen</span>
                        )}
                        {r.riskLevel === "LOW" && (
                          <span className="rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-700">Faible</span>
                        )}
                      </span>
                      <a
                        href={`/api/reports/${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold"
                        style={{ color: "var(--primary)" }}
                      >
                        Voir <ChevronRight className="h-3 w-3" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Utilisateurs ── */}
          {view === "users" && (
            <div className="space-y-5">
              <SectionHeader
                icon={Users}
                title="Gestion des utilisateurs"
                subtitle="Supervision des comptes et des rôles"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Shortcut
                  icon={Globe}
                  title="Flux étudiant"
                  description="Voir le parcours étudiant"
                  href="/student"
                />
                <Shortcut
                  icon={TrendingUp}
                  title="Flux enseignant"
                  description="Modération et rapports CD"
                  href="/teacher"
                />
                <Shortcut
                  icon={FileSearch}
                  title="Flux DA"
                  description="Validation et délibération"
                  href="/da"
                />
                <Shortcut
                  icon={Server}
                  title="API Reports"
                  description="JSON brut des rapports"
                  href="/api/reports"
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
