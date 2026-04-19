import { LoginPanel } from "@/components/login-panel";

const featureCards = [
  {
    title: "Détection multi-niveaux",
    description:
      "Analyse du plagiat direct, de la paraphrase et des reformulations issues de traduction automatique sur un seul parcours.",
    accent: "amber",
    tag: "Moteur",
  },
  {
    title: "Flux par rôle",
    description:
      "Espaces dédiés aux étudiants, enseignants, DA et administrateurs avec des étapes claires et contrôlées.",
    accent: "cyan",
    tag: "Workflow",
  },
  {
    title: "Rapports exploitables",
    description:
      "Résultats structurés, scores, décisions et traces d'analyse pour suivre un mémoire de bout en bout.",
    accent: "emerald",
    tag: "Reporting",
  },
  {
    title: "Sécurité active",
    description:
      "Contrôles same-origin, cookies signés, et garde-fous serveur pour protéger les actions sensibles.",
    accent: "violet",
    tag: "Protection",
  },
  {
    title: "Décisions finales",
    description:
      "Validation académique, délibération et archivage final au même endroit, sans navigation superflue.",
    accent: "rose",
    tag: "Décision",
  },
  {
    title: "Tests automatiques",
    description:
      "Vitest, Playwright et Selenium vérifient les parcours clés et les cas d'erreur avant livraison.",
    accent: "sky",
    tag: "QA",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Accès étudiant",
    description:
      "Connexion par INE, proposition de thème, dépôt final et lancement des auto-tests.",
  },
  {
    step: "02",
    title: "Validation enseignant",
    description:
      "Contrôle du thème, analyse officielle du document et saisie du rapport de conformité.",
  },
  {
    step: "03",
    title: "Délibération DA",
    description:
      "Validation académique, note finale et délibération finale avant publication du statut.",
  },
];

