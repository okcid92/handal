/**
 * DÉTECTION DE PLAGIAT — Algorithmes de similarité textuelle
 *
 * Trois algorithmes combinés :
 *  1. TF-IDF + Similarité Cosinus
 *  2. Indice de Jaccard (Jaccard Similarity)
 *  3. Similarité par N-grammes (N-gram Overlap)
 */

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface Document {
  name: string;
  content: string;
}

export interface SimilarityResult {
  name: string;
  /** TF-IDF + Cosine Similarity score [0, 1] */
  cosineTFIDF: number;
  /** Jaccard Similarity score [0, 1] */
  jaccard: number;
  /** N-gram Overlap score [0, 1] */
  ngram: number;
  /** Score combiné pondéré [0, 1] */
  combined: number;
  /** Séquences de mots communes détectées */
  commonPhrases: string[];
}

export interface PlagiarismReport {
  mainDocument: string;
  analyzedAt: Date;
  maxSimilarity: number;
  avgSimilarity: number;
  results: SimilarityResult[];
}

// ─────────────────────────────────────────────
// UTILITAIRES TEXTE
// ─────────────────────────────────────────────

/** Supprime les balises HTML d'une chaîne */
function stripHTML(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Normalise un texte :
 * - Mise en minuscule
 * - Suppression de la ponctuation (hors lettres accentuées)
 * - Collapsing des espaces
 */
function normalize(text: string): string {
  return stripHTML(text)
    .toLowerCase()
    .replace(/[^\w\sàâéèêëîïôùûüç]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Découpe un texte normalisé en tokens (mots),
 * filtre les tokens de longueur ≤ 1
 */
function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

// ─────────────────────────────────────────────
// ALGORITHME 1 — TF-IDF + SIMILARITÉ COSINUS
// Nom complet : Term Frequency–Inverse Document Frequency
//               avec Cosine Similarity
// ─────────────────────────────────────────────

type TFIDFVector = Record<string, number>;

/**
 * Calcule les vecteurs TF-IDF pour une collection de documents.
 *
 * TF  (Term Frequency)         = occurrences(mot) / total_mots_du_doc
 * IDF (Inverse Doc Frequency)  = log(N / df(mot) + 1)
 * TF-IDF = TF × IDF
 *
 * Chaque vecteur représente l'importance de chaque mot
 * dans son document par rapport au corpus entier.
 */
function computeTFIDF(documents: string[]): TFIDFVector[] {
  const N = documents.length;

  // Calcul du Document Frequency (df) : nb de docs contenant chaque mot
  const df: Record<string, number> = {};
  documents.forEach((doc) => {
    const uniqueTokens = new Set(tokenize(doc));
    uniqueTokens.forEach((word) => {
      df[word] = (df[word] ?? 0) + 1;
    });
  });

  // Calcul du vecteur TF-IDF pour chaque document
  return documents.map((doc) => {
    const tokens = tokenize(doc);
    const tf: Record<string, number> = {};
    tokens.forEach((word) => {
      tf[word] = (tf[word] ?? 0) + 1;
    });

    const vector: TFIDFVector = {};
    Object.entries(tf).forEach(([word, count]) => {
      const termFreq = count / tokens.length;
      const inverseDocFreq = Math.log(N / ((df[word] ?? 0) + 1) + 1);
      vector[word] = termFreq * inverseDocFreq;
    });

    return vector;
  });
}

/**
 * Similarité Cosinus entre deux vecteurs TF-IDF.
 *
 * cos(θ) = (A · B) / (||A|| × ||B||)
 *
 * Résultat dans [0, 1] :
 *   1 = identiques, 0 = aucune similarité
 */
function cosineSimilarity(a: TFIDFVector, b: TFIDFVector): number {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  allKeys.forEach((key) => {
    const av = a[key] ?? 0;
    const bv = b[key] ?? 0;
    dotProduct += av * bv;
    magnitudeA += av * av;
    magnitudeB += bv * bv;
  });

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

// ─────────────────────────────────────────────
// ALGORITHME 2 — INDICE DE JACCARD
// Nom complet : Jaccard Similarity Coefficient
//               (aussi appelé Jaccard Index)
// ─────────────────────────────────────────────

/**
 * Mesure la similarité entre deux ensembles de tokens.
 *
 * J(A, B) = |A ∩ B| / |A ∪ B|
 *
 * Résultat dans [0, 1] :
 *   1 = vocabulaires identiques, 0 = aucun mot en commun
 *
 * Avantage : résistant à la longueur des documents.
 * Limite   : sensible aux reformulations (synonymes non détectés).
 */
function jaccardSimilarity(textA: string, textB: string): number {
  const setA = new Set(tokenize(textA));
  const setB = new Set(tokenize(textB));

  let intersectionSize = 0;
  setA.forEach((word) => {
    if (setB.has(word)) intersectionSize++;
  });

  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

// ─────────────────────────────────────────────
// ALGORITHME 3 — SIMILARITÉ PAR N-GRAMMES
// Nom complet : N-gram Overlap Similarity
//               (variante du Jaccard sur des séquences de N mots)
// ─────────────────────────────────────────────

/**
 * Génère tous les n-grammes (séquences de n mots consécutifs)
 * d'une liste de tokens.
 *
 * Exemple avec n=3 : ["le","chat","mange"] → {"le chat mange"}
 */
function generateNgrams(tokens: string[], n: number): Set<string> {
  const ngrams = new Set<string>();
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(" "));
  }
  return ngrams;
}

/**
 * Similarité par n-grammes entre deux textes.
 *
 * score = |ngrams(A) ∩ ngrams(B)| / |ngrams(A) ∪ ngrams(B)|
 *
 * Par défaut n=3 (trigrammes de mots).
 * Plus efficace que Jaccard pour détecter les passages copiés-collés
 * car il tient compte de l'ordre des mots.
 *
 * Résultat dans [0, 1].
 */
function ngramSimilarity(textA: string, textB: string, n = 3): number {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.length < n || tokensB.length < n) return 0;

  const ngramsA = generateNgrams(tokensA, n);
  const ngramsB = generateNgrams(tokensB, n);

  let intersectionSize = 0;
  ngramsA.forEach((g) => {
    if (ngramsB.has(g)) intersectionSize++;
  });

  const unionSize = ngramsA.size + ngramsB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

// ─────────────────────────────────────────────
// EXTRACTION DES PHRASES COMMUNES
// ─────────────────────────────────────────────

/**
 * Détecte les séquences de 4 mots consécutifs présentes
 * dans les deux textes (indicateurs de copie directe).
 */
function findCommonPhrases(
  textA: string,
  textB: string,
  phraseLength = 4,
  maxResults = 5
): string[] {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  const ngramsB = new Set<string>();
  for (let i = 0; i <= tokensB.length - phraseLength; i++) {
    ngramsB.add(tokensB.slice(i, i + phraseLength).join(" "));
  }

  const found = new Set<string>();
  for (let i = 0; i <= tokensA.length - phraseLength; i++) {
    const phrase = tokensA.slice(i, i + phraseLength).join(" ");
    if (ngramsB.has(phrase)) found.add(phrase);
    if (found.size >= maxResults) break;
  }

  return [...found];
}

// ─────────────────────────────────────────────
// MOTEUR PRINCIPAL
// ─────────────────────────────────────────────

/**
 * Analyse la similarité d'un document principal par rapport
 * à une liste de documents de référence.
 *
 * Score combiné pondéré :
 *   combined = TF-IDF cosinus × 0.50
 *            + Jaccard         × 0.25
 *            + N-grammes       × 0.25
 *
 * Les résultats sont triés par score décroissant.
 */
export function analyzePlagiarism(
  main: Document,
  references: Document[]
): PlagiarismReport {
  const allContents = [main.content, ...references.map((r) => r.content)];
  const tfidfVectors = computeTFIDF(allContents);
  const mainVector = tfidfVectors[0];

  const results: SimilarityResult[] = references.map((ref, i) => {
    const cs = cosineSimilarity(mainVector, tfidfVectors[i + 1]);
    const js = jaccardSimilarity(main.content, ref.content);
    const ng = ngramSimilarity(main.content, ref.content);
    const combined = cs * 0.5 + js * 0.25 + ng * 0.25;
    const commonPhrases = findCommonPhrases(main.content, ref.content);

    return {
      name: ref.name,
      cosineTFIDF: cs,
      jaccard: js,
      ngram: ng,
      combined,
      commonPhrases,
    };
  });

  results.sort((a, b) => b.combined - a.combined);

  const maxSimilarity = results[0]?.combined ?? 0;
  const avgSimilarity =
    results.reduce((sum, r) => sum + r.combined, 0) / (results.length || 1);

  return {
    mainDocument: main.name,
    analyzedAt: new Date(),
    maxSimilarity,
    avgSimilarity,
    results,
  };
}

// ─────────────────────────────────────────────
// EXEMPLE D'UTILISATION
// ─────────────────────────────────────────────

const main: Document = {
  name: "rapport_etudiant.txt",
  content: "L'intelligence artificielle transforme profondément les industries modernes.",
};

const references: Document[] = [
  {
    name: "article_wikipedia.txt",
    content: "L'intelligence artificielle transforme profondément les industries modernes et redéfinit les métiers.",
  },
  {
    name: "these_2023.txt",
    content: "Les avancées en machine learning ont révolutionné le traitement automatique du langage naturel.",
  },
];

const report = analyzePlagiarism(main, references);

console.log("=== RAPPORT DE SIMILARITÉ ===");
console.log(`Document : ${report.mainDocument}`);
console.log(`Score max : ${(report.maxSimilarity * 100).toFixed(1)}%`);
console.log(`Score moy : ${(report.avgSimilarity * 100).toFixed(1)}%`);
report.results.forEach((r) => {
  console.log(`\n[${r.name}]`);
  console.log(`  Combiné        : ${(r.combined * 100).toFixed(1)}%`);
  console.log(`  TF-IDF cosinus : ${(r.cosineTFIDF * 100).toFixed(1)}%`);
  console.log(`  Jaccard        : ${(r.jaccard * 100).toFixed(1)}%`);
  console.log(`  N-grammes      : ${(r.ngram * 100).toFixed(1)}%`);
  if (r.commonPhrases.length)
    console.log(`  Phrases comm.  : ${r.commonPhrases.join(" | ")}`);
});