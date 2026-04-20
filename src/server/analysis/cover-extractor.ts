/**
 * cover-extractor.ts
 * Extrait les métadonnées structurées depuis la page de garde d'un mémoire IBAM.
 * Fonctionne sur le texte brut extrait (pas de parsing PDF direct).
 */

export type CoverMetadata = {
  authorName: string | null;
  department: string | null;
  academicYear: string | null;
};

// ── Mapping filières ────────────────────────────────────────────────────────
// Chaque entrée : [pattern de détection, label normalisé]
const DEPARTMENT_PATTERNS: Array<[RegExp, string | null]> = [
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
  [/licence\s+professionnelle\s+([A-Z]{2,6})/i, null], // capture groupe 1
];

// ── Patterns année académique ───────────────────────────────────────────────
const YEAR_PATTERNS: RegExp[] = [
  /ann[eé]e\s+acad[eé]mique\s*[:\-]?\s*(\d{4}[\s\-\/]+\d{4})/i,
  /(\d{4})\s*[-\/]\s*(\d{4})/,  // 2024-2025 ou 2024/2025
  /(\d{4})\s*[-\/]\s*(\d{2})/,  // 2024-25
];

// ── Patterns auteur ─────────────────────────────────────────────────────────
const AUTHOR_PATTERNS: RegExp[] = [
  /(?:pr[eé]sent[eé]\\s+par|r[eé]alis[eé]\\s+par|[eé]labor[eé]\\s+par|auteur)\\s*[:\\-]?\\s*([A-Z][^\\n\\r.;:]{2,60}?)(?=\\s{2,}|\\bsous\\b|\\bencadr|\\bdirecteur|\\bjury|$)/i,
];

// Mots à exclure des noms détectés (faux positifs fréquents)
const NAME_EXCLUSIONS = new Set([
  "IBAM", "UJKZ", "MIAGE", "CCA", "AGRO", "GI", "GC", "GM", "GE",
  "BURKINA", "FASO", "OUAGADOUGOU", "UNIVERSITE", "INSTITUT",
  "LICENCE", "MASTER", "RAPPORT", "STAGE", "MEMOIRE", "THESE",
  "JURY", "SOUTENU", "ANNEE", "ACADEMIQUE",
]);

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extrait la filière depuis le texte de la page de garde */
function extractDepartment(text: string): string | null {
  const normalized = normalizeText(text);

  for (const [pattern, label] of DEPARTMENT_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      // Si label est null, c'est un pattern avec groupe de capture
      if (label === null && match[1]) {
        return match[1].toUpperCase().trim();
      }
      return label;
    }
  }
  return null;
}

/** Extrait l'année académique depuis le texte */
function extractAcademicYear(text: string): string | null {
  const normalized = normalizeText(text);

  // Pattern explicite "Année académique : 2024-2025"
  const explicit = normalized.match(
    /ann[eé]e\s+acad[eé]mique\s*[:\-]?\s*(\d{4}[\s\-\/]+\d{2,4})/i,
  );
  if (explicit?.[1]) {
    return explicit[1].replace(/\s+/g, "-").replace(/\//g, "-").trim();
  }

  // Pattern implicite "2024-2025" dans les 500 premiers caractères
  const coverZone = normalized.slice(0, 800);
  const implicit = coverZone.match(/(\d{4})\s*[-\/]\s*(\d{4})/);
  if (implicit) {
    const y1 = parseInt(implicit[1]);
    const y2 = parseInt(implicit[2]);
    // Valider que c'est une année académique cohérente (écart de 1 an)
    if (y2 - y1 === 1 && y1 >= 2010 && y1 <= 2035) {
      return `${y1}-${y2}`;
    }
  }

  // Pattern court "2024-25"
  const short = coverZone.match(/(\d{4})\s*[-\/]\s*(\d{2})(?!\d)/);
  if (short) {
    const y1 = parseInt(short[1]);
    const y2short = parseInt(short[2]);
    const y2 = Math.floor(y1 / 100) * 100 + y2short;
    if (y2 - y1 === 1 && y1 >= 2010 && y1 <= 2035) {
      return `${y1}-${y2}`;
    }
  }

  return null;
}

/** Extrait le nom de l'auteur depuis le texte de la page de garde */
function extractAuthorName(text: string): string | null {
  const normalized = normalizeText(text);

  // Chercher après "Présenté par", "Réalisé par", etc.
  for (const pattern of AUTHOR_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      const candidate = (match[1] + (match[2] ? " " + match[2] : "")).trim();
      const words = candidate.split(/\s+/);
      // Vérifier qu'aucun mot n'est dans la liste d'exclusions
      if (words.every((w) => !NAME_EXCLUSIONS.has(w.toUpperCase()))) {
        if (candidate.length >= 4 && candidate.length <= 80) {
          return candidate;
        }
      }
    }
  }
  return null;
}

/**
 * Extrait toutes les métadonnées de la page de garde.
 * Utilise uniquement les 1500 premiers caractères (page de garde).
 */
export function extractCoverMetadata(extractedText: string): CoverMetadata {
  // Se concentrer sur la page de garde (premiers ~1500 caractères)
  const coverZone = extractedText.slice(0, 1500);

  return {
    authorName: extractAuthorName(coverZone),
    department: extractDepartment(coverZone),
    academicYear: extractAcademicYear(coverZone),
  };
}
