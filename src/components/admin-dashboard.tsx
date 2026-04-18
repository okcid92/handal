"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/frontend-api";

export function AdminDashboard() {
  const [overview, setOverview] = useState<{
    user: { name: string; role: string };
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ user: { name: string; role: string } }>("/api/me/overview")
      .then((result) => setOverview(result))
      .catch((error) =>
        setMessage(
          error instanceof Error ? error.message : "Erreur de chargement",
        ),
      );
  }, []);

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <Card title="Supervision globale">
        <div className="text-sm text-zinc-300">
          {overview?.user.name} · {overview?.user.role}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Shortcut
            href="/student"
            title="Student"
            description="Voir le flux étudiant"
          />
          <Shortcut
            href="/teacher"
            title="Teacher"
            description="Moderation et rapports"
          />
          <Shortcut
            href="/da"
            title="DA"
            description="Validation et délibération"
          />
          <Shortcut
            href="/api/reports"
            title="API Reports"
            description="JSON des rapports"
          />
        </div>
      </Card>

      <Card title="Etat">
        {message ? (
          <Banner>{message}</Banner>
        ) : (
          <div className="text-sm text-zinc-400">Console admin prête.</div>
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

function Shortcut({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/30 hover:bg-black/30"
    >
      <div className="font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-zinc-400">{description}</div>
    </a>
  );
}
