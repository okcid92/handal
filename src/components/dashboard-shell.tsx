type DashboardShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function DashboardShell({ title, subtitle, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_35%),linear-gradient(180deg,#0a0a0a_0%,#111111_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Origina</p>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">{subtitle}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
              <span className="font-medium text-white">Next.js</span> full stack
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
