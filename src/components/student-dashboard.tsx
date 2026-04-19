"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/frontend-api";

type OverviewResponse = {
  user: {
    id: string;
    name: string;
    role: string;
    ine: string | null;
    email: string | null;
  };
};

export function StudentDashboard() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [pendingLoading, setPendingLoading] = useState(true);

  const [themeTitle, setThemeTitle] = useState("");
  const [themeDescription, setThemeDescription] = useState("");
  const [themeMessage, setThemeMessage] = useState<string | null>(null);

  const [documentThemeId, setDocumentThemeId] = useState("");
  const [documentOriginalName, setDocumentOriginalName] = useState("");
  const [documentMimeType, setDocumentMimeType] = useState("application/pdf");
  const [documentFileSize, setDocumentFileSize] = useState(1024);
  const [documentChecksum, setDocumentChecksum] = useState("");
  const [documentMessage, setDocumentMessage] = useState<string | null>(null);

  const [autoTestDocumentId, setAutoTestDocumentId] = useState("");
  const [autoTestResult, setAutoTestResult] = useState<unknown>(null);
  const [autoTestMessage, setAutoTestMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOverview() {
      try {
        const result = await apiFetch<OverviewResponse>("/api/me/overview");
        if (mounted) {
          setOverview(result);
        }
      } catch (error) {
        if (mounted) {
          setPendingMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger le profil",
          );
        }
      } finally {
        if (mounted) {
          setPendingLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      mounted = false;
    };
  }, []);

  async function proposeTheme(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setThemeMessage(null);

    try {
      const result = await apiFetch<{ theme: { id: string; status: string } }>(
        "/api/themes/propose",
        {
          method: "POST",
          body: JSON.stringify({
            title: themeTitle,
            description: themeDescription,
          }),
        },
      );

      setThemeMessage(
        `Theme créé: ${result.theme.id} (${result.theme.status})`,
      );
      setThemeTitle("");
      setThemeDescription("");
    } catch (error) {
      setThemeMessage(
        error instanceof Error ? error.message : "Erreur proposition theme",
      );
    }
  }

  async function uploadDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDocumentMessage(null);

    try {
      const result = await apiFetch<{ document: { id: string } }>(
        "/api/documents/upload",
        {
          method: "POST",
          body: JSON.stringify({
            themeId: documentThemeId,
            originalName: documentOriginalName,
            mimeType: documentMimeType,
            fileSize: documentFileSize,
            checksum: documentChecksum,
          }),
        },
      );

      setDocumentMessage(`Document enregistré: ${result.document.id}`);
      setDocumentThemeId("");
      setDocumentOriginalName("");
      setDocumentChecksum("");
    } catch (error) {
      setDocumentMessage(
        error instanceof Error ? error.message : "Erreur dépôt document",
      );
    }
  }

  async function runAutoTest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAutoTestMessage(null);
    setAutoTestResult(null);

    try {
      const result = await apiFetch<{ autoTest: unknown }>(
        `/api/documents/${autoTestDocumentId}/auto-test`,
        {
          method: "POST",
        },
      );

      setAutoTestResult(result.autoTest);
      setAutoTestMessage("Auto-test calculé");
      setAutoTestDocumentId("");
    } catch (error) {
      setAutoTestMessage(
        error instanceof Error ? error.message : "Erreur auto-test",
      );
    }
  }

  if (pendingLoading) {
    return (
      <DashboardShellLoading label="Chargement du tableau de bord étudiant..." />
    );
  }

  return (
    <div className="space-y-8">
      <header className="section-frame rounded-[1.75rem] p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[#2d1a12] md:text-4xl">
              My Submissions
            </h2>
            <p className="mt-2 text-base text-[#6d4f43]">
              Upload and track your academic documents for analysis.
            </p>
          </div>

          <div className="flex w-full items-center gap-3 rounded-xl border border-[#8e2236]/20 bg-white px-4 py-3 md:w-auto md:min-w-[300px]">
            <span className="text-sm font-bold text-[#8e2236]">Search</span>
            <input
              type="text"
              placeholder="Search by title or class..."
              className="w-full border-none bg-transparent text-sm text-[#2d1a12] outline-none placeholder:text-[#ab8e82]"
            />
          </div>
        </div>
      </header>

      {pendingMessage ? (
        <div className="rounded-2xl border border-[#d99239]/40 bg-[#fff4df] px-4 py-3 text-sm text-[#7a542a]">
          {pendingMessage}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className="section-frame relative overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[#8e2236]/30 p-7 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f3e1bf] text-[#8e2236]">
              <span className="text-xl font-black">UP</span>
            </div>
            <h3 className="text-xl font-bold text-[#2d1a12]">Upload Thesis File</h3>
            <p className="mx-auto mt-2 max-w-[260px] text-sm text-[#6d4f43]">
              Drag and drop your document here, or use the dépôt form to register
              your file metadata.
            </p>
            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-[#9b7868]">
              Supported: .pdf, .docx
            </p>
          </div>

          <section className="section-frame rounded-[1.5rem] p-6">
            <h2 className="text-lg font-bold tracking-tight text-[#2d1a12]">
              Profil connecté
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Info label="Nom" value={overview?.user.name ?? "—"} />
              <Info label="Rôle" value={overview?.user.role ?? "—"} />
              <Info label="INE" value={overview?.user.ine ?? "—"} />
              <Info label="Identifiant" value={overview?.user.id ?? "—"} />
            </dl>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <section className="section-frame rounded-[1.5rem] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-[#2d1a12]">
                Recent Documents
              </h2>
              <span className="rounded-full bg-[#f4e1bd] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#8e2236]">
                Live
              </span>
            </div>

            <div className="space-y-3">
              <SubmissionItem
                title="Final_Thesis_v3_Draft.pdf"
                course="Hist 401"
                status="Analyzing"
                statusTone="processing"
                meta="Uploaded recently"
                score="--"
              />
              <SubmissionItem
                title="Lit_Review_Submission.docx"
                course="Eng 205"
                status="Ready"
                statusTone="ready"
                meta="Last ready result"
                score="8%"
              />
              <SubmissionItem
                title="Research_Methodology_Notes.pdf"
                course="Sci 301"
                status="Ready"
                statusTone="ready"
                meta="Historical result"
                score="2%"
              />
            </div>
          </section>

          <section className="section-frame rounded-[1.5rem] p-6">
            <h2 className="text-lg font-bold tracking-tight text-[#2d1a12]">
              Actions rapides
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-[#62483f]">
              <li>Proposer un nouveau thème.</li>
              <li>Enregistrer la métadonnée d’un dépôt final.</li>
              <li>Lancer un auto-test sur un document.</li>
            </ul>
          </section>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Panel title="Proposer un thème" accent="amber">
          <form className="space-y-4" onSubmit={proposeTheme}>
            <Input
              label="Titre"
              value={themeTitle}
              onChange={setThemeTitle}
              placeholder="Détection de plagiat multilingue"
            />
            <Textarea
              label="Description"
              value={themeDescription}
              onChange={setThemeDescription}
              placeholder="Décrire le sujet et le périmètre."
            />
            <SubmitButton>Créer le thème</SubmitButton>
          </form>
          {themeMessage ? <Message value={themeMessage} /> : null}
        </Panel>

        <Panel title="Dépôt du mémoire" accent="violet">
          <form className="space-y-4" onSubmit={uploadDocument}>
            <Input
              label="Theme ID"
              value={documentThemeId}
              onChange={setDocumentThemeId}
              placeholder="12"
            />
            <Input
              label="Nom du fichier"
              value={documentOriginalName}
              onChange={setDocumentOriginalName}
              placeholder="memoire-final.pdf"
            />
            <Input
              label="MIME type"
              value={documentMimeType}
              onChange={setDocumentMimeType}
              placeholder="application/pdf"
            />
            <Input
              label="Taille fichier"
              type="number"
              value={String(documentFileSize)}
              onChange={(value) => setDocumentFileSize(Number(value || 0))}
              placeholder="1024"
            />
            <Input
              label="Checksum"
              value={documentChecksum}
              onChange={setDocumentChecksum}
              placeholder="sha256:..."
            />
            <SubmitButton>Enregistrer le dépôt</SubmitButton>
          </form>
          {documentMessage ? <Message value={documentMessage} /> : null}
        </Panel>

        <Panel title="Auto-test" accent="rose">
          <form className="space-y-4" onSubmit={runAutoTest}>
            <Input
              label="Document ID"
              value={autoTestDocumentId}
              onChange={setAutoTestDocumentId}
              placeholder="25"
            />
            <SubmitButton>Lancer l’auto-test</SubmitButton>
          </form>
          {autoTestMessage ? <Message value={autoTestMessage} /> : null}
          {autoTestResult ? (
            <pre className="mt-4 overflow-auto rounded-2xl bg-[#f6ead4] p-4 text-xs text-[#4a2f23]">
              {JSON.stringify(autoTestResult, null, 2)}
            </pre>
          ) : null}
        </Panel>
      </section>
    </div>
  );
}

function SubmissionItem({
  title,
  course,
  status,
  statusTone,
  meta,
  score,
}: {
  title: string;
  course: string;
  status: string;
  statusTone: "processing" | "ready";
  meta: string;
  score: string;
}) {
  const toneClass =
    statusTone === "processing"
      ? "bg-[#f6e1bf] text-[#8f5c22]"
      : "bg-[#f0d7dc] text-[#8e2236]";

  return (
    <article className="rounded-xl border border-[#8e2236]/15 bg-white/80 p-4 shadow-[0_10px_24px_rgba(105,63,32,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#2d1a12]">{title}</h3>
          <p className="mt-1 text-sm text-[#8f6a5a]">
            {course} · {meta}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${toneClass}`}>
          {status}
        </span>
      </div>
      <div className="mt-3 text-right text-sm font-bold text-[#8e2236]">{score}</div>
    </article>
  );
}

function DashboardShellLoading({ label }: { label: string }) {
  return (
    <div className="section-frame rounded-2xl p-6 text-sm text-[#62483f]">
      {label}
    </div>
  );
}

function Panel({
  title,
  accent,
  children,
}: {
  title: string;
  accent: "emerald" | "cyan" | "amber" | "violet" | "rose";
  children: React.ReactNode;
}) {
  const accentClasses: Record<typeof accent, string> = {
    emerald: "text-[#6f5035] bg-[#e8d2ab]/60",
    cyan: "text-[#8e2236] bg-[#f0d7dc]/70",
    amber: "text-[#7a542a] bg-[#f6e1bf]/70",
    violet: "text-[#7b2b41] bg-[#efd5dd]/70",
    rose: "text-[#9d3a4d] bg-[#f3d7dd]/70",
  };

  return (
    <section className="section-frame rounded-[1.75rem] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-[#2d1a12]">
          {title}
        </h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] ${accentClasses[accent]}`}
        >
          Live
        </span>
      </div>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#8e2236]/20 bg-white/80 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-[#8f6a5a]">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-[#2d1a12]">{value}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm text-[#4f372b]">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-[#8e2236]/20 bg-white px-4 py-3 text-[#2d1a12] outline-none transition placeholder:text-[#aa8b7e] focus:border-[#8e2236]"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm text-[#4f372b]">{label}</div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        className="mt-2 w-full rounded-2xl border border-[#8e2236]/20 bg-white px-4 py-3 text-[#2d1a12] outline-none transition placeholder:text-[#aa8b7e] focus:border-[#8e2236]"
      />
    </label>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="inline-flex w-full items-center justify-center rounded-2xl bg-[#8e2236] px-4 py-3 font-semibold text-white transition hover:bg-[#6a1728]"
    >
      {children}
    </button>
  );
}

function Message({ value }: { value: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-[#d99239]/40 bg-[#fff5e5] px-4 py-3 text-sm text-[#7a542a]">
      {value}
    </div>
  );
}
