export interface RawDocument {
  name: string;
  content: string;
}

export interface ThemeProfile {
  documentName: string;
  keywords: KeywordScore[];
  dominantTheme: string;
  themeVector: Record<string, number>;
  stats: DocumentStats;
  analyzedAt: Date;
}

export interface KeywordScore {
  word: string;
  tfidf: number;
  cooccurrence: number;
  score: number;
  frequency: number;
}

export interface DocumentStats {
  totalWords: number;
  uniqueWords: number;
  avgSentenceLength: number;
  lexicalDiversity: number;
}

export interface ThemeComparisonResult {
  documentA: string;
  documentB: string;
  thematicSimilarity: number;
  keywordOverlap: number;
  vectorSimilarity: number;
  sharedKeywords: string[];
  uniqueToA: string[];
  uniqueToB: string[];
  proximityLevel: ProximityLevel;
  interpretation: string;
}

export type ProximityLevel =
  | "identique"
  | "très proche"
  | "proche"
  | "partiel"
  | "distant"
  | "sans rapport";

const STOP_WORDS = new Set([
  // Articles et déterminants
  "le","la","les","un","une","des","du","de","da","au","aux",
  // Conjonctions et prépositions
  "et","ou","ni","mais","donc","or","car","si","que","qui","quoi","dont",
  "où","quand","comment","pourquoi","quel","quelle","quels","quelles",
  "ce","cet","cette","ces","mon","ton","son","ma","ta","sa","notre",
  "votre","leur","mes","tes","ses","nos","vos","leurs",
  // Pronoms
  "je","tu","il","elle","nous","vous","ils","elles","me","te","se",
  "lui","y","en","on","ne","pas","plus","très","bien","aussi","même",
  "tout","tous","toute","toutes","autre","autres","comme","avec","sans",
  "sous","sur","dans","par","pour","vers","chez","entre","après","avant",
  "pendant","depuis","jusqu",
  // Verbes auxiliaires
  "est","sont","être","avoir","fait","faire","peut","peuvent","doit",
  "doivent","va","vont","été","avait","avaient","était","étaient",
  "sera","seront","ainsi","afin","lors","dont","cela","celui","celle",
  "ceux","celles","ici","là","alors","puis","donc","enfin","notamment",
  "notamment","soit","selon","via","dès","dès","lorsque","lorsqu",
  // Anglais
  "the","a","an","and","or","but","if","in","on","at","to","for",
  "of","with","by","from","this","that","these","those","is","are",
  "was","were","be","been","have","has","had","do","does","did",
  "will","would","could","should","may","might","it","its","he",
  "she","they","we","you","i","my","your","his","her","our","their",
  "not","no","so","as","about","into","than","then","there","when",
  "where","which","who","what","how","all","each","both","few",
  "more","most","other","some","such",
]);

// ── Stop-words académiques IBAM (termes trop génériques pour discriminer) ──
const ACADEMIC_STOP_WORDS = new Set([
  // Structure de rapport
  "rapport","stage","presentation","chapitre","figure","tableau",
  "page","annexe","section","partie","introduction","conclusion",
  "sommaire","resume","abstract","bibliographie","references",
  // Termes académiques vides
  "projet","systeme","gestion","analyse","developpement","mise",
  "place","etude","travail","realisation","conception","implementation",
  "objectif","objectifs","problematique","contexte","cadre",
  "methodologie","approche","solution","resultat","resultats",
  "perspective","perspectives","recommandation","recommandations",
  "contribution","contributions","enjeux","besoin","besoins",
  "fonctionnalite","fonctionnalites","module","modules",
  // Institutions et lieux
  "ibam","miage","ujkz","burkina","faso","ouagadougou",
  "universite","institut","ecole","departement","filiere",
  // Mots de liaison académique
  "permet","permettre","permettant","afin","notamment","ainsi",
  "cependant","toutefois","neanmoins","egalement","notamment",
  "differents","differentes","plusieurs","certains","certaines",
  "important","importante","importants","importantes",
  "general","generale","generaux","generales",
  "niveau","niveaux","type","types","forme","formes",
  "cas","exemple","exemples","point","points",
]);

