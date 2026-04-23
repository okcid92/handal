"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/frontend-api";
import { DALayout, type DaView } from "./DALayout";
import { DATracker } from "./DATracker";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type ReportRow = {
  id: string;
  documentId: string;
  globalSimilarity: string;
  aiScore: string | null;
  riskLevel: string;
  analyzedAt: string;
  student?: {
    name: string;
    firstName: string;
    lastName: string;
    department: string | null;
  };
  document?: { originalName: string };
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
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      {children}
    </div>
  );
}

export function DaDashboard() {
  const [overview, setOverview] = useState<{
    user: { name: string; role: string };
  } | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [view, setView] = useState<DaView>("dashboard");
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<{ user: { name: string; role: string } }>("/api/me/overview"),
      apiFetch<{ reports: ReportRow[] }>("/api/reports"),
    ])
      .then(([profile, reportData]) => {
        setOverview(profile);
        setReports(reportData.reports);
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

  return (
    <DALayout
      view={view}
      onViewChange={setView}
      userName={overview?.user.name ?? "DA"}
      reportsCount={reports.length}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      {message && <Banner ok={messageOk}>{message}</Banner>}
      <DATracker view={view} reports={reports} onNotify={notify} />
    </DALayout>
  );
}
