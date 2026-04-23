"use client";

import { useState } from "react";

import { apiFetch } from "@/lib/frontend-api";

type LoginMode = "student" | "staff";

type LoginResponse = {
  user: {
    role: "STUDENT" | "TEACHER" | "DA" | "ADMIN";
  };
};

const DEMO_PASSWORD = "mon926732";

const demoAccounts = {
  student: {
    label: "Etudiant",
    login: "N01331820231",
    password: DEMO_PASSWORD,
  },
  teacher: {
    label: "Enseignant",
    login: "teacher@handal.local",
    password: DEMO_PASSWORD,
  },
  da: { label: "DA", login: "da@handal.local", password: DEMO_PASSWORD },
  admin: {
    label: "Admin",
    login: "admin@handal.local",
    password: DEMO_PASSWORD,
  },
} as const;

type ApiErrorWithCode = Error & { code?: string; status?: number };

function mapAuthError(error: unknown): string {
  const err = error as ApiErrorWithCode;
  const code = err?.code;
  const status = err?.status;
  if (code === "INVALID_CREDENTIALS" || status === 401) {
    return "Identifiant ou mot de passe incorrect.";
  }
  if (code === "INVALID_LOGIN_CHANNEL") {
    const msg = err?.message ?? "";
    if (msg.includes("INE"))
      return "Les étudiants doivent se connecter avec leur INE, pas un email.";
    if (msg.includes("Student"))
      return "Ce compte étudiant doit utiliser l\u2019onglet \u00ab\u00a0Etudiant\u00a0\u00bb avec son INE.";
    return "Canal de connexion incorrect pour ce rôle.";
  }
  if (code === "RATE_LIMIT_EXCEEDED" || status === 429) {
    return "Trop de tentatives. Veuillez patienter avant de réessayer.";
  }
  if (status === 500) {
    return "Erreur serveur Handal. Veuillez réessayer dans un instant.";
  }
  return err?.message ?? "Erreur de connexion.";
}

export function LoginPanel() {
  const [mode, setMode] = useState<LoginMode>("student");
  const [login, setLogin] = useState<string>(demoAccounts.student.login);
  const [password, setPassword] = useState<string>(DEMO_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload =
        mode === "student"
          ? { ine: login.trim(), password }
          : { email: login.trim().toLowerCase(), password };

      const result = await apiFetch<LoginResponse>("/api/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const role = result.user.role.toLowerCase();
      // Laisser le cookie se propager avant la navigation
      await new Promise((resolve) => setTimeout(resolve, 80));
      window.location.assign(`/${role}`);
    } catch (error) {
      setMessage(mapAuthError(error));
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
    <section className="w-full rounded-[22px] border border-[#ddd4c4] bg-white p-5 shadow-[0_6px_22px_rgba(30,20,16,0.1)] sm:rounded-[24px] sm:p-[1.75rem]">
      <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-[#ddd4c4] bg-[#f4efe8] p-1.5">
        <button
          type="button"
          onClick={() => {
            setMode("student");
            setLogin(demoAccounts.student.login);
          }}
          className={`rounded-md px-3 py-2 text-[1rem] font-medium transition sm:py-2.5 sm:text-[1.1rem] ${mode === "student" ? "bg-[#7d1c2a] !text-white shadow-[0_1px_4px_rgba(125,28,42,0.25)]" : "text-[#8a7a6e] hover:text-[#1e1410]"}`}
        >
          Etudiant
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("staff");
            setLogin(demoAccounts.teacher.login);
          }}
          className={`rounded-md px-3 py-2 text-[1rem] font-medium transition sm:py-2.5 sm:text-[1.1rem] ${mode === "staff" ? "bg-[#7d1c2a] !text-white shadow-[0_1px_4px_rgba(125,28,42,0.25)]" : "text-[#8a7a6e] hover:text-[#1e1410]"}`}
        >
          Personnel
        </button>
      </div>

      <form
        className="mt-5 space-y-4 sm:mt-7 sm:space-y-4.5"
        onSubmit={handleSubmit}
      >
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b5649] sm:text-[13px]">
            {mode === "student" ? "INE" : "Email"}
          </label>
          <input
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#ddd4c4] bg-[#f4efe8] px-4 py-[0.8rem] text-[1rem] text-[#1e1410] outline-none transition placeholder:text-[#6b5649] focus:border-[#7d1c2a] focus:shadow-[0_0_0_3px_rgba(125,28,42,0.08)] sm:py-[0.95rem] sm:text-[1.1rem]"
            placeholder={
              mode === "student" ? "N01331820231" : "teacher@handal.local"
            }
            autoComplete="username"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b5649] sm:text-[13px]">
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#ddd4c4] bg-[#f4efe8] px-4 py-[0.8rem] text-[1rem] text-[#1e1410] outline-none transition placeholder:text-[#6b5649] focus:border-[#7d1c2a] focus:shadow-[0_0_0_3px_rgba(125,28,42,0.08)] sm:py-[0.95rem] sm:text-[1.1rem]"
            autoComplete="current-password"
          />
        </div>

        {message ? (
          <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-[1rem] text-rose-900 sm:text-[1.1rem]">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[9px] bg-[#7d1c2a] px-5 py-[0.8rem] text-[1rem] font-medium text-white transition hover:bg-[#5c1220] disabled:cursor-not-allowed disabled:opacity-60 sm:py-[0.95rem] sm:text-[1.1rem]"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <div className="mt-5 sm:mt-6">
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b5649] sm:text-[13px]">
          Comptes de demonstration
        </label>
        <select
          onChange={(e) => {
            const selected = e.target.value as keyof typeof demoAccounts;
            if (selected) fillDemoAccount(selected);
          }}
          className="w-full cursor-pointer rounded-lg border border-[#ddd4c4] bg-[#f4efe8] px-4 py-[0.8rem] text-[1rem] text-[#3f2d24] outline-none transition focus:border-[#7d1c2a] sm:py-[0.95rem] sm:text-[1.1rem]"
        >
          <option value="">Choisir un compte...</option>
          {Object.entries(demoAccounts).map(([key, account]) => (
            <option key={key} value={key}>
              {account.label} - {account.login}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
