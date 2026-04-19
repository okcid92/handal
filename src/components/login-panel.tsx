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
  teacher: {
    label: "Enseignant",
    login: "teacher@origina.local",
    password: "mon926732",
  },
  da: { label: "DA", login: "da@origina.local", password: "mon926732" },
  admin: {
    label: "Admin",
    login: "admin@origina.local",
    password: "mon926732",
  },
} as const;

export function LoginPanel() {
  const [mode, setMode] = useState<LoginMode>("student");
  const [login, setLogin] = useState<string>(demoAccounts.student.login);
  const [password, setPassword] = useState<string>(
    demoAccounts.student.password,
  );
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
      setMessage(
        error instanceof Error ? error.message : "Erreur de connexion",
      );
    } finally {
      setLoading(false);
    }
  }

  function fillDemoAccount(account: keyof typeof demoAccounts) {
    const selected = demoAccounts[account];
    setMode(account === "student" ? "student" : "staff");
    setLogin(selected.login);
    setPassword(selected.password);
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#101622]/90 p-5 shadow-[0_24px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-6">
      <div className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(17,82,212,0.18),_transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 sm:p-6">
        <div className="inline-flex items-center rounded-full border border-[#1152d4]/30 bg-[#1152d4]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-sky-200">
          Handal Access
        </div>
        <h2 className="mt-4 text-3xl font-black tracking-tighter text-white sm:text-4xl">
          Connexion sécurisée
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
          Accès étudiant par INE et accès personnel par email pour piloter le
          cycle thème, dépôt, analyse et délibération.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Étudiants
            </div>
            <div className="mt-2 text-sm text-slate-200">
              Proposition, dépôt, auto-test
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Enseignants
            </div>
            <div className="mt-2 text-sm text-slate-200">
              Validation locale et analyse officielle
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
              DA / Admin
            </div>
            <div className="mt-2 text-sm text-slate-200">
              Validation académique et délibération
            </div>
          </div>
        </div>
      </div>

      <section className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex gap-2 rounded-full border border-white/10 bg-black/20 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("student");
              setLogin(demoAccounts.student.login);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${mode === "student" ? "bg-white text-[#101622] shadow-sm" : "text-slate-400 hover:text-white"}`}
          >
            Etudiant
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("staff");
              setLogin(demoAccounts.teacher.login);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${mode === "staff" ? "bg-white text-[#101622] shadow-sm" : "text-slate-400 hover:text-white"}`}
          >
            Personnel
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-200">
              {mode === "student" ? "INE" : "Email"}
            </label>
            <input
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-[#1152d4]"
              placeholder={
                mode === "student" ? "N01331820231" : "teacher@origina.local"
              }
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-200">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-[#1152d4]"
              autoComplete="current-password"
            />
          </div>

          {message ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1152d4] px-5 py-3 font-semibold text-white transition hover:bg-[#0f49bf] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {Object.entries(demoAccounts).map(([key, account]) => (
            <button
              key={key}
              type="button"
              onClick={() => fillDemoAccount(key as keyof typeof demoAccounts)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm transition hover:border-white/20 hover:bg-white/5"
            >
              <div className="font-semibold text-white">{account.label}</div>
              <div className="mt-1 text-slate-400">{account.login}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
