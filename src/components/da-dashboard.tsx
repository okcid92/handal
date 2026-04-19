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
        <div className="text-sm text-[#62483f]">
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
          <label className="block text-sm text-[#4f372b]">
            Décision
            <select
              value={themeDecision}
              onChange={(event) =>
                setThemeDecision(event.target.value as "approved" | "rejected")
              }
              className="mt-2 w-full rounded-2xl border border-[#8e2236]/20 bg-white px-4 py-3 text-[#2d1a12]"
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
          <button className="w-full rounded-2xl bg-[#8e2236] px-4 py-3 font-semibold text-white">
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
          <label className="block text-sm text-[#4f372b]">
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
              className="mt-2 w-full rounded-2xl border border-[#8e2236]/20 bg-white px-4 py-3 text-[#2d1a12]"
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
          <button className="w-full rounded-2xl bg-[#d99239] px-4 py-3 font-semibold text-white">
            Enregistrer
          </button>
        </form>
      </Card>

      <Card title="Etat">
        {message ? (
          <Banner>{message}</Banner>
        ) : (
          <div className="text-sm text-[#8f6a5a]">Aucune action récente.</div>
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
