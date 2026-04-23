"use client";

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
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-serif text-4xl font-normal leading-[1.05] tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-medium text-[#5f483e]">
                {subtitle}
              </p>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
