export interface RawDocument {
  name: string;
  content: string;
}

export interface ThemeProfile {
  documentName: string;
  keywords: KeywordScore[];
  dominantTheme: string;
  themeVector: Record<string, number>;
  stats: DocumentStats;
  analyzedAt: Date;
}

export interface KeywordScore {
  word: string;
  tfidf: number;
  cooccurrence: number;
  score: number;
  frequency: number;
}

export interface DocumentStats {
  totalWords: number;
  uniqueWords: number;
  avgSentenceLength: number;
  lexicalDiversity: number;
}

export interface ThemeComparisonResult {
  documentA: string;
  documentB: string;
  thematicSimilarity: number;
  keywordOverlap: number;
  vectorSimilarity: number;
  sharedKeywords: string[];
  uniqueToA: string[];
  uniqueToB: string[];
  proximityLevel: ProximityLevel;
  interpretation: string;
}

export type ProximityLevel =
  | "identique"
  | "très proche"
  | "proche"
  | "partiel"
  | "distant"
  | "sans rapport";

const STOP_WORDS = new Set([
  "le",
  "la",
  "les",
  "un",
  "une",
  "des",
  "du",
  "de",
  "da",
  "au",
  "aux",
  "et",
  "ou",
  "ni",
  "mais",
  "donc",
  "or",
  "car",
  "si",
  "que",
  "qui",
  "quoi",
  "dont",
  "où",
  "quand",
  "comment",
  "pourquoi",
  "quel",
  "quelle",
  "quels",
  "quelles",
  "ce",
  "cet",
  "cette",
  "ces",
  "mon",
  "ton",
  "son",
  "ma",
  "ta",
  "sa",
  "notre",
  "votre",
  "leur",
  "mes",
  "tes",
  "ses",
  "nos",
  "vos",
  "leurs",
  "je",
  "tu",
  "il",
  "elle",
  "nous",
  "vous",
  "ils",
  "elles",
  "me",
  "te",
  "se",
  "lui",
  "y",
  "en",
  "on",
  "ne",
  "pas",
  "plus",
  "très",
  "bien",
  "aussi",
  "même",
  "tout",
  "tous",
  "toute",
  "toutes",
  "autre",
  "autres",
  "comme",
  "avec",
  "sans",
  "sous",
  "sur",
  "dans",
  "par",
  "pour",
  "vers",
  "chez",
  "entre",
  "après",
  "avant",
  "pendant",
  "depuis",
  "jusqu",
  "est",
  "sont",
  "être",
  "avoir",
  "fait",
  "faire",
  "peut",
  "peuvent",
  "doit",
  "doivent",
  "va",
  "vont",
  "été",
  "avait",
  "avaient",
  "était",
  "étaient",
  "sera",
  "seront",
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "if",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "this",
  "that",
  "these",
  "those",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "it",
  "its",
  "he",
  "she",
  "they",
  "we",
  "you",
  "i",
  "my",
  "your",
  "his",
  "her",
  "our",
  "their",
  "not",
  "no",
  "so",
  "as",
  "about",
  "into",
  "than",
  "then",
  "there",
  "when",
  "where",
  "which",
  "who",
  "what",
  "how",
  "all",
  "each",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
]);

