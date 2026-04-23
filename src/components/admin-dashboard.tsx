"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/frontend-api";
import { AdminLayout, type AdminView } from "./AdminLayout";
import { AdminTracker } from "./AdminTracker";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type ThemeSummary = { id: string; status: string };
type ReportSummary = { id: string; riskLevel: string };

function Banner({
  children,
  ok = true,
}: {
  children: React.ReactNode;
  ok?: boolean;
}) {
  return (
    <div
      className="mx-8 mt-4 flex items-start gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium"
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
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      {children}
    </div>
  );
}

export function AdminDashboard() {
  const [overview, setOverview] = useState<{
    user: { name: string; role: string };
  } | null>(null);
  const [themes, setThemes] = useState<ThemeSummary[]>([]);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [view, setView] = useState<AdminView>("dashboard");
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<{ user: { name: string; role: string } }>("/api/me/overview"),
      apiFetch<{ themes: ThemeSummary[] }>("/api/themes/pending"),
      apiFetch<{ reports: ReportSummary[] }>("/api/reports"),
    ])
      .then(([profile, themesResult, reportsResult]) => {
        setOverview(profile);
        setThemes(themesResult.themes);
        setReports(reportsResult.reports);
      })
      .catch((e) =>
        notify(e instanceof Error ? e.message : "Erreur de chargement", false),
      );
  }, []);

  function notify(msg: string, ok = true) {
    setMessage(msg || null);
    setMessageOk(ok);
    if (msg) setTimeout(() => setMessage(null), 6000);
  }

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      await apiFetch("/api/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      setLogoutLoading(false);
    }
  }

  const highRiskCount = reports.filter((r) => r.riskLevel === "HIGH").length;

  return (
    <AdminLayout
      view={view}
      onViewChange={setView}
      userName={overview?.user.name ?? "Administrateur"}
      pendingCount={themes.length}
      reportsCount={reports.length}
      highRiskCount={highRiskCount}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      {message && <Banner ok={messageOk}>{message}</Banner>}
      <AdminTracker
        view={view}
        onViewChange={setView}
        themes={themes}
        reports={reports}
        onNotify={notify}
      />
    </AdminLayout>
  );
}
