"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/frontend-api";

type ThemeSummary = {
  id: string;
  title: string;
  status: string;
  description: string;
  student: { name: string; ine: string | null };
};

type ReportSummary = {
  id: string;
  documentId: string;
  globalSimilarity: string;
  riskLevel: string;
  analyzedAt: string;
};

export function TeacherDashboard() {
  const [overview, setOverview] = useState<{
    user: { name: string; role: string };
  } | null>(null);
  const [themes, setThemes] = useState<ThemeSummary[]>([]);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const [themeId, setThemeId] = useState("");
  const [themeDecision, setThemeDecision] = useState<"approved" | "rejected">(
    "approved",
  );
  const [themeComment, setThemeComment] = useState("");

  const [analysisDocumentId, setAnalysisDocumentId] = useState("");
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      apiFetch<{ user: { name: string; role: string } }>("/api/me/overview"),
      apiFetch<{ themes: ThemeSummary[] }>("/api/themes/pending"),
      apiFetch<{ reports: ReportSummary[] }>("/api/reports"),
    ])
      .then(([profile, themeResult, reportResult]) => {
        if (!mounted) {
          return;
        }

        setOverview(profile);
        setThemes(themeResult.themes);
        setReports(reportResult.reports);
      })
      .catch((error) => {
        if (mounted) {
          setMessage(
            error instanceof Error ? error.message : "Erreur de chargement",
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function moderateTheme(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    try {
      const result = await apiFetch<{ theme: ThemeSummary }>(
        `/api/themes/${themeId}/validate-cd`,
        {
          method: "PATCH",
          body: JSON.stringify({
            decision: themeDecision,
            comment: themeComment,
          }),
        },
      );

      setMessage(`Thème mis à jour: ${result.theme.status}`);
      setThemeId("");
      setThemeComment("");
      const refreshed = await apiFetch<{ themes: ThemeSummary[] }>(
        "/api/themes/pending",
      );
      setThemes(refreshed.themes);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur modération");
    }
  }

  async function analyzeDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnalysisMessage(null);
    setAnalysisResult(null);

    try {
      const result = await apiFetch<{ report: unknown; analysis: unknown }>(
        `/api/documents/${analysisDocumentId}/analyze`,
        {
          method: "POST",
        },
      );

      setAnalysisResult(result.analysis);
      setAnalysisMessage("Analyse officielle enregistrée");
      setAnalysisDocumentId("");
      const refreshed = await apiFetch<{ reports: ReportSummary[] }>(
        "/api/reports",
      );
      setReports(refreshed.reports);
    } catch (error) {
      setAnalysisMessage(
        error instanceof Error ? error.message : "Erreur analyse",
      );
    }
  }

  return (
    <>
      {message ? <Banner>{message}</Banner> : null}
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card title="Profil connecté">
          <div className="text-sm text-zinc-300">
            {overview?.user.name} · {overview?.user.role}
          </div>
        </Card>
        <Card title="Rapports récents">
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300"
              >
                <div className="font-semibold text-white">
                  Rapport #{report.id}
                </div>
                <div>Document {report.documentId}</div>
                <div>
                  Similarité {report.globalSimilarity}% · {report.riskLevel}
                </div>
              </div>
            ))}
            {!reports.length ? (
              <div className="text-sm text-zinc-400">
                Aucun rapport disponible.
              </div>
            ) : null}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card title="Thèmes en attente">
          <div className="space-y-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setThemeId(theme.id)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-emerald-300/40"
              >
                <div className="font-semibold text-white">{theme.title}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                  #{theme.id} · {theme.student.name}
                </div>
                <p className="mt-2 text-sm text-zinc-300 line-clamp-3">
                  {theme.description}
                </p>
              </button>
            ))}
            {!themes.length ? (
              <div className="text-sm text-zinc-400">
                Aucun thème en attente.
              </div>
            ) : null}
          </div>
        </Card>

        <Card title="Validation locale / Analyse">
          <form className="space-y-4" onSubmit={moderateTheme}>
            <Field
              label="Theme ID"
              value={themeId}
              onChange={setThemeId}
              placeholder="42"
            />
            <label className="block text-sm text-zinc-300">
              Décision
              <select
                value={themeDecision}
                onChange={(event) =>
                  setThemeDecision(
                    event.target.value as "approved" | "rejected",
                  )
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              >
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </label>
            <Field
              label="Commentaire"
              value={themeComment}
              onChange={setThemeComment}
              placeholder="Commentaire de moderation"
            />
            <button className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-zinc-950">
              Valider le thème
            </button>
          </form>
          <div className="my-6 h-px bg-white/10" />
          <form className="space-y-4" onSubmit={analyzeDocument}>
            <Field
              label="Document ID"
              value={analysisDocumentId}
              onChange={setAnalysisDocumentId}
              placeholder="18"
            />
            <button className="w-full rounded-2xl bg-emerald-300 px-4 py-3 font-semibold text-zinc-950">
              Lancer l’analyse
            </button>
          </form>
          {analysisMessage ? <Banner>{analysisMessage}</Banner> : null}
          {analysisResult ? (
            <pre className="mt-4 overflow-auto rounded-2xl bg-black/30 p-4 text-xs text-zinc-200">
              {JSON.stringify(analysisResult, null, 2)}
            </pre>
          ) : null}
        </Card>
      </section>
    </>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm text-zinc-300">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300"
      />
    </label>
  );
}
