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
        <div className="text-sm text-[#62483f]">
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
          <div className="text-sm text-[#8f6a5a]">Console admin prête.</div>
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
      className="rounded-2xl border border-[#8e2236]/20 bg-white/85 p-4 transition hover:-translate-y-0.5 hover:border-[#8e2236]/45 hover:bg-[#fff7eb]"
    >
      <div className="font-semibold text-[#2d1a12]">{title}</div>
      <div className="mt-1 text-sm text-[#8f6a5a]">{description}</div>
    </a>
  );
}
