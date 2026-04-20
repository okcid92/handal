import { filterInstitutionalContent, buildExclusionNote, type FilterResult } from "./content-filter";

export interface Document {
  name: string;
  content: string;
}

export interface SimilarityResult {
  name: string;
  cosineTFIDF: number;
  jaccard: number;
  ngram: number;
  combined: number;
  commonPhrases: string[];
}

export interface PlagiarismReport {
  mainDocument: string;
  analyzedAt: Date;
  maxSimilarity: number;
  avgSimilarity: number;
  results: SimilarityResult[];
  exclusionNote: string | null;
  filterResult: Pick<FilterResult, "wasSliced" | "introFound" | "conclusionFound" | "excludedRatio">;
}

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
    .filter((w) => w.length > 1);
}

type TFIDFVector = Record<string, number>;

function computeTFIDF(documents: string[]): TFIDFVector[] {
  const N = documents.length;
  const df: Record<string, number> = {};

  documents.forEach((doc) => {
    const uniqueTokens = new Set(tokenize(doc));
    uniqueTokens.forEach((word) => {
      df[word] = (df[word] ?? 0) + 1;
    });
  });

  return documents.map((doc) => {
    const tokens = tokenize(doc);
    const tf: Record<string, number> = {};

    tokens.forEach((word) => {
      tf[word] = (tf[word] ?? 0) + 1;
    });

    const vector: TFIDFVector = {};
    Object.entries(tf).forEach(([word, count]) => {
      const termFreq = count / tokens.length;
      const inverseDocFreq = Math.log(N / ((df[word] ?? 0) + 1) + 1);
      vector[word] = termFreq * inverseDocFreq;
    });

    return vector;
  });
}

function cosineSimilarity(a: TFIDFVector, b: TFIDFVector): number {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  allKeys.forEach((key) => {
    const av = a[key] ?? 0;
    const bv = b[key] ?? 0;
    dotProduct += av * bv;
    magnitudeA += av * av;
    magnitudeB += bv * bv;
  });

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

function jaccardSimilarity(textA: string, textB: string): number {
  const setA = new Set(tokenize(textA));
  const setB = new Set(tokenize(textB));

  let intersectionSize = 0;
  setA.forEach((word) => {
    if (setB.has(word)) {
      intersectionSize += 1;
    }
  });

  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

function generateNgrams(tokens: string[], n: number): Set<string> {
  const ngrams = new Set<string>();

  for (let i = 0; i <= tokens.length - n; i += 1) {
    ngrams.add(tokens.slice(i, i + n).join(" "));
  }

  return ngrams;
}

function ngramSimilarity(textA: string, textB: string, n = 3): number {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.length < n || tokensB.length < n) {
    return 0;
  }

  const ngramsA = generateNgrams(tokensA, n);
  const ngramsB = generateNgrams(tokensB, n);

  let intersectionSize = 0;
  ngramsA.forEach((gram) => {
    if (ngramsB.has(gram)) {
      intersectionSize += 1;
    }
  });

  const unionSize = ngramsA.size + ngramsB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

function findCommonPhrases(
  textA: string,
  textB: string,
  phraseLength = 4,
  maxResults = 5,
): string[] {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  const ngramsB = new Set<string>();
  for (let i = 0; i <= tokensB.length - phraseLength; i += 1) {
    ngramsB.add(tokensB.slice(i, i + phraseLength).join(" "));
  }

  const found = new Set<string>();
  for (let i = 0; i <= tokensA.length - phraseLength; i += 1) {
    const phrase = tokensA.slice(i, i + phraseLength).join(" ");
    if (ngramsB.has(phrase)) {
      found.add(phrase);
    }

    if (found.size >= maxResults) {
      break;
    }
  }

  return [...found];
}

export function analyzePlagiarism(
  main: Document,
  references: Document[],
): PlagiarismReport {
  // Filtrer le contenu institutionnel du document principal
  const filterResult = filterInstitutionalContent(main.content);
  const filteredMain = {
    ...main,
    content: filterResult.filteredContent,
  };

  // Filtrer aussi les documents de référence
  const filteredReferences = references.map((ref) => ({
    ...ref,
    content: filterInstitutionalContent(ref.content).filteredContent,
  }));

  const allContents = [
    filteredMain.content,
    ...filteredReferences.map((r) => r.content),
  ];
  const tfidfVectors = computeTFIDF(allContents);
  const mainVector = tfidfVectors[0];

  const results: SimilarityResult[] = filteredReferences.map((ref, i) => {
    const cs = cosineSimilarity(mainVector, tfidfVectors[i + 1]);
    const js = jaccardSimilarity(filteredMain.content, ref.content);
    const ng = ngramSimilarity(filteredMain.content, ref.content);
    const combined = cs * 0.5 + js * 0.25 + ng * 0.25;

    return {
      name: ref.name,
      cosineTFIDF: cs,
      jaccard: js,
      ngram: ng,
      combined,
      commonPhrases: findCommonPhrases(filteredMain.content, ref.content),
    };
  });

  results.sort((a, b) => b.combined - a.combined);

  const maxSimilarity = results[0]?.combined ?? 0;
  const avgSimilarity =
    results.reduce((sum, result) => sum + result.combined, 0) /
    (results.length || 1);

  const exclusionNote = buildExclusionNote(filterResult);

  return {
    mainDocument: main.name,
    analyzedAt: new Date(),
    maxSimilarity,
    avgSimilarity,
    results,
    exclusionNote,
    filterResult: {
      wasSliced: filterResult.wasSliced,
      introFound: filterResult.introFound,
      conclusionFound: filterResult.conclusionFound,
      excludedRatio: filterResult.excludedRatio,
    },
  };
}
