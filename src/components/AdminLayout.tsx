"use client";

import {
  Upload,
  Library,
  Users,
  LogOut,
} from "lucide-react";

export type AdminView = "dashboard" | "reference-docs" | "users";

const NAV: { id: AdminView; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Uploader un document", icon: Upload },
  { id: "reference-docs", label: "Documents de référence", icon: Library },
  { id: "users", label: "Utilisateurs", icon: Users },
];

type Props = {
  view: AdminView;
  onViewChange: (v: AdminView) => void;
  userName: string;
  onLogout: () => void;
  logoutLoading: boolean;
  children: React.ReactNode;
};

const COLORS = {
  primary: "#7d1c2a",
  background: "#f4efe8",
  surface: "#ffffff",
  text: "#1e1410",
  textMuted: "#6b5649",
  border: "#ddd4c4",
};

export function AdminLayout({
  view,
  onViewChange,
  userName,
  onLogout,
  logoutLoading,
  children,
}: Props) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto md:flex"
        style={{ background: COLORS.surface, borderRight: `1.5px solid ${COLORS.border}` }}
      >
        {/* Header */}
        <div className="flex h-[68px] items-center gap-2.5 border-b px-4" style={{ borderColor: COLORS.border }}>
          <div className="flex h-[48px] w-[48px] items-center justify-center overflow-hidden">
            <img src="/brand/origina-logo.png" alt="Handal" className="h-[48px] w-auto object-contain" style={{ height: "auto" }} />
          </div>
          <div>
            <strong className="block text-[0.95rem] font-medium tracking-[0.01em]" style={{ color: COLORS.text }}>
              HANDAL
            </strong>
            <span className="text-[10px] tracking-[0.03em]" style={{ color: COLORS.textMuted }}>
              Administration
            </span>
          </div>
        </div>

        {/* Profile */}
        <div className="border-b p-4" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white"
              style={{ background: COLORS.primary }}
            >
              A
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: COLORS.text }}>{userName}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Administrateur</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={logoutLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-sm font-semibold transition hover:opacity-75 disabled:opacity-40"
            style={{ borderColor: COLORS.border, color: COLORS.textMuted }}
          >
            <LogOut className="h-4 w-4" />
            {logoutLoading ? "..." : "Déconnexion"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>
            Menu
          </p>
          <div className="space-y-1">
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
                      ? { background: COLORS.primary, color: "#fff", boxShadow: "0 4px 14px rgba(125,28,42,0.22)" }
                      : { color: COLORS.text, background: "transparent" }
                  }
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(125,28,42,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" style={{ background: COLORS.background }}>
        {children}
      </main>
    </div>
  );
}