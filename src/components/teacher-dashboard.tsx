"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/frontend-api";
import { CDLayout, type CdView } from "./CDLayout";
import { CDTracker } from "./CDTracker";

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
  aiScore?: string | null;
  riskLevel: string;
  analyzedAt: string;
  document: {
    id: string;
    title: string;
    originalName: string;
    storagePath: string;
    mimeType: string;
  };
};

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
      {children}
    </div>
  );
}

export function TeacherDashboard() {
  const [overview, setOverview] = useState<{
    user: { name: string; role: string; department?: string };
  } | null>(null);
  const [themes, setThemes] = useState<ThemeSummary[]>([]);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [view, setView] = useState<CdView>("dashboard");
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch<{ user: { name: string; role: string; department?: string } }>(
        "/api/me/overview",
      ),
      apiFetch<{ themes: ThemeSummary[] }>("/api/themes/pending"),
      apiFetch<{ reports: ReportSummary[] }>("/api/reports"),
    ])
      .then(([profile, themeResult, reportResult]) => {
        if (!mounted) return;
        setOverview(profile);
        setThemes(themeResult.themes);
        setReports(reportResult.reports);
      })
      .catch((e) =>
        notify(e instanceof Error ? e.message : "Erreur de chargement", false),
      );
    return () => {
      mounted = false;
    };
  }, []);

  function notify(msg: string, ok = true) {
    setMessage(msg);
    setMessageOk(ok);
    setTimeout(() => setMessage(null), 6000);
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

  return (
    <CDLayout
      view={view}
      onViewChange={setView}
      userName={overview?.user.name ?? "Enseignant"}
      department={overview?.user.department ?? ""}
      pendingCount={themes.length}
      reportsCount={reports.length}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      {message && <Banner ok={messageOk}>{message}</Banner>}
      <CDTracker
        view={view}
        onViewChange={setView}
        themes={themes}
        reports={reports}
        onThemesRefresh={setThemes}
        onReportsRefresh={setReports}
        onNotify={notify}
      />
    </CDLayout>
  );
}