// ── Technologies et méthodes à booster (NER léger) ────────────────────────
const TECH_KEYWORDS = new Set([
  // Langages
  "java","python","javascript","typescript","php","kotlin","swift",
  "csharp","cpp","ruby","golang","rust","scala","dart","flutter",
  // Frameworks web
  "react","angular","vuejs","nextjs","nodejs","express","django",
  "laravel","symfony","spring","springboot","fastapi","nestjs",
  // Bases de données
  "mysql","postgresql","mongodb","redis","sqlite","oracle",
  "mariadb","cassandra","elasticsearch","firebase",
  // DevOps / Infrastructure
  "docker","kubernetes","jenkins","gitlab","github","ansible",
  "terraform","nginx","apache","linux","ubuntu","debian",
  // Sécurité / Auth
  "keycloak","oauth","jwt","ldap","ssl","tls","https","saml",
  // Méthodes / Modélisation
  "merise","uml","agile","scrum","kanban","devops","cicd",
  "mvc","api","rest","graphql","microservices","erp","crm",
  // Domaines métier
  "comptabilite","facturation","paie","rh","stock","inventaire",
  "medical","sante","logistique","ecommerce","banque","finance",
  "reseau","securite","authentification","autorisation",
]);

// Boost multiplicateur pour les termes techniques
const TECH_BOOST = 2.5;
// Boost pour les mots commençant par une majuscule en milieu de phrase (NER)
const CAPITALIZED_BOOST = 1.6;

function stripHTML(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[\u00e0\u00e2\u00e4]/g, "a")
    .replace(/[\u00e9\u00e8\u00ea\u00eb]/g, "e")
    .replace(/[\u00ee\u00ef]/g, "i")
    .replace(/[\u00f4\u00f6]/g, "o")
    .replace(/[\u00f9\u00fb\u00fc]/g, "u")
    .replace(/\u00e7/g, "c")
    .replace(/[^a-z0-9]/g, "");
}

