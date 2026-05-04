"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  UploadCloud,
  LogOut,
  CheckCircle,
  Clock,
  Lock,
  XCircle,
  Send,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { apiFetch } from "@/lib/frontend-api";
import HistoriqueAttempts from "./historique-attempts";
import { SimilarityHighlighter } from "./SimilarityHighlighter";

type OverviewResponse = {
  user: {
    id: string;
    name: string;
    role: string;
    ine: string | null;
    email: string | null;
  };
  activeTheme: {
    id: string;
    title: string;
    status: string;
    teacherApproval: boolean | null;
    daApproval: boolean | null;
    validatedCd: boolean;
    validatedDa: boolean;
  } | null;
};

type ValidationStatus = "pending" | "approved" | "rejected";

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

type ReportDetail = {
  id: string;
  documentId: string;
  globalSimilarity: string;
  riskLevel: string;
  matchedSources?: Array<{
    name?: string;
    similarity?: number;
    type?: string;
    sourceId?: string | null;
    sourceLabel?: string | null;
    sourceDocumentId?: string | null;
  }>;
  highlightedSegments: Array<{
    type: "student" | "reference";
    text: string;
    startIndex: number;
    endIndex: number;
    similarity: number;
    matchedWith: string;
  }>;
  analyzedAt: string;
  document: {
    id: string;
    originalName: string;
    title: string;
    extractedText: string;
  };
  deliberations: Array<{
    id: string;
    decision: string;
    notes: string | null;
    committee: string | null;
    decidedAt: string;
    decider: { name: string; role: string } | null;
  }>;
};

const VALIDATED_STATUSES = [
  "VALIDATED",
  "VALIDATED_DA",
  "DOCUMENT_SUBMITTED",
  "ANALYSIS_PENDING",
  "APPROVED",
  "APPROVED_WITH_MENTION",
  "CONDITIONAL_APPROVAL",
  "REQUESTED_REVIEW",
  "FLAGGED_PLAGIARISM",
];

const ALGO_APPROVED_STATUSES = ["PENDING_VALIDATION", ...VALIDATED_STATUSES];

const STEPS = [
  { id: 1, label: "Proposition de thème" },
  { id: 2, label: "Validation Chef de Dépt" },
  { id: 3, label: "Dépôt du document" },
  { id: 4, label: "Résultats & Délibération" },
];

function getActiveStep(submitted: boolean, cdStatus: ValidationStatus) {
  if (!submitted) return 1;
  if (cdStatus !== "approved") return 2;
  return 3;
}

function StatusBadge({ status }: { status: ValidationStatus }) {
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-600/40 bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-800">
        <CheckCircle className="h-4 w-4" /> Validé
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-600/40 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-800">
        <XCircle className="h-4 w-4" /> Rejeté
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c98a2f]/50 bg-[#fff6e6] px-3 py-1.5 text-sm font-semibold text-[#5f3a10]">
      <Clock className="h-4 w-4" /> En attente
    </span>
  );
}

