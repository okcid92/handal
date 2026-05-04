"use client";

import {
  LayoutDashboard,
  Library,
  ShieldCheck,
  FileSearch,
  Users,
  LogOut,
  Settings,
  BookOpen,
} from "lucide-react";
import { HandalLogo } from "./HandalLogo";

export type AdminView = "dashboard" | "reference-docs" | "reference-library" | "staging" | "reports" | "users";

const NAV: { id: AdminView; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "reference-docs", label: "Documents de référence", icon: Library },
  { id: "reference-library", label: "Base de Référence", icon: BookOpen },
  { id: "staging", label: "Zone de staging", icon: ShieldCheck },
  { id: "reports", label: "Rapports système", icon: FileSearch },
  { id: "users", label: "Utilisateurs", icon: Users },
];

type Props = {
  view: AdminView;
  onViewChange: (v: AdminView) => void;
  userName: string;
  pendingCount: number;
  reportsCount: number;
  highRiskCount: number;
  onLogout: () => void;
  logoutLoading: boolean;
  children: React.ReactNode;
};

export function AdminLayout({
  view,
  onViewChange,
  userName,
  pendingCount,
  reportsCount,
  highRiskCount,
  onLogout,
  logoutLoading,
  children,
}: Props) {
  return (
    <div className="flex min-h-screen">
      <aside
        className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto md:flex"
        style={{
          background: "linear-gradient(180deg, var(--surface-1) 0%, var(--surface-2) 100%)",
          borderRight: "1.5px solid var(--line)",
        }}
      >
        <div style={{ borderBottom: "1px solid var(--line)" }}>
          <HandalLogo subtitle="Administration" href="/admin" variant="dark" />
        </div>

        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgba(123,36,56,0.10)" }}
            >
              <Settings className="h-4 w-4" style={{ color: "var(--primary)" }} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold" style={{ color: "var(--foreground)" }}>
                {userName}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
                Administrateur
              </p>
            </div>
          </div>
          <div
            className="rounded-lg px-3 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: "rgba(123,36,56,0.07)",
              color: "var(--primary)",
              border: "1px solid rgba(123,36,56,0.18)",
            }}
          >
            Contrôle plateforme
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={logoutLoading}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:opacity-75 disabled:opacity-40"
            style={{
              borderColor: "var(--line-strong)",
              color: "var(--text-soft)",
              background: "rgba(255,255,255,0.75)",
            }}
          >
            <LogOut className="h-3 w-3" />
            {logoutLoading ? "..." : "Déconnexion"}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>
            Menu
          </p>
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onViewChange(id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all"
                style={
                  active
                    ? { background: "var(--primary)", color: "#fff", boxShadow: "0 4px 14px rgba(123,36,56,0.22)" }
                    : { color: "var(--foreground)", background: "transparent" }
                }
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(123,36,56,0.07)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {id === "reference-docs" && pendingCount > 0 && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white" style={{ background: "var(--accent)" }}>
                    {pendingCount}
                  </span>
                )}
                {id === "reports" && highRiskCount > 0 && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white" style={{ background: "#b91c1c" }}>
                    {highRiskCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <nav
          className="px-3 py-3"
          style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}
        >
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>
            Ressources
          </p>
          <a
            href="/api/reference-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all"
            style={{ color: "var(--foreground)", background: "transparent" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(123,36,56,0.07)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">API Référence</span>
          </a>
        </nav>

        <div className="px-4 py-4" style={{ borderTop: "1px solid var(--line)" }}>
          <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>
            Statistiques rapides
          </p>
          <div className="space-y-2">
            {[
              { label: "Docs en attente", value: pendingCount, urgent: pendingCount > 0 },
              { label: "Rapports totaux", value: reportsCount, urgent: false },
              { label: "Risque élevé", value: highRiskCount, urgent: highRiskCount > 0 },
            ].map(({ label, value, urgent }) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border px-3 py-2.5"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.65)" }}
              >
                <span className="text-xs font-semibold" style={{ color: "var(--text-soft)" }}>{label}</span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-extrabold"
                  style={{
                    background: urgent ? "rgba(123,36,56,0.10)" : "rgba(0,0,0,0.05)",
                    color: urgent ? "var(--primary)" : "var(--text-soft)",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="app-shell flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 border-b bg-white/95 px-3 py-2 backdrop-blur md:hidden">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-[#6c5448]">Navigation Admin</p>
            <button
              type="button"
              onClick={onLogout}
              disabled={logoutLoading}
              className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold disabled:opacity-50"
              style={{ borderColor: "var(--line-strong)", color: "var(--text-soft)" }}
            >
              <LogOut className="h-3 w-3" />
              {logoutLoading ? "..." : "Déconnexion"}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {NAV.map(({ id, label }) => {
              const active = view === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onViewChange(id)}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={
                    active
                      ? { background: "var(--primary)", color: "#fff" }
                      : { background: "rgba(123,36,56,0.08)", color: "var(--primary)" }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
