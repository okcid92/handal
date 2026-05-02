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

// Marqueurs de démarrage du travail technique (souvent chapitre 2)
const CHAPTER_TWO_START_MARKERS: RegExp[] = [
  /chapitre\s*(?:ii|2)\s*[:\-]/i,
  /\b2\s+[\.)\-:]?\s*analyse\s+et\s+conception\b/i,
  /\bchapitre\s*(?:ii|2)\b[\s\S]{0,120}\b(?:analyse|conception|etude\s+prealable|m[ée]thodologie)\b/i,
];

// ── 3. Seuil de détection boilerplate ─────────────────────────────────────
// Un paragraphe est considéré institutionnel si sa similarité Jaccard
// avec la blacklist dépasse ce seuil.
const BOILERPLATE_JACCARD_THRESHOLD = 0.35;

// Longueur minimale d'un paragraphe pour être analysé (évite les titres seuls)
const MIN_PARAGRAPH_TOKENS = 15;

// ── Helpers ────────────────────────────────────────────────────────────────

const STOPWORDS_FR = new Set<string>([
  "a",
  "abord",
  "afin",
  "ah",
  "ai",
  "aie",
  "aient",
  "aies",
  "ainsi",
  "allaient",
  "allo",
  "allons",
  "apres",
  "assez",
  "attendu",
  "au",
  "aucun",
  "aucune",
  "aujourd",
  "auquel",
  "aura",
  "aurai",
  "auraient",
  "aurais",
  "aurait",
  "auras",
  "aurez",
  "auriez",
  "aurions",
  "aurons",
  "auront",
  "aussi",
  "autre",
  "autres",
  "aux",
  "avaient",
  "avais",
  "avait",
  "avant",
  "avec",
  "avoir",
  "avons",
  "ayant",
  "beaucoup",
  "bien",
  "bon",
  "car",
  "ce",
  "ceci",
  "cela",
  "celle",
  "celles",
  "celui",
  "cependant",
  "certain",
  "certaine",
  "certaines",
  "certains",
  "ces",
  "cet",
  "cette",
  "ceux",
  "chacun",
  "chaque",
  "chez",
  "ci",
  "comme",
  "comment",
  "concernant",
  "contre",
  "dans",
  "de",
  "dedans",
  "dehors",
  "depuis",
  "des",
  "desormais",
  "dessous",
  "dessus",
  "deux",
  "devant",
  "devoir",
  "devra",
  "devrait",
  "dire",
  "divers",
  "diverse",
  "doit",
  "donc",
  "dont",
  "du",
  "duquel",
  "duree",
  "elle",
  "elles",
  "en",
  "encore",
  "enfin",
  "entre",
  "envers",
  "est",
  "et",
  "etaient",
  "etais",
  "etait",
  "etant",
  "etc",
  "ete",
  "etre",
  "eu",
  "eux",
  "fait",
  "faite",
  "faites",
  "fois",
  "font",
  "force",
  "furent",
  "generalement",
  "grace",
  "hors",
  "ici",
  "il",
  "ils",
  "importe",
  "j",
  "je",
  "jusqu",
  "juste",
  "la",
  "laquelle",
  "le",
  "lequel",
  "les",
  "leur",
  "leurs",
  "lors",
  "lorsque",
  "lui",
  "m",
  "ma",
  "mais",
  "malgre",
  "me",
  "meme",
  "mes",
  "mien",
  "mienne",
  "miens",
  "mieux",
  "moins",
  "mon",
  "mot",
  "moyennant",
  "n",
  "ne",
  "neanmoins",
  "ni",
  "nombreux",
  "non",
  "nos",
  "notre",
  "nous",
  "nouveau",
  "nul",
  "on",
  "ont",
  "ou",
  "ouf",
  "oui",
  "par",
  "parce",
  "parmi",
  "partant",
  "pas",
  "pendant",
  "peu",
  "peut",
  "peuvent",
  "plus",
  "plusieurs",
  "pour",
  "pourquoi",
  "pourra",
  "pourrait",
  "presque",
  "proche",
  "puis",
  "puisque",
  "qu",
  "quand",
  "que",
  "quel",
  "quelle",
  "quelles",
  "quelque",
  "quelques",
  "quels",
  "qui",
  "quoique",
  "re",
  "sans",
  "sauf",
  "se",
  "selon",
  "sera",
  "serai",
  "seraient",
  "serais",
  "serait",
  "seras",
  "serez",
  "seriez",
  "serions",
  "serons",
  "seront",
  "ses",
  "si",
  "sien",
  "sienne",
  "siennes",
  "siens",
  "sinon",
  "soi",
  "soit",
  "sommes",
  "son",
  "sont",
  "sous",
  "souvent",
  "soyez",
  "sujet",
  "sur",
  "ta",
  "tandis",
  "te",
  "tel",
  "telle",
  "telles",
  "tels",
  "tes",
  "toi",
  "ton",
  "toujours",
  "tous",
  "tout",
  "toute",
  "toutes",
  "tres",
  "tu",
  "un",
  "une",
  "vers",
  "via",
  "voici",
  "voila",
  "votre",
  "vous",
  "vu",
  "y",
  // Termes institutionnels IBAM à exclure
  "ibam",
  "burkinabe",
  "ujkz",
  "ouagadougou",
  "academique",
  "soutenance",
  "jury",
  "encadreur",
  "remerciements",
  "dedicace",
  "sommaire",
  "annexe",
  "memoire",
  "rapport",
  "stage",
  "master",
  "licence",
  "filiere",
  "departement",
]);

