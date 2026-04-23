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
    <div className="min-h-screen bg-[#f4efe8] text-[#1e1410]">
      <main className="mx-auto w-full max-w-[1040px] px-6 pb-16">
        <nav className="sticky top-0 z-30 border-b border-[#ddd4c4] bg-[#f4efe8]/90 backdrop-blur-sm">
          <div className="flex h-[60px] items-center gap-6">
            <a href="#" className="flex items-center gap-3">
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-[#7d1c2a]">
                <Image
                  src="/brand/handal-lamp.png"
                  alt="Handal"
                  width={18}
                  height={18}
                  className="h-[18px] w-auto object-contain brightness-0 invert"
                  style={{ height: "auto" }}
                />
              </div>
              <div>
                <strong className="block text-sm font-medium tracking-wide">
                  HANDAL
                </strong>
                <span className="block text-[10px] text-[#8a7a6e]">
                  Academic Integrity Platform
                </span>
              </div>
            </a>
            <div className="ml-auto flex flex-wrap items-center gap-1">
              <a
                className="rounded-md px-3 py-1.5 text-sm text-[#5a4a3a] transition hover:bg-[#eae2d6] hover:text-[#1e1410]"
                href="#solution"
              >
                Solutions
              </a>
              <a
                className="rounded-md px-3 py-1.5 text-sm text-[#5a4a3a] transition hover:bg-[#eae2d6] hover:text-[#1e1410]"
                href="#workflow"
              >
                Workflow
              </a>
              <a
                className="rounded-md px-3 py-1.5 text-sm text-[#5a4a3a] transition hover:bg-[#eae2d6] hover:text-[#1e1410]"
                href="#securite"
              >
                Sécurité
              </a>
              <a
                className="rounded-lg bg-[#7d1c2a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#5c1220]"
                href="#connexion"
              >
                Connexion
              </a>
            </div>
          </div>
        </nav>

        <section className="grid gap-10 py-16 lg:grid-cols-[1fr_400px] lg:items-center">
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ddd4c4] bg-[#f5ece8] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#7d1c2a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7d1c2a]" />
              Plateforme académique
            </span>
            <h1 className="max-w-3xl text-4xl leading-tight tracking-tight sm:text-5xl">
              Handal orchestre la détection, la validation et la{" "}
              <em className="text-[#7d1c2a]">délibération</em> des mémoires.
              </h1>
            <p className="mt-5 max-w-xl text-base font-light leading-7 text-[#5a4a3a]">
              Un flux académique structuré en trois phases - thème, document,
              verdict - pour chaque acteur de l&apos;institution.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#connexion"
                className="inline-flex items-center rounded-[10px] bg-[#7d1c2a] px-6 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-[#5c1220]"
              >
                Accéder à la connexion
              </a>
              <a
                href="#solution"
                className="inline-flex items-center rounded-[10px] border border-[#ddd4c4] px-6 py-3 text-sm text-[#5a4a3a] transition hover:border-[#8a7a6e] hover:bg-[#eae2d6]"
              >
                Explorer la plateforme
              </a>
            </div>
          </div>

          <div id="connexion" className="scroll-mt-28">
            <LoginPanel />
          </div>
        </section>

        <section id="solution" className="space-y-8 bg-white py-14">
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex rounded-full border border-[#ddd4c4] bg-[#f5ece8] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7d1c2a]">
              Moteur
            </div>
            <h2 className="mx-auto max-w-2xl text-3xl">
              Tout ce dont une institution a besoin
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base font-light leading-7 text-[#5a4a3a]">
              Six modules intégrés couvrent l&apos;intégralité du parcours
              académique, de la proposition du thème à la délibération finale.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-[#ddd4c4] bg-[#f4efe8] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(30,20,16,0.08)]"
              >
                <div
                  className="mb-3 inline-flex rounded-full bg-[#f5ece8] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7d1c2a]"
                >
                  {card.tag}
                </div>
                <h2 className="text-2xl">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm font-light leading-6 text-[#5a4a3a]">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="workflow"
          className="grid gap-8 py-16 lg:grid-cols-2 lg:items-start"
        >
          <div className="space-y-6">
            <SectionHeading
              eyebrow="Pourquoi Handal"
              title="Conçu pour les institutions qui veulent du contrôle sans surcharge"
              description="Chaque rôle reste dans son corridor d'action, avec des checkpoints explicites et une gouvernance lisible pour l'administration et la DA."
            />

            <ul className="space-y-3 text-sm font-light leading-7 text-[#5a4a3a] sm:text-base">
              {highlights.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7d1c2a]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3">
            {workflowSteps.map((step) => (
              <article
                key={step.step}
                className="rounded-2xl border border-[#ddd4c4] bg-white p-6"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a7a6e]">
                  {step.step}
                </div>
                <h3 className="mt-3 text-2xl">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm font-light leading-6 text-[#5a4a3a]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="securite">
          <div className="rounded-[24px] border border-[#ddd4c4] bg-white p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex rounded-full border border-[#ddd4c4] bg-[#f5ece8] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7d1c2a]">
                  Sécurité et exploitation
                </div>
                <h2 className="mt-4 max-w-3xl text-3xl leading-tight sm:text-4xl">
                  Une base visuelle robuste et prête pour les parcours
                  critiques.
                </h2>
                <p className="mt-4 max-w-2xl text-sm font-light leading-7 text-[#5a4a3a] sm:text-base">
                  Le front conserve la lisibilité opérationnelle de vos flux, en
                  gagnant en caractère visuel et en impact institutionnel.
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

        <div className="mt-14 rounded-[24px] bg-[#7d1c2a] px-8 py-12 text-white">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl leading-tight">
                Prêt à moderniser votre processus académique ?
              </h2>
              <p className="mt-2 text-sm text-white/75">
                Rejoignez les institutions qui ont choisi Handal pour la
                rigueur et la traçabilité.
              </p>
            </div>
            <a
              href="#connexion"
              className="rounded-[10px] bg-white px-6 py-3 text-sm font-medium text-[#7d1c2a] transition hover:-translate-y-0.5"
            >
              Accéder à la plateforme
            </a>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[#ddd4c4] py-8 text-sm">
          <div>
            <div className="font-medium">Handal</div>
            <div className="text-xs text-[#8a7a6e]">
              © 2026 Handal Academic Systems. Tous droits réservés.
            </div>
          </div>
          <div className="flex gap-2">
            <a
              className="rounded-md border border-[#ddd4c4] px-3 py-1 text-[11px] uppercase tracking-[0.06em] text-[#8a7a6e] transition hover:bg-[#f4efe8]"
              href="#"
            >
              Privacy
            </a>
            <a
              className="rounded-md border border-[#ddd4c4] px-3 py-1 text-[11px] uppercase tracking-[0.06em] text-[#8a7a6e] transition hover:bg-[#f4efe8]"
              href="#"
            >
              Terms
            </a>
            <a
              className="rounded-md border border-[#ddd4c4] px-3 py-1 text-[11px] uppercase tracking-[0.06em] text-[#8a7a6e] transition hover:bg-[#f4efe8]"
              href="#"
            >
              Support
            </a>
          </div>
        </footer>
      </main>
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
      <div className="inline-flex rounded-full border border-[#ddd4c4] bg-[#f5ece8] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7d1c2a]">
        {eyebrow}
      </div>
      <h2 className="text-3xl leading-tight sm:text-4xl">
        {title}
      </h2>
      <p className="text-sm font-light leading-7 text-[#5a4a3a] sm:text-base">
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
    <div className="rounded-xl border border-[#ddd4c4] bg-[#f4efe8] p-4 text-sm">
      <div className="font-medium text-[#1e1410]">{title}</div>
      <div className="mt-2 leading-6 text-[#5a4a3a]">{description}</div>
    </div>
  );
}
