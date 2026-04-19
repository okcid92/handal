"use client";

import { useEffect, useState } from "react";
import { Globe, Server, ChevronRight } from "lucide-react";

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
      <Card title="Supervision globale" icon={Globe}>
        <div className="text-sm text-slate-600">
          {overview?.user.name} · {overview?.user.role}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Shortcut href="/student" title="Student" description="Voir le flux étudiant" />
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

      <Card title="Etat du serveur" icon={Server}>
        {message ? (
          <Banner>{message}</Banner>
        ) : (
          <div className="text-sm text-slate-500">Console admin prête.</div>
        )}
      </Card>
    </section>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="section-frame rounded-[1.75rem] p-5">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-2">
        {Icon ? <Icon className="w-5 h-5 text-accent" /> : null} {title}
      </h2>
      {children}
    </section>
  );
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#c98a2f]/35 bg-[#fff6e6] px-4 py-3 text-sm text-[#755028]">
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
      className="rounded-2xl border border-[#7b2438]/14 bg-white/88 p-4 transition hover:-translate-y-0.5 hover:border-[#c98a2f]/55 hover:bg-slate-50 group flex items-start justify-between"
    >
      <div>
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="mt-1 text-sm text-slate-500">{description}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500 transition group-hover:text-[#7b2438] group-hover:translate-x-1" />
    </a>
  );
}
