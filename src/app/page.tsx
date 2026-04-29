import Image from "next/image";
import { LoginPanel } from "@/components/login-panel";

const featureCards = [
  {
    title: "Détection multi-niveaux",
    description:
      "Analyse du plagiat direct, de la paraphrase et des reformulations issues de traduction automatique sur un seul parcours.",
    tag: "Moteur",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6.5" stroke="#7D1C2A" strokeWidth="1.3" />
        <path
          d="M6 9.5L8 11.5L12 7"
          stroke="#7D1C2A"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Rapports exploitables",
    description:
      "Résultats structurés, scores, décisions et traces d'analyse pour suivre un mémoire de bout en bout.",
    tag: "Reporting",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect
          x="3"
          y="3"
          width="12"
          height="12"
          rx="2"
          stroke="#7D1C2A"
          strokeWidth="1.3"
        />
        <path
          d="M6 7h6M6 10h4"
          stroke="#7D1C2A"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Sécurité active",
    description:
      "Contrôles same-origin, cookies signés et garde-fous serveur pour protéger les actions sensibles.",
    tag: "Protection",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 3L15 6.5V12L9 15L3 12V6.5L9 3Z"
          stroke="#7D1C2A"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="9" r="2" stroke="#7D1C2A" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    title: "Flux par rôle",
    description:
      "Espaces dédiés aux étudiants, enseignants, DA et administrateurs avec des étapes claires et contrôlées.",
    tag: "Workflow",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M3 9h4l2-5 2 9 2-4h2"
          stroke="#7D1C2A"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Délibérations finales",
    description:
      "Validation académique, délibération et archivage final au même endroit, sans navigation superflue.",
    tag: "Décision",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 3v4l3 2"
          stroke="#7D1C2A"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="9" r="6" stroke="#7D1C2A" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    title: "Intelligence sémantique",
    description:
      "Score combiné plagiat seuil strict à 20 % et signalement automatique des cas critiques.",
    tag: "Analyse",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M4 14V8M8 14V5M12 14V9M16 14V3"
          stroke="#7D1C2A"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const workflowSteps = [
  {
    step: "0 1",
    title: "Accès étudiant",
    description:
      "Connexion par INE, proposition de thème, dépôt final et lancement des auto-tests de conformité.",
  },
  {
    step: "0 2",
    title: "Validation enseignant",
    description:
      "Contrôle du thème, analyse officielle du document et saisie du rapport de conformité académique.",
  },
  {
    step: "0 3",
    title: "Délibération DA",
    description:
      "Validation académique, note finale et délibération conjointe avant publication du statut définitif.",
  },
];

const highlights = [
  "Navigation pensée pour les institutions IBAM et MIAGE.",
  "Interface claire, premium et focalisée sur les décisions.",
  "Toutes les actions critiques restent centralisées et auditables.",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f4efe8] text-[#1e1410] text-[1.05rem]">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-100 border-b border-[#ddd4c4] bg-[rgba(244,239,232,0.88)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[68px] max-w-[1040px] items-center gap-3 px-4 sm:h-[74px] sm:px-6 md:h-[82px] md:gap-7">
          <a href="#" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="flex h-[56px] w-[56px] items-center justify-center overflow-hidden sm:h-[64px] sm:w-[64px] md:h-[80px] md:w-[80px]">
              <Image
                src="/brand/origina-logo.png"
                alt="Handal"
                width={80}
                height={80}
                className="h-[56px] w-auto object-contain sm:h-[64px] md:h-[80px]"
                style={{ width: "auto", height: "auto" }}
              />
            </div>
            <div>
              <strong className="block text-[0.95rem] font-medium tracking-[0.01em] text-[#1e1410] sm:text-[1rem] md:text-[1.05rem]">
                HANDAL
              </strong>
              <span className="hidden text-[12px] tracking-[0.03em] text-[#6b5649] sm:block">
                Academic Integrity Platform
              </span>
            </div>
          </a>
          <div className="flex flex-1 items-center justify-end gap-1">
            <a
              href="#features"
              className="hidden rounded-md px-3 py-1.25 text-[1.05rem] font-medium text-[#3f2d24] transition hover:bg-[#eae2d6] hover:text-[#1e1410] md:inline-flex"
            >
              Solutions
            </a>
            <a
              href="#workflow"
              className="hidden rounded-md px-3 py-1.25 text-[1.05rem] font-medium text-[#3f2d24] transition hover:bg-[#eae2d6] hover:text-[#1e1410] md:inline-flex"
            >
              Workflow
            </a>
            <a
              href="#security"
              className="hidden rounded-md px-3 py-1.25 text-[1.05rem] font-medium text-[#3f2d24] transition hover:bg-[#eae2d6] hover:text-[#1e1410] md:inline-flex"
            >
              Sécurité
            </a>
            <a
              href="#connexion"
              className="rounded-lg bg-[#7d1c2a] px-3 py-2 text-sm font-medium !text-white transition hover:bg-[#5c1220] sm:px-4 sm:py-1.25 sm:text-[1.05rem]"
            >
              Connexion
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="py-9 sm:py-[56px] lg:py-[64px]">
        <div className="mx-auto grid max-w-[1040px] grid-cols-1 items-center gap-8 px-4 sm:gap-12 sm:px-6 lg:grid-cols-[1fr_430px] xl:gap-14">
          <div>
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#ddd4c4] bg-[#f5ece8] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7d1c2a] sm:text-[12px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7d1c2a] animate-pulse"></span>
              Plateforme académique
            </div>
            <h1 className="mb-4 font-serif text-[clamp(33px,10vw,60px)] font-normal leading-[1.08] tracking-[-0.01em] text-[#1e1410] sm:text-[clamp(42px,5.4vw,60px)] sm:leading-[1.06]">
              <span className="hero-title-line block">
                Handal orchestre la détection, la validation
              </span>
              <span className="hero-title-line hero-title-line-delay block">
                et la <em className="text-[#7d1c2a]">délibération</em> des
                mémoires.
              </span>
            </h1>
            <p className="mb-7 max-w-[520px] text-[1rem] font-normal leading-[1.68] text-[#3f2d24] sm:text-[1.1rem] sm:leading-[1.72]">
              Un flux académique structuré en trois phases — thème, document,
              verdict — pour chaque acteur de l&apos;institution.
            </p>
            <div className="flex gap-2.5 flex-wrap">
              <a
                href="#features"
                className="inline-flex items-center gap-1.75 rounded-[10px] border border-[#7d1c2a] bg-[#7d1c2a] px-5 py-2 text-[0.98rem] !text-white transition hover:border-[#5c1220] hover:bg-[#5c1220] sm:px-[1.375rem] sm:py-[0.6875rem] sm:text-[1.05rem]"
              >
                Explorer la plateforme
              </a>
            </div>
          </div>

          <div
            id="connexion"
            className="scroll-mt-24 w-full max-w-[430px] justify-self-stretch lg:justify-self-end"
          >
            <LoginPanel />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-white py-16 lg:py-18">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-block text-[9px] font-semibold text-[#7d1c2a] uppercase tracking-[0.1em] bg-[#f5ece8] px-2.5 py-1 rounded-full border border-[rgba(125,28,42,0.15)] mb-3.5">
              Moteur
            </div>
            <h2 className="font-serif text-[clamp(28px,8vw,44px)] font-normal leading-[1.16] text-[#1e1410] mb-3">
              Tout ce dont une institution a besoin
            </h2>
            <p className="text-[1.1rem] font-normal text-[#3f2d24] max-w-[580px] mx-auto leading-[1.72]">
              Six modules intégrés couvrent l&apos;intégralité du parcours
              académique, de la proposition du thème à la délibération finale.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="bg-[#f4efe8] border border-[#ddd4c4] rounded-[16px] p-5 sm:p-6 transition hover:shadow-[0_4px_16px_rgba(30,20,16,0.08)] hover:-translate-y-0.5"
              >
                <div className="w-9 h-9 bg-[#f5ece8] rounded-lg flex items-center justify-center mb-1">
                  {card.icon}
                </div>
                <div className="text-[10px] font-semibold text-[#7d1c2a] uppercase tracking-[0.08em] opacity-75 mb-0.5">
                  {card.tag}
                </div>
                <h3 className="font-serif text-[1.3rem] font-normal leading-[1.24] text-[#1e1410] mb-2.5">
                  {card.title}
                </h3>
                <p className="text-[1.05rem] font-normal text-[#3f2d24] leading-[1.62]">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="py-16 lg:py-18">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-5">
              <div className="inline-block text-[9px] font-semibold text-[#7d1c2a] uppercase tracking-[0.1em] bg-[#f5ece8] px-2.5 py-1 rounded-full border border-[rgba(125,28,42,0.15)] mb-3.5">
                Pourquoi Handal
              </div>
              <h2 className="font-serif text-[clamp(28px,8vw,44px)] font-normal leading-[1.16] text-[#1e1410] mb-4">
                Conçu pour les institutions qui veulent du contrôle sans
                surcharge
              </h2>
              <p className="text-[1.05rem] font-normal text-[#3f2d24] leading-[1.72] mb-5">
                Chaque rôle reste dans son corridor d&apos;action, avec des
                checkpoints explicites et une gouvernance lisible pour
                l&apos;administration et la DA.
              </p>
              <div className="space-y-2">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="flex gap-2.5 text-[1.05rem] font-normal text-[#3f2d24] leading-[1.55]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7d1c2a] flex-shrink-0 mt-1.75"></span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              {workflowSteps.map((step) => (
                <article
                  key={step.step}
                  className="bg-white border border-[#ddd4c4] rounded-[16px] p-[1.375rem]"
                >
                  <div className="text-[11px] font-semibold text-[#6b5649] uppercase tracking-[0.06em] mb-0.5">
                    {step.step}
                  </div>
                  <h3 className="font-serif text-[1.25rem] font-normal leading-[1.22] text-[#1e1410] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[1.05rem] font-normal text-[#3f2d24] leading-[1.6]">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="bg-white py-16 lg:py-18">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6">
          <div className="bg-white border border-[#ddd4c4] rounded-[24px] p-7 sm:p-9">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
              <div>
                <div className="inline-block text-[9px] font-semibold text-[#7d1c2a] uppercase tracking-[0.1em] bg-[#f5ece8] px-2.5 py-1 rounded-full border border-[rgba(125,28,42,0.15)] mb-3.5">
                  Sécurité & Exploitation
                </div>
                <h2 className="font-serif text-[clamp(28px,7.8vw,40px)] font-normal leading-[1.14] text-[#1e1410] mb-3.5">
                  Une base visuelle robuste et prête pour les parcours critiques
                </h2>
                <p className="text-[1.1rem] font-normal text-[#3f2d24] leading-[1.72]">
                  Le front conserve la lisibilité opérationnelle de vos flux,
                  tout en gagnant en caractère visuel et en impact
                  institutionnel.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#f4efe8] border border-[#ddd4c4] rounded-lg p-4">
                  <h4 className="text-[1.1rem] font-medium text-[#1e1410] mb-1.25">
                    Intégration
                  </h4>
                  <p className="text-[1.05rem] font-normal text-[#3f2d24] leading-[1.55]">
                    Pages rôle, login et suivi unifiés dans un flux cohérent.
                  </p>
                </div>
                <div className="bg-[#f4efe8] border border-[#ddd4c4] rounded-lg p-4">
                  <h4 className="text-[1.1rem] font-medium text-[#1e1410] mb-1.25">
                    Lisibilité
                  </h4>
                  <p className="text-[1.05rem] font-normal text-[#3f2d24] leading-[1.55]">
                    Hiérarchie nette, blocs denses, CTA explicites à chaque
                    étape.
                  </p>
                </div>
                <div className="bg-[#f4efe8] border border-[#ddd4c4] rounded-lg p-4">
                  <h4 className="text-[1.1rem] font-medium text-[#1e1410] mb-1.25">
                    Contraste
                  </h4>
                  <p className="text-[1.05rem] font-normal text-[#3f2d24] leading-[1.55]">
                    Palette sobre, accents maroon et crème — accessible en toute
                    condition.
                  </p>
                </div>
                <div className="bg-[#f4efe8] border border-[#ddd4c4] rounded-lg p-4">
                  <h4 className="text-[1.1rem] font-medium text-[#1e1410] mb-1.25">
                    Évolution
                  </h4>
                  <p className="text-[1.05rem] font-normal text-[#3f2d24] leading-[1.55]">
                    Base prête pour l&apos;ajout de nouveaux écrans et workflows
                    sans refonte.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <div className="bg-[#7d1c2a] py-10 sm:py-12 lg:py-13">
        <div className="max-w-[1040px] mx-auto flex flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center md:gap-8">
          <div>
            <h2 className="mb-1.5 font-serif text-[30px] font-normal leading-[1.12] text-white sm:text-[36px] lg:text-[38px]">
              Prêt à moderniser votre processus académique ?
            </h2>
            <p className="text-[1rem] font-normal text-white/92 sm:text-[1.1rem]">
              Rejoignez les institutions qui ont choisi Handal pour la rigueur
              et la traçabilité.
            </p>
          </div>
          <a
            href="#"
            className="w-full rounded-lg bg-white px-5 py-[0.6875rem] text-center font-sans text-[1rem] font-medium text-[#7d1c2a] transition hover:-translate-y-0.5 hover:opacity-90 sm:w-auto sm:px-6 sm:text-[1.1rem]"
          >
            Accéder à la plateforme →
          </a>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#ddd4c4] py-6">
        <div className="max-w-[1040px] mx-auto flex flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <div className="text-[1.1rem] font-medium text-[#1e1410]">
              Handal
            </div>
            <div className="text-[1.05rem] text-[#6b5649]">
              2026 Handal Academic Systems. Tous droits réservés.
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <a
              className="text-[1.05rem] font-medium text-[#6b5649] uppercase tracking-[0.06em] px-2.5 py-1.25 rounded-md border border-[#ddd4c4] transition hover:bg-[#f4efe8] hover:text-[#1e1410]"
              href="#"
            >
              Privacy
            </a>
            <a
              className="text-[1.05rem] font-medium text-[#6b5649] uppercase tracking-[0.06em] px-2.5 py-1.25 rounded-md border border-[#ddd4c4] transition hover:bg-[#f4efe8] hover:text-[#1e1410]"
              href="#"
            >
              Terms
            </a>
            <a
              className="text-[1.05rem] font-medium text-[#6b5649] uppercase tracking-[0.06em] px-2.5 py-1.25 rounded-md border border-[#ddd4c4] transition hover:bg-[#f4efe8] hover:text-[#1e1410]"
              href="#"
            >
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
