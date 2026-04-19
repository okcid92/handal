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
    <div className="section-frame rounded-[2rem] p-5 sm:p-6">
      <div className="rounded-[1.5rem] border border-[#8e2236]/20 bg-[radial-gradient(circle_at_top_right,_rgba(217,146,57,0.2),_transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,250,241,0.84))] p-5 sm:p-6">
        <div className="inline-flex items-center rounded-full border border-[#8e2236]/35 bg-[#8e2236]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-[#8e2236]">
          Handal Access
        </div>
        <h2 className="headline-tight mt-4 text-3xl font-bold text-[#2d1a12] sm:text-4xl">
          Connexion sécurisée
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[#62483f] sm:text-base">
          Accès étudiant par INE et accès personnel par email pour piloter le
          cycle thème, dépôt, analyse et délibération.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#8e2236]/15 bg-white/80 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-[#8f6a5a]">
              Étudiants
            </div>
            <div className="mt-2 text-sm text-[#2d1a12]">
              Proposition, dépôt, auto-test
            </div>
          </div>
          <div className="rounded-2xl border border-[#8e2236]/15 bg-white/80 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-[#8f6a5a]">
              Enseignants
            </div>
            <div className="mt-2 text-sm text-[#2d1a12]">
              Validation locale et analyse officielle
            </div>
          </div>
          <div className="rounded-2xl border border-[#8e2236]/15 bg-white/80 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-[#8f6a5a]">
              DA / Admin
            </div>
            <div className="mt-2 text-sm text-[#2d1a12]">
              Validation académique et délibération
            </div>
          </div>
        </div>
      </div>

      <section className="mt-5 rounded-[1.5rem] border border-[#8e2236]/20 bg-white/75 p-5 sm:p-6">
        <div className="flex gap-2 rounded-full border border-[#8e2236]/20 bg-[#f7efdf] p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("student");
              setLogin(demoAccounts.student.login);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${mode === "student" ? "bg-[#8e2236] text-white shadow-sm" : "text-[#7d5d52] hover:text-[#2d1a12]"}`}
          >
            Etudiant
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("staff");
              setLogin(demoAccounts.teacher.login);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${mode === "staff" ? "bg-[#8e2236] text-white shadow-sm" : "text-[#7d5d52] hover:text-[#2d1a12]"}`}
          >
            Personnel
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-[#4f372b]">
              {mode === "student" ? "INE" : "Email"}
            </label>
            <input
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#8e2236]/20 bg-white px-4 py-3 text-[#2d1a12] outline-none transition placeholder:text-[#aa8b7e] focus:border-[#8e2236]"
              placeholder={
                mode === "student" ? "N01331820231" : "teacher@origina.local"
              }
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#4f372b]">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#8e2236]/20 bg-white px-4 py-3 text-[#2d1a12] outline-none transition placeholder:text-[#aa8b7e] focus:border-[#8e2236]"
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
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#8e2236] px-5 py-3 font-semibold text-white transition hover:bg-[#6a1728] disabled:cursor-not-allowed disabled:opacity-60"
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
              className="rounded-2xl border border-[#8e2236]/20 bg-white px-4 py-3 text-left text-sm transition hover:border-[#8e2236]/45 hover:bg-[#fff7eb]"
            >
              <div className="font-semibold text-[#2d1a12]">
                {account.label}
              </div>
              <div className="mt-1 text-[#8f6a5a]">{account.login}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
