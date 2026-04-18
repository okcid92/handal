import { LoginPanel } from "@/components/login-panel";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_34%),linear-gradient(180deg,#09090b_0%,#111827_100%)] px-4 py-6 text-zinc-900 sm:px-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <LoginPanel />

        <section className="grid gap-4 md:grid-cols-4">
          <LinkCard
            href="/api/db-test"
            title="DB test"
            description="Vérifier MySQL"
          />
          <LinkCard
            href="/student"
            title="Student"
            description="Flux étudiant"
          />
          <LinkCard
            href="/teacher"
            title="Teacher"
            description="Validation et analyse"
          />
          <LinkCard href="/da" title="DA" description="Validation finale" />
        </section>
      </main>
    </div>
  );
}

function LinkCard({
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
      className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-white shadow-[0_18px_70px_rgba(0,0,0,0.28)] transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/10"
    >
      <div className="text-sm uppercase tracking-[0.25em] text-emerald-300">
        {title}
      </div>
      <div className="mt-2 text-sm text-zinc-300">{description}</div>
    </a>
  );
}
