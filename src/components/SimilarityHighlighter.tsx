"use client";

import { useState } from "react";

interface HighlightSegment {
  type?: "student" | "reference";
  text?: string;
  startIndex?: number;
  endIndex?: number;
  similarity?: number;
  matchedWith?: string;
  start?: number;
  end?: number;
}

interface MatchedSource {
  title: string;
  similarity: number;
}

interface SimilarityHighlighterProps {
  studentText: string;
  segments: HighlightSegment[];
  sourceTitle?: string;
  sourceText?: string;
}

const MAX_WORDS = 500;

export function SimilarityHighlighter({
  studentText,
  segments,
  sourceTitle,
  sourceText,
}: SimilarityHighlighterProps) {
  const [expanded, setExpanded] = useState(false);

  console.log("[Highlighter] segments:", segments.length, "studentText:", studentText?.slice(0, 100));

  if (segments.length === 0) {
    return null;
  }

  const studentSegments = segments.filter((s) => s.type === "student" || (!s.type && s.start !== undefined));
  const refSegments = segments.filter((s) => s.type === "reference");

  const isOldFormat = !segments[0]?.type;

  const truncateText = (text: string, maxWords: number) => {
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  const renderHighlightedText = (text: string, segs: HighlightSegment[]) => {
    if (segs.length === 0) {
      return <p className="text-sm text-[#5f483e]">{truncateText(text, MAX_WORDS)}</p>;
    }

    if (isOldFormat) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-[#5f483e]">{truncateText(text, MAX_WORDS)}</p>
          <p className="text-xs text-[#6c5448] italic">
            {segs.length} segment(s) similaire(s) détecté(s). Détails disponibles après nouvelle analyse.
          </p>
        </div>
      );
    }

    const sorted = [...segs].sort((a, b) => (a.startIndex || 0) - (b.startIndex || 0));
    const isStudent = segs[0].type === "student";
    
    const bgClass = isStudent
      ? "bg-red-100 border-l-2 border-red-400"
      : "bg-yellow-100 border-l-2 border-yellow-400";

    let result: React.ReactNode[] = [];
    let lastEnd = 0;

    sorted.forEach((seg, i) => {
      const startIdx = seg.startIndex || 0;
      const beforeText = text.slice(lastEnd, startIdx);
      if (beforeText) {
        result.push(
          <span key={`before-${i}`} className="text-sm text-[#5f483e]">
            {beforeText.slice(0, 200)}
          </span>
        );
      }

      result.push(
        <mark
          key={`seg-${i}`}
          className={`${bgClass} mx-0.5 rounded px-0.5 py-0.5 text-sm cursor-pointer`}
          title={`Similarité: ${Math.round((seg.similarity || 0) * 100)}% — ${seg.matchedWith || ""}`}
        >
          {(seg.text || "").slice(0, 150)}
        </mark>
      );

      lastEnd = seg.endIndex || startIdx + 50;
    });

    const afterText = text.slice(lastEnd);
    if (afterText) {
      result.push(
        <span key="after" className="text-sm text-[#5f483e]">
          {afterText.slice(0, 200)}
        </span>
      );
    }

    return <div className="leading-relaxed">{result}</div>;
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6c5448]">
          Textes similaires détectés
        </span>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 text-xs text-red-600">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
            Votre texte
          </span>
          <span className="flex items-center gap-1 text-xs text-yellow-600">
            <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
            Source
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="mb-2 text-xs font-semibold text-red-700">Votre document</p>
          {renderHighlightedText(studentText, studentSegments)}
        </div>

        {(sourceTitle || sourceText) && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="mb-2 text-xs font-semibold text-yellow-700">
              {sourceTitle || "Source(s) Similar(s)"}
            </p>
            {sourceText
              ? renderHighlightedText(sourceText, refSegments)
              : refSegments.length > 0 && (
                  <div className="space-y-2">
                    {refSegments.slice(0, 5).map((seg, i) => (
                      <div
                        key={i}
                        className="rounded border-l-2 border-yellow-400 bg-yellow-100 p-2 text-sm text-[#5f483e]"
                      >
                        {(seg.text || "").slice(0, 150)}
                        <span className="ml-2 text-xs text-yellow-600">
                          ({Math.round((seg.similarity || 0) * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-medium text-[#7b2438] hover:underline"
        >
          {expanded ? "Réduire" : "Voir plus de détails"}
        </button>
      </div>
    </div>
  );
}

export function SimpleSimilarityBadge({
  similarity,
}: {
  similarity: number;
}) {
  const color =
    similarity >= 50 ? "bg-red-100 text-red-700" :
    similarity >= 20 ? "bg-yellow-100 text-yellow-700" :
    "bg-green-100 text-green-700";

  const label =
    similarity >= 50 ? "Risque élevé" :
    similarity >= 20 ? "Risque moyen" :
    "Risque faible";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${color}`}>
      {similarity.toFixed(1)}% — {label}
    </span>
  );
}