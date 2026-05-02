import { describe, expect, it } from "vitest";

import { analyzePlagiarism } from "@/server/analysis/plagiadetectoralgo";

describe("plagiat-detector", () => {
  it("detects exact copy with very high combined score", async () => {
    const text = `
La transformation numérique des administrations publiques exige une gouvernance claire.
Elle impose aussi une documentation rigoureuse des processus et des responsabilités.
Par conséquent, chaque service doit tracer ses décisions et ses résultats.
`;

    const scores = await analyzePlagiarism(text, text);
    expect(scores.combined).toBeGreaterThan(0.8);
  });

  it("detects reformulation with strong ngram and winnowing", async () => {
    const textA = `
Le projet analyse les flux de données entre les services académiques.
Il décrit la collecte, la validation et le stockage des informations.
Enfin, il propose une architecture claire pour automatiser le suivi.
`;
    const textB = `
Le projet analyse les flux de données dans les services académiques.
Il décrit la collecte, la validation et le stockage des informations.
Enfin, il propose une architecture claire pour automatiser le suivi.
`;

    const scores = await analyzePlagiarism(textA, textB);
    expect(scores.ngram).toBeGreaterThan(0.4);
    expect(scores.winnowing).toBeGreaterThan(0.3);
  });

  it("penalizes paragraph reordering in winnowing vs cosine", async () => {
    const textA = `
Chapitre un: le cadre théorique présente les définitions et les principes.

Chapitre deux: la méthodologie décrit l'échantillonnage, les outils et le protocole.
`;
    const textB = `
Chapitre deux: la méthodologie décrit l'échantillonnage, les outils et le protocole.

Chapitre un: le cadre théorique présente les définitions et les principes.
`;

    const scores = await analyzePlagiarism(textA, textB);
    expect(scores.winnowing).toBeLessThan(scores.cosine);
  });

  it("detects surgical plagiarism with high lcs score", async () => {
    const textA =
      "L'etude presente une methode robuste de classification pour des corpus multilingues en contexte academique.";
    const textB =
      "L'etude presente une methode de classification robuste pour corpus multilingues en contexte academique.";

    const scores = await analyzePlagiarism(textA, textB);
    expect(scores.lcs).toBeGreaterThan(0.6);
  });

  it("returns low score for unrelated texts", async () => {
    const textA =
      "Le protocole reseau optimise la latence des paquets dans une topologie maillage.";
    const textB =
      "La cuisine locale valorise la fermentation du sorgho pour des recettes traditionnelles.";

    const scores = await analyzePlagiarism(textA, textB);
    expect(scores.combined).toBeLessThan(0.15);
  });

  it("detects paraphrase by style while lexical overlap remains low", async () => {
    const textA = `
Cependant, l'analyse demeure structurée: elle expose le contexte, puis les limites.
En effet, chaque section précise une hypothèse; ensuite, elle justifie un choix.
Enfin, la conclusion résume les effets, puis ouvre une perspective.
`;
    const textB = `
Cependant, l'examen reste ordonné: il présente la situation, puis les contraintes.
En effet, chaque partie formule une supposition; ensuite, elle motive une décision.
Enfin, la synthèse résume les impacts, puis ouvre une piste.
`;

    const scores = await analyzePlagiarism(textA, textB);
    expect(scores.style).toBeGreaterThan(0.6);
    expect(scores.cosine).toBeLessThan(0.3);
  });

  it("returns zeroed scores for empty text", async () => {
    const scores = await analyzePlagiarism("", "");
    expect(scores.cosine).toBe(0);
    expect(scores.jaccard).toBe(0);
    expect(scores.ngram).toBe(0);
    expect(scores.winnowing).toBe(0);
    expect(scores.lcs).toBe(0);
    expect(scores.style).toBe(0);
    expect(scores.simhash).toBe(0);
    expect(scores.combined).toBe(0);
    expect(scores.riskLevel).toBe("low");
  });
});
