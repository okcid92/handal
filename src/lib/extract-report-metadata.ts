export interface ExtractionResult {
  theme: string;
  studentName: string;
  department: string;
  academicYear: string;
  confidenceScore: number;
  _debug?: {
    themeConfidence: number;
    studentConfidence: number;
    departmentConfidence: number;
    yearConfidence: number;
    themeMethod:
      | "anchor_full"
      | "anchor_section"
      | "anchor_inline"
      | "fallback_caps"
      | "none";
    studentMethod: "anchor" | "fallback_after_par" | "none";
    rawYearToken?: string;
  };
}

export type ReportMetadata = {
  theme: string | null;
  studentName: string | null;
  isUncertain?: true;
  confidenceScore?: number;
};

function normalizePdfText(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, " ")
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

const RE_THEME_FULL = /th[eèê]me\s*:?\s*([\s\S]+?)(?=pr[eéê]sent[eéê]\s+par)/i;

const RE_THEME_SECTION =
  /th[eèê]me\s*:?\s*\n?([\s\S]+?)(?=\n[ \t]*\n|\n[ \t]*(?:pr[eé]sent|ma[iî]tre|directeur|p[eé]riode|ann[eé]e|encadreur|jury|auteur|soutenu|r[eé]alis|sommaire|d[eé]dicaces?))/i;

const RE_THEME_INLINE = /th[eèê]me\s*:?\s*((?:[^\n]+\n?){1,6})/i;

const RE_STUDENT_PRIMARY =
  /pr[eéê]sent[eéê]\s+par\s*:?\s*([\s\S]+?)(?=\n\s*\n|ma[iî]tre\s+de\s+stage|encadreur|directeur|jury|ann[eé]e\s+acad[eé]mique|$)/i;

const RE_ACADEMIC_YEAR =
  /ann[eé]e\s+acad[eé]mique\s*:?\s*(\d{4}\s*[-\u2013\u2014\/]{1,3}\s*\d{4})/i;

const RE_CIVILITY_TITLES =
  /\b(m\.|mme\.?|monsieur|madame|mademoiselle|dr\.?|pr\.?)\s*/gi;

const RE_CAPS_BLOCK =
  /[A-Z\u00C0-\u00D6\u00D8-\u00DE][A-Z\u00C0-\u00D6\u00D8-\u00DE \t''\u2019\-,]{19,}/g;

const RE_NAME_AFTER_PAR =
  /\bpar\s+([A-Z\u00C0-\u00D6\u00D8-\u00DE][A-Za-z\u00C0-\u00FF]+(?:\s+[A-Z\u00C0-\u00FF][A-Za-z\u00C0-\u00FF]+){1,2})/i;

const HEADER_WORDS = new Set([
  "RAPPORT",
  "OBTENTION",
  "LICENCE",
  "PROFESSIONNELLE",
  "UNIVERSITE",
  "UNIVERSITY",
  "IBAM",
  "INSTITUT",
  "BURKINABE",
  "ARTS",
  "METIERS",
  "ZERBO",
  "SOMMAIRE",
  "DEDICACES",
  "DEDICACE",
]);

const NOISE_WORDS = [
  /UNIVERSIT[EÉ]/gi,
  /JOSEPH\s+KI[-\s]?ZERBO/gi,
  /IBAM/gi,
  /RAPPORT\s+DE\s+STAGE/gi,
  /LICEN[CS]E/gi,
  /REMERCIEMENT[S]?/gi,
];

function isHeaderBlock(text: string): boolean {
  let count = 0;
  for (const w of text.toUpperCase().split(/\s+/)) {
    if (HEADER_WORDS.has(w) && ++count >= 2) return true;
  }
  return false;
}

const DEPARTMENT_MAP: Record<string, string> = {
  MIAGE: "Methodes Informatiques Appliquees a la Gestion",
  CCA: "Comptabilite-Controle-Audit",
  AGRO: "Agronomie",
  MID: "Marketing et Innovation Digitale",
  ABF: "Assurance Banque Finance",
  ADB: "Assistant de Direction Bilingue",
  ADC: "Assistant de Direction Comptable",
  M2ISIE: "Ingenierie des Systemes d'Information en Entreprise",
  MISI: "Securite Informatique",
  IBF: "Ingenierie Bancaire et Financiere",
  MAGE: "Administration et Gestion des Entreprises",
  MCCA: "Master Comptabilite-Controle-Audit",
};

