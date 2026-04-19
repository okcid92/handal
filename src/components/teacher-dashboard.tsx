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
          <div className="text-sm text-[#62483f]">
            {overview?.user.name} · {overview?.user.role}
          </div>
        </Card>
        <Card title="Rapports récents">
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-[#8e2236]/20 bg-white/85 p-4 text-sm text-[#62483f]"
              >
                <div className="font-semibold text-[#2d1a12]">
                  Rapport #{report.id}
                </div>
                <div>Document {report.documentId}</div>
                <div>
                  Similarité {report.globalSimilarity}% · {report.riskLevel}
                </div>
              </div>
            ))}
            {!reports.length ? (
              <div className="text-sm text-[#8f6a5a]">
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
                className="w-full rounded-2xl border border-[#8e2236]/20 bg-white/85 p-4 text-left transition hover:border-[#8e2236]/45"
              >
                <div className="font-semibold text-[#2d1a12]">
                  {theme.title}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#8f6a5a]">
                  #{theme.id} · {theme.student.name}
                </div>
                <p className="mt-2 text-sm text-[#62483f] line-clamp-3">
                  {theme.description}
                </p>
              </button>
            ))}
            {!themes.length ? (
              <div className="text-sm text-[#8f6a5a]">
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
            <label className="block text-sm text-[#4f372b]">
              Décision
              <select
                value={themeDecision}
                onChange={(event) =>
                  setThemeDecision(
                    event.target.value as "approved" | "rejected",
                  )
                }
                className="mt-2 w-full rounded-2xl border border-[#8e2236]/20 bg-white px-4 py-3 text-[#2d1a12]"
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
            <button className="w-full rounded-2xl bg-[#8e2236] px-4 py-3 font-semibold text-white">
              Valider le thème
            </button>
          </form>
          <div className="my-6 h-px bg-[#8e2236]/15" />
          <form className="space-y-4" onSubmit={analyzeDocument}>
            <Field
              label="Document ID"
              value={analysisDocumentId}
              onChange={setAnalysisDocumentId}
              placeholder="18"
            />
            <button className="w-full rounded-2xl bg-[#d99239] px-4 py-3 font-semibold text-white">
              Lancer l’analyse
            </button>
          </form>
          {analysisMessage ? <Banner>{analysisMessage}</Banner> : null}
          {analysisResult ? (
            <pre className="mt-4 overflow-auto rounded-2xl bg-[#f6ead4] p-4 text-xs text-[#4a2f23]">
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
    <section className="section-frame rounded-[1.75rem] p-5">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-[#2d1a12]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#d99239]/40 bg-[#fff5e5] px-4 py-3 text-sm text-[#7a542a]">
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
      <div className="text-sm text-[#4f372b]">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-[#8e2236]/20 bg-white px-4 py-3 text-[#2d1a12] outline-none transition placeholder:text-[#aa8b7e] focus:border-[#8e2236]"
      />
    </label>
  );
}
