import Image from "next/image";
import { LoginPanel } from "@/components/login-panel";

const featureCards = [
  {
    title: "Détection multi-niveaux",
    description:
      "Analyse du plagiat direct, de la paraphrase et des reformulations issues de traduction automatique sur un seul parcours.",
    accent: "amber" as const,
    tag: "Moteur",
  },
  {
    title: "Flux par rôle",
    description:
      "Espaces dédiés aux étudiants, enseignants, DA et administrateurs avec des étapes claires et contrôlées.",
    accent: "cyan" as const,
    tag: "Workflow",
  },
  {
    title: "Rapports exploitables",
    description:
      "Résultats structurés, scores, décisions et traces d'analyse pour suivre un mémoire de bout en bout.",
    accent: "emerald" as const,
    tag: "Reporting",
  },
  {
    title: "Sécurité active",
    description:
      "Contrôles same-origin, cookies signés, et garde-fous serveur pour protéger les actions sensibles.",
    accent: "violet" as const,
    tag: "Protection",
  },
  {
    title: "Décisions finales",
    description:
      "Validation académique, délibération et archivage final au même endroit, sans navigation superflue.",
    accent: "rose" as const,
    tag: "Décision",
  },
  {
    title: "Tests automatiques",
    description:
      "Vitest, Playwright et Selenium vérifient les parcours clés et les cas d'erreur avant livraison.",
    accent: "sky" as const,
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
  "Interface claire, premium et focalisée sur les décisions.",
  "Toutes les actions critiques restent centralisées et auditables.",
];

export default function Home() {
  return (
    <div className="app-shell relative min-h-screen overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 pb-10">
        <nav className="fade-up sticky top-4 z-20 glass-card rounded-3xl px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="brand-logo-ring flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#fff8eb]">
                <Image
                  src="/brand/handal-lamp.png"
                  alt="Handal"
                  width={40}
                  height={40}
                />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7b2032]">
                  Handal
                </div>
                <div className="text-xs text-[#8f6a5a]">
                  Academic Integrity Platform
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-[#4a2f23]">
              <a
                className="rounded-full border border-[#8e2236]/20 bg-white/70 px-4 py-2 transition hover:border-[#8e2236]/40"
                href="#solution"
              >
                Solutions
              </a>
              <a
                className="rounded-full border border-[#8e2236]/20 bg-white/70 px-4 py-2 transition hover:border-[#8e2236]/40"
                href="#workflow"
              >
                Workflow
              </a>
              <a
                className="rounded-full border border-[#8e2236]/20 bg-white/70 px-4 py-2 transition hover:border-[#8e2236]/40"
                href="#securite"
              >
                Sécurité
              </a>
              <a
                className="rounded-full bg-[#8e2236] px-4 py-2 font-semibold text-white transition hover:bg-[#6a1728]"
                href="#connexion"
              >
                Connexion
              </a>
            </div>
          </div>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-8">
            <div className="fade-up tag-chip">Intégrité académique 2.0</div>

            <div className="fade-up delay-1 space-y-5">
              <h1 className="headline-tight max-w-4xl text-5xl font-bold text-[#2d1a12] sm:text-6xl lg:text-7xl">
                Handal orchestre la détection, la validation et la délibération
                des mémoires dans un seul flux.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#62483f] sm:text-xl">
                Une direction artistique premium inspirée de PolyPlag: structure
                éditoriale forte, sections immersives, CTA explicites et
                dashboards orientés décision.
              </p>
            </div>

            <div className="fade-up delay-2 flex flex-wrap gap-4">
              <a
                href="#connexion"
                className="inline-flex items-center justify-center rounded-2xl bg-[#8e2236] px-7 py-4 text-base font-bold text-white shadow-[0_20px_64px_rgba(142,34,54,0.24)] transition hover:translate-y-[-1px] hover:bg-[#6a1728]"
              >
                Accéder à la connexion
              </a>
              <a
                href="#solution"
                className="inline-flex items-center justify-center rounded-2xl border border-[#8e2236]/25 bg-white/75 px-7 py-4 text-base font-bold text-[#4a2f23] transition hover:border-[#8e2236]/45"
              >
                Explorer la plateforme
              </a>
            </div>

            <div className="fade-up delay-3 grid gap-3 sm:grid-cols-3">
              <MetricCard value="3 rôles" label="Étudiant, enseignant, DA" />
              <MetricCard
                value="1 workflow"
                label="Thème, dépôt, délibération"
              />
              <MetricCard
                value="0 friction"
                label="Tests et contrôles intégrés"
              />
            </div>
          </div>

          <div id="connexion" className="scroll-mt-28">
            <LoginPanel />
          </div>
        </section>

        <section id="solution" className="space-y-6">
          <SectionHeading
            eyebrow="Excellence analytique"
            title="Un cockpit institutionnel pour piloter tout le cycle académique"
            description="Inspiration directe du style référence: bento dense, forts contrastes, accent bleu-or et lisibilité immédiate sur desktop comme mobile."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            {featureCards.map((card, index) => (
              <div
                key={card.title}
                className={`section-frame rounded-[1.75rem] p-6 transition hover:-translate-y-1 ${index === 0 || index === 5 ? "md:col-span-8" : "md:col-span-4"}`}
              >
                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${accentClasses[card.accent]}`}
                >
                  {card.tag}
                </div>
                <h2 className="mt-5 text-2xl font-bold tracking-tight text-[#2d1a12]">
                  {card.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#62483f] sm:text-base">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="workflow"
          className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start"
        >
          <div className="section-frame space-y-6 rounded-[1.9rem] p-7">
            <SectionHeading
              eyebrow="Pourquoi Handal"
              title="Conçu pour les institutions qui veulent du contrôle sans surcharge"
              description="Chaque rôle reste dans son corridor d'action, avec des checkpoints explicites et une gouvernance lisible pour l'administration et la DA."
            />

            <ul className="space-y-4 text-sm leading-7 text-[#62483f] sm:text-base">
              {highlights.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#d99239] shadow-[0_0_0_6px_rgba(217,146,57,0.18)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {workflowSteps.map((step) => (
              <article
                key={step.step}
                className="section-frame rounded-[1.75rem] p-6"
              >
                <div className="text-xs font-bold uppercase tracking-[0.35em] text-[#8e2236]">
                  {step.step}
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-tight text-[#2d1a12]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#62483f]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="securite">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#8e2236]/20 bg-[linear-gradient(135deg,rgba(255,249,239,0.96),rgba(245,228,195,0.95))] p-8 shadow-[0_28px_80px_rgba(105,63,32,0.16)] sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(142,34,54,0.09),_transparent_42%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex rounded-full border border-[#8e2236]/25 bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] text-[#8e2236]">
                  Sécurité et exploitation
                </div>
                <h2 className="headline-tight mt-5 max-w-3xl text-3xl font-bold text-[#2d1a12] sm:text-4xl">
                  Une base visuelle ambitieuse, robuste et prête pour les
                  parcours critiques.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#62483f] sm:text-base">
                  Le front conserve la lisibilité opérationnelle de vos flux,
                  tout en gagnant en caractère visuel et en impact
                  institutionnel.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ActionCard
                  title="Intégration"
                  description="Pages rôle, login et suivi unifiés."
                />
                <ActionCard
                  title="Lisibilité"
                  description="Hiérarchie nette, blocs denses, CTA explicites."
                />
                <ActionCard
                  title="Contraste"
                  description="Palette sombre, accents bleus et or."
                />
                <ActionCard
                  title="Évolution"
                  description="Base prête pour nouveaux écrans et workflows."
                />
              </div>
            </div>
          </div>
        </section>

        <footer className="section-frame rounded-3xl px-6 py-8 text-sm text-[#62483f] sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-bold tracking-tight text-[#2d1a12]">
                Handal
              </div>
              <div className="mt-1 text-[#89665b]">
                © 2026 Handal Academic Systems. Tous droits réservés.
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em]">
              <a
                className="rounded-full border border-[#8e2236]/25 bg-white/70 px-3 py-1.5 hover:border-[#8e2236]/45"
                href="#"
              >
                Privacy
              </a>
              <a
                className="rounded-full border border-[#8e2236]/25 bg-white/70 px-3 py-1.5 hover:border-[#8e2236]/45"
                href="#"
              >
                Terms
              </a>
              <a
                className="rounded-full border border-[#8e2236]/25 bg-white/70 px-3 py-1.5 hover:border-[#8e2236]/45"
                href="#"
              >
                Support
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="section-frame rounded-[1.5rem] p-5">
      <div className="text-2xl font-black tracking-tight text-[#2d1a12]">
        {value}
      </div>
      <div className="mt-2 text-sm text-[#6a4d43]">{label}</div>
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
      <div className="tag-chip">{eyebrow}</div>
      <h2 className="headline-tight text-3xl font-bold text-[#2d1a12] sm:text-4xl">
        {title}
      </h2>
      <p className="text-sm leading-7 text-[#62483f] sm:text-base">
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
    <div className="rounded-[1.4rem] border border-[#8e2236]/20 bg-white/80 p-4 text-sm shadow-[0_12px_32px_rgba(119,74,40,0.13)]">
      <div className="font-semibold text-[#2d1a12]">{title}</div>
      <div className="mt-2 leading-6 text-[#62483f]">{description}</div>
    </div>
  );
}

const accentClasses: Record<string, string> = {
  amber: "bg-[#d99239]/15 text-[#8f5e20]",
  cyan: "bg-[#8e2236]/10 text-[#8e2236]",
  emerald: "bg-[#cea873]/20 text-[#74522d]",
  violet: "bg-[#7f2f45]/13 text-[#7f2f45]",
  rose: "bg-[#9f3a4e]/13 text-[#9f3a4e]",
  sky: "bg-[#c49a62]/18 text-[#6d4b2a]",
};
