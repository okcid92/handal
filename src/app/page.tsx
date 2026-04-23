import Image from "next/image";

const featureCards = [
  {
    title: "Détection multi-niveaux",
    description:
      "Analyse du plagiat direct, de la paraphrase et des reformulations issues de traduction automatique sur un seul parcours.",
    tag: "Moteur",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6.5" stroke="#7D1C2A" strokeWidth="1.3"/>
        <path d="M6 9.5L8 11.5L12 7" stroke="#7D1C2A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
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
        <rect x="3" y="3" width="12" height="12" rx="2" stroke="#7D1C2A" strokeWidth="1.3"/>
        <path d="M6 7h6M6 10h4" stroke="#7D1C2A" strokeWidth="1.3" strokeLinecap="round"/>
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
        <path d="M9 3L15 6.5V12L9 15L3 12V6.5L9 3Z" stroke="#7D1C2A" strokeWidth="1.3" strokeLinejoin="round"/>
        <circle cx="9" cy="9" r="2" stroke="#7D1C2A" strokeWidth="1.2"/>
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
        <path d="M3 9h4l2-5 2 9 2-4h2" stroke="#7D1C2A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
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
        <path d="M9 3v4l3 2" stroke="#7D1C2A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="9" r="6" stroke="#7D1C2A" strokeWidth="1.3"/>
      </svg>
    ),
  },
  {
    title: "Intelligence sémantique",
    description:
      "Score combiné plagiat + détection IA, seuil strict à 20 % et signalement automatique des cas critiques.",
    tag: "Analyse",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M4 14V8M8 14V5M12 14V9M16 14V3" stroke="#7D1C2A" strokeWidth="1.3" strokeLinecap="round"/>
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
    <div className="min-h-screen bg-[#f4efe8] text-[#1e1410]">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-100 bg-[rgba(244,239,232,0.88)] backdrop-blur-[12px] border-b border-[#ddd4c4]">
        <div className="max-w-[1040px] mx-auto px-6 h-[60px] flex items-center gap-8">
          <a href="#" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-[34px] h-[34px] bg-[#7d1c2a] rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L3 5.5V13L9 16L15 13V5.5L9 2Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M9 2V16M3 5.5L15 5.5" stroke="white" strokeWidth="1.1" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <strong className="block text-sm font-medium tracking-[0.01em] text-[#1e1410]">HANDAL</strong>
              <span className="block text-[10px] text-[#8a7a6e] tracking-[0.03em]">Academic Integrity Platform</span>
            </div>
          </a>
          <div className="flex-1 flex gap-1 items-center justify-end">
            <a href="#features" className="text-sm font-normal text-[#5a4a3a] px-3.5 py-1.5 rounded-md transition hover:bg-[#eae2d6] hover:text-[#1e1410]">Solutions</a>
            <a href="#workflow" className="text-sm font-normal text-[#5a4a3a] px-3.5 py-1.5 rounded-md transition hover:bg-[#eae2d6] hover:text-[#1e1410]">Workflow</a>
            <a href="#security" className="text-sm font-normal text-[#5a4a3a] px-3.5 py-1.5 rounded-md transition hover:bg-[#eae2d6] hover:text-[#1e1410]">Sécurité</a>
            <a href="#" className="bg-[#7d1c2a] text-white text-sm font-medium px-4.5 py-1.75 rounded-lg transition hover:bg-[#5c1220]">Connexion</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="py-[72px]">
        <div className="max-w-[1040px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f5ece8] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#7d1c2a] border border-[#ddd4c4] mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7d1c2a] animate-pulse"></span>
              Plateforme académique
            </div>
            <h1 className="font-serif text-[clamp(38px,5vw,52px)] font-normal leading-[1.12] text-[#1e1410] mb-5 tracking-[-0.01em]">
              Handal orchestre la détection, la validation<br /> et la <em className="text-[#7d1c2a]">délibération</em> des mémoires.
            </h1>
            <p className="text-base font-light leading-[1.65] text-[#5a4a3a] mb-8 max-w-[460px]">
              Un flux académique structuré en trois phases — thème, document, verdict — pour chaque acteur de l'institution.
            </p>
            <div className="flex gap-2.5 flex-wrap">
              <a
                href="#"
                className="inline-flex items-center gap-1.75 rounded-[10px] bg-[#7d1c2a] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#5c1220] hover:-translate-y-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Accéder à la connexion
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-1.75 rounded-[10px] border border-[#ddd4c4] px-6 py-3 text-sm text-[#5a4a3a] transition hover:bg-[#eae2d6] hover:border-[#8a7a6e]"
              >
                Explorer la plateforme
              </a>
            </div>
          </div>

          <div className="bg-white border border-[#ddd4c4] rounded-[24px] p-7 shadow-[0_4px_16px_rgba(30,20,16,0.08)]">
            {/* Role tabs */}
            <div className="grid grid-cols-2 bg-[#f4efe8] rounded-lg p-0.75 mb-6 border border-[#ddd4c4]">
              <button className="font-sans text-[13px] font-medium text-white bg-[#7d1c2a] rounded-md py-2 cursor-pointer transition shadow-[0_1px_4px_rgba(125,28,42,0.25)]">
                Étudiant
              </button>
              <button className="font-sans text-[13px] font-medium text-[#8a7a6e] bg-transparent rounded-md py-2 cursor-pointer transition hover:bg-[#eae2d6]">
                Personnel
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-medium text-[#8a7a6e] uppercase tracking-[0.06em] mb-1.5">
                INE
              </label>
              <input
                type="text"
                value="N01331820231"
                className="w-full bg-[#f4efe8] border border-[#ddd4c4] rounded-lg px-3.5 py-2.5 font-sans text-sm text-[#1e1410] outline-none transition focus:border-[#7d1c2a] focus:shadow-[0_0_0_3px_rgba(125,28,42,0.08)]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-[11px] font-medium text-[#8a7a6e] uppercase tracking-[0.06em] mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value="mon926732"
                className="w-full bg-[#f4efe8] border border-[#ddd4c4] rounded-lg px-3.5 py-2.5 font-sans text-sm text-[#1e1410] outline-none transition focus:border-[#7d1c2a] focus:shadow-[0_0_0_3px_rgba(125,28,42,0.08)]"
              />
            </div>
            <button className="w-full bg-[#7d1c2a] text-white font-sans text-sm font-medium py-3 rounded-lg mb-4 cursor-pointer transition hover:bg-[#5c1220] tracking-[0.01em]">
              Se connecter
            </button>

            <div className="mb-1.5">
              <label className="block text-[11px] font-medium text-[#8a7a6e] uppercase tracking-[0.06em]">
                Comptes de démonstration
              </label>
            </div>
            <div className="relative">
              <select className="w-full bg-[#f4efe8] border border-[#ddd4c4] rounded-lg px-3.5 py-2.25 font-sans text-sm text-[#5a4a3a] outline-none cursor-pointer appearance-none">
                <option>Admin — admin@handal.local</option>
                <option>Étudiant — N01331820231</option>
                <option>Enseignant — teacher@handal.local</option>
                <option>DA — da@handal.local</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-[1040px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-block text-[10px] font-semibold text-[#7d1c2a] uppercase tracking-[0.1em] bg-[#f5ece8] px-2.5 py-1 rounded-full border border-[rgba(125,28,42,0.15)] mb-3.5">
              Moteur
            </div>
            <h2 className="font-serif text-[clamp(28px,3.5vw,38px)] font-normal leading-[1.2] text-[#1e1410] mb-3">
              Tout ce dont une institution a besoin
            </h2>
            <p className="text-base font-light text-[#5a4a3a] max-w-[520px] mx-auto leading-[1.65]">
              Six modules intégrés couvrent l'intégralité du parcours académique, de la proposition du thème à la délibération finale.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="bg-[#f4efe8] border border-[#ddd4c4] rounded-[16px] p-7 transition hover:shadow-[0_4px_16px_rgba(30,20,16,0.08)] hover:-translate-y-0.5"
              >
                <div className="w-9 h-9 bg-[#f5ece8] rounded-lg flex items-center justify-center mb-1">
                  {card.icon}
                </div>
                <div className="text-[10px] font-semibold text-[#7d1c2a] uppercase tracking-[0.08em] opacity-75 mb-0.5">
                  {card.tag}
                </div>
                <h3 className="font-serif text-xl font-normal leading-[1.25] text-[#1e1410] mb-2.5">
                  {card.title}
                </h3>
                <p className="text-sm font-light text-[#5a4a3a] leading-[1.6]">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="py-20">
        <div className="max-w-[1040px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div className="inline-block text-[10px] font-semibold text-[#7d1c2a] uppercase tracking-[0.1em] bg-[#f5ece8] px-2.5 py-1 rounded-full border border-[rgba(125,28,42,0.15)] mb-3.5">
                Pourquoi Handal
              </div>
              <h2 className="font-serif text-[clamp(28px,3.5vw,38px)] font-normal leading-[1.2] text-[#1e1410] mb-4">
                Conçu pour les institutions qui veulent du contrôle sans surcharge
              </h2>
              <p className="text-sm font-light text-[#5a4a3a] leading-[1.7] mb-6">
                Chaque rôle reste dans son corridor d'action, avec des checkpoints explicites et une gouvernance lisible pour l'administration et la DA.
              </p>
              <div className="space-y-2.5">
                {highlights.map((item) => (
                  <div key={item} className="flex gap-2.5 text-sm font-light text-[#5a4a3a] leading-[1.5]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7d1c2a] flex-shrink-0 mt-1.75"></span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              {workflowSteps.map((step) => (
                <article
                  key={step.step}
                  className="bg-white border border-[#ddd4c4] rounded-[16px] p-6"
                >
                  <div className="text-[11px] font-semibold text-[#8a7a6e] uppercase tracking-[0.06em] mb-0.5">
                    {step.step}
                  </div>
                  <h3 className="font-serif text-[19px] font-normal leading-[1.25] text-[#1e1410] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm font-light text-[#5a4a3a] leading-[1.6]">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="bg-white py-20">
        <div className="max-w-[1040px] mx-auto px-6">
          <div className="bg-white border border-[#ddd4c4] rounded-[24px] p-8 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
              <div>
                <div className="inline-block text-[10px] font-semibold text-[#7d1c2a] uppercase tracking-[0.1em] bg-[#f5ece8] px-2.5 py-1 rounded-full border border-[rgba(125,28,42,0.15)] mb-3.5">
                  Sécurité & Exploitation
                </div>
                <h2 className="font-serif text-[clamp(26px,3vw,34px)] font-normal leading-[1.25] text-[#1e1410] mb-3.5">
                  Une base visuelle robuste et prête pour les parcours critiques
                </h2>
                <p className="text-sm font-light text-[#5a4a3a] leading-[1.7]">
                  Le front conserve la lisibilité opérationnelle de vos flux, tout en gagnant en caractère visuel et en impact institutionnel.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#f4efe8] border border-[#ddd4c4] rounded-lg p-4.5">
                  <h4 className="text-sm font-medium text-[#1e1410] mb-1.25">Intégration</h4>
                  <p className="text-xs font-light text-[#5a4a3a] leading-[1.5]">
                    Pages rôle, login et suivi unifiés dans un flux cohérent.
                  </p>
                </div>
                <div className="bg-[#f4efe8] border border-[#ddd4c4] rounded-lg p-4.5">
                  <h4 className="text-sm font-medium text-[#1e1410] mb-1.25">Lisibilité</h4>
                  <p className="text-xs font-light text-[#5a4a3a] leading-[1.5]">
                    Hiérarchie nette, blocs denses, CTA explicites à chaque étape.
                  </p>
                </div>
                <div className="bg-[#f4efe8] border border-[#ddd4c4] rounded-lg p-4.5">
                  <h4 className="text-sm font-medium text-[#1e1410] mb-1.25">Contraste</h4>
                  <p className="text-xs font-light text-[#5a4a3a] leading-[1.5]">
                    Palette sobre, accents maroon et crème — accessible en toute condition.
                  </p>
                </div>
                <div className="bg-[#f4efe8] border border-[#ddd4c4] rounded-lg p-4.5">
                  <h4 className="text-sm font-medium text-[#1e1410] mb-1.25">Évolution</h4>
                  <p className="text-xs font-light text-[#5a4a3a] leading-[1.5]">
                    Base prête pour l'ajout de nouveaux écrans et workflows sans refonte.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <div className="bg-[#7d1c2a] py-14">
        <div className="max-w-[1040px] mx-auto px-6 flex items-center justify-between gap-8">
          <div>
            <h2 className="font-serif text-[30px] font-normal leading-[1.2] text-white mb-1.5">
              Prêt à moderniser votre processus académique ?
            </h2>
            <p className="text-sm font-light text-white/80">
              Rejoignez les institutions qui ont choisi Handal pour la rigueur et la traçabilité.
            </p>
          </div>
          <a
            href="#"
            className="bg-white text-[#7d1c2a] font-sans text-sm font-medium px-7 py-3 rounded-lg transition hover:opacity-90 hover:-translate-y-0.5 whitespace-nowrap flex-shrink-0"
          >
            Accéder à la plateforme →
          </a>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#ddd4c4] py-7">
        <div className="max-w-[1040px] mx-auto px-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm font-medium text-[#1e1410]">Handal</div>
            <div className="text-xs text-[#8a7a6e]">
              2026 Handal Academic Systems. Tous droits réservés.
            </div>
          </div>
          <div className="flex gap-1">
            <a
              className="text-xs font-medium text-[#8a7a6e] uppercase tracking-[0.06em] px-2.5 py-1.25 rounded-md border border-[#ddd4c4] transition hover:bg-[#f4efe8] hover:text-[#1e1410]"
              href="#"
            >
              Privacy
            </a>
            <a
              className="text-xs font-medium text-[#8a7a6e] uppercase tracking-[0.06em] px-2.5 py-1.25 rounded-md border border-[#ddd4c4] transition hover:bg-[#f4efe8] hover:text-[#1e1410]"
              href="#"
            >
              Terms
            </a>
            <a
              className="text-xs font-medium text-[#8a7a6e] uppercase tracking-[0.06em] px-2.5 py-1.25 rounded-md border border-[#ddd4c4] transition hover:bg-[#f4efe8] hover:text-[#1e1410]"
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
