import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { analyzePlagiarism } from "@/server/analysis/plagiat-detector";
import { getSemanticScore } from "@/server/analysis/semantic-client";

const analysisSchema = z.object({
  textA: z.string(),
  textB: z.string(),
});

function toPercent(score: number): number {
  return Math.round(score * 100);
}

function withSemanticCombined(base: {
  cosine: number;
  jaccard: number;
  ngram: number;
  winnowing: number;
  lcs: number;
  style: number;
}, semantic: number) {
  return (
    0.2 * base.cosine +
    0.1 * base.jaccard +
    0.15 * base.ngram +
    0.15 * base.winnowing +
    0.15 * semantic +
    0.15 * base.lcs +
    0.05 * base.style
  );
}

function riskLevelFromCombined(combined: number): "low" | "medium" | "high" {
  if (combined < 0.2) return "low";
  if (combined < 0.7) return "medium";
  return "high";
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = analysisSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload. textA and textB are required." },
      { status: 400 },
    );
  }

  const { textA, textB } = parsed.data;

  const semanticPromise = getSemanticScore(textA, textB);
  const baseScoresPromise = analyzePlagiarism(textA, textB);
  const [baseScores, semanticScore] = await Promise.all([
    baseScoresPromise,
    semanticPromise,
  ]);

  const combined =
    semanticScore === undefined
      ? baseScores.combined
      : withSemanticCombined(baseScores, semanticScore);
  const riskLevel = riskLevelFromCombined(combined);

  return NextResponse.json({
    scores: {
      cosine: toPercent(baseScores.cosine),
      jaccard: toPercent(baseScores.jaccard),
      ngram: toPercent(baseScores.ngram),
      winnowing: toPercent(baseScores.winnowing),
      lcs: toPercent(baseScores.lcs),
      style: toPercent(baseScores.style),
      simhash: toPercent(baseScores.simhash),
      semantic: semanticScore === undefined ? null : toPercent(semanticScore),
    },
    combined: toPercent(combined),
    globalSimilarity: toPercent(combined),
    riskLevel,
    flagged: toPercent(combined) >= 20,
  });
}