function normalizeWhitespace(raw: string): string {
  return raw
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanNoise(text: string): string {
  let result = text;
  for (const pattern of NOISE_WORDS) result = result.replace(pattern, "");
  return result.replace(/\s+/g, " ").trim();
}

function toProperCase(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => {
      if (!w) return w;
      if (w === w.toUpperCase() && w.length > 1) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ")
    .trim();
}

function cleanTheme(raw: string): string {
  return normalizeWhitespace(
    raw
      .replace(/[«»"""*]/g, "")
      .replace(/^\s*[-\u2013\u2014]+\s*/gm, "")
      .replace(/\n\s*pr[eéê]sent[eéê]\s+par\s*:?.*$/i, "")
      .replace(/\boption\s*:.*$/im, ""),
  );
}

function normalizeYearSeparator(raw: string): string {
  return raw
    .replace(/\s*[-\u2013\u2014\/\u2212]+\s*/g, "-")
    .replace(/-{2,}/g, "-");
}

function firstThird(text: string): string {
  const cutoff = Math.max(500, Math.floor(text.length / 3));
  return text.slice(0, cutoff);
}

interface FieldResult<T> {
  value: T;
  confidence: number;
  method: string;
}

function extractTheme(text: string): FieldResult<string> & {
  method:
    | "anchor_full"
    | "anchor_section"
    | "anchor_inline"
    | "fallback_caps"
    | "none";
} {
  const m1 = RE_THEME_FULL.exec(text);
  if (m1?.[1]) {
    const c = cleanNoise(cleanTheme(m1[1]));
    if (c.length >= 10 && !isHeaderBlock(c)) {
      return { value: c, confidence: 0.95, method: "anchor_full" };
    }
  }

  const m2 = RE_THEME_SECTION.exec(text);
  if (m2?.[1]) {
    const c = cleanNoise(cleanTheme(m2[1]));
    if (c.length >= 10 && !isHeaderBlock(c)) {
      return { value: c, confidence: 0.9, method: "anchor_section" };
    }
  }

  const m3 = RE_THEME_INLINE.exec(text);
  if (m3?.[1]) {
    const c = cleanNoise(cleanTheme(m3[1]));
    if (c.length >= 10 && !isHeaderBlock(c)) {
      return { value: c, confidence: 0.8, method: "anchor_inline" };
    }
  }

  const candidates = [...firstThird(text).matchAll(RE_CAPS_BLOCK)]
    .map((m) => m[0])
    .filter((c) => !isHeaderBlock(c))
    .sort((a, b) => b.length - a.length);

  if (candidates.length > 0) {
    const c = cleanNoise(cleanTheme(candidates[0]));
    if (c.length >= 15)
      return { value: c, confidence: 0.6, method: "fallback_caps" };
  }

  return { value: "", confidence: 0, method: "none" };
}

function extractStudent(text: string): FieldResult<string> & {
  method: "anchor" | "fallback_after_par" | "none";
} {
  const m = RE_STUDENT_PRIMARY.exec(text);
  if (m?.[1]) {
    const name = normalizeWhitespace(
      m[1].split("\n")[0].replace(RE_CIVILITY_TITLES, ""),
    );
    const candidate = name.split(/\s+/).filter(Boolean).slice(0, 4).join(" ");
    if (candidate.length >= 4)
      return { value: candidate, confidence: 0.92, method: "anchor" };
  }
  const fb = RE_NAME_AFTER_PAR.exec(text);
  if (fb?.[1]) {
    return {
      value: toProperCase(normalizeWhitespace(fb[1])),
      confidence: 0.55,
      method: "fallback_after_par",
    };
  }
  return { value: "", confidence: 0, method: "none" };
}

function extractDepartment(text: string): FieldResult<string> {
  for (const code of Object.keys(DEPARTMENT_MAP)) {
    if (new RegExp(`\\b${code}\\b`, "i").test(text)) {
      return { value: code, confidence: 0.9, method: `keyword_${code}` };
    }
  }
  const opt = /option\s*:?\s*([A-Za-z\u00C0-\u00FF\s()]+?)(?=\n|$)/i.exec(text);
  if (opt?.[1])
    return {
      value: normalizeWhitespace(opt[1]),
      confidence: 0.5,
      method: "option_label",
    };
  return { value: "Inconnu", confidence: 0.1, method: "none" };
}

function extractAcademicYear(
  text: string,
): FieldResult<string> & { rawToken?: string } {
  const m = RE_ACADEMIC_YEAR.exec(text);
  if (m?.[1]) {
    return {
      value: normalizeYearSeparator(m[1]),
      confidence: 0.95,
      method: "regex_label",
      rawToken: m[1],
    };
  }
  const bare = /\b(\d{4}\s*[-\u2013\u2014\/]{1,3}\s*\d{4})\b/.exec(text);
  if (bare?.[1]) {
    return {
      value: normalizeYearSeparator(bare[1]),
      confidence: 0.65,
      method: "bare_years",
      rawToken: bare[1],
    };
  }
  return { value: "", confidence: 0, method: "none" };
}

export function extractCoverPage(
  extractedText: string,
  debug = false,
): ExtractionResult {
  if (!extractedText?.trim()) {
    return {
      theme: "",
      studentName: "",
      department: "Inconnu",
      academicYear: "",
      confidenceScore: 0,
      ...(debug && {
        _debug: {
          themeConfidence: 0,
          studentConfidence: 0,
          departmentConfidence: 0,
          yearConfidence: 0,
          themeMethod: "none",
          studentMethod: "none",
        },
      }),
    };
  }

  const text = normalizePdfText(extractedText);

  const themeR = extractTheme(text);
  const studentR = extractStudent(text);
  const deptR = extractDepartment(text);
  const yearR = extractAcademicYear(text);

  const confidenceScore = parseFloat(
    (
      themeR.confidence * 0.35 +
      studentR.confidence * 0.3 +
      deptR.confidence * 0.2 +
      yearR.confidence * 0.15
    ).toFixed(3),
  );

  const result: ExtractionResult = {
    theme: themeR.value,
    studentName: studentR.value,
    department: deptR.value,
    academicYear: yearR.value,
    confidenceScore,
  };

  if (debug) {
    result._debug = {
      themeConfidence: themeR.confidence,
      studentConfidence: studentR.confidence,
      departmentConfidence: deptR.confidence,
      yearConfidence: yearR.confidence,
      themeMethod: themeR.method as NonNullable<
        ExtractionResult["_debug"]
      >["themeMethod"],
      studentMethod: studentR.method as NonNullable<
        ExtractionResult["_debug"]
      >["studentMethod"],
      rawYearToken: (yearR as { rawToken?: string }).rawToken,
    };
  }

  return result;
}

export function extractReportMetadata(text: string): ReportMetadata {
  const extracted = extractCoverPage(text);
  const theme = extracted.theme || null;
  const studentName = extracted.studentName || null;

  const result: ReportMetadata = {
    theme,
    studentName,
    confidenceScore: extracted.confidenceScore,
  };

  if (!theme || !studentName) {
    result.isUncertain = true;
  }

  return result;
}
