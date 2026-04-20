/**
 * cover-extractor.ts
 * Extraction géométrique des métadonnées de page de garde IBAM.
 *
 * Approche : ancres strictes par mots-clés (THEME, Présenté par, Maître de stage)
 * + distance de Levenshtein pour la correspondance floue des ancres OCR.
 */

export type CoverMetadata = {
  subjectLabel: string | null;
  authorName: string | null;
  department: string | null;
  academicYear: string | null;
};

// ── Distance de Levenshtein (fuzzy matching des ancres OCR) ─────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Cherche une ancre dans le texte avec tolérance OCR (Levenshtein <= maxDist) */
function findAnchorIndex(
  text: string,
  anchor: string,
  maxDist = 2,
): number {
  const lower = text.toLowerCase();
  const anchorLower = anchor.toLowerCase();
  const anchorLen = anchorLower.length;

  // Recherche exacte d'abord (rapide)
  const exact = lower.indexOf(anchorLower);
  if (exact !== -1) return exact;

  // Recherche floue : fenêtre glissante
  for (let i = 0; i <= lower.length - anchorLen + maxDist; i++) {
    const window = lower.slice(i, i + anchorLen);
    if (levenshtein(window, anchorLower) <= maxDist) {
      return i;
    }
  }
  return -1;
}

// ── Normalisation du texte ──────────────────────────────────────────────────
function flattenText(text: string): string {
  return text
    .replace(/\r/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Convertit "BANDE HAMIDOU" ou "bande hamidou" en "Bande Hamidou" */
function toProperCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase())
    .trim();
}

