import {
  buildExclusionNote,
  filterInstitutionalContent,
  tokenize,
  tokenizeAndStem,
  type FilterResult,
} from "./content-filter";

export interface Document {
  name: string;
  content: string;
}

export interface DetailedScores {
  cosine: number; // 0-1
  jaccard: number; // 0-1
  ngram: number; // 0-1
  winnowing: number; // 0-1
  lcs: number; // 0-1
  style: number; // 0-1
  simhash: number; // 0-1 (indicateur)
  semantic?: number; // 0-1 optionnel
  combined: number; // 0-1
  riskLevel: "low" | "medium" | "high";
}

export interface SimilarityResult {
  name: string;
  cosineTFIDF: number;
  jaccard: number;
  ngram: number;
  winnowing: number;
  lcs: number;
  style: number;
  simhash: number;
  semantic?: number;
  combined: number;
  commonPhrases: string[];
}

export interface PlagiarismReport {
  mainDocument: string;
  analyzedAt: Date;
  maxSimilarity: number;
  avgSimilarity: number;
  combined: number;
  results: SimilarityResult[];
  exclusionNote: string | null;
  filterResult: Pick<
    FilterResult,
    "wasSliced" | "introFound" | "conclusionFound" | "excludedRatio"
  >;
}

type TFIDFVector = Map<string, number>;

const LCS_TOKEN_LIMIT = 500;
const WINNOWING_K = 5;
const WINNOWING_WINDOW = 4;
const LOGICAL_CONNECTORS = [
  "cependant",
  "neanmoins",
  "toutefois",
  "donc",
  "ainsi",
  "par consequent",
  "en effet",
  "de plus",
  "en outre",
  "premierement",
  "deuxiemement",
  "enfin",
  "finalement",
  "or",
  "c est pourquoi",
  "par ailleurs",
  "d ailleurs",
];

function stripHTML(text: string): string {
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function normalizeRawText(text: string): string {
  return stripHTML(text)
    .normalize("NFD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function createTf(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  const total = tokens.length || 1;
  for (const [token, count] of tf) {
    tf.set(token, count / total);
  }
  return tf;
}

function createTfidfVectors(tokenLists: string[][]): TFIDFVector[] {
  const docCount = tokenLists.length;
  const df = new Map<string, number>();

  for (const tokens of tokenLists) {
    const seen = new Set(tokens);
    for (const token of seen) {
      df.set(token, (df.get(token) ?? 0) + 1);
    }
  }

  return tokenLists.map((tokens) => {
    if (tokens.length === 0) return new Map<string, number>();
    const tf = createTf(tokens);
    const vector = new Map<string, number>();
    for (const [token, tfValue] of tf) {
      const docFreq = df.get(token) ?? 0;
      const idf = Math.log((1 + docCount) / (1 + docFreq)) + 1;
      vector.set(token, tfValue * idf);
    }
    return vector;
  });
}

function cosineSimilarity(a: TFIDFVector, b: TFIDFVector): number {
  if (a.size === 0 || b.size === 0) return 0;
  const keys = new Set([...a.keys(), ...b.keys()]);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const key of keys) {
    const av = a.get(key) ?? 0;
    const bv = b.get(key) ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  if (normA === 0 || normB === 0) return 0;
  return clamp01(dot / (Math.sqrt(normA) * Math.sqrt(normB)));
}

function jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : clamp01(intersection / union);
}

function ngrams(tokens: string[], n: number): Set<string> {
  const grams = new Set<string>();
  if (tokens.length < n) return grams;
  for (let i = 0; i <= tokens.length - n; i += 1) {
    grams.add(tokens.slice(i, i + n).join(" "));
  }
  return grams;
}

function diceCoefficient(setA: Set<string | number>, setB: Set<string | number>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection += 1;
  }
  return clamp01((2 * intersection) / (setA.size + setB.size));
}

function ngramSimilarity(tokensA: string[], tokensB: string[]): number {
  const biA = ngrams(tokensA, 2);
  const biB = ngrams(tokensB, 2);
  const triA = ngrams(tokensA, 3);
  const triB = ngrams(tokensB, 3);
  const bigramScore = diceCoefficient(biA, biB);
  const trigramScore = diceCoefficient(triA, triB);
  return clamp01(0.6 * bigramScore + 0.4 * trigramScore);
}

function polynomialHash(tokens: string[]): number {
  const joined = tokens.join(" ");
  let hash = 0;
  const base = 257;
  const mod = 2_147_483_647;
  for (let i = 0; i < joined.length; i += 1) {
    hash = (hash * base + joined.charCodeAt(i)) % mod;
  }
  return hash;
}

