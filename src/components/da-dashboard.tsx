"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/frontend-api";

export function DaDashboard() {
  const [overview, setOverview] = useState<{
    user: { name: string; role: string };
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [themeId, setThemeId] = useState("");
  const [themeDecision, setThemeDecision] = useState<"approved" | "rejected">(
    "approved",
  );
  const [finalScore, setFinalScore] = useState("15");
  const [themeComment, setThemeComment] = useState("");

  const [reportId, setReportId] = useState("");
  const [deliberationDecision, setDeliberationDecision] = useState<
    "final_validation" | "sanction" | "rewrite_required"
  >("final_validation");
  const [committee, setCommittee] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    apiFetch<{ user: { name: string; role: string } }>("/api/me/overview")
      .then((result) => setOverview(result))
      .catch((error) =>
        setMessage(
          error instanceof Error ? error.message : "Erreur de chargement",
        ),
      );
  }, []);

  async function validateTheme(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    try {
      const result = await apiFetch<{
        theme: { id: string; status: string; finalScore: string | null };
      }>(`/api/themes/${themeId}/validate-da`, {
        method: "PATCH",
        body: JSON.stringify({
          decision: themeDecision,
          finalScore: themeDecision === "approved" ? Number(finalScore) : null,
          comment: themeComment,
        }),
      });

      setMessage(`Thème ${result.theme.id} -> ${result.theme.status}`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Erreur validation DA",
      );
    }
  }

  async function deliberate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    try {
      const result = await apiFetch<{
        deliberation: { id: string; decision: string };
      }>(`/api/reports/${reportId}/deliberate`, {
        method: "POST",
        body: JSON.stringify({
          decision: deliberationDecision,
          committee,
          notes,
        }),
      });

      setMessage(`Délibération enregistrée: ${result.deliberation.decision}`);
      setReportId("");
      setCommittee("");
      setNotes("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Erreur délibération",
      );
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <Card title="Profil connecté">
        <div className="text-sm text-zinc-300">
          {overview?.user.name} · {overview?.user.role}
        </div>
      </Card>

      <Card title="Validation académique">
        <form className="space-y-4" onSubmit={validateTheme}>
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
                setThemeDecision(event.target.value as "approved" | "rejected")
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
            >
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
          <Field
            label="Note finale (0..20)"
            value={finalScore}
            onChange={setFinalScore}
            placeholder="15"
          />
          <Field
            label="Commentaire"
            value={themeComment}
            onChange={setThemeComment}
            placeholder="Commentaire DA"
          />
          <button className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-zinc-950">
            Valider le thème
          </button>
        </form>
      </Card>

      <Card title="Délibération finale">
        <form className="space-y-4" onSubmit={deliberate}>
          <Field
            label="Report ID"
            value={reportId}
            onChange={setReportId}
            placeholder="11"
          />
          <label className="block text-sm text-zinc-300">
            Décision
            <select
              value={deliberationDecision}
              onChange={(event) =>
                setDeliberationDecision(
                  event.target.value as
                    | "final_validation"
                    | "sanction"
                    | "rewrite_required",
                )
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
            >
              <option value="final_validation">final_validation</option>
              <option value="sanction">sanction</option>
              <option value="rewrite_required">rewrite_required</option>
            </select>
          </label>
          <Field
            label="Committee"
            value={committee}
            onChange={setCommittee}
            placeholder="Commission pédagogique"
          />
          <Field
            label="Notes"
            value={notes}
            onChange={setNotes}
            placeholder="Décision finale"
          />
          <button className="w-full rounded-2xl bg-emerald-300 px-4 py-3 font-semibold text-zinc-950">
            Enregistrer
          </button>
        </form>
      </Card>

      <Card title="Etat">
        {message ? (
          <Banner>{message}</Banner>
        ) : (
          <div className="text-sm text-zinc-400">Aucune action récente.</div>
        )}
      </Card>
    </section>
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
