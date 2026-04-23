"use client";

import { useState, useRef } from "react";
import { X, FileText, Upload, CheckCircle, AlertCircle } from "lucide-react";

interface UploadResult {
  fileName: string;
  documentId: string;
  dominantTheme?: string;
  subjectLabel?: string | null;
  techStack?: string[];
  topKeywords?: string[];
  excludedRatio?: number;
  warning?: string;
}

interface UploadError {
  fileName: string;
  error: string;
}

interface FileProgress {
  fileName: string;
  fileIndex: number;
  totalFiles: number;
  pageIndex?: number;
  totalPages?: number;
  extractedCharacters?: number;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function AdminReferenceBulkUpload({
  onUploadDone,
}: { onUploadDone?: () => void } = {}) {
  const [queue, setQueue] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState<FileProgress | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: File[]) {
    const valid = incoming.filter(
      (f) =>
        (f.type === "application/pdf" ||
          f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          f.type === "text/plain") &&
        f.size <= 50 * 1024 * 1024,
    );
    setQueue((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !names.has(f.name))];
    });
  }

  function removeFile(name: string) {
    setQueue((prev) => prev.filter((f) => f.name !== name));
  }

  function reset() {
    setQueue([]);
    setResults([]);
    setErrors([]);
    setDoneMessage(null);
    setProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    if (queue.length === 0 || isUploading) return;

    setIsUploading(true);
    setResults([]);
    setErrors([]);
    setDoneMessage(null);
    setProgress(null);

    try {
      const formData = new FormData();
      queue.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/admin/reference-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let data: { error?: { code?: string; message?: string } } | null = null;
        try { data = await response.json(); } catch { data = null; }
        const message =
          data?.error?.code === "STORAGE_TRANSFER_FAILED"
            ? "Erreur de stockage système."
            : data?.error?.message || "Upload échoué";
        setErrors([{ fileName: "Upload", error: message }]);
        return;
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffered = "";

        const parseChunk = (chunk: string) => {
          buffered += chunk;
          let sep = buffered.indexOf("\n\n");
          while (sep !== -1) {
            const raw = buffered.slice(0, sep).trim();
            buffered = buffered.slice(sep + 2);

            let eventName = "message";
            const dataLines: string[] = [];
            raw.split("\n").forEach((line) => {
              if (line.startsWith("event:")) { eventName = line.slice(6).trim(); return; }
              if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
            });

            if (dataLines.length === 0) { sep = buffered.indexOf("\n\n"); continue; }

            try {
              const payload = JSON.parse(dataLines.join("\n"));
              if (eventName === "file-start" || eventName === "page-progress") {
                setProgress({
                  fileName: payload.fileName,
                  fileIndex: payload.fileIndex,
                  totalFiles: payload.totalFiles,
                  pageIndex: payload.pageIndex,
                  totalPages: payload.totalPages,
                  extractedCharacters: payload.extractedCharacters,
                });
              }
              if (eventName === "file-complete") {
                setResults((prev) => [...prev, payload]);
              }
              if (eventName === "file-error") {
                setErrors((prev) => [...prev, payload]);
              }
              if (eventName === "done") {
                setResults(payload.uploads || []);
                setErrors(payload.errors || []);
                setDoneMessage(payload.message || null);
                setProgress(null);
                if ((payload.uploads || []).length > 0) onUploadDone?.();
              }
              if (eventName === "fatal") {
                setErrors([{ fileName: "Upload", error: payload.error?.message || "Erreur fatale" }]);
                setProgress(null);
              }
            } catch { /* ignore parse errors */ }

            sep = buffered.indexOf("\n\n");
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          parseChunk(decoder.decode(value, { stream: true }));
        }
        parseChunk(decoder.decode());
      } else {
        const data = await response.json();
        setResults(data.uploads || []);
        setErrors(data.errors || []);
        if ((data.uploads || []).length > 0) {
          setDoneMessage("Documents importés avec succès.");
          onUploadDone?.();
        }
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setErrors([{ fileName: "Réseau", error: err instanceof Error ? err.message : "Erreur réseau" }]);
    } finally {
      setIsUploading(false);
    }
  }

  const isDone = !isUploading && (results.length > 0 || errors.length > 0);

  return (
    <div className="space-y-4">
      {/* Drop zone — masquée pendant l'upload ou après */}
      {!isUploading && !isDone && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed px-8 py-10 text-center transition-colors ${
            isDragOver
              ? "border-[#7b2438] bg-[#f6e7ea]"
              : "border-[#7b2438]/30 bg-white hover:border-[#7b2438]/55 hover:bg-[#fdf8f5]"
          }`}
        >
          <Upload className="mx-auto mb-3 h-10 w-10 text-[#7b2438]/40" />
          <p className="text-sm font-semibold text-[#7b2438]">
            Glissez-déposez vos fichiers ici ou cliquez pour parcourir
          </p>
          <p className="mt-1 text-xs text-[#6c5448]">
            PDF, DOCX ou TXT · Max 50 Mo par fichier · Plusieurs fichiers acceptés
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={(e) => addFiles(Array.from(e.target.files || []))}
            className="hidden"
          />
        </div>
      )}

      {/* File queue */}
      {queue.length > 0 && !isUploading && !isDone && (
        <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "rgba(123,36,56,0.12)" }}>
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "rgba(123,36,56,0.10)", background: "rgba(123,36,56,0.03)" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>
              {queue.length} fichier{queue.length > 1 ? "s" : ""} sélectionné{queue.length > 1 ? "s" : ""}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold"
              style={{ color: "var(--primary)" }}
            >
              + Ajouter
            </button>
          </div>
          <ul className="divide-y" style={{ borderColor: "rgba(123,36,56,0.07)" }}>
            {queue.map((file) => (
              <li key={file.name} className="flex items-center gap-3 px-4 py-3">
                <FileText className="h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {file.name}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-soft)" }}>
                    {formatSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.name)}
                  className="shrink-0 rounded-lg p-1 transition hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5 text-red-400" />
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t px-4 py-3" style={{ borderColor: "rgba(123,36,56,0.10)" }}>
            <button
              type="button"
              onClick={handleUpload}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition"
              style={{ background: "var(--primary)" }}
            >
              <Upload className="h-4 w-4" />
              Importer {queue.length} fichier{queue.length > 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      {isUploading && (
        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "rgba(123,36,56,0.12)" }}>
          <div className="mb-3 flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#7b2438]/20 border-t-[#7b2438]" />
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Indexation en cours...
            </p>
          </div>

          {/* Per-file progress bars */}
          <div className="space-y-2">
            {queue.map((file, idx) => {
              const isCurrent = progress?.fileName === file.name;
              const isDoneFile = results.some((r) => r.fileName === file.name);
              const isError = errors.some((e) => e.fileName === file.name);
              const fileIdx = idx + 1;
              const currentFileIdx = progress?.fileIndex ?? 0;

              let pct = 0;
              if (isDoneFile || isError) pct = 100;
              else if (isCurrent && progress?.totalPages) {
                pct = Math.round(((progress.pageIndex ?? 0) / progress.totalPages) * 100);
              } else if (fileIdx < currentFileIdx) pct = 100;

              return (
                <div key={file.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="truncate text-xs font-medium" style={{ color: "var(--foreground)", maxWidth: "70%" }}>
                      {file.name}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-soft)" }}>
                      {isDoneFile ? "✓ Importé" : isError ? "✗ Erreur" : isCurrent ? `${pct}%` : fileIdx < currentFileIdx ? "✓" : "En attente"}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(123,36,56,0.08)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        background: isError ? "#b91c1c" : isDoneFile || fileIdx < currentFileIdx ? "#16a34a" : "var(--primary)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {progress?.extractedCharacters !== undefined && (
            <p className="mt-2 text-[11px]" style={{ color: "var(--text-soft)" }}>
              {progress.extractedCharacters.toLocaleString()} caractères extraits
              {progress.totalPages ? ` · Page ${progress.pageIndex ?? 0}/${progress.totalPages}` : ""}
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {isDone && (
        <div className="space-y-3">
          {doneMessage && (
            <div className="rounded-xl border-2 border-[#7b2438]/25 bg-[#f6e7ea] px-4 py-3 text-sm font-semibold text-[#7b2438]">
              {doneMessage}
            </div>
          )}

          {results.length > 0 && (
            <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "rgba(22,163,74,0.24)" }}>
              <div className="border-b px-4 py-3" style={{ borderColor: "rgba(22,163,74,0.15)", background: "rgba(22,163,74,0.05)" }}>
                <p className="flex items-center gap-2 text-sm font-bold text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  {results.length} document{results.length > 1 ? "s" : ""} importé{results.length > 1 ? "s" : ""}
                </p>
              </div>
              <ul className="divide-y divide-green-100">
                {results.map((r, i) => (
                  <li key={i} className="px-4 py-3">
                    <p className="text-sm font-semibold text-[#2b1d16]">{r.fileName}</p>
                    {r.subjectLabel && (
                      <p className="mt-0.5 text-xs text-[#4f3a30]">
                        <span className="font-semibold text-[#7b2438]">Sujet :</span> {r.subjectLabel}
                      </p>
                    )}
                    {r.techStack && r.techStack.length > 0 && (
                      <p className="mt-0.5 text-xs text-[#6c5448]">
                        <span className="font-semibold">Stack :</span> {r.techStack.slice(0, 3).join(" · ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "rgba(220,38,38,0.22)" }}>
              <div className="border-b px-4 py-3" style={{ borderColor: "rgba(220,38,38,0.15)", background: "rgba(220,38,38,0.04)" }}>
                <p className="flex items-center gap-2 text-sm font-bold text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  {errors.length} erreur{errors.length > 1 ? "s" : ""}
                </p>
              </div>
              <ul className="divide-y divide-red-50">
                {errors.map((e, i) => (
                  <li key={i} className="px-4 py-3">
                    <p className="text-sm font-semibold text-[#2b1d16]">{e.fileName}</p>
                    <p className="mt-0.5 text-xs text-red-700">{e.error}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={reset}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition hover:opacity-80"
            style={{ borderColor: "rgba(123,36,56,0.22)", color: "var(--primary)" }}
          >
            Importer d'autres fichiers
          </button>
        </div>
      )}
    </div>
  );
}
