import { describe, expect, it } from "vitest";
import { extractCoverMetadata } from "@/server/analysis/cover-extractor";
import { analyzeTheme } from "@/server/analysis/themeanalysor";

describe("extractCoverMetadata", () => {
  it("extracts the real theme and not institutional header blocks", () => {
    const text = `UNIVERSITE JOSEPH KI-ZERBO
(UJKZ)
********
INSTITUT BURKINABE DES
ARTS ET METIERS
(IBAM)
RAPPORT DE STAGE POUR L'OBTENTION DE LA LICENCE
PROFESSIONNELLE
OPTION : Méthodes Informatiques Appliquées à la Gestion (MIAGE)
THEME : ANALYSE ET DEVELOPPEMENT D'UNE
PLATEFORME MOBILE POUR LA GESTION DES
RENDEZ-VOUS DANS LES FORMATIONS SANITAIRES AU
BURKINA
FASO
T
Présenté par BANDE Hamidou
Maître de stageDirecteur de Mémoire
Mr Pascal KABOREDr Yamba DABONE
Ingénieur de Conception en Génie LogicielEnseignant-Chercheur en Informatique à
Ministère de la Santél'IBAM
Période de stage : 1er Juillet au 30 Septembre 2025
Année Académique 2024-202`;

    const result = extractCoverMetadata(text);

    expect(result.subjectLabel).toContain("ANALYSE ET DEVELOPPEMENT");
    expect(result.subjectLabel).toContain("BURKINA FASO");
    expect(result.subjectLabel).not.toContain(
      "OBTENTION DE LA LICENCE PROFESSIONNELLE",
    );
  });

  it("extracts THEME block and does not fall back to SOMMAIRE", () => {
    const text = `UNIVERSITE JOSEPH KI-ZERBO
(UJKZ)
******
INSTITUT BURKINABE DES ARTS ET METIERS
(IBAM)
RAPPORT DE STAGE POUR L'OBTENTION DE LA LICENCE
PROFESSIONNELLE
OPTION : Méthodes Informatiques Appliquées à la Gestion (MIAGE)
THEME :
MISE EN PLACE D'UN OUTIL DE PROSPECTION MOBILE ET
CRM POUR L'ANALYSE GEOMARKETING ET L'EXPLOITATION
DES DONNEES COMMERCIALES
Présenté par KOURA Lémiyi Stéphane Ulrich
Maitre de stage :Directeur du rapport :
M. ZOUNDI RelwendéDr KONE Lydie
Directeur de Kuilinga TechnologiesEnseignante chercheuse
en informatique l'IBAM
Période de stage : du 01/07/2025 au 30/09/2025
Année académique : 2024-2025RAPPORT DE STAGE
LICENCE MIAGE
SOMMAIRE
SOMMAIRE .....................................................................................................................................i
DEDICACES .................................................................................................................................. ii`;

    const result = extractCoverMetadata(text);

    expect(result.subjectLabel).toContain(
      "MISE EN PLACE D'UN OUTIL DE PROSPECTION MOBILE",
    );
    expect(result.subjectLabel).toContain("DONNEES COMMERCIALES");
    expect(result.subjectLabel).not.toContain("SOMMAIRE");
  });

  it("does not fall back to remerciements as theme", () => {
    const text = `UNIVERSITE JOSEPH KI-ZERBO
(UJKZ)
INSTITUT BURKINABE DES ARTS ET METIERS
(IBAM)
RAPPORT DE STAGE POUR L'OBTENTION DE LA LICENCE PROFESSIONNELLE
OPTION : Méthodes Informatiques Appliquées à la Gestion (MIAGE)
THEME :
MISE EN PLACE D'UN OUTIL DE PROSPECTION MOBILE ET CRM
Présenté par KOURA Lémiyi Stéphane Ulrich
Période de stage : du 01/07/2025 au 30/09/2025
Année académique : 2024-2025
REMERCIEMENTS ......................................................................................
REMERCIEMENTS ...................................................................................... i
DEDICACES ............................................................................................ ii`;

    const result = extractCoverMetadata(text);

    expect(result.subjectLabel).toContain(
      "MISE EN PLACE D'UN OUTIL DE PROSPECTION MOBILE ET CRM",
    );
    expect(result.subjectLabel).not.toContain("REMERCIEMENTS");
  });

  it("stops before list headings and does not capture them as theme", () => {
    const text = `UNIVERSITE JOSEPH KI-ZERBO
(UJKZ)
INSTITUT BURKINABE DES ARTS ET METIERS
(IBAM)
RAPPORT DE STAGE POUR L'OBTENTION DE LA LICENCE PROFESSIONNELLE
OPTION : Méthodes Informatiques Appliquées à la Gestion (MIAGE)
THEME :
MISE EN PLACE D'UN OUTIL DE PROSPECTION MOBILE ET CRM
Présenté par KOURA Lémiyi Stéphane Ulrich
Période de stage : du 01/07/2025 au 30/09/2025
Année académique : 2024-2025
LISTE DES TABLEAUX .............................................................................
LISTE DES FIGURES ...............................................................................
SOMMAIRE ............................................................................................
REMERCIEMENTS ...................................................................................`;

    const result = extractCoverMetadata(text);

    expect(result.subjectLabel).toContain(
      "MISE EN PLACE D'UN OUTIL DE PROSPECTION MOBILE ET CRM",
    );
    expect(result.subjectLabel).not.toContain("LISTE DES TABLEAUX");
    expect(result.subjectLabel).not.toContain("SOMMAIRE");
  });

  it("analyzeTheme also extracts the cover subject before presenté par", () => {
    const text = `UNIVERSITE JOSEPH KI-ZERBO
(UJKZ)
INSTITUT BURKINABE DES ARTS ET METIERS
(IBAM)
RAPPORT DE STAGE POUR L'OBTENTION DE LA LICENCE PROFESSIONNELLE
OPTION : Méthodes Informatiques Appliquées à la Gestion (MIAGE)
THEME :
MISE EN PLACE D'UN OUTIL DE PROSPECTION MOBILE ET CRM
Présenté par KOURA Lémiyi Stéphane Ulrich
Période de stage : du 01/07/2025 au 30/09/2025
Année académique : 2024-2025
LISTE DES TABLEAUX .............................................................................
REMERCIEMENTS ...................................................................................`;

    const result = analyzeTheme({ name: "sample.pdf", content: text });

    expect(result.subjectLabel).toContain(
      "MISE EN PLACE D'UN OUTIL DE PROSPECTION MOBILE ET CRM",
    );
    expect(result.subjectLabel).not.toContain("LISTE DES TABLEAUX");
    expect(result.subjectLabel).not.toContain("REMERCIEMENTS");
  });

  it("uses only the text between THEME and Présenté par", () => {
    const text = `THEME :
STRUCTURES FORMATION D'ACCUEIL
Présenté par KOURA Lémiyi Stéphane Ulrich`;

    const cover = extractCoverMetadata(text);
    const profile = analyzeTheme({ name: "sample.pdf", content: text });

    expect(cover.subjectLabel).toContain("STRUCTURES FORMATION D'ACCUEIL");
    expect(profile.subjectLabel).toContain("STRUCTURES FORMATION D'ACCUEIL");
  });

  it("extracts SUJET when THEME is absent", () => {
    const text = `UNIVERSITE JOSEPH KI-ZERBO
(UJKZ)
INSTITUT BURKINABE DES ARTS ET METIERS
(IBAM)
SUJET :
ANALYSE DU SYSTEME D'INFORMATION POUR LES RESSOURCES HUMAINES
Présenté par SANOGO Mariam`;

    const cover = extractCoverMetadata(text);
    expect(cover.subjectLabel).toContain("ANALYSE DU SYSTEME D'INFORMATION");
    expect(cover.subjectLabel).not.toContain("UJKZ");
  });

  it("extracts TITRE when THEME and SUJET are absent", () => {
    const text = `UNIVERSITE JOSEPH KI-ZERBO
(UJKZ)
TITRE :
DEVELOPPEMENT D'UNE APPLICATION WEB POUR LA GESTION BANCAIRE
Par OUEDRAOGO Jean`;

    const cover = extractCoverMetadata(text);
    expect(cover.subjectLabel).toContain("DEVELOPPEMENT D'UNE APPLICATION WEB");
  });

  it("rejects generic candidates like 'structures formation d'accueil' when no cover subject found", () => {
    const text = `Chapitre 1 : Introduction
Structures formation d'accueil. Les structures suivantes offrent une formation.
Nous avons travaillé avec les structures formation d'accueil pour développer.
structures formation d'accueil est importante pour.`;

    const profile = analyzeTheme({ name: "sample.pdf", content: text });
    // Should NOT be "structures formation d'accueil" but rather something with more meaning
    expect(profile.subjectLabel).not.toEqual("structures formation d'accueil");
  });

  it("removes 'Suivant' and other PDF navigation words from extracted theme", () => {
    const text = `UNIVERSITE JOSEPH KI-ZERBO
INSTITUT BURKINABE DES ARTS ET METIERS
THEME : Suivant : DEVELOPPEMENT D'UNE APPLICATION MOBILE
Présenté par KOURA Lémiyi Stéphane`;

    const cover = extractCoverMetadata(text);
    const profile = analyzeTheme({ name: "sample.pdf", content: text });

    // Should NOT contain "Suivant"
    expect(cover.subjectLabel).not.toContain("Suivant");
    expect(profile.subjectLabel).not.toContain("Suivant");
    // But should contain the actual theme
    expect(cover.subjectLabel).toContain("DEVELOPPEMENT");
    expect(profile.subjectLabel).toContain("DEVELOPPEMENT");
  });

  it("strips IBAM institutional residue from theme", () => {
    const text = `THEME : OPTION : MIAGE - ANALYSE DE SYSTEME D'INFORMATION
Présenté par KOURA Lémiyi`;

    const cover = extractCoverMetadata(text);

    // Should NOT contain "OPTION : MIAGE"
    expect(cover.subjectLabel).not.toContain("OPTION");
    expect(cover.subjectLabel).not.toContain("MIAGE");
    // But should contain the actual theme
    expect(cover.subjectLabel).toContain("ANALYSE");
  });
});