function winnowingFingerprints(tokens: string[]): Set<number> {
  if (tokens.length < WINNOWING_K) return new Set<number>();

  const shingleHashes: number[] = [];
  for (let i = 0; i <= tokens.length - WINNOWING_K; i += 1) {
    shingleHashes.push(polynomialHash(tokens.slice(i, i + WINNOWING_K)));
  }

  const fingerprints = new Set<number>();
  const windowSize = Math.min(WINNOWING_WINDOW, shingleHashes.length);
  for (let i = 0; i <= shingleHashes.length - windowSize; i += 1) {
    let min = Number.MAX_SAFE_INTEGER;
    for (let j = i; j < i + windowSize; j += 1) {
      if (shingleHashes[j] < min) min = shingleHashes[j];
    }
    fingerprints.add(min);
  }
  return fingerprints;
}

function winnowingSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length < WINNOWING_K || tokensB.length < WINNOWING_K) return 0;
  const fingerprintsA = winnowingFingerprints(tokensA);
  const fingerprintsB = winnowingFingerprints(tokensB);
  return diceCoefficient(fingerprintsA, fingerprintsB);
}

function lcsSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const a = tokensA.slice(0, LCS_TOKEN_LIMIT);
  const b = tokensB.slice(0, LCS_TOKEN_LIMIT);
  const prev = new Array<number>(b.length + 1).fill(0);
  const curr = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      if (a[i - 1] === b[j - 1]) curr[j] = prev[j - 1] + 1;
      else curr[j] = Math.max(curr[j - 1], prev[j]);
    }
    for (let j = 0; j <= b.length; j += 1) {
      prev[j] = curr[j];
      curr[j] = 0;
    }
  }

  const lcsLength = prev[b.length];
  return clamp01((2 * lcsLength) / (a.length + b.length));
}

function safeRatio(a: number, b: number): number {
  if (a === 0 && b === 0) return 1;
  const max = Math.max(a, b);
  if (max === 0) return 1;
  return clamp01(1 - Math.abs(a - b) / max);
}