/** Nettoie un nom d'auteur : supprime titres, préfixes, caractères parasites */
function cleanAuthorName(raw: string): string {
  return raw
    .replace(/^(?:M\.|Mme\.?|Monsieur|Madame|Dr\.?|Pr\.?)\s+/i, "")
    .replace(/[^\w\s\u00c0-\u024f'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Nettoie un titre de thème */
function cleanSubject(raw: string): string {
  return raw
    .replace(/[^\w\s\u00c0-\u024f'«»"":,.()\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Termes OS/génériques à rejeter dans un titre de thème
const SUBJECT_REJECT_TERMS = [
  "windows", "linux", "macos", "android", "ios",
  "miage", "cca", "agro", "ibam", "ujkz",
  "burkina", "ouagadougou",
];

function isValidSubject(text: string): boolean {
  const lower = text.toLowerCase();
  // Rejeter si trop court ou contient des termes OS/institutionnels
  if (text.length < 10) return false;
  if (SUBJECT_REJECT_TERMS.some((t) => lower.includes(t))) return false;
  return true;
}

// ── Ancres de la page de garde IBAM ────────────────────────────────────────
// Ordre typique : THEME → Présenté par → Maître de stage / Encadreur

const THEME_ANCHORS = [
  "theme :", "thème :", "theme:", "thème:", "theme -", "sujet :", "sujet:",
  "intitule :", "intitulé :", "titre :",
];

const AUTHOR_START_ANCHORS = [
  "présenté par", "presente par", "réalisé par", "realise par",
  "elaboré par", "elabore par", "auteur :", "auteur:",
];

const AUTHOR_END_ANCHORS = [
  "maître de stage", "maitre de stage", "encadreur", "encadreur pédagogique",
  "directeur de mémoire", "directeur de memoire", "sous la direction",
  "jury", "soutenu le", "année académique", "annee academique",
];

// ── Mapping filières ────────────────────────────────────────────────────────
const DEPARTMENT_PATTERNS: Array<[RegExp, string]> = [
  [/m[eé]thodes?\s+informatiques?\s+appliqu[eé]es?\s+[àa]\s+la\s+gestion/i, "MIAGE"],
  [/\bMIAGE\b/, "MIAGE"],
  [/comptabilit[eé]\s+contr[oô]le\s+audit/i, "CCA"],
  [/\bCCA\b/, "CCA"],
  [/g[eé]nie\s+informatique/i, "GI"],
  [/\bGI\b(?!\w)/, "GI"],
  [/g[eé]nie\s+civil/i, "GC"],
  [/g[eé]nie\s+m[eé]canique/i, "GM"],
  [/g[eé]nie\s+[eé]lectrique/i, "GE"],
  [/agriculture\s+et\s+[eé]levage/i, "AGRO"],
  [/\bAGRO\b/, "AGRO"],
];

// ── Extraction par ancres ───────────────────────────────────────────────────

function extractSubjectByAnchors(cover: string): string | null {
  const flat = flattenText(cover);

  // 1. Chercher l'ancre THEME avec tolérance OCR
  let themeStart = -1;
  let themeAnchorLen = 0;
  for (const anchor of THEME_ANCHORS) {
    const idx = findAnchorIndex(flat, anchor, 1);
    if (idx !== -1) {
      themeStart = idx + anchor.length;
      themeAnchorLen = anchor.length;
      break;
    }
  }

  if (themeStart === -1) {
    // Fallback : chercher le bloc en majuscules le plus long sur la page de garde
    return extractLongestUppercaseBlock(flat);
  }

  // 2. Chercher la fin du thème = début de "Présenté par"
  let themeEnd = flat.length;
  for (const anchor of AUTHOR_START_ANCHORS) {
    const idx = findAnchorIndex(flat.slice(themeStart), anchor, 2);
    if (idx !== -1) {
      themeEnd = themeStart + idx;
      break;
    }
  }

  const raw = flat.slice(themeStart, themeEnd).trim();
  const cleaned = cleanSubject(raw);

  if (isValidSubject(cleaned)) {
    return cleaned.length > 200 ? cleaned.slice(0, 200).trim() : cleaned;
  }

  // Si le résultat est invalide, fallback sur le bloc majuscules
  return extractLongestUppercaseBlock(flat);
}

/** Fallback : bloc de texte en majuscules le plus long (souvent le titre) */
function extractLongestUppercaseBlock(flat: string): string | null {
  const blocks = flat.match(/[A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ][A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ\s'«»"":,.()\-]{15,}/g);
  if (!blocks) return null;

  const candidates = blocks
    .map((b) => b.trim())
    .filter((b) => isValidSubject(b))
    .sort((a, b) => b.length - a.length);

  return candidates[0] ?? null;
}

function extractAuthorByAnchors(cover: string): string | null {
  const flat = flattenText(cover);

  // Chercher l'ancre "Présenté par" avec tolérance OCR
  let authorStart = -1;
  for (const anchor of AUTHOR_START_ANCHORS) {
    const idx = findAnchorIndex(flat, anchor, 2);
    if (idx !== -1) {
      authorStart = idx + anchor.length;
      // Sauter les séparateurs ": " ou "- "
      const afterAnchor = flat.slice(authorStart).match(/^\s*[:\-]?\s*/);
      if (afterAnchor) authorStart += afterAnchor[0].length;
      break;
    }
  }

  if (authorStart === -1) return null;

  // Chercher la fin du nom = début de l'ancre suivante
  let authorEnd = Math.min(flat.length, authorStart + 120);
  for (const anchor of AUTHOR_END_ANCHORS) {
    const idx = findAnchorIndex(flat.slice(authorStart), anchor, 2);
    if (idx !== -1 && idx < authorEnd - authorStart) {
      authorEnd = authorStart + idx;
      break;
    }
  }

  const raw = flat.slice(authorStart, authorEnd).trim();
  const cleaned = cleanAuthorName(raw);

  if (cleaned.length < 3 || cleaned.length > 80) return null;

  // Proper case si tout en majuscules
  const isAllCaps = cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned);
  return isAllCaps ? toProperCase(cleaned) : cleaned;
}

function extractDepartment(cover: string): string | null {
  const flat = flattenText(cover);
  for (const [pattern, label] of DEPARTMENT_PATTERNS) {
    if (pattern.test(flat)) return label;
  }
  return null;
}

function extractAcademicYear(cover: string): string | null {
  const flat = flattenText(cover);

  // Explicite : "Année Académique : 2024-2025"
  const explicit = flat.match(
    /ann[eé]e\s+acad[eé]mique\s*[:\-]?\s*(\d{4}[\s\-\/]+\d{2,4})/i,
  );
  if (explicit?.[1]) {
    return explicit[1].replace(/\s+/g, "-").replace(/\//g, "-").trim();
  }

  // Implicite : "2024-2025" ou "2024/2025"
  const implicit = flat.match(/(\d{4})\s*[-\/]\s*(\d{4})/);
  if (implicit) {
    const y1 = parseInt(implicit[1]);
    const y2 = parseInt(implicit[2]);
    if (y2 - y1 === 1 && y1 >= 2010 && y1 <= 2035) return `${y1}-${y2}`;
  }

  // Court : "2024-25"
  const short = flat.match(/(\d{4})\s*[-\/]\s*(\d{2})(?!\d)/);
  if (short) {
    const y1 = parseInt(short[1]);
    const y2 = Math.floor(y1 / 100) * 100 + parseInt(short[2]);
    if (y2 - y1 === 1 && y1 >= 2010 && y1 <= 2035) return `${y1}-${y2}`;
  }

  return null;
}

// ── Export principal ────────────────────────────────────────────────────────

/**
 * Extrait les métadonnées structurées de la page de garde d'un mémoire IBAM.
 * Utilise les 2000 premiers caractères (page de garde uniquement).
 */
export function extractCoverMetadata(extractedText: string): CoverMetadata {
  const coverZone = extractedText.slice(0, 2000);

  return {
    subjectLabel: extractSubjectByAnchors(coverZone),
    authorName: extractAuthorByAnchors(coverZone),
    department: extractDepartment(coverZone),
    academicYear: extractAcademicYear(coverZone),
  };
}
