/**
 * EXTRACTION DE THÈME & COMPARAISON THÉMATIQUE
 *
 * Algorithme : TF-IDF Keyword Extraction + TextRank-inspired Scoring
 *              + Thematic Cosine Similarity
 *
 * Pipeline en deux phases :
 *   Phase 1 — analyzeTheme(doc)   → extrait et stocke la signature thématique
 *   Phase 2 — compareThemes(a, b) → compare deux signatures, retourne un rapport
 */

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface RawDocument {
  name: string;
  content: string;
}

/** Signature thématique produite par analyzeTheme() */
export interface ThemeProfile {
  documentName: string;
  /** Mots-clés extraits avec leur score de pertinence [0, 1] */
  keywords: KeywordScore[];
  /** Thème dominant (label synthétique basé sur les top mots-clés) */
  dominantTheme: string;
  /** Vecteur thématique : map mot → poids TF-IDF × TextRank */
  themeVector: Record<string, number>;
  /** Statistiques du document source */
  stats: DocumentStats;
  /** Timestamp d'analyse (permet la comparaison différée) */
  analyzedAt: Date;
}

export interface KeywordScore {
  word: string;
  /** Score TF-IDF normalisé */
  tfidf: number;
  /** Score de co-occurrence (inspiré TextRank) */
  cooccurrence: number;
  /** Score final combiné */
  score: number;
  /** Nombre d'occurrences brutes */
  frequency: number;
}

export interface DocumentStats {
  totalWords: number;
  uniqueWords: number;
  avgSentenceLength: number;
  lexicalDiversity: number; // uniqueWords / totalWords
}

export interface ThemeComparisonResult {
  documentA: string;
  documentB: string;
  /** Similarité thématique globale [0, 1] */
  thematicSimilarity: number;
  /** Similarité basée sur les mots-clés partagés */
  keywordOverlap: number;
  /** Similarité cosinus sur vecteurs thématiques */
  vectorSimilarity: number;
  /** Mots-clés en commun entre les deux profils */
  sharedKeywords: string[];
  /** Mots-clés exclusifs au document A */
  uniqueToA: string[];
  /** Mots-clés exclusifs au document B */
  uniqueToB: string[];
  /** Niveau de proximité thématique */
  proximityLevel: ProximityLevel;
  /** Interprétation en langage naturel */
  interpretation: string;
}

export type ProximityLevel =
  | "identique"
  | "très proche"
  | "proche"
  | "partiel"
  | "distant"
  | "sans rapport";

// ─────────────────────────────────────────────
// STOP WORDS (français + anglais)
// ─────────────────────────────────────────────

const STOP_WORDS = new Set([
  // Français
  "le","la","les","un","une","des","du","de","da","au","aux",
  "et","ou","ni","mais","donc","or","car","si","que","qui","quoi",
  "dont","où","quand","comment","pourquoi","quel","quelle","quels","quelles",
  "ce","cet","cette","ces","mon","ton","son","ma","ta","sa","notre","votre","leur",
  "mes","tes","ses","nos","vos","leurs","je","tu","il","elle","nous","vous","ils","elles",
  "me","te","se","lui","y","en","on","ne","pas","plus","très","bien","aussi","même",
  "tout","tous","toute","toutes","autre","autres","comme","avec","sans","sous","sur",
  "dans","par","pour","vers","chez","entre","après","avant","pendant","depuis","jusqu",
  "est","sont","être","avoir","fait","faire","peut","peuvent","doit","doivent","va",
  "vont","été","avait","avaient","était","étaient","sera","seront",
  // Anglais
  "the","a","an","and","or","but","if","in","on","at","to","for","of","with",
  "by","from","this","that","these","those","is","are","was","were","be","been",
  "have","has","had","do","does","did","will","would","could","should","may","might",
  "it","its","he","she","they","we","you","i","my","your","his","her","our","their",
  "not","no","so","as","about","into","than","then","there","when","where","which",
  "who","what","how","all","each","both","few","more","most","other","some","such",
]);

// ─────────────────────────────────────────────
// UTILITAIRES TEXTE
// ─────────────────────────────────────────────