function extractStyleMetrics(text: string) {
  const normalized = normalizeRawText(text);
  const words = tokenize(normalized);
  const wordCount = words.length;
  const sentences = normalized
    .split(/[.!?]+/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const paragraphs = stripHTML(text)
    .split(/\n{2,}|\r\n{2,}/g)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const punctuationCount = (stripHTML(text).match(/[.,;:!?()"'«»\-]/g) ?? [])
    .length;
  const uniqueWords = new Set(words).size;

  let connectorCount = 0;
  for (const connector of LOGICAL_CONNECTORS) {
    const regex = new RegExp(`\\b${connector}\\b`, "g");
    connectorCount += (normalized.match(regex) ?? []).length;
  }

  return {
    avgSentenceLength:
      sentences.length > 0 ? wordCount / sentences.length : 0,
    avgWordLength:
      wordCount > 0
        ? words.reduce((sum, word) => sum + word.length, 0) / wordCount
        : 0,
    punctuationDensity: wordCount > 0 ? punctuationCount / wordCount : 0,
    lexicalDiversity: wordCount > 0 ? uniqueWords / wordCount : 0,
    paragraphCount: paragraphs.length,
    connectorDensity: wordCount > 0 ? connectorCount / wordCount : 0,
  };
}

function styleSimilarity(textA: string, textB: string): number {
  const a = extractStyleMetrics(textA);
  const b = extractStyleMetrics(textB);
  const scores = [
    safeRatio(a.avgSentenceLength, b.avgSentenceLength),
    safeRatio(a.avgWordLength, b.avgWordLength),
    safeRatio(a.punctuationDensity, b.punctuationDensity),
    safeRatio(a.lexicalDiversity, b.lexicalDiversity),
    safeRatio(a.paragraphCount, b.paragraphCount),
    safeRatio(a.connectorDensity, b.connectorDensity),
  ];
  return clamp01(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

function fnv1a64(input: string): bigint {
  let hash = BigInt("0xcbf29ce484222325");
  const prime = BigInt("0x100000001b3");
  const one = BigInt(1);
  const mask = (one << BigInt(64)) - one;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * prime) & mask;
  }
  return hash;
}

function simhash64(tokens: string[]): bigint {
  const vector = new Array<number>(64).fill(0);
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  for (const [token, count] of tf) {
    const hash = fnv1a64(token);
    for (let bit = 0; bit < 64; bit += 1) {
      const one = BigInt(1);
      const bitSet = ((hash >> BigInt(bit)) & one) === one;
      vector[bit] += bitSet ? count : -count;
    }
  }
  let result = BigInt(0);
  for (let bit = 0; bit < 64; bit += 1) {
    if (vector[bit] >= 0) result |= BigInt(1) << BigInt(bit);
  }
  return result;
}

function simhashSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const hashA = simhash64(tokensA);
  const hashB = simhash64(tokensB);
  let identical = 0;
  for (let bit = 0; bit < 64; bit += 1) {
    const mask = BigInt(1) << BigInt(bit);
    if ((hashA & mask) === (hashB & mask)) identical += 1;
  }
  return identical / 64;
}

function findCommonPhrases(
  textA: string,
  textB: string,
  phraseLength = 4,
  maxResults = 5,
): string[] {
  const tokensA = tokenizeAndStem(textA);
  const tokensB = tokenizeAndStem(textB);
  if (tokensA.length < phraseLength || tokensB.length < phraseLength) return [];

  const gramsB = new Set<string>();
  for (let i = 0; i <= tokensB.length - phraseLength; i += 1) {
    gramsB.add(tokensB.slice(i, i + phraseLength).join(" "));
  }

  const found = new Set<string>();
  for (let i = 0; i <= tokensA.length - phraseLength; i += 1) {
    const phrase = tokensA.slice(i, i + phraseLength).join(" ");
    if (gramsB.has(phrase)) found.add(phrase);
    if (found.size >= maxResults) break;
  }
  return [...found];
}

function riskFromCombined(combined: number): "low" | "medium" | "high" {
  if (combined < 0.2) return "low";
  if (combined < 0.7) return "medium";
  return "high";
}

export async function analyzePlagiarism(
  textA: string,
  textB: string,
  semanticScore?: number,
): Promise<DetailedScores> {
  const sourceA = stripHTML(textA);
  const sourceB = stripHTML(textB);
  const tokensA = tokenizeAndStem(sourceA);
  const tokensB = tokenizeAndStem(sourceB);

  if (tokensA.length === 0 || tokensB.length === 0) {
    const empty: DetailedScores = {
      cosine: 0,
      jaccard: 0,
      ngram: 0,
      winnowing: 0,
      lcs: 0,
      style: 0,
      simhash: 0,
      combined: 0,
      riskLevel: "low",
    };
    if (semanticScore !== undefined) empty.semantic = clamp01(semanticScore);
    return empty;
  }

  const [vectorA, vectorB] = createTfidfVectors([tokensA, tokensB]);
  const cosine = cosineSimilarity(vectorA, vectorB);
  const jaccard = jaccardSimilarity(tokensA, tokensB);
  const ngram = ngramSimilarity(tokensA, tokensB);
  const winnowing = winnowingSimilarity(tokensA, tokensB);
  const lcs = lcsSimilarity(tokensA, tokensB);
  const style = styleSimilarity(sourceA, sourceB);
  const simhash = simhashSimilarity(tokensA, tokensB);
  const semantic = semanticScore !== undefined ? clamp01(semanticScore) : undefined;

  const combined =
    semantic === undefined
      ? 0.3 * cosine +
        0.2 * jaccard +
        0.2 * ngram +
        0.15 * winnowing +
        0.1 * lcs +
        0.05 * style
      : 0.2 * cosine +
        0.1 * jaccard +
        0.15 * ngram +
        0.15 * winnowing +
        0.15 * semantic +
        0.15 * lcs +
        0.05 * style;

  return {
    cosine,
    jaccard,
    ngram,
    winnowing,
    lcs,
    style,
    simhash,
    semantic,
    combined: clamp01(combined),
    riskLevel: riskFromCombined(combined),
  };
}

export async function analyzePlagiarismReport(
  main: Document,
  references: Document[],
): Promise<PlagiarismReport> {
  const filterResult = filterInstitutionalContent(main.content);
  const filteredMain = { ...main, content: filterResult.filteredContent };
  const filteredReferences = references.map((ref) => ({
    ...ref,
    content: filterInstitutionalContent(ref.content).filteredContent,
  }));

  const results: SimilarityResult[] = [];
  for (const ref of filteredReferences) {
    const detailed = await analyzePlagiarism(filteredMain.content, ref.content);
    results.push({
      name: ref.name,
      cosineTFIDF: detailed.cosine,
      jaccard: detailed.jaccard,
      ngram: detailed.ngram,
      winnowing: detailed.winnowing,
      lcs: detailed.lcs,
      style: detailed.style,
      simhash: detailed.simhash,
      semantic: detailed.semantic,
      combined: detailed.combined,
      commonPhrases: findCommonPhrases(filteredMain.content, ref.content),
    });
  }

  results.sort((a, b) => b.combined - a.combined);

  const maxSimilarity = results[0]?.combined ?? 0;
  const avgSimilarity =
    results.reduce((sum, result) => sum + result.combined, 0) /
    (results.length || 1);

  return {
    mainDocument: main.name,
    analyzedAt: new Date(),
    maxSimilarity,
    avgSimilarity,
    combined: clamp01(maxSimilarity),
    results,
    exclusionNote: buildExclusionNote(filterResult),
    filterResult: {
      wasSliced: filterResult.wasSliced,
      introFound: filterResult.introFound,
      conclusionFound: filterResult.conclusionFound,
      excludedRatio: filterResult.excludedRatio,
    },
  };
}
