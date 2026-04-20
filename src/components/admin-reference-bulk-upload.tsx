"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface UploadResult {
  fileName: string;
  documentId: string;
  dominantTheme?: string;
  topKeywords?: string[];
  excludedRatio?: number;
  warning?: string;
}

interface UploadError {
  fileName: string;
  error: string;
}

interface UploadProgress {
  fileName?: string;
  fileIndex?: number;
  totalFiles?: number;
  pageIndex?: number;
  totalPages?: number;
  extractedCharacters?: number;
  message?: string;
}

export function AdminReferenceBulkUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setResults([]);
    setErrors([]);
    setNotice(null);
    setProgress(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/admin/reference-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let data: any = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }
        console.error("Upload failed:", data);
        const message =
          data.error?.code === "STORAGE_TRANSFER_FAILED"
            ? "Erreur de stockage système : Espace disque insuffisant ou partitions incompatibles sur le serveur Handal."
            : data.error?.message || "Upload failed";
        setErrors([
          {
            fileName: "Bulk upload",
            error: message,
          },
        ]);
        return;
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffered = "";

        const parseChunk = (chunk: string) => {
          buffered += chunk;

          let separatorIndex = buffered.indexOf("\n\n");
          while (separatorIndex !== -1) {
            const rawEvent = buffered.slice(0, separatorIndex).trim();
            buffered = buffered.slice(separatorIndex + 2);

            let eventName = "message";
            const dataLines: string[] = [];

            rawEvent.split("\n").forEach((line) => {
              if (line.startsWith("event:")) {
                eventName = line.slice(6).trim();
                return;
              }
              if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).trim());
              }
            });

            if (dataLines.length === 0) {
              separatorIndex = buffered.indexOf("\n\n");
              continue;
            }

            try {
              const payload = JSON.parse(dataLines.join("\n"));

              if (eventName === "start") {
                setNotice(payload.message || null);
              }

              if (eventName === "file-start") {
                setProgress({
                  fileName: payload.fileName,
                  fileIndex: payload.fileIndex,
                  totalFiles: payload.totalFiles,
                });
              }

              if (eventName === "page-progress") {
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
                setResults((current) => [...current, payload]);
              }

              if (eventName === "file-error") {
                setErrors((current) => [...current, payload]);
              }

              if (eventName === "done") {
                setResults(payload.uploads || []);
                setErrors(payload.errors || []);
                if ((payload.uploads || []).length > 0) {
                  setNotice(payload.message || null);
                }
                setProgress(null);
              }

              if (eventName === "fatal") {
                setErrors([
                  {
                    fileName: "Bulk upload",
                    error: payload.error?.message || "Upload failed",
                  },
                ]);
                setProgress(null);
              }
            } catch (error) {
              console.error("Failed to parse upload event", error);
            }

            separatorIndex = buffered.indexOf("\n\n");
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
          setNotice(
            "Document ajouté à la bibliothèque de référence Handal avec succès.",
          );
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      setErrors([
        {
          fileName: "Network",
          error: error instanceof Error ? error.message : "Network error",
        },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f3] to-[#f5f1e8] px-6 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header with Handal Logo */}
        <div className="mb-8 flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm">
          <Image
            src="/brand/handal-lamp.png"
            alt="Handal"
            width={48}
            height={48}
            className="h-12 w-auto object-contain"
            style={{ height: "auto" }}
          />
          <div>
            <h1 className="text-3xl font-black uppercase tracking-wider text-[#7b2438]">
              Base de Référence
            </h1>
            <p className="text-sm text-gray-600">
              Importez les mémoires des années précédentes pour enrichir
              l'algorithme Handal
            </p>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-6 rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-colors ${
            isDragOver
              ? "border-[#7b2438] bg-[#7b2438]/5"
              : "border-[#7b2438]/30 bg-white hover:border-[#7b2438]/50"
          }`}
        >
          <div className="mb-4 flex justify-center">
            <svg
              className="h-16 w-16 text-[#7b2438]/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <p className="mb-2 text-lg font-semibold text-[#7b2438]">
            Glissez-déposez vos fichiers PDF ici
          </p>
          <p className="mb-4 text-sm text-gray-600">
            ou cliquez pour parcourir votre ordinateur
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-[#7b2438] px-6 py-2 font-bold text-white transition-all hover:bg-[#5f1b2a] active:scale-95"
          >
            Sélectionner des fichiers
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="mt-3 text-xs text-gray-500">
            PDF, DOCX ou TXT · Maximum 50 MB par fichier
          </p>
        </div>

        {/* Upload Progress / Results */}
        {notice && (
          <div className="mb-6 rounded-2xl border-2 border-[#631926]/30 bg-[#f6e7ea] px-5 py-4 text-sm font-semibold text-[#631926]">
            {notice}
          </div>
        )}

        {isUploading && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7b2438]/20 border-t-[#7b2438]" />
              <div>
                <p className="font-semibold text-gray-700">
                  Indexation en cours...
                </p>
                {progress?.fileName && (
                  <p className="text-sm text-gray-500">
                    Document [{progress.fileName}]
                    {progress.fileIndex && progress.totalFiles
                      ? ` · ${progress.fileIndex}/${progress.totalFiles}`
                      : ""}
                    {progress.pageIndex && progress.totalPages
                      ? ` · Page ${progress.pageIndex}/${progress.totalPages}`
                      : ""}
                  </p>
                )}
                {progress?.extractedCharacters !== undefined && (
                  <p className="text-xs text-gray-500">
                    {progress.extractedCharacters.toLocaleString()} caractères extraits
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Results */}
        {results.length > 0 && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#7b2438]">
              ✓ {results.length} document{results.length > 1 ? "s" : ""} importé
              {results.length > 1 ? "s" : ""}
            </h2>
            <div className="space-y-2">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-green-50 p-3 border-l-4 border-green-500"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800">{result.fileName}</p>
                    <p className="text-xs text-gray-500">
                      ID: {result.documentId.slice(0, 8)}...
                    </p>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-green-700">
                    ✓ Indexé comme référence Handal
                  </p>
                  {result.dominantTheme && result.dominantTheme !== "indéterminé" && (
                    <p className="mt-0.5 text-xs text-gray-600">
                      <span className="font-semibold">Thème :</span>{" "}
                      {result.dominantTheme}
                    </p>
                  )}
                  {result.topKeywords && result.topKeywords.length > 0 && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {result.topKeywords.join(" · ")}
                    </p>
                  )}
                  {result.excludedRatio !== undefined && result.excludedRatio > 5 && (
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {result.excludedRatio}% de contenu institutionnel exclu de l’index
                    </p>
                  )}
                  {result.warning && (
                    <p className="mt-0.5 text-xs text-yellow-700">{result.warning}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Results */}
        {errors.length > 0 && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-red-700">
              ✗ {errors.length} erreur{errors.length > 1 ? "s" : ""}
            </h2>
            <div className="space-y-2">
              {errors.map((error, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-red-50 p-3 border-l-4 border-red-500"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {error.fileName}
                    </p>
                    <p className="text-sm text-red-700">{error.error}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {(results.length > 0 || errors.length > 0) && (
          <div className="rounded-2xl bg-[#7b2438]/5 p-4 text-center">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-[#7b2438]">
                {results.length} succès
              </span>{" "}
              |{" "}
              <span className="font-bold text-red-700">
                {errors.length} erreur{errors.length !== 1 ? "s" : ""}
              </span>
            </p>
            <button
              onClick={() => {
                setResults([]);
                setErrors([]);
              }}
              className="mt-3 text-sm font-semibold text-[#7b2438] hover:underline"
            >
              Importer d'autres fichiers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
