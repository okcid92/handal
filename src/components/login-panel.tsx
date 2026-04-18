"use client";

import { useState } from "react";

import { apiFetch } from "@/lib/frontend-api";

type LoginMode = "student" | "staff";

type LoginResponse = {
  user: {
    role: "STUDENT" | "TEACHER" | "DA" | "ADMIN";
  };
};

const demoAccounts = {
  student: { label: "Etudiant", login: "N01331820231", password: "mon926732" },
  teacher: { label: "Enseignant", login: "teacher@origina.local", password: "mon926732" },
  da: { label: "DA", login: "da@origina.local", password: "mon926732" },
  admin: { label: "Admin", login: "admin@origina.local", password: "mon926732" },
} as const;

export function LoginPanel() {
  const [mode, setMode] = useState<LoginMode>("student");
  const [login, setLogin] = useState<string>(demoAccounts.student.login);
  const [password, setPassword] = useState<string>(demoAccounts.student.password);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload =
        mode === "student"
          ? { ine: login, password }
          : { email: login, password };

      const result = await apiFetch<LoginResponse>("/api/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const role = result.user.role.toLowerCase();
      window.location.assign(`/${role}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  function useDemo(account: keyof typeof demoAccounts) {
    const selected = demoAccounts[account];
    setMode(account === "student" ? "student" : "staff");
    setLogin(selected.login);
    setPassword(selected.password);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-[2rem] border border-white/10 bg-zinc-950 p-8 text-white shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Origina</p>
        <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Plateforme académique Next.js pour le suivi de mémoire.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300">
          Connexion par INE pour les étudiants, par email pour le personnel.
          Tout le workflow thème, dépôt, analyse et délibération est centralisé
          dans une seule application.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Student</div>
            <div className="mt-2 text-sm text-zinc-200">Proposition, dépôt, auto-test</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Teacher</div>
            <div className="mt-2 text-sm text-zinc-200">Validation locale, analyse officielle</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">DA / Admin</div>
            <div className="mt-2 text-sm text-zinc-200">Validation finale, délibération</div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
        <div className="flex gap-2 rounded-full bg-zinc-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("student");
              setLogin(demoAccounts.student.login);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${mode === "student" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
          >
            Etudiant
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("staff");
              setLogin(demoAccounts.teacher.login);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${mode === "staff" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
          >
            Personnel
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-zinc-700">{mode === "student" ? "INE" : "Email"}</label>
            <input
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900"
              placeholder={mode === "student" ? "N01331820231" : "teacher@origina.local"}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900"
              autoComplete="current-password"
            />
          </div>

          {message ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {Object.entries(demoAccounts).map(([key, account]) => (
            <button
              key={key}
              type="button"
              onClick={() => useDemo(key as keyof typeof demoAccounts)}
              className="rounded-2xl border border-zinc-200 px-4 py-3 text-left text-sm transition hover:border-zinc-900 hover:bg-zinc-50"
            >
              <div className="font-semibold text-zinc-900">{account.label}</div>
              <div className="text-zinc-500">{account.login}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
