import { STOPWORDS_FR } from "./content-filter";

export interface MatchOptions {
  minSegmentLength?: number;
  similarityThreshold?: number;
  windowSize?: number;
}

export interface TextSegment {
  text: string;
  startIndex: number;
  endIndex: number;
  similarity: number;
  matchedSegmentId?: string;
}

export interface MatchResult {
  studentSegments: TextSegment[];
  referenceSegments: TextSegment[];
  overallSimilarity: number;
  totalMatchedWords: number;
}

const DEFAULT_OPTIONS: Required<MatchOptions> = {
  minSegmentLength: 20,
  similarityThreshold: 0.75,
  windowSize: 50,
};

function tokenize(text: string): string[] {
  return text
    .normalize("NFD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS_FR.has(token));
}

function generateTrigrams(tokens: string[]): Set<string> {
  const trigrams = new Set<string>();
  for (let i = 0; i < tokens.length - 2; i++) {
    trigrams.add(`${tokens[i]}_${tokens[i + 1]}_${tokens[i + 2]}`);
  }
  return trigrams;
}

function jaccardScore(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function lcsLength(tokensA: string[], tokensB: string[]): number {
  const m = tokensA.length;
  const n = tokensB.length;
  if (m === 0 || n === 0) return 0;

  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (tokensA[i - 1] === tokensB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function mergeOverlappingSegments(segments: TextSegment[]): TextSegment[] {
  if (segments.length === 0) return [];

  const sorted = [...segments].sort((a, b) => a.startIndex - b.startIndex);
  const merged: TextSegment[] = [];

  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    if (next.startIndex <= current.endIndex) {
      const combinedText = current.text + " " + next.text;
      current = {
        text: combinedText,
        startIndex: current.startIndex,
        endIndex: Math.max(current.endIndex, next.endIndex),
        similarity: Math.max(current.similarity, next.similarity),
      };
    } else {
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
}

function getWordsInRange(tokens: string[], start: number, end: number): string {
  return tokens.slice(start, end).join(" ");
}

export function findMatchingSegments(
  studentText: string,
  referenceText: string,
  options?: MatchOptions,
): MatchResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const studentTokens = tokenize(studentText);
  const referenceTokens = tokenize(referenceText);

  if (studentTokens.length === 0 || referenceTokens.length === 0) {
    return {
      studentSegments: [],
      referenceSegments: [],
      overallSimilarity: 0,
      totalMatchedWords: 0,
    };
  }

  const studentWindows: { tokens: string[]; trigrams: Set<string>; startIdx: number }[] = [];
  const windowSize = Math.min(opts.windowSize, 500);

  for (let i = 0; i < studentTokens.length; i += Math.floor(windowSize / 2)) {
    const windowTokens = studentTokens.slice(i, i + windowSize);
    if (windowTokens.length >= 10) {
      studentWindows.push({
        tokens: windowTokens,
        trigrams: generateTrigrams(windowTokens),
        startIdx: i,
      });
    }
  }

  const referenceWindows: { tokens: string[]; trigrams: Set<string>; startIdx: number }[] = [];
  for (let i = 0; i < referenceTokens.length; i += Math.floor(windowSize / 2)) {
    const windowTokens = referenceTokens.slice(i, i + windowSize);
    if (windowTokens.length >= 10) {
      referenceWindows.push({
        tokens: windowTokens,
        trigrams: generateTrigrams(windowTokens),
        startIdx: i,
      });
    }
  }

  const matchedWindows: { studentIdx: number; refIdx: number; score: number }[] = [];

  for (const sw of studentWindows) {
    for (const rw of referenceWindows) {
      const score = jaccardScore(sw.trigrams, rw.trigrams);
      if (score >= opts.similarityThreshold) {
        matchedWindows.push({
          studentIdx: sw.startIdx,
          refIdx: rw.startIdx,
          score,
        });
      }
    }
  }

  const studentSegments: TextSegment[] = [];
  const referenceSegments: TextSegment[] = [];
  let totalMatchedWords = 0;

  for (const match of matchedWindows) {
    const stokens = studentTokens.slice(
      match.studentIdx,
      match.studentIdx + windowSize,
    );
    const rtokens = referenceTokens.slice(match.refIdx, match.refIdx + windowSize);

    const lcsScore = lcsLength(stokens, rtokens) / Math.max(stokens.length, rtokens.length);
    const finalScore = Math.max(match.score, lcsScore);

    const studentWordCount = Math.min(stokens.length, windowSize);
    const refWordCount = Math.min(rtokens.length, windowSize);
    const matchedCount = Math.floor(finalScore * Math.min(studentWordCount, refWordCount));
    totalMatchedWords += matchedCount;

    const studentTextSegment = getWordsInRange(studentTokens, match.studentIdx, match.studentIdx + windowSize);
    const refTextSegment = getWordsInRange(referenceTokens, match.refIdx, match.refIdx + windowSize);

    if (studentTextSegment.length > 10 && refTextSegment.length > 10) {
      studentSegments.push({
        text: studentTextSegment,
        startIndex: match.studentIdx,
        endIndex: match.studentIdx + windowSize,
        similarity: finalScore,
      });
      referenceSegments.push({
        text: refTextSegment,
        startIndex: match.refIdx,
        endIndex: match.refIdx + windowSize,
        similarity: finalScore,
      });
    }
  }

  const mergedStudent = mergeOverlappingSegments(studentSegments);
  const mergedRef = mergeOverlappingSegments(referenceSegments);

  const filteredStudent = mergedStudent.filter(
    (s) => s.text.split(" ").length >= opts.minSegmentLength,
  );
  const filteredRef = mergedRef.filter(
    (s) => s.text.split(" ").length >= opts.minSegmentLength,
  );

  const matchedWordCount = filteredStudent.reduce(
    (sum, seg) => sum + seg.text.split(" ").length,
    0,
  );
  const totalStudentWords = studentTokens.length;
  const overallSimilarity = totalStudentWords > 0 ? matchedWordCount / totalStudentWords : 0;

  return {
    studentSegments: filteredStudent,
    referenceSegments: filteredRef,
    overallSimilarity: Math.min(1, overallSimilarity),
    totalMatchedWords: matchedWordCount,
  };
}

export function buildHighlightedHTML(
  fullText: string,
  segments: TextSegment[],
  isStudent: boolean,
): string {
  if (segments.length === 0) {
    return `<p>${fullText.slice(0, 2000)}${fullText.length > 2000 ? "..." : ""}</p>`;
  }

  const sorted = [...segments].sort((a, b) => a.startIndex - b.startIndex);

  const bgClass = isStudent
    ? "bg-red-200 border-red-500"
    : "bg-yellow-200 border-yellow-500";

  let result = "";
  let lastEnd = 0;

  for (let i = 0; i < sorted.length; i++) {
    const seg = sorted[i];

    if (seg.startIndex > lastEnd) {
      result += `<span>${fullText.slice(lastEnd, seg.startIndex)}</span> `;
    }

    const percent = Math.round(seg.similarity * 100);
    result += `<mark class="${bgClass} cursor-pointer rounded px-0.5" title="Similarité: ${percent}%">${seg.text}</mark> `;

    lastEnd = seg.endIndex;
  }

  if (lastEnd < fullText.length) {
    result += `<span>${fullText.slice(lastEnd, Math.min(lastEnd + 500, fullText.length))}...</span>`;
  }

  return result;
}