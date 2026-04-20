/**
 * content-filter.ts
 * Filtre le contenu institutionnel redondant avant l'analyse de plagiat.
 * Objectif : ne scorer que le travail réel de l'étudiant.
 */

// ── 1. Blacklist de phrases institutionnelles ──────────────────────────────
// Fragments normalisés (minuscules, sans ponctuation excessive) qui
// apparaissent dans quasiment tous les mémoires IBAM/UJKZ et ne doivent
// pas contribuer au score de similarité.
const INSTITUTIONAL_PHRASES: string[] = [
  // Présentation IBAM / UJKZ
  "institut burkinabe des arts et metiers",
  "universite joseph ki zerbo",
  "ujkz",
  "ibam",
  "burkina faso",
  "unite progres justice",
  // Formules de page de garde
  "memoire de fin de cycle",
  "memoire de fin d etude",
  "rapport de stage",
  "en vue de l obtention",
  "licence professionnelle",
  "master professionnel",
  "annee academique",
  "presente par",
  "sous la direction de",
  "directeur de memoire",
  "maitre de stage",
  "encadreur pedagogique",
  "encadreur professionnel",
  "soutenu le",
  "jury",
  // Remerciements types
  "nous remercions",
  "je remercie",
  "nos remerciements vont",
  "mes remerciements vont",
  "toute notre gratitude",
  "toute ma gratitude",
  "a nos parents",
  "a ma famille",
  "a tous ceux qui",
  // Sommaire / Table des matières
  "table des matieres",
  "sommaire",
  "liste des figures",
  "liste des tableaux",
  "liste des abreviations",
  "liste des acronymes",
  "glossaire",
  // Dédicaces
  "dedicace",
  "je dedie ce travail",
  "nous dedions ce travail",
  // Avant-propos
  "avant propos",
  // Résumé / Abstract boilerplate
  "mots cles",
  "key words",
  "abstract",
];

// ── 2. Marqueurs de slicing intro/conclusion ───────────────────────────────
const INTRO_MARKERS: RegExp[] = [
  /introduction\s+g[eé]n[eé]rale/i,
  /introduction\s+g[eé]n[eé]ral/i,
  /\bintroduction\b/i,
  /chapitre\s+(?:i|1|premier)\s*[:\-]/i,
];

const CONCLUSION_MARKERS: RegExp[] = [
  /conclusion\s+g[eé]n[eé]rale/i,
  /conclusion\s+g[eé]n[eé]ral/i,
  /\bconclusion\b/i,
  /recommandations?\s+g[eé]n[eé]rales?/i,
  /perspectives?\s+et\s+recommandations?/i,
];

// ── 3. Seuil de détection boilerplate ─────────────────────────────────────
// Un paragraphe est considéré institutionnel si sa similarité Jaccard
// avec la blacklist dépasse ce seuil.
const BOILERPLATE_JACCARD_THRESHOLD = 0.35;

// Longueur minimale d'un paragraphe pour être analysé (évite les titres seuls)
const MIN_PARAGRAPH_TOKENS = 15;

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizeForFilter(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[îï]/g, "i")
    .replace(/[ôö]/g, "o")
    .replace(/[ùûü]/g, "u")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeSimple(text: string): string[] {
  return normalizeForFilter(text)
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function jaccardTokens(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  setA.forEach((t) => { if (setB.has(t)) inter++; });
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Vérifie si un paragraphe contient une phrase blacklistée */
function containsBlacklistedPhrase(paragraph: string): boolean {
  const norm = normalizeForFilter(paragraph);
  return INSTITUTIONAL_PHRASES.some((phrase) => norm.includes(phrase));
}

/** Vérifie si un paragraphe ressemble à du boilerplate par Jaccard */
function isBoilerplateParagraph(paragraph: string): boolean {
  const tokens = tokenizeSimple(paragraph);
  if (tokens.length < MIN_PARAGRAPH_TOKENS) return true; // trop court = titre/entête
  const blacklistTokens = tokenizeSimple(INSTITUTIONAL_PHRASES.join(" "));
  return jaccardTokens(tokens, blacklistTokens) >= BOILERPLATE_JACCARD_THRESHOLD;
}

// ── Export principal ───────────────────────────────────────────────────────

export type FilterResult = {
  filteredContent: string;
  wasSliced: boolean;
  introFound: boolean;
  conclusionFound: boolean;
  excludedRatio: number; // 0–1 : proportion du texte original exclue
};

/**
 * Filtre le contenu d'un document avant analyse :
 * 1. Slice entre Introduction et Conclusion si détectées
 * 2. Supprime les paragraphes institutionnels (blacklist + Jaccard)
 */
export function filterInstitutionalContent(rawText: string): FilterResult {
  const originalLength = rawText.length;

  // ── Étape 1 : Slicing intro → conclusion ──────────────────────────────
  let sliced = rawText;
  let introFound = false;
  let conclusionFound = false;
  let wasSliced = false;

  let introIndex = -1;
  for (const marker of INTRO_MARKERS) {
    const match = sliced.search(marker);
    if (match !== -1) {
      introIndex = match;
      introFound = true;
      break;
    }
  }

  let conclusionIndex = -1;
  for (const marker of CONCLUSION_MARKERS) {
    // Chercher depuis la moitié du document pour éviter les faux positifs
    const searchFrom = Math.floor(sliced.length / 3);
    const searchZone = sliced.slice(searchFrom);
    const match = searchZone.search(marker);
    if (match !== -1) {
      conclusionIndex = searchFrom + match;
      conclusionFound = true;
      break;
    }
  }

  if (introFound && introIndex !== -1) {
    const end = conclusionFound && conclusionIndex > introIndex
      ? conclusionIndex + 500 // inclure quelques lignes de conclusion
      : sliced.length;
    sliced = sliced.slice(introIndex, end);
    wasSliced = true;
  }

  // ── Étape 2 : Filtrage paragraphe par paragraphe ──────────────────────
  const paragraphs = sliced
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const kept: string[] = [];

  for (const paragraph of paragraphs) {
    if (containsBlacklistedPhrase(paragraph)) continue;
    if (isBoilerplateParagraph(paragraph)) continue;
    kept.push(paragraph);
  }

  // Fallback : si le filtre a tout supprimé, retourner le texte slicé brut
  const filteredContent = kept.length > 0 ? kept.join("\n\n") : sliced;

  const excludedRatio =
    originalLength > 0
      ? Math.max(0, 1 - filteredContent.length / originalLength)
      : 0;

  return {
    filteredContent,
    wasSliced,
    introFound,
    conclusionFound,
    excludedRatio,
  };
}

/**
 * Génère la note d'exclusion à inclure dans le rapport.
 */
export function buildExclusionNote(result: FilterResult): string | null {
  if (result.excludedRatio < 0.05) return null; // moins de 5% exclu → pas de note

  const parts: string[] = [
    "Certaines parties ont été exclues de l'analyse pour garantir l'équité :",
  ];

  if (result.wasSliced && result.introFound) {
    parts.push(
      result.conclusionFound
        ? "• Analyse centrée sur le contenu entre l'Introduction et la Conclusion."
        : "• Analyse centrée sur le contenu à partir de l'Introduction.",
    );
  }

  parts.push(
    "• Présentation institutionnelle (IBAM, UJKZ), remerciements, dédicaces, sommaire et annexes standards exclus.",
  );

  parts.push(
    `• Proportion du document exclue : ${Math.round(result.excludedRatio * 100)}%.`,
  );

  return parts.join("\n");
}
