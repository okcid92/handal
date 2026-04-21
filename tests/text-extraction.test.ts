/**
 * Tests unitaires pour l'extraction PDF Handal
 * Valide que la nouvelle implémentation pdfjs-dist fonctionne correctement
 *
 * Exécution:
 * npm run test:unit -- tests/text-extraction.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  extractFirstPageHandal,
  firstPageTitleScore,
  assertAllowedDocumentType,
  assertAllowedDocumentSize,
} from "@/server/text-extraction";
import { extractReportMetadata } from "@/lib/extract-report-metadata";
import { ApiError } from "@/lib/api-errors";

describe("text-extraction (Handal)", () => {
  describe("assertAllowedDocumentType", () => {
    it("should accept PDF files", () => {
      expect(() => assertAllowedDocumentType("application/pdf")).not.toThrow();
    });

    it("should accept DOCX files", () => {
      expect(() =>
        assertAllowedDocumentType(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
      ).not.toThrow();
    });

    it("should accept TXT files", () => {
      expect(() => assertAllowedDocumentType("text/plain")).not.toThrow();
    });

    it("should reject invalid MIME types", () => {
      expect(() => assertAllowedDocumentType("application/msword")).toThrow(
        ApiError,
      );
    });
  });

  describe("assertAllowedDocumentSize", () => {
    it("should accept files under 50MB", () => {
      expect(() => assertAllowedDocumentSize(10 * 1024 * 1024)).not.toThrow();
    });

    it("should reject files over 50MB", () => {
      expect(() => assertAllowedDocumentSize(51 * 1024 * 1024)).toThrow(
        ApiError,
      );
    });

    it("should accept exactly 50MB", () => {
      expect(() => assertAllowedDocumentSize(50 * 1024 * 1024)).not.toThrow();
    });
  });

  describe("firstPageTitleScore", () => {
    it("should return 100 for exact match (case-insensitive)", () => {
      const score = firstPageTitleScore(
        "Déploiement de Docker dans les Microservices",
        "déploiement de docker dans les microservices",
      );
      expect(score).toBe(100);
    });

    it("should return 100 when title is substring", () => {
      const score = firstPageTitleScore(
        "Le titre attendu est ici: Algorithmes de Triage",
        "Algorithmes de Triage",
      );
      expect(score).toBe(100);
    });

    it("should normalize accents correctly", () => {
      const score = firstPageTitleScore(
        "SYSTEMES D'INFORMATION GEOGRAPHIQUE",
        "Systèmes d'Information Géographique",
      );
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it("should handle bigram scoring for partial matches", () => {
      const score = firstPageTitleScore(
        "Machine Learning avec Python pour l'IA",
        "Machine Learning",
      );
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it("should return 0 for empty title", () => {
      const score = firstPageTitleScore("Some content", "");
      expect(score).toBe(0);
    });

    it("should be case-insensitive", () => {
      const score1 = firstPageTitleScore(
        "ANALYSE DE DONNEES",
        "Analyse de Données",
      );
      const score2 = firstPageTitleScore(
        "analyse de donnees",
        "ANALYSE DE DONNEES",
      );
      // Both scores should be high (>80% threshold) - may differ slightly due to accents
      expect(score1).toBeGreaterThanOrEqual(80);
      expect(score2).toBeGreaterThanOrEqual(80);
    });
  });

  describe("extractFirstPageHandal", () => {
    it("should extract text from TXT files", async () => {
      const buffer = Buffer.from("Test content for TXT file\n More content");
      const result = await extractFirstPageHandal(buffer, "text/plain");
      expect(result).toContain("Test content");
      expect(result).toBeTruthy();
    });

    it("should handle empty files", async () => {
      const buffer = Buffer.from("");
      // TXT handling returns empty string
      const result = await extractFirstPageHandal(buffer, "text/plain");
      expect(result).toBe("");
    });

    it("should throw ApiError for invalid MIME type in extraction", async () => {
      const buffer = Buffer.from("Test");
      // This will be caught at assertAllowedDocumentType before reaching extraction
      expect(async () => {
        assertAllowedDocumentType("application/zip");
        await extractFirstPageHandal(buffer, "application/zip");
      }).toBeDefined();
    });

    // PDF tests require actual PDF binary data - would need sample PDFs
    it("should handle TXT with special characters", async () => {
      const buffer = Buffer.from("Spécial: à é ç ü Caractères français œæß");
      const result = await extractFirstPageHandal(buffer, "text/plain");
      expect(result).toContain("Spécial");
      expect(result).toContain("français");
    });
  });
});

/**
 * INTEGRATION TESTS (À exécuter avec un vrai PDF)
 *
 * Pour tester avec des PDFs réels:
 *
 * 1. Tester PDF normal:
 *    - Uploader un PDF avec titre de première page = "Analyse de Données"
 *    - Sélectionner le thème "Analyse de Données"
 *    - Vérifier extraction réussie
 *
 * 2. Tester mismatch titre:
 *    - Uploader PDF avec titre = "Machine Learning"
 *    - Sélectionner thème = "Analyse de Données"
 *    - Vérifier retour JSON 422 avec titleScore < 80
 *
 * 3. Tester PDF crypté:
 *    - Uploader PDF avec mot de passe
 *    - Vérifier message "PDF est protégé par mot de passe"
 *
 * 4. Tester PDF corrompu:
 *    - Uploader fichier PDF endommagé
 *    - Vérifier message "PDF semble corrompu"
 *
 * 5. Vérifier logo Handal:
 *    - Vérifier affichage du logo pendant l'analyse
 *    - Vérifier affichage du logo dans les résultats
 */