const STEM_SUFFIXES = [
  "ations",
  "ements",
  "ation",
  "ement",
  "iques",
  "ites",
  "ique",
  "ite",
  "eurs",
  "ions",
  "ment",
  "ants",
  "eur",
  "ion",
  "ant",
  "ees",
  "ee",
  "es",
  "e",
] as const;

function normalizeForFilter(text: string): string {
  return text
    .normalize("NFD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return text
    .normalize("NFD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS_FR.has(token));
}

export function stem(token: string): string {
  for (const suffix of STEM_SUFFIXES) {
    if (!token.endsWith(suffix)) continue;
    const root = token.slice(0, -suffix.length);
    if (root.length > 3) return root;
  }
  return token;
}

export function tokenizeAndStem(text: string): string[] {
  return tokenize(text).map(stem);
}

function jaccardTokens(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  setA.forEach((t) => {
    if (setB.has(t)) inter++;
  });
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
  const tokens = tokenize(paragraph);
  // Ne rejette pas les paragraphes courts : ils peuvent être du contenu légitime
  if (tokens.length === 0) return true;
  if (tokens.length < MIN_PARAGRAPH_TOKENS) return false;
  const blacklistTokens = tokenize(INSTITUTIONAL_PHRASES.join(" "));
  return (
    jaccardTokens(tokens, blacklistTokens) >= BOILERPLATE_JACCARD_THRESHOLD
  );
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
 * Coupe le texte pour démarrer l'analyse à partir du Chapitre 2,
 * afin d'ignorer la présentation institutionnelle du Chapitre 1.
 */
export function skipChapterOne(text: string): string {
  for (const marker of CHAPTER_TWO_START_MARKERS) {
    const match = marker.exec(text);
    if (match?.index !== undefined && match.index >= 0) {
      return text.slice(match.index);
    }
  }

  // Fallback: si on trouve une introduction générale, on la retire
  // pour limiter le bruit institutionnel même sans détection explicite du chapitre 2.
  const introEndRegex =
    /introduction\s+g[eé]n[eé]rale[\s\S]+?(?=\n\s*(?:chapitre\s*(?:ii|2)|2\s+[\.)\-:]?))/i;
  if (introEndRegex.test(text)) {
    return text.replace(introEndRegex, "").trim();
  }

  return text;
}

/**
 * Filtre le contenu d'un document avant analyse :
 * 1. Slice entre Introduction et Conclusion si détectées
 * 2. Supprime les paragraphes institutionnels (blacklist + Jaccard)
 */
export function filterInstitutionalContent(rawText: string): FilterResult {
  const originalLength = rawText.length;

  // ── Étape 0 : Amputation du chapitre 1 (bruit institutionnel massif) ───
  const afterChapterOneSkip = skipChapterOne(rawText);

  // ── Étape 1 : Slicing intro → conclusion ──────────────────────────────
  let sliced = afterChapterOneSkip;
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
    const end =
      conclusionFound && conclusionIndex > introIndex
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
