import Link from "next/link";

type DashboardShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function DashboardShell({
  title,
  subtitle,
  children,
}: DashboardShellProps) {
  return (
    <div className="app-shell min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="section-frame rounded-[2rem] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.32em] text-[#8e2236]">
              Handal Strategic Console
            </p>
            <Link
              href="/"
              className="rounded-full border border-[#8e2236]/20 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4a2f23] transition hover:border-[#8e2236]/45"
            >
              Retour Accueil
            </Link>
          </div>

          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-[#8e2236]">
            Handal
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="headline-tight text-3xl font-bold text-[#2d1a12] sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62483f]">
                {subtitle}
              </p>
            </div>
            <div className="rounded-2xl border border-[#8e2236]/20 bg-white/80 px-4 py-3 text-sm text-[#62483f]">
              <span className="font-semibold text-[#2d1a12]">Next.js 16</span> ·
              UI cockpit
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[#4a2f23]">
            <Link
              className="rounded-full border border-[#8e2236]/20 bg-white/80 px-3 py-1.5 transition hover:border-[#8e2236]/45"
              href="/student"
            >
              Student
            </Link>
            <Link
              className="rounded-full border border-[#8e2236]/20 bg-white/80 px-3 py-1.5 transition hover:border-[#8e2236]/45"
              href="/teacher"
            >
              Teacher
            </Link>
            <Link
              className="rounded-full border border-[#8e2236]/20 bg-white/80 px-3 py-1.5 transition hover:border-[#8e2236]/45"
              href="/da"
            >
              DA
            </Link>
            <Link
              className="rounded-full border border-[#8e2236]/20 bg-white/80 px-3 py-1.5 transition hover:border-[#8e2236]/45"
              href="/admin"
            >
              Admin
            </Link>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
