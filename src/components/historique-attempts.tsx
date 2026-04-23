"use client";

import { useState } from "react";

const MAROON = "#7D1C2A";
const MAROON_LIGHT = "#F5ECE8";
const MAROON_MID = "#B85A5A";
const GREEN = "#1A7A4A";
const GREEN_LIGHT = "#E8F5EE";
const CREAM = "#F7F3EE";

type AnalysisEntry = {
  id: string;
  documentId: string | null;
  reportId: string | null;
  fileName: string;
  detectedTitle: string | null;
  titleScore: number;
  similarityScore: number | null;
  blocked: boolean;
  titleMismatch: boolean;
  attemptNumber: number;
  analyzedAt: string;
  sourceReference: string | null;
  sourceReferenceId: string | null;
  sourceReferenceSimilarity: number | null;
  autoValidatedByCd?: boolean;
};

interface HistoriqueAttemptsProps {
  attempts: AnalysisEntry[];
  onViewReport?: (reportId: string) => void;
  reportModalLoading?: string | null;
}

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 85 ? GREEN : pct >= 60 ? "#B87A1A" : MAROON;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: "#E8E0D8",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 500, minWidth: 32 }}>
        {pct}%
      </span>
    </div>
  );
}

function AttemptCard({
  attempt,
  defaultOpen,
  onViewReport,
  reportModalLoading,
}: {
  attempt: AnalysisEntry;
  defaultOpen: boolean;
  onViewReport?: (reportId: string) => void;
  reportModalLoading?: string | null;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { attemptNumber, analyzedAt, fileName, detectedTitle, similarityScore, blocked, titleMismatch, sourceReference, sourceReferenceSimilarity, reportId, autoValidatedByCd } = attempt;
  const autoValidated =
    autoValidatedByCd ??
    (similarityScore !== null && !blocked && similarityScore < 20);

  const date = new Date(analyzedAt);
  const dateStr = date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedDate = `${dateStr} à ${timeStr}`;

  return (
    <div
      style={{
        border: `0.5px solid ${titleMismatch ? MAROON + "55" : "#D4C8BC"}`,
        borderRadius: 12,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* ─── Header ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: open ? `0.5px solid #E8E0D8` : "none",
          background: titleMismatch ? MAROON_LIGHT : "transparent",
          cursor: "pointer",
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: titleMismatch ? MAROON : "#D4C8BC",
            color: "#fff",
            fontSize: 12,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {attemptNumber}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#3A2A22" }}>
              {formattedDate}
            </span>
            {titleMismatch && (
              <span
                style={{
                  fontSize: 11,
                  background: MAROON,
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontWeight: 500,
                }}
              >
                Titre non conforme
              </span>
            )}
            <span style={{ fontSize: 11, color: "#8A7A6E" }}>
              Tentative #{attemptNumber}
            </span>
          </div>
          <span
            style={{
              fontSize: 12,
              color: "#8A7A6E",
              display: "block",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {detectedTitle && detectedTitle.length > 5
              ? detectedTitle
              : fileName.replace(/\.[^.]+$/, "")}
          </span>
        </div>

        <div
          style={{
            fontSize: 18,
            color: titleMismatch ? MAROON : "#A09080",
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
            flexShrink: 0,
            userSelect: "none",
          }}
        >
          ›
        </div>
      </div>

      {/* ─── Body (expanded) ─── */}
      {open && (
        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Titre détecté si présent */}
          {detectedTitle && (
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#8A7A6E",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  margin: "0 0 10px",
                }}
              >
                Titre détecté
              </p>
              <div
                style={{
                  background: CREAM,
                  borderRadius: 8,
                  padding: "10px 12px",
                  borderLeft: `3px solid ${MAROON}`,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "#2A1A12",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    display: "block",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                  }}
                >
                  {detectedTitle}
                </span>
              </div>
            </div>
          )}

          {/* Similitude détectée */}
          {similarityScore !== null && (
            <div
              style={{
                borderTop: `0.5px solid #E8E0D8`,
                paddingTop: 14,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#8A7A6E",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  margin: "0 0 10px",
                }}
              >
                Analyse de similarité
              </p>

              <div
                style={{
                  border: `0.5px solid #F0C8C0`,
                  background: "#FEF5F3",
                  borderRadius: 8,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {sourceReference && (
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#5A1A12",
                          lineHeight: 1.5,
                          display: "block",
                          wordBreak: "break-word",
                          whiteSpace: "normal",
                        }}
                      >
                        {sourceReference}
                      </span>
                    )}
                    {sourceReferenceSimilarity != null && (
                      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                        <span style={{ fontSize: 11, color: "#8A5A50" }}>
                          📄 Référence détectée
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      flexShrink: 0,
                      background:
                        similarityScore >= 75 ? "#FDECEC" : "#FEF7ED",
                      border: `1px solid ${
                        similarityScore >= 75 ? "#F0C0C0" : "#F0D880"
                      }`,
                      borderRadius: 8,
                      padding: "6px 10px",
                      textAlign: "center",
                      minWidth: 52,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 500,
                        color:
                          blocked ? MAROON : similarityScore >= 75 ? MAROON : "#8A6A10",
                        lineHeight: 1,
                      }}
                    >
                      {similarityScore.toFixed(1)}%
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#A08070",
                        marginTop: 2,
                      }}
                    >
                      {blocked ? "Rejeté" : "similarité"}
                    </div>
                  </div>
                </div>

                {autoValidated && (
                  <div
                    style={{
                      marginTop: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      alignSelf: "flex-start",
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: GREEN_LIGHT,
                      color: GREEN,
                      fontSize: 11,
                      fontWeight: 700,
                      border: `1px solid ${GREEN}33`,
                    }}
                  >
                    <span style={{ fontSize: 12, lineHeight: 1 }}>✓</span>
                    Validé par CD (Auto)
                  </div>
                )}

                {/* Statut du document */}
                {blocked && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: "8px 10px",
                      background: "#FDECEC",
                      borderRadius: 6,
                      borderLeft: `3px solid ${MAROON}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: MAROON,
                        fontWeight: 500,
                      }}
                    >
                      ⚠️ Taux de plagiat trop élevé (≥50%)
                    </span>
                  </div>
                )}
              </div>

              {/* Bouton Voir le rapport */}
              {reportId && onViewReport && (
                <button
                  onClick={() => onViewReport(reportId)}
                  disabled={reportModalLoading === reportId}
                  style={{
                    marginTop: 10,
                    padding: "8px 12px",
                    background:
                      reportModalLoading === reportId
                        ? "transparent"
                        : "transparent",
                    border: `1px solid ${MAROON}`,
                    borderRadius: 6,
                    color: MAROON,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: reportModalLoading === reportId ? "not-allowed" : "pointer",
                    opacity: reportModalLoading === reportId ? 0.6 : 1,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (reportModalLoading !== reportId) {
                      e.currentTarget.style.background = MAROON_LIGHT;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {reportModalLoading === reportId
                    ? "⏳ Chargement..."
                    : "📋 Voir le rapport détaillé"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoriqueAttempts({
  attempts,
  onViewReport,
  reportModalLoading,
}: HistoriqueAttemptsProps) {
  if (!attempts || attempts.length === 0) {
    return (
      <div
        style={{
          background: CREAM,
          borderRadius: 16,
          border: `0.5px solid #D4C8BC`,
          padding: "20px",
          fontFamily: "var(--font-sans, system-ui, sans-serif)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#F0E8E0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke={MAROON} strokeWidth="1.2" />
              <path
                d="M8 4.5V8.5L10.5 10"
                stroke={MAROON}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "#2A1A12" }}>
              Historique de vos tentatives
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: "#8A7A6E" }}>
              Toutes vos analyses sont conservées comme preuve de correction
            </p>
          </div>
        </div>

        {/* Empty state */}
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#8A7A6E",
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 500 }}>
            Aucune analyse effectuée pour le moment
          </p>
          <p style={{ fontSize: 12, marginTop: 8, color: "#A09080" }}>
            Déposez votre document pour commencer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: CREAM,
        borderRadius: 16,
        border: `0.5px solid #D4C8BC`,
        padding: "20px",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "#F0E8E0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke={MAROON} strokeWidth="1.2" />
            <path
              d="M8 4.5V8.5L10.5 10"
              stroke={MAROON}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "#2A1A12" }}>
            Historique de vos tentatives
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: "#8A7A6E" }}>
            Toutes vos analyses sont conservées comme preuve de correction
          </p>
        </div>
        <span
          style={{
            marginLeft: "auto",
            background: MAROON_LIGHT,
            color: MAROON,
            fontSize: 12,
            fontWeight: 500,
            padding: "4px 10px",
            borderRadius: 20,
            border: `0.5px solid ${MAROON}44`,
          }}
        >
          {attempts.length} dépôt{attempts.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {attempts.map((a, i) => (
          <AttemptCard
            key={a.id}
            attempt={a}
            defaultOpen={i === 0}
            onViewReport={onViewReport}
            reportModalLoading={reportModalLoading}
          />
        ))}
      </div>

      {/* Légende */}
      <div
        style={{
          marginTop: 14,
          padding: "10px 14px",
          background: "#F0E8E0",
          borderRadius: 8,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: GREEN,
            }}
          />
          <span style={{ fontSize: 11, color: "#5A4A3A" }}>
            Similarité &lt; 20% — document validé
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: MAROON,
            }}
          />
          <span style={{ fontSize: 11, color: "#5A4A3A" }}>
            Similarité ≥ 75% — révision recommandée
          </span>
        </div>
      </div>
    </div>
  );
}