function Stepper({ active }: { active: number }) {
  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const done = step.id < active;
        const current = step.id === active;
        return (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-2.5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition-all ${
                  done
                    ? "bg-green-600 text-white shadow-sm"
                    : current
                      ? "bg-[#7b2438] text-white shadow-[0_4px_16px_rgba(123,36,56,0.35)]"
                      : "border-2 border-[#7b2438]/30 bg-white text-[#7b2438]/40"
                }`}
              >
                {done ? <CheckCircle className="h-5 w-5" /> : step.id}
              </div>
              <span
                className={`hidden text-center text-xs font-semibold leading-snug md:block ${
                  current
                    ? "text-[#7b2438]"
                    : done
                      ? "text-green-700"
                      : "text-[#6c5448]"
                }`}
                style={{ maxWidth: "84px" }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-3 mb-6 h-0.5 flex-1 rounded-full ${
                  done ? "bg-green-500/50" : "bg-[#7b2438]/15"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StudentDashboard() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const [themeTitle, setThemeTitle] = useState("");
  const [themeDescription, setThemeDescription] = useState("");
  const [themeMessage, setThemeMessage] = useState<string | null>(null);
  const [themeSubmitted, setThemeSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [algoStatus, setAlgoStatus] = useState<ValidationStatus>("pending");
  const [cdStatus, setCdStatus] = useState<ValidationStatus>("pending");
  const [, setDaStatus] = useState<ValidationStatus>("pending");

  const [documentMessage, setDocumentMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatusMessage, setUploadStatusMessage] = useState<string | null>(
    null,
  );
  const [titleMismatch, setTitleMismatch] = useState<{
    titleScore: number;
    validatedTitle: string;
  } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    globalSimilarity: number;
    riskLevel: string;
    blocked: boolean;
    uploadAttempts: number;
    topReferenceSource?: {
      sourceId: string | null;
      sourceLabel: string | null;
      sourceSimilarity: number | null;
    };
    exclusionNote?: string | null;
  } | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisEntry[]>([]);
  const [reportModal, setReportModal] = useState<ReportDetail | null>(null);
  const [reportModalLoading, setReportModalLoading] = useState<string | null>(null);
  const [reportModalError, setReportModalError] = useState<string | null>(null);
  const [lastDeliberation, setLastDeliberation] = useState<ReportDetail["deliberations"][0] | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch<{ ok: boolean; history: AnalysisEntry[] }>("/api/me/analysis-history"),
      apiFetch<OverviewResponse>("/api/me/overview"),
    ])
      .then(([historyData, overviewData]) => {
        if (!mounted) return;

        const history = historyData.history ?? [];
        setAnalysisHistory(history);
        setOverview(overviewData);

        const t = overviewData.activeTheme;
        if (t) {
          setThemeSubmitted(true);
          setAlgoStatus(ALGO_APPROVED_STATUSES.includes(t.status) ? "approved" : "pending");
          const cdApproved = t.teacherApproval === true || t.validatedCd || VALIDATED_STATUSES.includes(t.status);
          const cdRejected = t.teacherApproval === false;
          setCdStatus(cdApproved ? "approved" : cdRejected ? "rejected" : "pending");
          const daApproved = t.daApproval === true || t.validatedDa || VALIDATED_STATUSES.includes(t.status);
          const daRejected = t.daApproval === false;
          setDaStatus(daApproved ? "approved" : daRejected ? "rejected" : "pending");
        }

        // Calcul de l'étape : 4 si rapport existe, sinon selon CD
        const hasReport = history.some((a) => a.reportId);
        if (hasReport) {
          setActiveStep(4);
          // Charger automatiquement la délibération du dernier rapport
          const latestReportId = history.find((a) => a.reportId)?.reportId;
          if (latestReportId) {
            apiFetch<{ ok: boolean; report: ReportDetail }>(`/api/me/reports/${latestReportId}`)
              .then((d) => {
                if (d.report.deliberations?.length > 0) {
                  setLastDeliberation(d.report.deliberations[0]);
                }
              })
              .catch(() => {});
          }
        } else if (t) {
          const cdApproved = t.teacherApproval === true || t.validatedCd || VALIDATED_STATUSES.includes(t.status);
          const cdRejected = t.teacherApproval === false;
          setActiveStep(getActiveStep(true, cdApproved ? "approved" : cdRejected ? "rejected" : "pending"));
        }
      })
      .catch((e) => {
        if (mounted) setErrorMsg(e instanceof Error ? e.message : "Erreur de chargement");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  async function proposeTheme(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setThemeMessage(null);
    setSubmitting(true);
    try {
      await apiFetch<{ theme: { id: string } }>("/api/themes/propose", {
        method: "POST",
        body: JSON.stringify({
          title: themeTitle,
          description: themeDescription,
        }),
      });
      setThemeSubmitted(true);
      setThemeTitle("");
      setThemeDescription("");
      setThemeMessage("Thème soumis avec succès !");
      setAlgoStatus("pending");
      setCdStatus("pending");
      setDaStatus("pending");
    } catch (err) {
      setThemeMessage(
        err instanceof Error ? err.message : "Erreur lors de la soumission",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    if (
      ![
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(file.type)
    ) {
      setDocumentMessage("Format non supporté. Utilisez .pdf ou .docx");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setDocumentMessage("Fichier trop volumineux (max 50 MB)");
      return;
    }
    setUploading(true);
    setUploadStatusMessage(
      "Handal analyse l'intégralité de votre document... Veuillez patienter.",
    );
    setDocumentMessage(null);
    setAnalysisResult(null);
    setTitleMismatch(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      let res: Response;
      try {
        res = await fetch("/api/documents/upload-file", {
          method: "POST",
          body: fd,
        });
      } catch {
        // Erreur réseau (fetch abandonné, timeout navigateur, connexion perdue)
        setDocumentMessage(
          "Le serveur Handal met du temps à répondre. Votre analyse continue en arrière-plan, vérifiez l\u2019historique dans un instant.",
        );
        // Rafraîchir l'historique après un délai pour laisser le serveur terminer
        setTimeout(() => {
          apiFetch<{ ok: boolean; history: AnalysisEntry[] }>("/api/me/analysis-history")
            .then((r) => {
              setAnalysisHistory(r.history ?? []);
              if ((r.history ?? []).some((a) => a.reportId)) setActiveStep(4);
            })
            .catch(() => {});
        }, 8000);
        return;
      }
      const cloned = res.clone();
      if (!res.ok) {
        const err = (await cloned.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(err.error?.message || "Erreur upload");
      }
      const data = (await cloned.json()) as {
        titleMismatch?: boolean;
        titleScore?: number;
        validatedTitle?: string;
        analysis?: {
          globalSimilarity: number;
          riskLevel: string;
          blocked: boolean;
          uploadAttempts: number;
          topReferenceSource?: {
            sourceId: string | null;
            sourceLabel: string | null;
            sourceSimilarity: number | null;
          };
        };
        document?: { id: string };
      };
      if (data.titleMismatch) {
        setTitleMismatch({
          titleScore: data.titleScore!,
          validatedTitle: data.validatedTitle!,
        });
      } else if (data.analysis) {
        setAnalysisResult(data.analysis);
        setDocumentMessage(null);
      } else {
        setDocumentMessage(`✓ Document déposé : ${data.document?.id}`);
      }
      apiFetch<{ ok: boolean; history: AnalysisEntry[] }>("/api/me/analysis-history")
        .then((r) => {
          setAnalysisHistory(r.history ?? []);
          if ((r.history ?? []).some((a) => a.reportId)) setActiveStep(4);
        })
        .catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur upload";
      const isNetworkError =
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("network") ||
        msg.toLowerCase().includes("load failed");
      setDocumentMessage(
        isNetworkError
          ? "Le serveur Handal met du temps à répondre. Votre analyse continue en arrière-plan, vérifiez l\u2019historique dans un instant."
          : msg,
      );
      if (isNetworkError) {
        setTimeout(() => {
          apiFetch<{ ok: boolean; history: AnalysisEntry[] }>("/api/me/analysis-history")
            .then((r) => {
              setAnalysisHistory(r.history ?? []);
              if ((r.history ?? []).some((a) => a.reportId)) setActiveStep(4);
            })
            .catch(() => {});
        }, 8000);
      }
    } finally {
      setUploading(false);
      setUploadStatusMessage(null);
    }
  }

  async function openReport(reportId: string) {
    setReportModalError(null);
    setReportModalLoading(reportId);
    try {
      const data = await apiFetch<{ ok: boolean; report: ReportDetail }>(
        `/api/me/reports/${reportId}`,
      );
      setReportModal(data.report);
    } catch (err) {
      setReportModalError(
        err instanceof Error
          ? err.message
          : "Impossible de charger le rapport.",
      );
    } finally {
      setReportModalLoading(null);
    }
  }

  async function handleLogout() {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      await apiFetch<{ message: string }>("/api/logout", { method: "POST" });
      window.location.href = "/";
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur déconnexion");
      setLogoutLoading(false);
    }
  }

  const fullName = overview?.user.name?.trim() ?? "";
  const [firstName = "Étudiant"] = fullName.split(/\s+/).filter(Boolean);
  const depositUnlocked = cdStatus === "approved";
  const showFinalResult = lastDeliberation !== null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#7b2438]/20 border-t-[#7b2438]" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#7b2438]/20 border-t-[#7b2438]" />
      </div>
    );
  }

  // ── Vue finale après délibération ─────────────────────────────────────────────
  if (showFinalResult && lastDeliberation) {
    const isValidation = lastDeliberation.decision === "FINAL_VALIDATION";
    const isSanction = lastDeliberation.decision === "SANCTION";

    return (
      <div className="app-shell min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <header className="section-frame mb-8 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src="/brand/handal-lamp.png" alt="Handal" width={36} height={36} className="h-9 w-auto object-contain" />
                <div>
                  <p className="text-lg font-black uppercase tracking-widest leading-none" style={{ color: "var(--primary)" }}>HANDAL</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-soft)" }}>Plateforme d&apos;analyse IBAM</p>
                </div>
              </div>
              <button type="button" onClick={handleLogout} disabled={logoutLoading}
                className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50">
                <LogOut className="h-4 w-4" />{logoutLoading ? "..." : "Déconnexion"}
              </button>
            </div>
          </header>

          {isValidation ? (
            /* ── SUCCÈS ── */
            <section className="section-frame rounded-2xl p-10 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-12 w-12 text-green-600" strokeWidth={2.5} />
              </div>
              <h1 className="mb-3 text-3xl font-black text-[#2b1d16]">Félicitations, {firstName} !</h1>
              <p className="mb-2 text-base font-medium text-[#6c5448]">
                Votre mémoire a été officiellement validé par la Direction Académique.
              </p>
              {lastDeliberation.notes && (
                <p className="mb-6 text-sm italic text-[#6c5448]/80">&laquo; {lastDeliberation.notes} &raquo;</p>
              )}

              <div className="mb-8 rounded-2xl border-2 border-dashed border-[#7b2438]/20 bg-[#faf7f4] p-6 text-left">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#6c5448]">Instructions de dépôt physique</p>
                <ul className="space-y-2 text-sm text-[#5f483e]">
                  <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />Imprimez votre rapport en <strong>3 exemplaires</strong> (reliure spirale).</li>
                  <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />Joignez l&apos;attestation de succès générée par Handal.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />Déposez les documents au <strong>secrétariat de l&apos;IBAM</strong> avant la date limite.</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <div className="inline-flex items-center gap-2 rounded-xl border-2 border-green-300 bg-green-50 px-5 py-2.5 text-sm font-bold text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  Validé par {lastDeliberation.decider?.name ?? "Direction Académique"}
                </div>
                <button type="button"
                  onClick={() => {
                    const entry = analysisHistory.find((a) => a.reportId);
                    if (entry?.reportId) openReport(entry.reportId);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-[#7b2438]/20 px-5 py-2.5 text-sm font-bold text-[#7b2438] transition hover:bg-[#f2d9e0]">
                  Voir le rapport détaillé
                </button>
              </div>
            </section>
          ) : isSanction ? (
            /* ── SANCTION ── */
            <section className="section-frame rounded-2xl p-10 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-12 w-12 text-red-600" strokeWidth={2.5} />
              </div>
              <h1 className="mb-3 text-3xl font-black text-red-700">Sanction prononcée</h1>
              <p className="mb-6 text-base font-medium text-[#6c5448]">
                La Direction Académique a prononcé une sanction suite à l&apos;analyse de votre mémoire.
              </p>
              {lastDeliberation.notes && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-left">
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-red-700">Motif</p>
                  <p className="text-sm italic text-red-800">&laquo; {lastDeliberation.notes} &raquo;</p>
                </div>
              )}
              <p className="text-sm text-[#6c5448]">Contactez votre encadrant ou le secrétariat pour la suite de la procédure.</p>
            </section>
          ) : (
            /* ── RÉÉCRITURE ── */
            <section className="section-frame rounded-2xl p-10 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-100">
                <Clock className="h-12 w-12 text-orange-500" strokeWidth={2.5} />
              </div>
              <h1 className="mb-3 text-3xl font-black text-[#9a6a28]">Réécriture requise</h1>
              <p className="mb-6 text-base font-medium text-[#6c5448]">
                La Direction Académique demande des corrections avant validation finale.
              </p>
              {lastDeliberation.notes && (
                <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-left">
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-700">Observations</p>
                  <p className="text-sm italic text-orange-800">&laquo; {lastDeliberation.notes} &raquo;</p>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button type="button"
                  onClick={() => {
                    setLastDeliberation(null);
                    setActiveStep(3);
                    setAnalysisResult(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7b2438] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#5f1b2a]">
                  <UploadCloud className="h-4 w-4" /> Déposer une nouvelle version
                </button>
                <button type="button"
                  onClick={() => {
                    const entry = analysisHistory.find((a) => a.reportId);
                    if (entry?.reportId) openReport(entry.reportId);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-[#7b2438]/20 px-5 py-2.5 text-sm font-bold text-[#7b2438] transition hover:bg-[#f2d9e0]">
                  Voir le rapport
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Modal rapport */}
        {(reportModal || reportModalError) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={() => { setReportModal(null); setReportModalError(null); }}>
            <div className="relative flex w-[95%] max-w-2xl flex-col max-h-[90vh] rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex shrink-0 items-center justify-between border-b border-[#7b2438]/10 px-6 py-4">
                <span className="text-sm font-bold text-[#2b1d16]">Rapport d&apos;analyse</span>
                <button type="button" onClick={() => { setReportModal(null); setReportModalError(null); }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#6c5448] transition hover:bg-[#f2d9e0]">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {reportModalError ? (
                  <p className="text-sm text-red-700">{reportModalError}</p>
                ) : reportModal ? (
                  <div className="space-y-4">
                    <p className="font-semibold text-[#2b1d16]">{reportModal.document.title || reportModal.document.originalName}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ label: "Similarité", value: `${parseFloat(reportModal.globalSimilarity).toFixed(1)}%`, color: parseFloat(reportModal.globalSimilarity) >= 50 ? "#b91c1c" : parseFloat(reportModal.globalSimilarity) >= 20 ? "#c98a2f" : "#16a34a" },
                        { label: "Risque", value: reportModal.riskLevel === "LOW" ? "Faible" : reportModal.riskLevel === "MEDIUM" ? "Moyen" : "Élevé", color: reportModal.riskLevel === "LOW" ? "#16a34a" : reportModal.riskLevel === "MEDIUM" ? "#c98a2f" : "#b91c1c" }]
                        .map(({ label, value, color }) => (
                          <div key={label} className="rounded-xl border-2 border-[#7b2438]/10 bg-[#faf7f4] p-3 text-center">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-[#6c5448]">{label}</p>
                            <p className="mt-1 text-base font-extrabold" style={{ color }}>{value}</p>
                          </div>
                        ))}
                    </div>
                    {reportModal.deliberations?.map((d) => {
                      const isV = d.decision === "FINAL_VALIDATION";
                      const isS = d.decision === "SANCTION";
                      return (
                        <div key={d.id} className="rounded-xl border-2 px-4 py-3"
                          style={{ borderColor: isV ? "rgba(22,163,74,0.35)" : isS ? "rgba(220,38,38,0.35)" : "rgba(201,138,47,0.35)", background: isV ? "rgba(22,163,74,0.06)" : isS ? "rgba(220,38,38,0.06)" : "rgba(201,138,47,0.08)" }}>
                          <p className="text-sm font-bold" style={{ color: isV ? "#166534" : isS ? "#b91c1c" : "#9a6a28" }}>
                            {isV ? "Validation finale" : isS ? "Sanction" : "Réécriture requise"}
                          </p>
                          {d.notes && <p className="mt-1 text-xs text-[#5f483e]">{d.notes}</p>}
                          <p className="mt-1 text-[10px] text-[#6c5448]/70">{d.decider?.name ?? "DA"} · {new Date(d.decidedAt).toLocaleDateString("fr-FR")}</p>
                        </div>
                      );
                    })}
                    {parseFloat(reportModal.globalSimilarity) >= 15 && (
                      <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-yellow-700">
                          {parseFloat(reportModal.globalSimilarity) >= 50 ? "⚠️ Documents similaires détectés" : "Sources similaires détectées"}
                        </p>
                        
                        {/* Show matched sources first */}
                        {reportModal.matchedSources && reportModal.matchedSources.length > 0 && (
                          <div className="mb-4 space-y-2">
                            {reportModal.matchedSources.slice(0, 5).map((src, i) => (
                              <div key={i} className="flex items-center justify-between rounded bg-white p-2 text-sm">
                                <span className="text-[#5f483e] truncate flex-1 mr-2">{src.sourceLabel || src.name || `Document #${i+1}`}</span>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap ${(src.similarity || 0) >= 50 ? "bg-red-100 text-red-700" : (src.similarity || 0) >= 20 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                                  {(src.similarity || 0).toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Show detailed segments if available */}
                        {reportModal.highlightedSegments && reportModal.highlightedSegments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-yellow-200">
                            <p className="text-xs font-semibold text-[#6c5448] mb-2">Segments similaires trouvés:</p>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {reportModal.highlightedSegments.slice(0, 10).map((seg, i) => (
                                <div key={i} className={`rounded p-2 text-xs ${seg.type === "student" ? "bg-red-50 border-l-2 border-red-400" : "bg-yellow-50 border-l-2 border-yellow-400"}`}>
                                  <span className="font-semibold">{seg.type === "student" ? "📝 Votre texte" : "📄 Source"}:</span>
                                  <p className="text-[#5f483e] mt-1 line-clamp-2">{seg.text || "Texte non disponible"}</p>
                                  <span className="text-[#6c5448]/70">Similarité: {Math.round((seg.similarity || 0) * 100)}% • {seg.matchedWith?.split(":")[2] || "Document de référence"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {(!reportModal.matchedSources || reportModal.matchedSources.length === 0) && (!reportModal.highlightedSegments || reportModal.highlightedSegments.length === 0) && (
                          <div className="text-center py-4">
                            <p className="text-sm text-[#6c5448] font-medium">
                              {parseFloat(reportModal.globalSimilarity) >= 50 
                                ? "Similarité très élevée détectée avec un autre document" 
                                : "Aucune source de référence identifiée"}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* ── Header ── */}
        <header className="section-frame rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/student"
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <Image
                src="/brand/handal-lamp.png"
                alt="Handal"
                width={40}
                height={27}
                className="h-10 w-auto object-contain"
                priority
              />
              <div>
                <p
                  className="text-xl font-black uppercase tracking-widest leading-none"
                  style={{ color: "var(--primary)" }}
                >
                  HANDAL
                </p>
                <p
                  className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-soft)" }}
                >
                  Plateforme d&apos;analyse IBAM
                </p>
              </div>
            </Link>
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
              <p
                className="hidden text-sm font-semibold sm:block"
                style={{ color: "var(--text-soft)" }}
              >
                {firstName} — L3 MIAGE
              </p>
              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {logoutLoading ? "..." : "Déconnexion"}
              </button>
            </div>
          </div>
        </header>

        {/* ── Error ── */}
        {errorMsg && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-5 py-4 text-sm font-medium text-red-800">
            {errorMsg}
          </div>
        )}

        {/* ── Stepper ── */}
        <section className="section-frame rounded-2xl px-8 py-6">
          <p className="mb-5 text-xs font-bold uppercase tracking-widest text-[#6c5448]">
            Progression
          </p>
          <Stepper active={activeStep} />
        </section>

        {/* ── Proposition & Validation ── */}
        <section className="section-frame rounded-2xl p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-[#7b2438]/10 pb-5">
            <span className="tag-chip">Étapes 1 & 2</span>
            <h2 className="text-xl font-bold text-[#2b1d16]">
              Proposition & Validation du thème
            </h2>
          </div>

          {!themeSubmitted ? (
            <form onSubmit={proposeTheme} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#2b1d16]">
                  Titre du thème
                </label>
                <input
                  type="text"
                  value={themeTitle}
                  onChange={(e) => setThemeTitle(e.target.value)}
                  placeholder="Ex : Détection de plagiat multilingue par NLP"
                  required
                  className="h-12 w-full rounded-xl border-2 border-[#7b2438]/20 bg-white px-4 text-[#2b1d16] outline-none transition placeholder:text-[#6c5448]/50 focus:border-[#7b2438] focus:ring-2 focus:ring-[#7b2438]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#2b1d16]">
                  Description
                </label>
                <textarea
                  value={themeDescription}
                  onChange={(e) => setThemeDescription(e.target.value)}
                  placeholder="Décrivez le sujet, les objectifs et le périmètre de votre thème..."
                  rows={5}
                  required
                  className="w-full resize-none rounded-xl border-2 border-[#7b2438]/20 bg-white px-4 py-3 text-[#2b1d16] outline-none transition placeholder:text-[#6c5448]/50 focus:border-[#7b2438] focus:ring-2 focus:ring-[#7b2438]/10"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {submitting
                  ? "Soumission en cours..."
                  : "Soumettre à l'algorithme"}
              </button>
            </form>
          ) : (
            <div className="max-w-full overflow-hidden rounded-xl border-2 border-[#7b2438]/15 bg-white px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#6c5448] mb-1">
                Thème soumis
              </p>
              <p className="max-w-full truncate text-sm font-semibold text-[#2b1d16]">
                {overview?.activeTheme?.title ?? "—"}
              </p>
            </div>
          )}

          {uploading && (
            <div className="mt-4 rounded-xl border-2 border-[#7b2438]/20 bg-[#f2d9e0]/35 px-5 py-4">
              <p className="text-sm font-bold text-[#7b2438]">
                {uploadStatusMessage ??
                  "Handal analyse l'intégralité de votre document... Veuillez patienter."}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#7b2438]/10">
                <div
                  className="h-full w-2/3 rounded-full bg-[#7b2438]"
                  style={{ animation: "pulse 1.4s ease-in-out infinite" }}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-[#6c5448]">
                Extraction du texte, vérification du titre et analyse de
                similarité sur l&apos;intégralité des pages.
              </p>
            </div>
          )}

          {themeMessage && (
            <div
              className={`mt-4 rounded-xl border-2 px-5 py-3 text-sm font-semibold ${
                themeMessage.startsWith("Thème")
                  ? "border-green-400/50 bg-green-50 text-green-800"
                  : "border-red-400/50 bg-red-50 text-red-800"
              }`}
            >
              {themeMessage}
            </div>
          )}

          {themeSubmitted && (
            <div className="mt-8 space-y-4">
              <div className="border-t border-[#7b2438]/10 pt-6">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#6c5448]">
                  Statuts de validation
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    {
                      label: "Validation par l'algorithme",
                      status: algoStatus,
                    },
                    { label: "Chef de Département", status: cdStatus },
                  ].map(({ label, status }) => (
                    <div
                      key={label}
                      className="rounded-xl border-2 border-[#7b2438]/12 bg-white p-5"
                    >
                      <p className="mb-3 text-sm font-bold text-[#2b1d16]">
                        {label}
                      </p>
                      <StatusBadge status={status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Dépôt ── */}
        <section
          className={`section-frame rounded-2xl p-8 transition-all duration-300 ${
            !depositUnlocked ? "opacity-40 grayscale" : ""
          }`}
        >
          <div className="mb-6 flex items-start gap-4 border-b border-[#7b2438]/10 pb-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#7b2438]/20 bg-[#f2d9e0]">
              <Lock className="h-5 w-5 text-[#7b2438]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#2b1d16]">
                Dépôt du mémoire final
              </h3>
              <p className="mt-1 text-sm font-medium text-[#6c5448]">
                {depositUnlocked
                  ? "Votre thème est validé. Vous pouvez déposer votre mémoire."
                  : "Le dépôt sera débloqué une fois votre thème validé par le Chef de Département."}
              </p>
            </div>
          </div>

          {depositUnlocked ? (
            <>
              {!analysisResult && (
                <label
                  htmlFor="file-upload"
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    handleFileUpload(e.dataTransfer.files);
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition ${
                    dragActive
                      ? "border-[#7b2438] bg-[#f2d9e0]/40"
                      : "border-[#7b2438]/25 hover:border-[#7b2438]/50 hover:bg-[#f2d9e0]/20"
                  }`}
                >
                  <UploadCloud className="h-10 w-10 text-[#7b2438]/60" />
                  <div>
                    <p className="text-sm font-bold text-[#2b1d16]">
                      Glissez votre fichier ici ou{" "}
                      <span className="text-[#7b2438] underline">
                        parcourez
                      </span>
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#6c5448]">
                      PDF ou DOCX — max 50 MB
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </label>
              )}

              {/* Erreur titre premiere page */}
              {titleMismatch && (
                <div className="mt-4 flex max-w-full items-start gap-3 overflow-hidden rounded-xl border-2 border-[#7b2438]/60 bg-[#f2d9e0] px-5 py-4">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7b2438]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#7b2438]">
                      Erreur : Le titre détecté sur votre document ne correspond
                      pas au thème validé par le Chef de département.
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#5f1a29]">
                      Titre attendu :{" "}
                      <span className="block max-w-full truncate font-bold">
                        {titleMismatch.validatedTitle}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-[#5f1a29]">
                      Correspondance :{" "}
                      <span className="font-bold">
                        {titleMismatch.titleScore}%
                      </span>{" "}
                      (seuil requis : 80%)
                    </p>
                    <button
                      type="button"
                      onClick={() => setTitleMismatch(null)}
                      className="mt-2 text-xs font-semibold text-[#7b2438] underline"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              )}

              {/* Barre de progression pendant l'analyse */}
              {uploading && (
                <div className="mt-4 space-y-3">
                  {" "}
                  <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                    <Image
                      src="/brand/handal-lamp.png"
                      alt="Handal"
                      width={24}
                      height={24}
                      className="h-6 w-auto object-contain"
                      style={{ height: "auto" }}
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-[#7b2438]">
                      HANDAL
                    </span>
                    <span className="text-[10px] font-semibold text-[#6c5448] break-words">
                      — Analyse en cours
                    </span>
                  </div>{" "}
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#7b2438]/10">
                    <div
                      className="h-full rounded-full bg-[#7b2438] animate-[progress_2s_ease-in-out_infinite]"
                      style={{
                        width: "60%",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                  </div>
                  <p className="text-center text-sm font-semibold text-[#6c5448]">
                    {uploadStatusMessage ??
                      "Handal analyse l'intégralité de votre document... Veuillez patienter."}
                  </p>
                </div>
              )}

              {/* Résultat d'analyse : jauge circulaire */}
              {analysisResult && (
                <div className="mt-4 space-y-4">
                  <div className="flex max-w-full flex-col items-center gap-4 overflow-hidden rounded-xl border-2 border-[#7b2438]/15 bg-white p-6">
                    <div className="flex w-full flex-wrap items-center justify-center gap-2 border-b border-[#7b2438]/10 pb-3 text-center">
                      <Image
                        src="/brand/handal-lamp.png"
                        alt="Handal"
                        width={24}
                        height={24}
                        className="h-6 w-auto object-contain"
                        style={{ height: "auto" }}
                      />
                      <span
                        className="text-xs font-black uppercase tracking-widest"
                        style={{ color: "var(--primary)" }}
                      >
                        HANDAL
                      </span>
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: "var(--text-soft)" }}
                      >
                        — Analyse officielle
                      </span>
                    </div>

                    <div className="relative flex items-center justify-center">
                      <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="rgba(123,36,56,0.10)"
                          strokeWidth="10"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke={
                            analysisResult.blocked
                              ? "#7b2438"
                              : analysisResult.globalSimilarity < 20
                                ? "#16a34a"
                                : "#c98a2f"
                          }
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 50}`}
                          strokeDashoffset={`${2 * Math.PI * 50 * (1 - Math.min(analysisResult.globalSimilarity, 100) / 100)}`}
                          transform="rotate(-90 60 60)"
                          style={{ transition: "stroke-dashoffset 1s ease" }}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span
                          className="text-2xl font-extrabold"
                          style={{
                            color: analysisResult.blocked
                              ? "#7b2438"
                              : analysisResult.globalSimilarity < 20
                                ? "#16a34a"
                                : "#c98a2f",
                          }}
                        >
                          {analysisResult.globalSimilarity.toFixed(1)}%
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6c5448]">
                          Similarité
                        </span>
                      </div>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-4 text-center sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">
                          Niveau de risque
                        </p>
                        <p
                          className="text-lg font-extrabold"
                          style={{
                            color:
                              analysisResult.riskLevel === "LOW"
                                ? "#16a34a"
                                : analysisResult.riskLevel === "MEDIUM"
                                  ? "#c98a2f"
                                  : "#b91c1c",
                          }}
                        >
                          {analysisResult.riskLevel === "LOW"
                            ? "Faible"
                            : analysisResult.riskLevel === "MEDIUM"
                              ? "Moyen"
                              : "Élevé"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">
                          Tentative
                        </p>
                        <p className="text-lg font-extrabold text-[#2b1d16]">
                          #{analysisResult.uploadAttempts}
                        </p>
                      </div>
                    </div>
                  </div>

                  {analysisResult.blocked ? (
                    <div className="flex max-w-full items-start gap-3 overflow-hidden rounded-xl border-2 border-[#7b2438]/60 bg-[#f2d9e0] px-5 py-4">
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7b2438]" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#7b2438]">
                          Taux de plagiat trop élevé (50%+)
                        </p>
                        {analysisResult.topReferenceSource?.sourceId && (
                          <p className="mt-0.5 text-xs font-semibold text-[#5f1a29]">
                            Similitude détectée avec :{" "}
                            <span className="inline-block max-w-full truncate align-bottom font-extrabold">
                              {analysisResult.topReferenceSource.sourceLabel ??
                                `Document #${analysisResult.topReferenceSource.sourceId}`}
                            </span>
                            {analysisResult.topReferenceSource
                              .sourceSimilarity != null && (
                              <>
                                {" "}
                                (
                                {analysisResult.topReferenceSource.sourceSimilarity.toFixed(
                                  1,
                                )}
                                %)
                              </>
                            )}
                          </p>
                        )}
                        <p className="mt-1 text-xs font-medium text-[#5f1a29]">
                          Vous devez corriger votre document et le soumettre à
                          nouveau.
                        </p>
                      </div>
                    </div>
                  ) : analysisResult.globalSimilarity < 20 ? (
                    <div className="flex items-start gap-3 rounded-xl border-2 border-green-400/50 bg-green-50 px-5 py-4">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <p className="text-sm font-bold text-green-800">
                          Document conforme aux standards
                        </p>
                        <p className="text-xs font-medium text-green-700">
                          Le taux de similarité est inférieur au seuil de 20%.
                          Votre mémoire est éligible à la délibération.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 rounded-xl border-2 border-[#c98a2f]/50 bg-[#fff6e6] px-5 py-4">
                      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#c98a2f]" />
                      <div>
                        <p className="text-sm font-bold text-[#5f3a10]">
                          Seuil de similarité élevé
                        </p>
                        <p className="text-xs font-medium text-[#755028]">
                          Le taux dépasse 20%. Votre document sera examiné avant
                          délibération.
                        </p>
                      </div>
                    </div>
                  )}

                  {analysisResult.exclusionNote && (
                    <div className="rounded-xl border border-[#7b2438]/15 bg-[#faf7f4] px-4 py-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">
                        Sections exclues de l&apos;analyse
                      </p>
                      <p className="whitespace-pre-line text-xs font-medium leading-relaxed text-[#6c5448]">
                        {analysisResult.exclusionNote}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setAnalysisResult(null);
                      setDocumentMessage(null);
                    }}
                    className="w-full rounded-xl border-2 border-[#7b2438]/20 py-2.5 text-sm font-semibold text-[#7b2438] transition hover:bg-[#7b2438]/05"
                  >
                    Déposer un autre document
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border-2 border-[#c98a2f]/40 bg-[#fff6e6] px-5 py-4 text-sm font-semibold text-[#5f3a10]">
              État actuel :{" "}
              {algoStatus !== "approved"
                ? "En attente de validation par l'algorithme"
                : cdStatus === "rejected"
                  ? "Thème rejeté par le Chef de Département"
                  : "En attente de validation du Chef de Département"}
            </div>
          )}

          {documentMessage && (
            <div
              className={`mt-4 rounded-xl border-2 px-5 py-3 text-sm font-semibold ${
                documentMessage.startsWith("✓")
                  ? "border-green-400/50 bg-green-50 text-green-800"
                  : documentMessage.includes("arrière-plan")
                    ? "border-[#c98a2f]/50 bg-[#fff6e6] text-[#755028]"
                    : "border-red-400/50 bg-red-50 text-red-800"
              }`}
            >
              {documentMessage}
            </div>
          )}
        </section>

        {/* ── Historique des analyses ── */}
        <section className="section-frame rounded-2xl p-0">
          <HistoriqueAttempts
            attempts={analysisHistory}
            onViewReport={(reportId) => openReport(reportId)}
            reportModalLoading={reportModalLoading}
          />
        </section>
      </div>

      {/* ── Modal Rapport ── */}
      {(reportModal || reportModalError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => {
            setReportModal(null);
            setReportModalError(null);
          }}
        >
          <div
            className="relative flex w-[95%] max-w-2xl flex-col max-h-[90vh] rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal — sticky */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#7b2438]/10 px-4 py-4 md:px-8">
              <div className="flex items-center gap-2">
                <Image
                  src="/brand/handal-lamp.png"
                  alt="Handal"
                  width={20}
                  height={20}
                  className="h-5 w-auto object-contain"
                  style={{ height: "auto" }}
                />
                <span
                  className="text-sm font-black uppercase tracking-widest"
                  style={{ color: "var(--primary)" }}
                >
                  HANDAL
                </span>
                <span className="text-xs font-semibold text-[#6c5448]">
                  — Rapport d&apos;analyse
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReportModal(null);
                  setReportModalError(null);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#6c5448] transition hover:bg-[#f2d9e0] hover:text-[#7b2438]"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 md:px-8">
              <div className="space-y-4">
              {reportModalError ? (
                <div className="flex items-start gap-3 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-sm font-semibold text-red-700">
                    {reportModalError}
                  </p>
                </div>
              ) : reportModal ? (
                <>
                  {/* Titre document */}
                  <div className="max-w-full overflow-hidden">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">
                      Document
                    </p>
                    <p className="mt-0.5 break-words text-sm font-semibold text-[#2b1d16]">
                      {reportModal.document.title || reportModal.document.originalName || "Titre non disponible"}
                    </p>
                    <p className="max-w-full truncate text-[10px] text-[#6c5448]/70">
                      {reportModal.document.originalName}
                    </p>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      {
                        label: "Similarité globale",
                        value: `${parseFloat(reportModal.globalSimilarity).toFixed(1)}%`,
                        color:
                          parseFloat(reportModal.globalSimilarity) >= 50
                            ? "#b91c1c"
                            : parseFloat(reportModal.globalSimilarity) >= 20
                              ? "#c98a2f"
                              : "#16a34a",
                      },
                      {
                        label: "Niveau de risque",
                        value:
                          reportModal.riskLevel === "LOW"
                            ? "Faible"
                            : reportModal.riskLevel === "MEDIUM"
                              ? "Moyen"
                              : "Élevé",
                        color:
                          reportModal.riskLevel === "LOW"
                            ? "#16a34a"
                            : reportModal.riskLevel === "MEDIUM"
                              ? "#c98a2f"
                              : "#b91c1c",
                      },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="rounded-xl border-2 border-[#7b2438]/10 bg-[#faf7f4] p-3 text-center"
                      >
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#6c5448]">
                          {label}
                        </p>
                        <p
                          className="mt-1 text-base font-extrabold"
                          style={{ color }}
                        >
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Sources détectées */}
                  {Array.isArray(reportModal.matchedSources) &&
                    reportModal.matchedSources.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">
                          Sources détectées
                        </p>
                        <div className="space-y-2">
                          {reportModal.matchedSources
                            ?.filter((src) =>
                              (src.name || "").toLowerCase().includes("commission") === false &&
                              (src.name || "").toLowerCase().includes("jury") === false
                            )
                            .slice(0, 6)
                            .map((src, i) => {
                              const label = (src.sourceLabel && src.sourceLabel.length > 3)
                                ? src.sourceLabel
                                : (src.name || "")
                                    .replace(/rapport\s*#?\d*/gi, "Document d'archive")
                                    .replace(/^(reference|validated):\d+:/, "")
                                    .trim() || `Source #${i + 1}`;
                              const pct = Math.min(src.similarity || 0, 100);
                              const scoreColor =
                                pct >= 50 ? "#b91c1c" : pct >= 20 ? "#c98a2f" : "#16a34a";
                              const barColor =
                                pct >= 50 ? "bg-red-500" : pct >= 20 ? "bg-amber-500" : "bg-green-500";
                              return (
                                <div
                                  key={i}
                                  className="rounded-lg border border-[#7b2438]/10 bg-[#faf7f4] px-3 py-2.5"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      {src.sourceDocumentId ? (
                                        <a
                                          href={`/api/documents/${src.sourceDocumentId}/view`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-xs font-bold text-[#7b2438] underline decoration-dotted hover:decoration-solid break-words"
                                        >
                                          <ExternalLink className="h-3 w-3 shrink-0 mt-0.5" />
                                          <span className="break-words line-clamp-2">{label}</span>
                                        </a>
                                      ) : (
                                        <p className="break-words text-xs font-semibold text-[#2b1d16] line-clamp-2">
                                          {label}
                                        </p>
                                      )}
                                      <p className="mt-0.5 text-[10px] text-[#6c5448]/70 capitalize">
                                        {src.type}
                                      </p>
                                    </div>
                                    <span
                                      className="shrink-0 text-sm font-extrabold"
                                      style={{ color: scoreColor }}
                                    >
                                      {pct.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#7b2438]/10">
                                    <div
                                      className={`h-full rounded-full ${barColor}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                  {/* Délibérations */}
                  {Array.isArray(reportModal.deliberations) && reportModal.deliberations.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">
                        Décision de délibération
                      </p>
                      <div className="space-y-2">
                        {reportModal.deliberations.map((d) => {
                          const isValidation = d.decision === "FINAL_VALIDATION";
                          const isSanction = d.decision === "SANCTION";
                          return (
                            <div
                              key={d.id}
                              className="rounded-xl border-2 px-4 py-3"
                              style={{
                                borderColor: isValidation ? "rgba(22,163,74,0.35)" : isSanction ? "rgba(220,38,38,0.35)" : "rgba(201,138,47,0.35)",
                                background: isValidation ? "rgba(22,163,74,0.06)" : isSanction ? "rgba(220,38,38,0.06)" : "rgba(201,138,47,0.08)",
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {isValidation
                                  ? <CheckCircle className="h-4 w-4 text-green-600" />
                                  : isSanction
                                    ? <XCircle className="h-4 w-4 text-red-600" />
                                    : <Clock className="h-4 w-4 text-[#c98a2f]" />
                                }
                                <p className="text-sm font-bold" style={{ color: isValidation ? "#166534" : isSanction ? "#b91c1c" : "#9a6a28" }}>
                                  {isValidation ? "Validation finale" : isSanction ? "Sanction" : "Réécriture requise"}
                                </p>
                              </div>
                              {d.notes && (
                                <p className="mt-2 text-xs text-[#5f483e]">{d.notes}</p>
                              )}
                              {d.committee && (
                                <p className="mt-1 text-[10px] text-[#6c5448]">
                                  Commission : {d.committee}
                                </p>
                              )}
                              <p className="mt-1 text-[10px] text-[#6c5448]/70">
                                {d.decider?.name ?? "Direction Académique"} · {new Date(d.decidedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-[#6c5448]/60 text-right">
                    Analysé le{" "}
                    {new Date(reportModal.analyzedAt).toLocaleDateString(
                      "fr-FR",
                      { day: "2-digit", month: "long", year: "numeric" },
                    )}
                  </p>
                </>
              ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
