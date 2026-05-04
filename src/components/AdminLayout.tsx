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

const BRAND = "#6c5448";

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
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-white md:flex" style={{ borderRight: "1.5px solid #e8e0db" }}>
        {/* Header */}
        <div className="border-b px-5 py-4" style={{ borderColor: "#e8e0db" }}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7d1c2a]">
              <span className="text-sm font-bold text-white">H</span>
            </div>
            <span className="text-lg font-bold" style={{ color: BRAND }}>HANDAL</span>
          </div>
          <div className="mt-2 rounded-full bg-[#6c5448]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider w-fit" style={{ color: BRAND }}>
            Administration
          </div>
        </div>

        {/* Profile */}
        <div className="border-b px-5 py-4" style={{ borderColor: "#e8e0db" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white" style={{ background: BRAND }}>
              A
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#1a1a1a" }}>{userName}</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>Administrateur</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={logoutLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm font-semibold transition hover:opacity-75 disabled:opacity-40"
            style={{ borderColor: "rgba(108,84,72,0.3)", color: BRAND }}
          >
            <LogOut className="h-4 w-4" />
            {logoutLoading ? "..." : "Déconnexion"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#9ca3af" }}>
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
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all"
                  style={
                    active
                      ? { background: BRAND, color: "#fff" }
                      : { color: "#4b5563", background: "transparent" }
                  }
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "#faf7f5";
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
      <main className="flex-1 overflow-y-auto" style={{ background: "#faf7f5" }}>
        {children}
      </main>
    </div>
  );
}