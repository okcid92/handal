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
    login: "teacher@handal.local",
    password: "mon926732",
  },
  da: { label: "DA", login: "da@handal.local", password: "mon926732" },
  admin: {
    label: "Admin",
    login: "admin@handal.local",
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
      <section className="rounded-[1.5rem] border border-[#7b2438]/18 bg-white/82 p-5 sm:p-6">
        <div className="flex gap-2 rounded-full border border-[#7b2438]/14 bg-[#f7f1e8] p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("student");
              setLogin(demoAccounts.student.login);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${mode === "student" ? "btn-primary" : "text-[#71554a] hover:text-slate-900"}`}
          >
            Etudiant
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("staff");
              setLogin(demoAccounts.teacher.login);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${mode === "staff" ? "btn-primary" : "text-[#71554a] hover:text-slate-900"}`}
          >
            Personnel
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">
              {mode === "student" ? "INE" : "Email"}
            </label>
            <input
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#7b2438]/18 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b2438]"
              placeholder={
                mode === "student" ? "N01331820231" : "teacher@handal.local"
              }
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#7b2438]/18 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b2438]"
              autoComplete="current-password"
            />
          </div>

          {message ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-6">
          <label className="text-sm font-medium text-slate-700">
            Comptes de démonstration
          </label>
          <select
            onChange={(e) => {
              const selected = e.target.value as keyof typeof demoAccounts;
              if (selected) fillDemoAccount(selected);
            }}
            className="mt-2 w-full rounded-2xl border border-[#7b2438]/18 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#7b2438]"
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
    </div>
  );
}