function stripHTML(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function normalize(text: string): string {
  return stripHTML(text)
    .toLowerCase()
    .replace(/[^\w\sàâéèêëîïôùûüç]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function splitSentences(text: string): string[] {
  return stripHTML(text)
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ─────────────────────────────────────────────
// ÉTAPE 1 — TF-IDF SUR UN SEUL DOCUMENT
// (variante mono-document : IDF estimé via sous-fenêtres)
// ─────────────────────────────────────────────

/**
 * Calcule le TF-IDF intra-document en découpant le texte
 * en fenêtres de phrases (pseudo-documents).
 * Permet d'identifier les mots importants sans corpus externe.
 */
function computeInternalTFIDF(
  tokens: string[],
  sentences: string[]
): Record<string, number> {
  const N = Math.max(sentences.length, 1);

  // TF global dans le document
  const tf: Record<string, number> = {};
  tokens.forEach((w) => (tf[w] = (tf[w] ?? 0) + 1));

  // DF : dans combien de phrases apparaît chaque mot
  const df: Record<string, number> = {};
  sentences.forEach((sent) => {
    const sentTokens = new Set(tokenize(sent));
    sentTokens.forEach((w) => (df[w] = (df[w] ?? 0) + 1));
  });

  // TF-IDF normalisé
  const tfidfMap: Record<string, number> = {};
  Object.entries(tf).forEach(([word, count]) => {
    const termFreq = count / tokens.length;
    const idf = Math.log(N / ((df[word] ?? 0) + 1) + 1);
    tfidfMap[word] = termFreq * idf;
  });

  return tfidfMap;
}

// ─────────────────────────────────────────────
// ÉTAPE 2 — SCORING DE CO-OCCURRENCE (TEXTRANK-INSPIRED)
// ─────────────────────────────────────────────

/**
 * Construit un graphe de co-occurrence entre mots
 * dans une fenêtre glissante de `windowSize` mots.
 *
 * Un lien entre A et B signifie qu'ils apparaissent
 * souvent ensemble → indice de proximité sémantique.
 *
 * Retourne un score de centralité normalisé [0, 1]
 * pour chaque mot (nombre de co-occurrences uniques).
 */
function computeCooccurrenceScore(
  tokens: string[],
  windowSize = 4
): Record<string, number> {
  const cooc: Record<string, Set<string>> = {};

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    if (!cooc[word]) cooc[word] = new Set();

    for (let j = i + 1; j < Math.min(i + windowSize, tokens.length); j++) {
      const neighbor = tokens[j];
      cooc[word].add(neighbor);
      if (!cooc[neighbor]) cooc[neighbor] = new Set();
      cooc[neighbor].add(word);
    }
  }

  // Score = nb de voisins uniques (degré dans le graphe)
  const raw: Record<string, number> = {};
  Object.entries(cooc).forEach(([word, neighbors]) => {
    raw[word] = neighbors.size;
  });

  // Normalisation [0, 1]
  const maxDegree = Math.max(...Object.values(raw), 1);
  const scores: Record<string, number> = {};
  Object.entries(raw).forEach(([word, degree]) => {
    scores[word] = degree / maxDegree;
  });

  return scores;
}

// ─────────────────────────────────────────────
// ÉTAPE 3 — CALCUL DES STATISTIQUES
// ─────────────────────────────────────────────

function computeStats(text: string): DocumentStats {
  const allTokens = normalize(text).split(/\s+/).filter((w) => w.length > 0);
  const sentences = splitSentences(text);
  const uniqueWords = new Set(allTokens).size;

  return {
    totalWords: allTokens.length,
    uniqueWords,
    avgSentenceLength:
      sentences.length > 0 ? allTokens.length / sentences.length : 0,
    lexicalDiversity: allTokens.length > 0 ? uniqueWords / allTokens.length : 0,
  };
}

// ─────────────────────────────────────────────
// PHASE 1 — analyzeTheme()
// Entrée  : un document brut
// Sortie  : un ThemeProfile (signature thématique)
// ─────────────────────────────────────────────

/**
 * Analyse un document et extrait sa signature thématique.
 * Le résultat peut être stocké et comparé plus tard
 * via compareThemes() sans retraiter le texte original.
 *
 * @param doc       Document à analyser
 * @param topK      Nombre de mots-clés à extraire (défaut : 15)
 * @returns         ThemeProfile prêt pour la comparaison
 */
export function analyzeTheme(doc: RawDocument, topK = 15): ThemeProfile {
  const tokens = tokenize(doc.content);
  const sentences = splitSentences(doc.content);

  if (tokens.length === 0) {
    return {
      documentName: doc.name,
      keywords: [],
      dominantTheme: "indéterminé",
      themeVector: {},
      stats: computeStats(doc.content),
      analyzedAt: new Date(),
    };
  }

  // Calcul des scores
  const tfidfMap = computeInternalTFIDF(tokens, sentences);
  const coocMap = computeCooccurrenceScore(tokens);

  // Fréquences brutes
  const freqMap: Record<string, number> = {};
  tokens.forEach((w) => (freqMap[w] = (freqMap[w] ?? 0) + 1));

  // Normalisation TF-IDF [0, 1]
  const maxTFIDF = Math.max(...Object.values(tfidfMap), 1);

  // Score final combiné : 60% TF-IDF + 40% co-occurrence
  const allWords = new Set([...Object.keys(tfidfMap), ...Object.keys(coocMap)]);
  const scored: KeywordScore[] = [];

  allWords.forEach((word) => {
    const tfidf = (tfidfMap[word] ?? 0) / maxTFIDF;
    const cooc = coocMap[word] ?? 0;
    const score = tfidf * 0.6 + cooc * 0.4;

    scored.push({
      word,
      tfidf,
      cooccurrence: cooc,
      score,
      frequency: freqMap[word] ?? 0,
    });
  });

  // Tri par score décroissant, on garde les topK
  scored.sort((a, b) => b.score - a.score);
  const keywords = scored.slice(0, topK);

  // Vecteur thématique : uniquement les topK mots avec leur score
  const themeVector: Record<string, number> = {};
  keywords.forEach((kw) => {
    themeVector[kw.word] = kw.score;
  });

  // Thème dominant : label basé sur les 5 premiers mots-clés
  const dominantTheme = keywords
    .slice(0, 5)
    .map((kw) => kw.word)
    .join(", ");

  return {
    documentName: doc.name,
    keywords,
    dominantTheme,
    themeVector,
    stats: computeStats(doc.content),
    analyzedAt: new Date(),
  };
}

// ─────────────────────────────────────────────
// PHASE 2 — compareThemes()
// Entrée  : deux ThemeProfile (déjà analysés)
// Sortie  : ThemeComparisonResult
// ─────────────────────────────────────────────

/**
 * Similarité cosinus entre deux vecteurs thématiques.
 */
function cosineSimilarity(
  vecA: Record<string, number>,
  vecB: Record<string, number>
): number {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, magA = 0, magB = 0;

  keys.forEach((k) => {
    const a = vecA[k] ?? 0;
    const b = vecB[k] ?? 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Jaccard sur les ensembles de mots-clés (top keywords).
 */
function keywordJaccard(profileA: ThemeProfile, profileB: ThemeProfile): number {
  const setA = new Set(profileA.keywords.map((k) => k.word));
  const setB = new Set(profileB.keywords.map((k) => k.word));
  let inter = 0;
  setA.forEach((w) => { if (setB.has(w)) inter++; });
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

function getProximityLevel(score: number): ProximityLevel {
  if (score >= 0.85) return "identique";
  if (score >= 0.65) return "très proche";
  if (score >= 0.45) return "proche";
  if (score >= 0.25) return "partiel";
  if (score >= 0.10) return "distant";
  return "sans rapport";
}

function getInterpretation(
  level: ProximityLevel,
  sharedKeywords: string[]
): string {
  const shared =
    sharedKeywords.length > 0
      ? ` Concepts communs : ${sharedKeywords.slice(0, 3).join(", ")}.`
      : "";

  const messages: Record<ProximityLevel, string> = {
    identique:
      "Les deux documents traitent exactement du même sujet." + shared,
    "très proche":
      "Les thèmes sont très similaires, probablement le même domaine." + shared,
    proche:
      "Les documents partagent un thème commun avec des perspectives différentes." +
      shared,
    partiel:
      "Quelques points communs, mais les thèmes principaux divergent." + shared,
    distant:
      "Faible connexion thématique, domaines différents avec quelques intersections." +
      shared,
    "sans rapport":
      "Les documents ne partagent aucun thème commun détectable.",
  };

  return messages[level];
}

/**
 * Compare deux profils thématiques produits par analyzeTheme().
 *
 * Peut être appelé immédiatement ou après une longue période —
 * le ThemeProfile est auto-suffisant (pas besoin du texte original).
 *
 * @param profileA  Signature thématique du document A
 * @param profileB  Signature thématique du document B
 * @returns         Rapport de comparaison thématique
 */
export function compareThemes(
  profileA: ThemeProfile,
  profileB: ThemeProfile
): ThemeComparisonResult {
  const vectorSim = cosineSimilarity(profileA.themeVector, profileB.themeVector);
  const keywordSim = keywordJaccard(profileA, profileB);

  // Score final : 70% vecteur, 30% mots-clés
  const thematicSimilarity = vectorSim * 0.7 + keywordSim * 0.3;

  // Mots-clés partagés et exclusifs
  const setA = new Set(profileA.keywords.map((k) => k.word));
  const setB = new Set(profileB.keywords.map((k) => k.word));
  const sharedKeywords: string[] = [];
  const uniqueToA: string[] = [];
  const uniqueToB: string[] = [];

  setA.forEach((w) => (setB.has(w) ? sharedKeywords.push(w) : uniqueToA.push(w)));
  setB.forEach((w) => { if (!setA.has(w)) uniqueToB.push(w); });

  const proximityLevel = getProximityLevel(thematicSimilarity);
  const interpretation = getInterpretation(proximityLevel, sharedKeywords);

  return {
    documentA: profileA.documentName,
    documentB: profileB.documentName,
    thematicSimilarity,
    keywordOverlap: keywordSim,
    vectorSimilarity: vectorSim,
    sharedKeywords,
    uniqueToA,
    uniqueToB,
    proximityLevel,
    interpretation,
  };
}

// ─────────────────────────────────────────────
// UTILITAIRE — Comparaison 1 vs N
// ─────────────────────────────────────────────

/**
 * Compare un document principal contre plusieurs références.
 * Les profils peuvent avoir été analysés à des moments différents.
 *
 * @param main        Profil du document à analyser
 * @param references  Liste de profils de référence
 * @returns           Résultats triés par similarité décroissante
 */
export function compareOneToMany(
  main: ThemeProfile,
  references: ThemeProfile[]
): ThemeComparisonResult[] {
  return references
    .map((ref) => compareThemes(main, ref))
    .sort((a, b) => b.thematicSimilarity - a.thematicSimilarity);
}

// ─────────────────────────────────────────────
// EXEMPLE D'UTILISATION
// ─────────────────────────────────────────────

// ── Phase 1 : analyse des documents (peut se faire à des moments différents)

const profileA = analyzeTheme({
  name: "rapport_IA.txt",
  content: `L'intelligence artificielle révolutionne les systèmes de santé.
    Les algorithmes de machine learning permettent de détecter des maladies
    avec une précision supérieure aux médecins humains. Les réseaux de neurones
    profonds analysent des milliers d'images médicales pour identifier des tumeurs.
    La médecine prédictive et les données de santé transforment les diagnostics.`,
});

const profileB = analyzeTheme({
  name: "article_deep_learning.txt",
  content: `Le deep learning et les réseaux de neurones transforment l'analyse d'images.
    Ces algorithmes sont entraînés sur des millions de données pour reconnaître
    des patterns complexes. Les applications médicales incluent la détection
    de cancers et l'analyse d'IRM. La précision de ces modèles dépasse les experts humains.`,
});

const profileC = analyzeTheme({
  name: "rapport_finance.txt",
  content: `Les marchés financiers connaissent une volatilité sans précédent.
    Les taux d'intérêt et l'inflation affectent les investissements boursiers.
    Les banques centrales ajustent leurs politiques monétaires pour stabiliser
    les économies. Les crypto-monnaies perturbent les systèmes bancaires traditionnels.`,
});

// ── Phase 2 : comparaison différée (profileA déjà en mémoire ou base de données)

console.log("=== PROFIL THÉMATIQUE — rapport_IA.txt ===");
console.log(`Thème dominant : ${profileA.dominantTheme}`);
console.log("Top mots-clés :");
profileA.keywords.slice(0, 8).forEach((kw) => {
  console.log(`  ${kw.word.padEnd(20)} score: ${kw.score.toFixed(3)}  freq: ${kw.frequency}`);
});

console.log("\n=== COMPARAISONS THÉMATIQUES ===");
const comparisons = compareOneToMany(profileA, [profileB, profileC]);

comparisons.forEach((r) => {
  console.log(`\n[${r.documentA}] vs [${r.documentB}]`);
  console.log(`  Similarité thématique : ${(r.thematicSimilarity * 100).toFixed(1)}%`);
  console.log(`  Vecteur cosinus       : ${(r.vectorSimilarity * 100).toFixed(1)}%`);
  console.log(`  Overlap mots-clés     : ${(r.keywordOverlap * 100).toFixed(1)}%`);
  console.log(`  Niveau de proximité   : ${r.proximityLevel}`);
  console.log(`  Interprétation        : ${r.interpretation}`);
  if (r.sharedKeywords.length)
    console.log(`  Mots-clés partagés    : ${r.sharedKeywords.join(", ")}`);
  if (r.uniqueToA.length)
    console.log(`  Exclusif A            : ${r.uniqueToA.slice(0, 5).join(", ")}`);
  if (r.uniqueToB.length)
    console.log(`  Exclusif B            : ${r.uniqueToB.slice(0, 5).join(", ")}`);
});