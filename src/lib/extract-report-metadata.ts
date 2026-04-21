export type ReportMetadata = {
  theme: string | null;
  studentName: string | null;
  isUncertain?: true;
};

const NOISE_WORDS = [
  /UNIVERSIT[EÉ]/gi,
  /JOSEPH\s+KI[-\s]?ZERBO/gi,
  /IBAM/gi,
  /RAPPORT\s+DE\s+STAGE/gi,
  /LICEN[CS]E/gi,
];

const TITLE_PREFIXES = /^(M\.?|Mme\.?|Monsieur|Madame)\s+/i;

function cleanNoise(text: string): string {
  let result = text;
  for (const pattern of NOISE_WORDS) {
    result = result.replace(pattern, "");
  }
  return result.replace(/\s+/g, " ").trim();
}

function extractTheme(text: string): { value: string | null; uncertain: boolean } {
  // Strategy 1: fuzzy anchor between THEME and "Présenté par" / "Par :"
  const anchorMatch = text.match(
    /(?:TH[EÈ]ME)\s*[:\-]?\s*([\s\S]*?)(?=Pr[eé]sent[eé]\s+par|Par\s*:)/i,
  );
  if (anchorMatch) {
    const candidate = cleanNoise(anchorMatch[1]);
    if (candidate.length >= 10) return { value: candidate, uncertain: false };
  }

  // Strategy 2: longest all-uppercase block
  const upperBlocks = text.match(/[A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ][A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ\s'''\-]{9,}/g);
  if (upperBlocks) {
    const best = upperBlocks
      .map((b) => cleanNoise(b.trim()))
      .filter((b) => b.length >= 10)
      .sort((a, b) => b.length - a.length)[0];
    if (best) return { value: best, uncertain: true };
  }

  return { value: null, uncertain: true };
}

function extractStudentName(text: string): string | null {
  const match = text.match(
    /Pr[eé]sent[eé]\s+par\s*:?\s*([\s\S]*?)(?:\n\s*\n|Ma[iî]tre\s+de\s+stage|$)/i,
  );
  if (!match) return null;

  const raw = match[1].split("\n")[0].trim();
  return raw.replace(TITLE_PREFIXES, "").replace(/\s+/g, " ").trim() || null;
}

export function extractReportMetadata(text: string): ReportMetadata {
  const { value: theme, uncertain } = extractTheme(text);
  const studentName = extractStudentName(text);

  const result: ReportMetadata = { theme, studentName };
  if (uncertain || !theme || !studentName) result.isUncertain = true;

  return result;
}
