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
  History,
  FileText,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { apiFetch } from "@/lib/frontend-api";

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
};

type ReportDetail = {
  id: string;
  documentId: string;
  globalSimilarity: string;
  aiScore: string | null;
  riskLevel: string;
  matchedSources: Array<{
    name: string;
    similarity: number;
    type: string;
    sourceId: string | null;
    sourceLabel: string | null;
  }>;
  analyzedAt: string;
  document: {
    id: string;
    originalName: string;
    title: string;
  };
};

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

  const [themeTitle, setThemeTitle] = useState("");
  const [themeDescription, setThemeDescription] = useState("");
  const [themeMessage, setThemeMessage] = useState<string | null>(null);
  const [themeSubmitted, setThemeSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [algoStatus, setAlgoStatus] = useState<ValidationStatus>("pending");
  const [cdStatus, setCdStatus] = useState<ValidationStatus>("pending");
  const [daStatus, setDaStatus] = useState<ValidationStatus>("pending");

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
  } | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisEntry[]>([]);
  const [reportModal, setReportModal] = useState<ReportDetail | null>(null);
  const [reportModalLoading, setReportModalLoading] = useState<string | null>(null);
  const [reportModalError, setReportModalError] = useState<string | null>(null);

  // Statuts validés si le thème est VALIDATED, VALIDATED_DA, ou les deux votes v2 approuvés
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

  useEffect(() => {
    let mounted = true;
    apiFetch<{ ok: boolean; history: AnalysisEntry[] }>(
      "/api/me/analysis-history",
    )
      .then((r) => {
        if (mounted) setAnalysisHistory(r.history ?? []);
      })
      .catch(() => {});
    apiFetch<OverviewResponse>("/api/me/overview")
      .then((r) => {
        if (!mounted) return;
        setOverview(r);
        const t = r.activeTheme;
        if (!t) return;
        // Thème soumis dès qu'il existe
        setThemeSubmitted(true);
        // Validation algorithmique
        const algoApproved = ALGO_APPROVED_STATUSES.includes(t.status);
        setAlgoStatus(algoApproved ? "approved" : "pending");
        // Statut Chef de département
        const daApproved =
          t.daApproval === true ||
          t.validatedDa ||
          VALIDATED_STATUSES.includes(t.status);
        // Chef de Département est le seul validateur : VALIDATED suffit
        const cdApproved =
          t.teacherApproval === true ||
          t.validatedCd ||
          VALIDATED_STATUSES.includes(t.status);
        const cdRejected = t.teacherApproval === false;
        setCdStatus(
          cdApproved ? "approved" : cdRejected ? "rejected" : "pending",
        );
        const daRejected = t.daApproval === false;
        setDaStatus(
          daApproved ? "approved" : daRejected ? "rejected" : "pending",
        );
      })
      .catch((e) => {
        if (mounted)
          setErrorMsg(e instanceof Error ? e.message : "Erreur de chargement");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
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
      const res = await fetch("/api/documents/upload-file", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Erreur upload");
      }
      const data = await res.json();
      if (data.titleMismatch) {
        setTitleMismatch({
          titleScore: data.titleScore,
          validatedTitle: data.validatedTitle,
        });
      } else if (data.analysis) {
        setAnalysisResult(data.analysis);
        setDocumentMessage(null);
      } else {
        setDocumentMessage(`✓ Document déposé : ${data.document.id}`);
      }
      // Rafraichir l'historique
      apiFetch<{ ok: boolean; history: AnalysisEntry[] }>(
        "/api/me/analysis-history",
      )
        .then((r) => setAnalysisHistory(r.history ?? []))
        .catch(() => {});
    } catch (err) {
      setDocumentMessage(err instanceof Error ? err.message : "Erreur upload");
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
        err instanceof Error ? err.message : "Impossible de charger le rapport.",
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
  const activeStep = getActiveStep(themeSubmitted, cdStatus);
  const depositUnlocked = cdStatus === "approved";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#7b2438]/20 border-t-[#7b2438]" />
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* ── Header ── */}
        <header className="section-frame rounded-2xl p-6">
          <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-3">
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
            <div className="rounded-xl border-2 border-[#7b2438]/15 bg-white px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#6c5448] mb-1">
                Thème soumis
              </p>
              <p className="text-sm font-semibold text-[#2b1d16]">
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
                similarité sur l'intégralité des pages.
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="mt-4 flex items-start gap-3 rounded-xl border-2 border-[#7b2438]/60 bg-[#f2d9e0] px-5 py-4">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7b2438]" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#7b2438]">
                      Erreur : Le titre détecté sur votre document ne correspond
                      pas au thème validé par le Chef de département.
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#5f1a29]">
                      Titre attendu :{" "}
                      <span className="font-bold">
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
                  <div className="flex items-center justify-center gap-2 mb-3">
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
                    <span className="text-[10px] font-semibold text-[#6c5448]">
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
                  <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-[#7b2438]/15 bg-white p-6">
                    {/* Logo Handal officiel */}
                    <div className="flex items-center gap-2 border-b border-[#7b2438]/10 pb-3 w-full justify-center">
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
                    {/* Jauge circulaire SVG */}
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
                    <div className="flex gap-6 text-center">
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

                  {/* Feedback visuel selon seuil */}
                  {analysisResult.blocked ? (
                    <div className="flex items-start gap-3 rounded-xl border-2 border-[#7b2438]/60 bg-[#f2d9e0] px-5 py-4">
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7b2438]" />
                      <div>
                        <p className="text-sm font-bold text-[#7b2438]">
                          Taux de plagiat trop élevé (50%+)
                        </p>
                        {analysisResult.topReferenceSource?.sourceId && (
                          <p className="mt-0.5 text-xs font-semibold text-[#5f1a29]">
                            Similitude détectée avec le{" "}
                            <span className="font-bold">
                              document de référence #{analysisResult.topReferenceSource.sourceId}
                            </span>
                            {analysisResult.topReferenceSource.sourceSimilarity != null && (
                              <> ({analysisResult.topReferenceSource.sourceSimilarity.toFixed(1)}%)</>
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
                  : "border-red-400/50 bg-red-50 text-red-800"
              }`}
            >
              {documentMessage}
            </div>
          )}
        </section>

        {/* ── Historique des analyses ── */}
        <section className="section-frame rounded-2xl p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-[#7b2438]/10 pb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2d9e0]">
              <History className="h-5 w-5 text-[#7b2438]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#2b1d16]">
                Historique de vos tentatives
              </h3>
              <p className="text-xs font-medium text-[#6c5448]">
                Toutes vos analyses sont conservées comme preuve de correction
              </p>
            </div>
          </div>

          {analysisHistory.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-[#7b2438]/15 bg-white py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f2d9e0]">
                <FileText className="h-7 w-7 text-[#7b2438]/50" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#2b1d16]">
                  Aucune analyse effectuée pour le moment
                </p>
                <p className="mt-1 text-xs font-medium text-[#6c5448]">
                  Déposez votre document pour commencer.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {analysisHistory.map((entry, idx) => {
                const isLatest = idx === 0;
                const date = new Date(entry.analyzedAt);
                const dateStr = date.toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const timeStr = date.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={entry.id}
                    className="rounded-xl border bg-white px-5 py-4"
                    style={{
                      borderColor: isLatest
                        ? "rgba(123,36,56,0.30)"
                        : "rgba(203,213,225,0.8)",
                      boxShadow: isLatest
                        ? "0 0 0 1px rgba(123,36,56,0.08)"
                        : undefined,
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      {/* Infos gauche */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-[#6c5448]">
                            {dateStr} à {timeStr}
                          </span>
                          {isLatest && (
                            <span className="rounded-full bg-[#7b2438] px-2 py-0.5 text-[10px] font-bold text-white">
                              Dernière
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-[#6c5448]">
                            Tentative #{entry.attemptNumber}
                          </span>
                        </div>

                        {/* Titre détecté */}
                        {entry.detectedTitle && (
                          <p className="text-xs text-[#6c5448] truncate max-w-xs">
                            <span className="font-semibold">
                              Titre détecté :
                            </span>{" "}
                            {entry.detectedTitle.slice(0, 80)}
                            {entry.detectedTitle.length > 80 ? "…" : ""}
                          </p>
                        )}

                        {/* Fichier */}
                        <p className="text-[10px] text-[#6c5448]/70 truncate max-w-xs">
                          {entry.fileName}
                        </p>
                      </div>

                      {/* Score + statut droite */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {entry.titleMismatch ? (
                          <span className="rounded-full border border-[#7b2438]/40 bg-[#f2d9e0] px-3 py-1 text-[11px] font-bold text-[#7b2438]">
                            Titre non conforme
                          </span>
                        ) : entry.similarityScore != null ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-lg font-extrabold"
                                style={{
                                  color: isLatest
                                    ? "#7b2438"
                                    : entry.blocked
                                      ? "#b91c1c"
                                      : entry.similarityScore < 20
                                        ? "#16a34a"
                                        : "#c98a2f",
                                }}
                              >
                                {entry.similarityScore.toFixed(1)}%
                              </span>
                              {entry.blocked ? (
                                <span className="rounded-full border border-[#7b2438]/50 bg-[#f2d9e0] px-2.5 py-0.5 text-[11px] font-bold text-[#7b2438]">
                                  Rejeté (&gt;50%)
                                </span>
                              ) : (
                                <span className="rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-700">
                                  Validé pour examen
                                </span>
                              )}
                            </div>
                            {entry.sourceReferenceId && (
                              <p className="text-[10px] font-semibold text-[#7b2438] text-right">
                                Similitude détectée avec le{" "}
                                <span className="font-bold">
                                  document de référence #{entry.sourceReferenceId}
                                </span>
                                {entry.sourceReferenceSimilarity != null && (
                                  <> ({entry.sourceReferenceSimilarity.toFixed(1)}%)</>
                                )}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#6c5448]">—</span>
                        )}

                        {/* Bouton Voir le rapport */}
                        {entry.reportId && (
                          <button
                            type="button"
                            onClick={() => openReport(entry.reportId!)}
                            disabled={reportModalLoading === entry.reportId}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#7b2438]/30 px-3 py-1 text-[11px] font-bold text-[#7b2438] transition hover:bg-[#f2d9e0] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {reportModalLoading === entry.reportId ? (
                              <>
                                <span className="h-3 w-3 animate-spin rounded-full border border-[#7b2438]/30 border-t-[#7b2438]" />
                                Chargement...
                              </>
                            ) : (
                              <>
                                <ExternalLink className="h-3 w-3" />
                                Voir le rapport
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Modal Rapport ── */}
      {(reportModal || reportModalError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => { setReportModal(null); setReportModalError(null); }}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-[#7b2438]/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/brand/handal-lamp.png"
                  alt="Handal"
                  width={20}
                  height={20}
                  className="h-5 w-auto object-contain"
                  style={{ height: "auto" }}
                />
                <span className="text-sm font-black uppercase tracking-widest" style={{ color: "var(--primary)" }}>
                  HANDAL
                </span>
                <span className="text-xs font-semibold text-[#6c5448]">— Rapport d&apos;analyse</span>
              </div>
              <button
                type="button"
                onClick={() => { setReportModal(null); setReportModalError(null); }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#6c5448] transition hover:bg-[#f2d9e0] hover:text-[#7b2438]"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Contenu modal */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
              {reportModalError ? (
                <div className="flex items-start gap-3 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-sm font-semibold text-red-700">{reportModalError}</p>
                </div>
              ) : reportModal ? (
                <>
                  {/* Titre document */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">Document</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#2b1d16] truncate">{reportModal.document.title}</p>
                    <p className="text-[10px] text-[#6c5448]/70">{reportModal.document.originalName}</p>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-3 gap-3">
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
                        label: "Score IA",
                        value: reportModal.aiScore
                          ? `${parseFloat(reportModal.aiScore).toFixed(1)}%`
                          : "—",
                        color: "#2b1d16",
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
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#6c5448]">{label}</p>
                        <p className="mt-1 text-base font-extrabold" style={{ color }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Sources détectées */}
                  {Array.isArray(reportModal.matchedSources) && reportModal.matchedSources.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#6c5448]">Sources détectées</p>
                      <div className="space-y-2">
                        {reportModal.matchedSources.slice(0, 6).map((src, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-lg border border-[#7b2438]/10 bg-white px-3 py-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-[#2b1d16]">
                                {src.sourceLabel ?? src.name}
                              </p>
                              <p className="text-[10px] text-[#6c5448]/70 capitalize">{src.type}</p>
                            </div>
                            <span
                              className="ml-3 shrink-0 text-sm font-extrabold"
                              style={{
                                color:
                                  src.similarity >= 50
                                    ? "#b91c1c"
                                    : src.similarity >= 20
                                      ? "#c98a2f"
                                      : "#16a34a",
                              }}
                            >
                              {src.similarity.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-[#6c5448]/60 text-right">
                    Analysé le {new Date(reportModal.analyzedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