function normalize(text: string): string {
  return stripHTML(text)
    .toLowerCase()
    .replace(/[^\w\s\u00e0\u00e2\u00e9\u00e8\u00ea\u00eb\u00ee\u00ef\u00f4\u00f9\u00fb\u00fc\u00e7]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Détecte si un mot commence par une majuscule en milieu de phrase (NER léger) */
function isCapitalizedMidSentence(rawWord: string, position: number): boolean {
  if (position === 0) return false;
  return rawWord.length > 2 && rawWord[0] === rawWord[0].toUpperCase() && rawWord[0] !== rawWord[0].toLowerCase();
}

function isValidToken(normalized: string): boolean {
  return (
    normalized.length > 2 &&
    !STOP_WORDS.has(normalized) &&
    !ACADEMIC_STOP_WORDS.has(normalized) &&
    !/^\d+$/.test(normalized) // exclure les nombres purs
  );
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .map(normalizeWord)
    .filter(isValidToken);
}

/** Tokenize en conservant les mots bruts pour la détection NER */
function tokenizeWithRaw(text: string): Array<{ norm: string; raw: string; pos: number }> {
  const raw = stripHTML(text).split(/\s+/);
  const result: Array<{ norm: string; raw: string; pos: number }> = [];
  raw.forEach((word, pos) => {
    const norm = normalizeWord(word);
    if (isValidToken(norm)) {
      result.push({ norm, raw: word, pos });
    }
  });
  return result;
}

/** Extrait les bigrammes et trigrammes significatifs */
function extractNgrams(
  tokens: string[],
  n: 2 | 3,
): Array<{ phrase: string; count: number }> {
  const counts = new Map<string, number>();
  for (let i = 0; i <= tokens.length - n; i++) {
    // Ne pas former de n-gramme si l'un des tokens est trop court
    const slice = tokens.slice(i, i + n);
    if (slice.some((t) => t.length < 3)) continue;
    const phrase = slice.join(" ");
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  }
  // Garder uniquement les n-grammes qui apparaissent au moins 2 fois
  return [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .map(([phrase, count]) => ({ phrase, count }))
    .sort((a, b) => b.count - a.count);
}

function splitSentences(text: string): string[] {
  return stripHTML(text)
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function computeInternalTFIDF(
  tokens: string[],
  sentences: string[],
): Record<string, number> {
  const N = Math.max(sentences.length, 1);

  const tf: Record<string, number> = {};
  tokens.forEach((w) => {
    tf[w] = (tf[w] ?? 0) + 1;
  });

  const df: Record<string, number> = {};
  sentences.forEach((sentence) => {
    const sentenceTokens = new Set(tokenize(sentence));
    sentenceTokens.forEach((w) => {
      df[w] = (df[w] ?? 0) + 1;
    });
  });

  const tfidfMap: Record<string, number> = {};
  Object.entries(tf).forEach(([word, count]) => {
    const termFreq = count / tokens.length;
    const idf = Math.log(N / ((df[word] ?? 0) + 1) + 1);
    tfidfMap[word] = termFreq * idf;
  });

  return tfidfMap;
}

function computeCooccurrenceScore(
  tokens: string[],
  windowSize = 4,
): Record<string, number> {
  const cooc: Record<string, Set<string>> = {};

  for (let i = 0; i < tokens.length; i += 1) {
    const word = tokens[i];
    if (!cooc[word]) {
      cooc[word] = new Set();
    }

    for (let j = i + 1; j < Math.min(i + windowSize, tokens.length); j += 1) {
      const neighbor = tokens[j];
      cooc[word].add(neighbor);
      if (!cooc[neighbor]) {
        cooc[neighbor] = new Set();
      }
      cooc[neighbor].add(word);
    }
  }

  const raw: Record<string, number> = {};
  Object.entries(cooc).forEach(([word, neighbors]) => {
    raw[word] = neighbors.size;
  });

  const maxDegree = Math.max(...Object.values(raw), 1);
  const scores: Record<string, number> = {};
  Object.entries(raw).forEach(([word, degree]) => {
    scores[word] = degree / maxDegree;
  });

  return scores;
}

function computeStats(text: string): DocumentStats {
  const allTokens = normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 0);
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

export function analyzeTheme(doc: RawDocument, topK = 15): ThemeProfile {
  const rawTokens = tokenizeWithRaw(doc.content);
  const tokens = rawTokens.map((t) => t.norm);
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

  const tfidfMap = computeInternalTFIDF(tokens, sentences);
  const coocMap = computeCooccurrenceScore(tokens);

  const freqMap: Record<string, number> = {};
  tokens.forEach((w) => { freqMap[w] = (freqMap[w] ?? 0) + 1; });

  const maxTFIDF = Math.max(...Object.values(tfidfMap), 1);
  const allWords = new Set([...Object.keys(tfidfMap), ...Object.keys(coocMap)]);
  const scored: KeywordScore[] = [];

  // Construire un set des mots capitalisés en milieu de phrase
  const capitalizedMidSentence = new Set<string>();
  rawTokens.forEach(({ norm, raw, pos }) => {
    if (isCapitalizedMidSentence(raw, pos)) {
      capitalizedMidSentence.add(norm);
    }
  });

  allWords.forEach((word) => {
    const tfidf = (tfidfMap[word] ?? 0) / maxTFIDF;
    const cooc = coocMap[word] ?? 0;
    let score = tfidf * 0.6 + cooc * 0.4;

    // Boost NER : technologie connue
    if (TECH_KEYWORDS.has(word)) score *= TECH_BOOST;
    // Boost NER : capitalisé en milieu de phrase (entité nommée probable)
    else if (capitalizedMidSentence.has(word)) score *= CAPITALIZED_BOOST;

    scored.push({
      word,
      tfidf,
      cooccurrence: cooc,
      score,
      frequency: freqMap[word] ?? 0,
    });
  });

  scored.sort((a, b) => b.score - a.score);
  const keywords = scored.slice(0, topK);

  // ── Extraction des n-grammes pour le dominantTheme ────────────────────────
  const trigrams = extractNgrams(tokens, 3);
  const bigrams = extractNgrams(tokens, 2);

  // Préférer les trigrammes, puis bigrammes, puis mots seuls
  const topLabels: string[] = [];

  // 1. Trigrammes contenant au moins un terme technique
  for (const { phrase } of trigrams) {
    if (topLabels.length >= 3) break;
    const words = phrase.split(" ");
    if (words.some((w) => TECH_KEYWORDS.has(w))) {
      topLabels.push(phrase);
    }
  }

  // 2. Bigrammes contenant au moins un terme technique
  for (const { phrase } of bigrams) {
    if (topLabels.length >= 3) break;
    const words = phrase.split(" ");
    if (words.some((w) => TECH_KEYWORDS.has(w)) && !topLabels.includes(phrase)) {
      topLabels.push(phrase);
    }
  }

  // 3. Trigrammes fréquents (sans contrainte tech)
  for (const { phrase } of trigrams) {
    if (topLabels.length >= 3) break;
    if (!topLabels.includes(phrase)) topLabels.push(phrase);
  }

  // 4. Bigrammes fréquents
  for (const { phrase } of bigrams) {
    if (topLabels.length >= 3) break;
    if (!topLabels.includes(phrase)) topLabels.push(phrase);
  }

  // 5. Mots seuls boosted (fallback)
  for (const kw of keywords) {
    if (topLabels.length >= 3) break;
    if (!topLabels.some((l) => l.includes(kw.word))) {
      topLabels.push(kw.word);
    }
  }

  const dominantTheme = topLabels.slice(0, 3).join(" | ") || "indéterminé";

  const themeVector: Record<string, number> = {};
  keywords.forEach((kw) => { themeVector[kw.word] = kw.score; });

  return {
    documentName: doc.name,
    keywords,
    dominantTheme,
    themeVector,
    stats: computeStats(doc.content),
    analyzedAt: new Date(),
  };
}

function cosineSimilarity(
  vecA: Record<string, number>,
  vecB: Record<string, number>,
): number {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  keys.forEach((k) => {
    const a = vecA[k] ?? 0;
    const b = vecB[k] ?? 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function keywordJaccard(
  profileA: ThemeProfile,
  profileB: ThemeProfile,
): number {
  const setA = new Set(profileA.keywords.map((k) => k.word));
  const setB = new Set(profileB.keywords.map((k) => k.word));

  let inter = 0;
  setA.forEach((w) => {
    if (setB.has(w)) {
      inter += 1;
    }
  });

  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

function getProximityLevel(score: number): ProximityLevel {
  if (score >= 0.85) return "identique";
  if (score >= 0.65) return "très proche";
  if (score >= 0.45) return "proche";
  if (score >= 0.25) return "partiel";
  if (score >= 0.1) return "distant";
  return "sans rapport";
}

function getInterpretation(
  level: ProximityLevel,
  sharedKeywords: string[],
): string {
  const shared =
    sharedKeywords.length > 0
      ? ` Concepts communs : ${sharedKeywords.slice(0, 3).join(", ")}.`
      : "";

  const messages: Record<ProximityLevel, string> = {
    identique: "Les deux documents traitent exactement du même sujet." + shared,
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
    "sans rapport": "Les documents ne partagent aucun thème commun détectable.",
  };

  return messages[level];
}

export function compareThemes(
  profileA: ThemeProfile,
  profileB: ThemeProfile,
): ThemeComparisonResult {
  const vectorSim = cosineSimilarity(
    profileA.themeVector,
    profileB.themeVector,
  );
  const keywordSim = keywordJaccard(profileA, profileB);
  const thematicSimilarity = vectorSim * 0.7 + keywordSim * 0.3;

  const setA = new Set(profileA.keywords.map((k) => k.word));
  const setB = new Set(profileB.keywords.map((k) => k.word));

  const sharedKeywords: string[] = [];
  const uniqueToA: string[] = [];
  const uniqueToB: string[] = [];

  setA.forEach((w) => {
    if (setB.has(w)) {
      sharedKeywords.push(w);
    } else {
      uniqueToA.push(w);
    }
  });

  setB.forEach((w) => {
    if (!setA.has(w)) {
      uniqueToB.push(w);
    }
  });

  const proximityLevel = getProximityLevel(thematicSimilarity);

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
    interpretation: getInterpretation(proximityLevel, sharedKeywords),
  };
}

export function compareOneToMany(
  main: ThemeProfile,
  references: ThemeProfile[],
): ThemeComparisonResult[] {
  return references
    .map((ref) => compareThemes(main, ref))
    .sort((a, b) => b.thematicSimilarity - a.thematicSimilarity);
}