const highlights = [
  "Navigation pensée pour les institutions IBAM et MIAGE.",
  "Interface sombre, contrastée et focalisée sur les décisions.",
  "Toutes les actions critiques restent centralisées et auditables.",
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0f16] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(17,82,212,0.24),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.16),_transparent_26%),linear-gradient(180deg,#0b0f16_0%,#101622_48%,#0b0f16_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="sticky top-4 z-20 rounded-[1.75rem] border border-white/10 bg-[#101622]/85 px-6 py-4 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1152d4] to-[#f59e0b] text-sm font-black tracking-[0.25em] text-white shadow-[0_16px_40px_rgba(17,82,212,0.35)]">
                H
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-300">
                  Handal
                </p>
                <p className="text-sm text-slate-300">
                  Plateforme académique, validation et gouvernance des mémoires.
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <a className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:text-white" href="#solution">
                Solution
              </a>
              <a className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:text-white" href="#workflow">
                Workflow
              </a>
              <a className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:text-white" href="#securite">
                Sécurité
              </a>
              <a className="rounded-full bg-white px-4 py-2 font-semibold text-[#101622] transition hover:bg-slate-200" href="#connexion">
                Connexion
              </a>
            </nav>
          </div>
        </header>

        <section className="grid gap-8 py-4 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-10">
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border border-[#1152d4]/30 bg-[#1152d4]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.32em] text-sky-200">
              Intégrité académique 2.0
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-black tracking-tighter leading-[0.95] text-balance sm:text-6xl lg:text-7xl">
                Handal orchestre la détection, la validation et la délibération
                des mémoires dans un seul flux.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Une interface sombre, dense et focalisée sur l’action pour gérer
                les dépôts, les analyses et les validations finales des parcours
                académiques.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="#connexion"
                className="inline-flex items-center justify-center rounded-2xl bg-[#1152d4] px-7 py-4 text-base font-bold text-white shadow-[0_18px_60px_rgba(17,82,212,0.28)] transition hover:translate-y-[-1px] hover:bg-[#0f49bf]"
              >
                Accéder à la connexion
              </a>
              <a
                href="#solution"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-base font-bold text-white transition hover:border-white/20 hover:bg-white/10"
              >
                Explorer la plateforme
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard value="3 rôles" label="Étudiant, enseignant, DA" />
              <MetricCard value="1 workflow" label="Thème, dépôt, délibération" />
              <MetricCard value="0 friction" label="Tests et contrôles intégrés" />
            </div>
          </div>

          <div id="connexion" className="scroll-mt-28">
            <LoginPanel />
          </div>
        </section>

        <section id="solution" className="space-y-6 py-8 lg:py-12">
          <SectionHeading
            eyebrow="Excellence analytique"
            title="Une interface de supervision pensée comme un poste de contrôle"
            description="Le design reprend les codes d’un tableau de bord institutionnel: blocs serrés, contrastes forts et hiérarchie claire pour prioriser l’action."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            {featureCards.map((card, index) => (
              <div
                key={card.title}
                className={`rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-white/20 ${index === 0 || index === 5 ? "md:col-span-8" : "md:col-span-4"}`}
              >
                <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${accentClasses[card.accent]}`}>
                  {card.tag}
                </div>
                <h2 className="mt-5 text-2xl font-bold tracking-tight text-white">
                  {card.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="grid gap-6 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:py-12">
          <div className="space-y-6 rounded-[1.9rem] border border-white/10 bg-white/5 p-7 backdrop-blur">
            <SectionHeading
              eyebrow="Pourquoi Handal"
              title="Conçu pour les institutions qui veulent du contrôle sans surcharge"
              description="Handal réduit les allers-retours entre portails et rassemble les étapes sensibles dans une seule surface opérationnelle."
            />

            <ul className="space-y-4 text-sm leading-7 text-slate-300 sm:text-base">
              {highlights.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#f59e0b] shadow-[0_0_0_6px_rgba(245,158,11,0.12)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {workflowSteps.map((step) => (
              <article
                key={step.step}
                className="rounded-[1.75rem] border border-white/10 bg-[#101622]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
              >
                <div className="text-xs font-bold uppercase tracking-[0.35em] text-[#f59e0b]">
                  {step.step}
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-tight text-white">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="securite" className="py-8 lg:py-12">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(17,82,212,0.24),rgba(245,158,11,0.14))] p-8 shadow-[0_28px_100px_rgba(0,0,0,0.24)] sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_36%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] text-white/90">
                  Sécurité et exploitation
                </div>
                <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tighter text-white sm:text-4xl">
                  Une base visuelle premium, robuste et prête pour les parcours
                  critiques.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                  Le front garde des repères forts: navigation claire, blocs de
                  contrôle lisibles, et contraste net pour accélérer la lecture
                  des décisions.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ActionCard title="Intégration" description="Pages rôle, login et suivi unifiés." />
                <ActionCard title="Lisibilité" description="Hiérarchie nette, blocs denses, CTA explicites." />
                <ActionCard title="Contraste" description="Palette sombre, accents bleus et or." />
                <ActionCard title="Évolution" description="Base prête pour nouveaux écrans et workflows." />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.2)]">
      <div className="text-2xl font-black tracking-tight text-white">
        {value}
      </div>
      <div className="mt-2 text-sm text-slate-300">{label}</div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl space-y-4">
      <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.32em] text-sky-200">
        {eyebrow}
      </div>
      <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="text-sm leading-7 text-slate-300 sm:text-base">
        {description}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-[#101622]/75 p-4 text-sm shadow-[0_14px_50px_rgba(0,0,0,0.18)]">
      <div className="font-semibold text-white">{title}</div>
      <div className="mt-2 leading-6 text-slate-300">{description}</div>
    </div>
  );
}

const accentClasses: Record<string, string> = {
  amber: "bg-[#f59e0b]/10 text-[#fde68a]",
  cyan: "bg-[#1152d4]/10 text-[#bfdbfe]",
  emerald: "bg-emerald-500/10 text-emerald-200",
  violet: "bg-violet-500/10 text-violet-200",
  rose: "bg-rose-500/10 text-rose-200",
  sky: "bg-sky-500/10 text-sky-200",
};
