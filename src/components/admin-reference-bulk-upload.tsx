"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface UploadResult {
  fileName: string;
  documentId: string;
  similarity?: number;
  riskLevel?: string;
  warning?: string;
}

interface UploadError {
  fileName: string;
  error: string;
}

export function AdminReferenceBulkUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
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

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/admin/reference-docs", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Upload failed:", data);
        setErrors([
          {
            fileName: "Bulk upload",
            error: data.error?.message || "Upload failed",
          },
        ]);
        return;
      }

      setResults(data.uploads || []);
      setErrors(data.errors || []);

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
        {isUploading && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7b2438]/20 border-t-[#7b2438]" />
              <p className="font-semibold text-gray-700">
                Importation en cours...
              </p>
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
                  className="flex items-center justify-between rounded-lg bg-green-50 p-3 border-l-4 border-green-500"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {result.fileName}
                    </p>
                    {result.similarity !== undefined && (
                      <p className="text-sm text-gray-600">
                        Similarité: {result.similarity}% · Niveau de risque:{" "}
                        {result.riskLevel}
                      </p>
                    )}
                    {result.warning && (
                      <p className="text-sm text-yellow-700">
                        {result.warning}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    ID: {result.documentId.slice(0, 8)}...
                  </p>
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
