"use client";

import {
  Upload,
  Library,
  Users,
  LogOut,
  ShieldCheck,
} from "lucide-react";

export type AdminView = "dashboard" | "reference-docs" | "staging" | "users";

const NAV: { id: AdminView; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Uploader un document", icon: Upload },
  { id: "reference-docs", label: "Documents de référence", icon: Library },
  { id: "staging", label: "Zone de staging", icon: ShieldCheck },
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
        style={{
          background: "linear-gradient(180deg, var(--surface-1) 0%, var(--surface-2) 100%)",
          borderRight: "1.5px solid var(--line)",
        }}
      >
        {/* Header */}
        <div className="flex h-[68px] items-center gap-2.5 border-b px-4" style={{ borderColor: "var(--line)" }}>
          <div className="flex h-[48px] w-[48px] items-center justify-center overflow-hidden">
            <img src="/brand/origina-logo.png" alt="Handal" className="h-[48px] w-auto object-contain" style={{ height: "auto" }} />
          </div>
          <div>
            <strong className="block text-[0.95rem] font-medium tracking-[0.01em]" style={{ color: "var(--foreground)" }}>
              HANDAL
            </strong>
            <span className="text-[10px] tracking-[0.03em]" style={{ color: "var(--text-soft)" }}>
              Administration
            </span>
          </div>
        </div>

        {/* Profile */}
        <div className="border-b p-4" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white"
              style={{ background: "var(--primary)" }}
            >
              A
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{userName}</p>
              <p className="text-xs" style={{ color: "var(--text-soft)" }}>Administrateur</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={logoutLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-sm font-semibold transition hover:opacity-75 disabled:opacity-40"
            style={{ borderColor: "var(--line-strong)", color: "var(--text-soft)" }}
          >
            <LogOut className="h-4 w-4" />
            {logoutLoading ? "..." : "Déconnexion"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>
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
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" style={{ background: "var(--background)" }}>
        {children}
      </main>
    </div>
  );
}