function stripHTML(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(text: string): string {
  return stripHTML(text)
    .toLowerCase()
    .replace(/[^\w\sàâéèêëîïôùûüç]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function splitSentences(text: string): string[] {
  return stripHTML(text)
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function computeInternalTFIDF(
  tokens: string[],
  sentences: string[],
): Record<string, number> {
  const N = Math.max(sentences.length, 1);

  const tf: Record<string, number> = {};
  tokens.forEach((w) => {
    tf[w] = (tf[w] ?? 0) + 1;
  });

  const df: Record<string, number> = {};
  sentences.forEach((sentence) => {
    const sentenceTokens = new Set(tokenize(sentence));
    sentenceTokens.forEach((w) => {
      df[w] = (df[w] ?? 0) + 1;
    });
  });

  const tfidfMap: Record<string, number> = {};
  Object.entries(tf).forEach(([word, count]) => {
    const termFreq = count / tokens.length;
    const idf = Math.log(N / ((df[word] ?? 0) + 1) + 1);
    tfidfMap[word] = termFreq * idf;
  });

  return tfidfMap;
}

function computeCooccurrenceScore(
  tokens: string[],
  windowSize = 4,
): Record<string, number> {
  const cooc: Record<string, Set<string>> = {};

  for (let i = 0; i < tokens.length; i += 1) {
    const word = tokens[i];
    if (!cooc[word]) {
      cooc[word] = new Set();
    }

    for (let j = i + 1; j < Math.min(i + windowSize, tokens.length); j += 1) {
      const neighbor = tokens[j];
      cooc[word].add(neighbor);
      if (!cooc[neighbor]) {
        cooc[neighbor] = new Set();
      }
      cooc[neighbor].add(word);
    }
  }

  const raw: Record<string, number> = {};
  Object.entries(cooc).forEach(([word, neighbors]) => {
    raw[word] = neighbors.size;
  });

  const maxDegree = Math.max(...Object.values(raw), 1);
  const scores: Record<string, number> = {};
  Object.entries(raw).forEach(([word, degree]) => {
    scores[word] = degree / maxDegree;
  });

  return scores;
}

function computeStats(text: string): DocumentStats {
  const allTokens = normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const sentences = splitSentences(text);
  const uniqueWords = new Set(allTokens).size;

  return {
    totalWords: allTokens.length,
    uniqueWords,
    avgSentenceLength:
      sentences.length > 0 ? allTokens.length / sentences.length : 0,
    lexicalDiversity: allTokens.length > 0 ? uniqueWords / allTokens.length : 0,
  };
}

export function analyzeTheme(doc: RawDocument, topK = 15): ThemeProfile {
  const tokens = tokenize(doc.content);
  const sentences = splitSentences(doc.content);

  if (tokens.length === 0) {
    return {
      documentName: doc.name,
      keywords: [],
      dominantTheme: "indéterminé",
      themeVector: {},
      stats: computeStats(doc.content),
      analyzedAt: new Date(),
    };
  }

  const tfidfMap = computeInternalTFIDF(tokens, sentences);
  const coocMap = computeCooccurrenceScore(tokens);

  const freqMap: Record<string, number> = {};
  tokens.forEach((w) => {
    freqMap[w] = (freqMap[w] ?? 0) + 1;
  });

  const maxTFIDF = Math.max(...Object.values(tfidfMap), 1);
  const allWords = new Set([...Object.keys(tfidfMap), ...Object.keys(coocMap)]);
  const scored: KeywordScore[] = [];

  allWords.forEach((word) => {
    const tfidf = (tfidfMap[word] ?? 0) / maxTFIDF;
    const cooc = coocMap[word] ?? 0;
    const score = tfidf * 0.6 + cooc * 0.4;

    scored.push({
      word,
      tfidf,
      cooccurrence: cooc,
      score,
      frequency: freqMap[word] ?? 0,
    });
  });

  scored.sort((a, b) => b.score - a.score);
  const keywords = scored.slice(0, topK);

  const themeVector: Record<string, number> = {};
  keywords.forEach((kw) => {
    themeVector[kw.word] = kw.score;
  });

  const dominantTheme = keywords
    .slice(0, 5)
    .map((kw) => kw.word)
    .join(", ");

  return {
    documentName: doc.name,
    keywords,
    dominantTheme,
    themeVector,
    stats: computeStats(doc.content),
    analyzedAt: new Date(),
  };
}

function cosineSimilarity(
  vecA: Record<string, number>,
  vecB: Record<string, number>,
): number {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  keys.forEach((k) => {
    const a = vecA[k] ?? 0;
    const b = vecB[k] ?? 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function keywordJaccard(
  profileA: ThemeProfile,
  profileB: ThemeProfile,
): number {
  const setA = new Set(profileA.keywords.map((k) => k.word));
  const setB = new Set(profileB.keywords.map((k) => k.word));

  let inter = 0;
  setA.forEach((w) => {
    if (setB.has(w)) {
      inter += 1;
    }
  });

  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

function getProximityLevel(score: number): ProximityLevel {
  if (score >= 0.85) return "identique";
  if (score >= 0.65) return "très proche";
  if (score >= 0.45) return "proche";
  if (score >= 0.25) return "partiel";
  if (score >= 0.1) return "distant";
  return "sans rapport";
}

function getInterpretation(
  level: ProximityLevel,
  sharedKeywords: string[],
): string {
  const shared =
    sharedKeywords.length > 0
      ? ` Concepts communs : ${sharedKeywords.slice(0, 3).join(", ")}.`
      : "";

  const messages: Record<ProximityLevel, string> = {
    identique: "Les deux documents traitent exactement du même sujet." + shared,
    "très proche":
      "Les thèmes sont très similaires, probablement le même domaine." + shared,
    proche:
      "Les documents partagent un thème commun avec des perspectives différentes." +
      shared,
    partiel:
      "Quelques points communs, mais les thèmes principaux divergent." + shared,
    distant:
      "Faible connexion thématique, domaines différents avec quelques intersections." +
      shared,
    "sans rapport": "Les documents ne partagent aucun thème commun détectable.",
  };

  return messages[level];
}

export function compareThemes(
  profileA: ThemeProfile,
  profileB: ThemeProfile,
): ThemeComparisonResult {
  const vectorSim = cosineSimilarity(
    profileA.themeVector,
    profileB.themeVector,
  );
  const keywordSim = keywordJaccard(profileA, profileB);
  const thematicSimilarity = vectorSim * 0.7 + keywordSim * 0.3;

  const setA = new Set(profileA.keywords.map((k) => k.word));
  const setB = new Set(profileB.keywords.map((k) => k.word));

  const sharedKeywords: string[] = [];
  const uniqueToA: string[] = [];
  const uniqueToB: string[] = [];

  setA.forEach((w) => {
    if (setB.has(w)) {
      sharedKeywords.push(w);
    } else {
      uniqueToA.push(w);
    }
  });

  setB.forEach((w) => {
    if (!setA.has(w)) {
      uniqueToB.push(w);
    }
  });

  const proximityLevel = getProximityLevel(thematicSimilarity);

  return {
    documentA: profileA.documentName,
    documentB: profileB.documentName,
    thematicSimilarity,
    keywordOverlap: keywordSim,
    vectorSimilarity: vectorSim,
    sharedKeywords,
    uniqueToA,
    uniqueToB,
    proximityLevel,
    interpretation: getInterpretation(proximityLevel, sharedKeywords),
  };
}

export function compareOneToMany(
  main: ThemeProfile,
  references: ThemeProfile[],
): ThemeComparisonResult[] {
  return references
    .map((ref) => compareThemes(main, ref))
    .sort((a, b) => b.thematicSimilarity - a.thematicSimilarity);
}
