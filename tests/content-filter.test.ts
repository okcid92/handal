import { describe, expect, it } from "vitest";

import {
  filterInstitutionalContent,
  skipChapterOne,
} from "@/server/analysis/content-filter";

describe("content-filter", () => {
  it("skips chapter one when chapter two marker is present", () => {
    const text = `
CHAPITRE I : PRESENTATION DES STRUCTURES DE FORMATION ET D'ACCUEIL
IBAM UJKZ organigramme historique mission

CHAPITRE II : ANALYSE ET CONCEPTION
Ce chapitre présente l'architecture technique et la modélisation UML.
`;

    const result = skipChapterOne(text);

    expect(result).toContain("CHAPITRE II : ANALYSE ET CONCEPTION");
    expect(result).not.toContain("PRESENTATION DES STRUCTURES");
  });

  it("keeps text unchanged when no chapter two marker is found", () => {
    const text = "Texte court sans marqueur de chapitre.";

    const result = skipChapterOne(text);

    expect(result).toBe(text);
  });

  it("applies chapter-one skipping inside filterInstitutionalContent", () => {
    const text = `
CHAPITRE 1 : PRESENTATION DES STRUCTURES DE FORMATION ET D'ACCUEIL
Institut Burkinabe des Arts et Metiers.

CHAPITRE 2 : ETUDE PREALABLE ET CONCEPTION
Nous avons développé une application web avec API et base de données.
Cette section décrit les cas d'utilisation et la conception logicielle.
`;

    const result = filterInstitutionalContent(text);

    expect(result.filteredContent).toContain("CHAPITRE 2");
    expect(result.filteredContent).not.toContain("PRESENTATION DES STRUCTURES");
  });
});
