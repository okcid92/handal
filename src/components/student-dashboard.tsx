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
    <>
      {pendingMessage ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {pendingMessage}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Profil connecté" accent="emerald">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Nom" value={overview?.user.name ?? "—"} />
            <Info label="Rôle" value={overview?.user.role ?? "—"} />
            <Info label="INE" value={overview?.user.ine ?? "—"} />
            <Info label="Identifiant" value={overview?.user.id ?? "—"} />
          </dl>
        </Panel>

        <Panel title="Actions rapides" accent="cyan">
          <ul className="space-y-3 text-sm text-zinc-300">
            <li>Proposer un nouveau thème.</li>
            <li>Enregistrer la métadonnée d’un dépôt final.</li>
            <li>Lancer un auto-test sur un document.</li>
          </ul>
        </Panel>
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
            <pre className="mt-4 overflow-auto rounded-2xl bg-black/30 p-4 text-xs text-zinc-200">
              {JSON.stringify(autoTestResult, null, 2)}
            </pre>
          ) : null}
        </Panel>
      </section>
    </>
  );
}

function DashboardShellLoading({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
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
    emerald: "text-emerald-200 bg-emerald-500/10",
    cyan: "text-cyan-200 bg-cyan-500/10",
    amber: "text-amber-200 bg-amber-500/10",
    violet: "text-violet-200 bg-violet-500/10",
    rose: "text-rose-200 bg-rose-500/10",
  };

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
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
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
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
      <div className="text-sm text-zinc-300">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300"
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
      <div className="text-sm text-zinc-300">{label}</div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300"
      />
    </label>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 font-semibold text-zinc-950 transition hover:bg-zinc-200"
    >
      {children}
    </button>
  );
}

function Message({ value }: { value: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
      {value}
    </div>
  );
}
