# Workflows Détaillés - Handal

> [!IMPORTANT]
> **Workflow Handal v2 — Validation Conjointe**
> Ce document décrit le workflow **v2 complet** (validation conjointe) implémenté dans Handal.
>
> **Modèle v2 :** validation simultanée conjointe (TEACHER + DA en parallèle).
> **Statuts Theme :** PENDING → PENDING_VALIDATION → VALIDATED/REJECTED

Ce document décrit le workflow complet de chaque rôle utilisateur dans la plateforme Handal, avec tous les états, conditions et actions possibles.

---

## 0. SYSTÈME DE FILTRAGE INTELLIGENT (Vue d'Ensemble)

### Architecture Générale

Le workflow Handal s'articule autour de **trois phases critiques** avec filtrage progressif:

#### Phase 1: Le Thème (Double Barrière)

- **Objectif:** Éviter les sujets redondants ou déjà traités
- **Étapes:**
  1. **Proposition (Étudiant):** Soumission titre + description
  2. **Auto-Vérification Algorithmique:** Comparaison instantanée avec tous les mémoires existants
  3. **Validation Administrative Simultanée:** Chef de département + Direction Académique (DA)

#### Phase 2: Le Document (Analyse Technique)

- **Objectif:** Évaluer la qualité pédagogique et l'intégrité académique
- **Étapes:**
  1. **Dépôt du Document:** Téléversement du fichier final (thème VALIDATED uniquement)
  2. **Analyse Profonde:** Détection plagiat sémantique + analyse motifs IA

#### Phase 3: Le Verdict (Appréciation Finale avec Seuil 20%)

- **Objectif:** Décision automatique + humaine sur l'admissibilité
- **Étapes:**
  1. **Filtre Automatique 20%:** Score < 20% = "propre", Score ≥ 20% = alerte/rejet
  2. **Appréciation Humaine:** Chef de département + DA consultent rapport détaillé
  3. **Décision Finale:** Soutenance autorisée, mention, ou sanction

### Diagramme Global

```mermaid
flowchart TD
    Start((Début)) --> Prop[Proposition du Thème]
    Prop --> AlgoTheme{Algo : Doublon ?}
    AlgoTheme -- Oui --> RejectTheme[Thème Rejeté]
    AlgoTheme -- Non --> DualVal[Validation DA & Chef Dept]

    DualVal --> ValOK{Validé ?}
    ValOK -- Non --> RejectTheme
    ValOK -- Oui --> Upload[Dépôt du Document]

    Upload --> AlgoDoc[Analyse Plagiat & IA]
    AlgoDoc --> ScoreCheck{Score < 20% ?}

    ScoreCheck -- Non --> Sanction[Alerte Plagiat / Rejet]
    ScoreCheck -- Oui --> FinalApp[Appréciation DA & Chef]

    FinalApp --> Decision((Décision Finale))
```

### Tableau Comparatif: Ancien vs Nouveau Workflow

| Étape                   | Ancien Workflow                | Nouveau Workflow                                  |
| ----------------------- | ------------------------------ | ------------------------------------------------- |
| **Vérification Thème**  | Unicité du titre uniquement    | Comparaison algorithmique avec historique complet |
| **Séquence Validation** | Teacher d'abord, puis DA       | Envoi conjoint à DA & Chef de département         |
| **Note/Score**          | Assignée par DA lors du thème  | Remplacée par appréciation finale après analyse   |
| **Critère de Passage**  | Aucun seuil automatique        | Seuil strict de 20% de similarité                 |
| **Analyse Document**    | Auto-test + analyse officielle | Plagiat sémantique + détection IA                 |
| **Décision Finale**     | Délibération DA seule          | Appréciation conjointe Chef + DA                  |

---

## 1. WORKFLOW ÉTUDIANT (STUDENT)

### 1.1 Authentification & Accès

**Point d'entrée:** Page d'accueil `/`

- L'étudiant saisit son **INE** (Identifiant National Étudiant) et son mot de passe
- Le système valide les identifiants via `/api/login`
- Redirection vers `/student` (tableau de bord étudiant)
- La session est stockée localement

**Comptes de démo:**

- INE: `N01331820231`
- Mot de passe: `mon926732`

**Permissions:**

- Accès exclusif à `/student`
- Peut consulter son profil et ses propres thèmes/documents

---

### 1.2 Proposition de Thème (Phase 1, Étape 1)

**Endpoint:** `POST /api/themes/propose`

**Conditions préalables:**

- Étudiant authentifié
- N'a pas encore de thème validé (un thème actif par étudiant)

**Données requises:**

```json
{
  "title": "Détection de plagiat multilingue par NLP",
  "description": "Évaluation des approches sémantiques et traduction inverse pour détecter le plagiat cross-lingue."
}
```

**Validations (Client):**

- `title` minimum 8 caractères
- `description` minimum 1 caractère

**Validations (Serveur):**

1. **Validation Format:**
   - `title` minimum 8 caractères
   - `description` minimum 1 caractère

2. **Auto-Vérification Algorithmique:**
   - Comparaison sémantique du titre et description avec **tous les mémoires existants**
   - Utilisation de similarité cosinus pour détecter les doublons
   - Seuil de similarité: ≥ 70% = rejet automatique

**Résultat en cas de succès:**

- Thème créé avec statut `PENDING_VALIDATION`
- **Envoi SIMULTANÉ** aux Chef de département (TEACHER) et Direction Académique (DA)
- Notification: "Nouveau thème en attente de validation"

**Résultat en cas d'échec (Doublon détecté):**

- Code 409: Doublon détecté
- L'étudiant peut reformuler et renvoyer

**État du thème:**

```
PENDING_VALIDATION ← Attend votes parallèles TEACHER + DA
```

**UI/UX:**

- Formulaire "Proposer un thème"
- Si doublon: message explicite avec scores de similarité
- Si accepté: "Thème #12 en attente de validation"

---

### 1.3 Suivi des Thèmes

**Endpoint:** `GET /api/me/overview`

L'étudiant voit:

- Son profil: nom, rôle, INE, identifiant
- État de son thème actuel (si proposé)
- Ses documents (si thème validé)

**États du thème visibles (v2):**

1. **PENDING_VALIDATION** → En attente de votes parallèles (Teacher + DA)
2. **REJECTED** → Rejeté (un des deux a rejeté), ne peut pas déposer
3. **VALIDATED** → Approuvé par Teacher + DA, **peut déposer le mémoire**
4. **ANALYSIS_COMPLETE** → Document analysé, en attente d'appréciation
5. **APPROVED** → Appréciation finale positive, soutenance autorisée
6. **FLAGGED_PLAGIARISM** → Alerte plagiat (score ≥ 20%), en révision

**Actions disponibles selon l'état:**

- **PENDING_VALIDATION:** Attendre votes
- **REJECTED:** Proposer nouveau thème
- **VALIDATED:** Déposer le mémoire final
- **ANALYSIS_COMPLETE:** Attendre appréciation
- **APPROVED:** Accès aux rapports finaux
- **FLAGGED_PLAGIARISM:** Révision/correction nécessaire

---

### 1.4 Dépôt du Mémoire Final (Phase 2, Étape 1)

**Endpoint:** `POST /api/documents/upload-file` (multipart/form-data)

**Conditions préalables (STRICTES):**

1. Étudiant authentifié
2. Thème appartient à l'étudiant
3. Thème a le statut `VALIDATED` (approuvé par Teacher + DA)

**Données requises:**

```
Multipart Form:
- file: [binary PDF/DOCX file]
```

**Validations:**

- Fichier présent (`file` requis)
- Étudiant doit avoir un thème avec statut `VALIDATED` (retrouvé automatiquement)
- Type MIME accepté: `application/pdf` ou `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Taille fichier ≤ 50MB
- Calcul SHA-256 checksum automatique

**Traitement interne:**

1. Authentification de l'étudiant
2. Récupération du thème VALIDATED lié à cet étudiant
3. Validation du fichier
4. Calcul du checksum SHA-256
5. Création d'un enregistrement `document` en base avec:
   - `theme_id` (retrouvé automatiquement)
   - `student_id` (de l'authentification)
   - `original_name` (nom du fichier)
   - `mime_type`
   - `file_size`
   - `checksum` (sha256:...)
   - `is_final: true`
   - `submitted_at: NOW()`
   - **`status = "SUBMITTED"`**

**Résultat en cas de succès:**

- Code 201
- Réponse: `{ ok: true, document: { id: "25", status: "SUBMITTED" } }`
- Message UI: `"Document uploadé: 25. Analyse Plagiat + IA en cours..."`
- **Lancement automatique de la Phase 2 (Analyse Technique)**
- L'analyseprend environ 24h (simulé : immédiat en développement)

**Résultat en cas d'échec:**

- Code 400: fichier invalide, format non supporté, trop volumineux
- Code 401: étudiant non authentifié
- Code 403: étudiant n'a pas de thème VALIDATED
- Code 422: validation schema échouée

**État du document:**

```
SUBMITTED ← Document uploadé
  ↓
Analyse Profonde Automatisée (Plagiat + Détection IA)
  ↓
ANALYSIS_COMPLETE ← Scores générés, rapport créé
```

**UI/UX:**

- Zone de dépôt avec drag-and-drop (SEUL champ)
- Affichage du thème lié (lecture seule): `"Thème: [titre du thème VALIDATED]"`
- Message de validation du fichier avant upload
- Affichage de la progression d'upload
- Message de succès: `"Votre document a été uploadé. Analyse en cours. Résultats disponibles dans 24h."`
- Liste des documents récents avec statut et progression d'analyse

---

### 1.5 Analyse Profonde du Document (Phase 2, Étape 2)

**Processus Automatique Lancé à la Soumission**

Cette étape s'exécute **automatiquement** après le dépôt du document (section 1.4).

**Analyses Effectuées:**

#### 1. Détection Plagiat Sémantique

- **Comparaison:** Document vs. tous les mémoires stockés + sources web
- **Méthode:** Similarité cosinus sur embeddings sémantiques
- **Résultat:** Score de similarité (0-100%)
- **Sortie:**
  - `plagiarism_score`: Pourcentage (ex: 15%)
  - `matched_sources`: Liste des documents/sources similaires
  - `highlighted_segments`: Passages suspects avec offset

#### 2. Détection d'Automatisation (IA)

- **Détection:** Analyse des motifs linguistiques pour identifier génération IA
- **Méthode:** Machine learning sur patterns textuels (répétitions, structure, vocabulaire)
- **Résultat:** Score de probabilité IA (0-100%)
- **Sortie:**
  - `ai_detection_score`: Pourcentage (ex: 8%)
  - `ai_probability`: `low` / `medium` / `high`
  - `risk_indicators`: Zones de texte suspectes

**Résultat Complet:** 🔲 Planifié — structure JSON cible

```json
{
  "document_id": "25",
  "analysis_type": "DEEP_ANALYSIS",
  "plagiarism_score": 15,
  "ai_detection_score": 8,
  "combined_risk_score": 22,
  "risk_level": "MEDIUM",
  "matched_sources": [
    { "id": "10", "title": "...", "similarity": 0.73 },
    { "id": "35", "title": "...", "similarity": 0.68 }
  ],
  "ai_indicators": [
    { "type": "repetition_pattern", "severity": "low" },
    { "type": "formal_structure", "severity": "medium" }
  ],
  "analyzed_at": "2026-04-19T14:30:00Z",
  "status": "ANALYSIS_COMPLETE"
}
```

**État du Document:**

```
SUBMITTED (document reçu)
  ↓
ANALYSIS_IN_PROGRESS (analyse sémantique + IA)
  ↓
ANALYSIS_COMPLETE (scores générés)
  ↓
→ Phase 3 : Application du Seuil 20% (voir section 1.6)
```

**Endpoint cible (Étudiant):** `GET /api/documents/{id}/analysis` 🔲 Planifié — non implémenté

L'étudiant pourra consulter les scores (read-only après génération).

---

### 1.6 Phase 3: Le Verdict - Application du Seuil 20%

**Filtre Automatique (Seuil 20%)**

Une fois l'analyse complète, le système applique un **seuil strict** sur le score plagiat combiné:

```
SI plagiarism_score + (ai_detection_score * 0.5) < 20%:
    → FLAGGED = false (Document "propre")
    → État: CLEAN
    → Peut avancer vers appréciation humaine

SINON:
    → FLAGGED = true (Alerte plagiat)
    → État: FLAGGED_PLAGIARISM
    → Demande révision/correction
    → Étudiant reçoit notification
```

**Cas d'Usage 1: Score < 20% (Document Propre)**

- Le document passe le filtre automatique
- État du document: `CLEAN`
- État du thème: `ANALYSIS_PENDING` (en attente d'appréciation humaine)
- Notification à l'étudiant: `"Votre document a passé la vérification d'intégrité. En attente d'appréciation de la commission."`
- **Passage à l'Appréciation Humaine** (voir section 1.7)

**Cas d'Usage 2: Score ≥ 20% (Alerte Plagiat)**

- Le document est automatiquement **REJETÉ** ou **FLAGGED** pour révision
- État du document: `FLAGGED_PLAGIARISM`
- État du thème: `FLAGGED_PLAGIARISM`
- Notification à l'étudiant: `"ALERTE: Votre document contient {score}% de contenu similaire/automatisé. Révision requise. Dépôt d'une nouvelle version possible."`
- Options pour l'étudiant:
  - ✅ Déposer une nouvelle version corrigée
  - ✅ Contester le résultat (escalade vers Chef + DA pour révision manuelle)

**Endpoint:** Phase automatique, pas d'endpoint direct

---

### 1.7 Appréciation Humaine Finale (Phase 3, Étape 2)

**Conditions Préalables:**

1. Document en état `CLEAN` (score < 20%)
2. Analyse complète disponible
3. Chef de département ET Direction Académique consultent le rapport

**Processus Collaboratif:**

1. **Chef de Département (TEACHER) consulte:**
   - Rapport d'analyse complète
   - Segments surlignés
   - Scores plagiat + IA
   - Historique du thème

2. **Direction Académique (DA) consulte:**
   - Mêmes informations
   - Décisions antérieures (si révisions)

3. **Appréciation Conjointe:**
   - Discussion via commentaires sur le rapport (optionnel)
   - Validation indépendante ou concertée
   - Enregistrement de la décision finale

**Décisions Possibles:**

| Décision                | Description                                                         |
| ----------------------- | ------------------------------------------------------------------- |
| `APPROVED`              | Document accepté, soutenance autorisée                              |
| `APPROVED_WITH_MENTION` | Accepté avec distinction (Très Bien, Bien, etc.)                    |
| `CONDITIONAL_APPROVAL`  | Accepté sous conditions (corrections mineures, commentaires)        |
| `REQUESTED_REVIEW`      | Demande révision plus profonde (plagiat suspect malgré score < 20%) |
| `REJECTED`              | Rejeté (qualité insuffisante, intégrité compromise)                 |

**Endpoint cible:** `POST /api/documents/{id}/final-appreciation` 🔲 Planifié — non implémenté

```json
{
  "decision": "APPROVED",
  "teacher_comment": "Travail de qualité, méthodologie rigoureuse.",
  "da_comment": "Conforme aux standards académiques. Approuvé.",
  "mention": "BIEN",
  "conditions": null
}
```

**Résultat:**

- Réponse: `{ ok: true, document: { id: "25", status: "APPROVED" } }`
- États finaux:
  - Document: `APPROVED` / `APPROVED_WITH_MENTION` / `CONDITIONAL_APPROVAL` / `REQUESTED_REVIEW` / `REJECTED`
  - Thème: `APPROVED` / `APPROVED_WITH_MENTION` / etc.
- Notification à l'étudiant: `"Appréciation finale reçue: APPROVED. Soutenance autorisée le [DATE]."`

**UI/UX:**

- Panneau "Appréciation Finale" visible pour TEACHER + DA
- Affichage du rapport complet
- Champs de commentaire pour chaque rôle
- Dropdown pour décision finale
- Historique des commentaires antérieurs (si révisions)

---

### 1.8 Workflow Complet Étudiant (Diagramme v2)

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 0: AUTHENTIFICATION                               │
│    ├─ INE + mot de passe                               │
│    └─ Redirection → /student                           │
└─────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 1: LE THÈME (Validation Conjointe)               │
│ • Proposition + Auto-Check (70% seuil)                  │
│ • POST /api/themes/propose                              │
│ • SI doublon: REJECTED automatique                     │
│ • SI OK: PENDING_VALIDATION                            │
│            ↓                                           │
│     Votes parallèles: Teacher + DA                      │
│            ↓                                           │
│  SI 2 approuvent: VALIDATED (peut déposer)            │
│  SI 1 rejette: REJECTED                               │
└─────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 2: DOCUMENT (Analyse Automatique)                │
│ • Dépôt: POST /api/documents/upload-file               │
│ • Condition: thème = VALIDATED                         │
│ • Analyse: Plagiat + IA                                │
│ • Seuil 20%: CLEAN ou FLAGGED_PLAGIARISM            │
└─────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 3: APPRÉCIATION FINALE (Teacher + DA)            │
│ POST /api/documents/{id}/final-appreciation            │
│ • Décisions: APPROVED, APPROVED_WITH_MENTION, etc.    │
│ • Si 2 approuvent: Document = APPROVED                 │
│ • Si 1 rejette: Document = REJECTED                   │
└─────────────────────────────────────────────────────────┘
                               ↓
     ┌─────────────────────────┴──────────────────────┐
     ↓                                                ↓
APPROVED (Soutenance)                  REJECTED (Fin)
```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 0: AUTHENTIFICATION                                       │
│    ├─ INE + mot de passe                                         │
│    └─ Redirection → /student                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: LE THÈME (Double Barrière)                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Étape 1: Proposition + Auto-Check Algorithmique            │ │
│ │ POST /api/themes/propose {title, description}              │ │
│ │   ↓ Vérification automatique vs historique (70% seuil)     │ │
│ │   ↓ SI doublon: REJECTED automatiquement                   │ │
│ │   ↓ SI OK: Thème PENDING_VALIDATION                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│              ↓                                   ↓              │
│     ┌────────────────┐                ┌──────────────────┐      │
│     ↓ AUTO-REJECTED  ↓                ↓ AUTO-APPROVED    ↓      │
│   REJECTED        Étape 2: Validation Simultanée           │
│  (Fin)         Chef Département + DA                      │
│                                       ↓                    │
│                   ┌──────────────────┴──────────────────┐  │
│                   ↓                                     ↓  │
│              REJETÉ par commission          APPROUVÉ par commission
│                   │                                     │  │
│                   └──REJECTED                  VALIDATED──┘ │
│                      (Fin)                   (peut déposer)
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: LE DOCUMENT (Analyse Technique)                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Étape 1: Dépôt du Mémoire                                  │ │
│ │ POST /api/documents/upload-file                            │ │
│ │ → Conditions: thème = VALIDATED                            │ │
│ │ → État document: SUBMITTED                                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│              ↓                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Étape 2: Analyse Profonde (Automatique)                    │ │
│ │ • Détection Plagiat Sémantique (0-100%)                    │ │
│ │ • Détection IA Automatisée (0-100%)                        │ │
│ │ → État document: ANALYSIS_COMPLETE                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: LE VERDICT (Appréciation Finale)                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Étape 1: Filtre Automatique 20%                            │ │
│ │ IF score_plagiat + (score_ia * 0.5) < 20%:                │ │
│ │    → État: CLEAN                                           │ │
│ │ ELSE:                                                      │ │
│ │    → État: FLAGGED_PLAGIARISM                             │ │
│ │    → Notification étudiant + option révision              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│              ↓                                   ↓              │
│     ┌────────────────┐                ┌──────────────────┐      │
│     ↓ FLAGGED        ↓                ↓ CLEAN            ↓      │
│  PLAGIARISM       Étape 2: Appréciation Humaine           │
│  Révision requis  Chef Département + DA consultent        │
│                   POST /api/documents/{id}/final-appreciation│
│                       ↓                                    │
│                   Décisions possibles:                     │
│                   • APPROVED                               │
│                   • APPROVED_WITH_MENTION                  │
│                   • CONDITIONAL_APPROVAL                   │
│                   • REQUESTED_REVIEW                       │
│                   • REJECTED                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────┴──────────────────────┐
    ↓                                                ↓
APPROVED / WITH MENTION       CONDITIONAL / REJECTED
Soutenance autorisée         Révision ou fin
```

---

---

## 2. WORKFLOW ENSEIGNANT (TEACHER)

### 2.1 Authentification & Accès

**Point d'entrée:** Page d'accueil `/`

- L'enseignant saisit son **email** et mot de passe
- Le système valide via `/api/login`
- Redirection vers `/teacher` (tableau de bord enseignant)

**Comptes de démo:**

- Email: `teacher@handal.local`
- Mot de passe: `mon926732`

**Permissions:**

- Accès exclusif à `/teacher`
- Accès en lecture aux thèmes en attente de modération
- Accès en lecture aux rapports
- Accès en écriture pour modérer thèmes et lancer analyses

---

### 2.2 Consultation des Thèmes en Attente

**Endpoint:** `GET /api/themes/pending`

**Conditions préalables:**

- Enseignant authentifié
- Rôle: TEACHER ou ADMIN

**Résultat:**

```json
{
  "ok": true,
  "themes": [
    {
      "id": "12",
      "title": "Détection de plagiat multilingue",
      "status": "PENDING",
      "description": "...",
      "student": {
        "name": "Jean Dupont",
        "ine": "N01331820231"
      }
    }
  ]
}
```

**UI/UX:**

- Panneau "Thèmes en attente" affiche liste interactive
- Clic sur thème rempli les champs de modération
- Affichage: titre, ID, nom étudiant, INE

---

### 2.3 Validation Conjointe du Thème (Phase 1, Étape 2) ✅ Implémenté

**Endpoint:** `POST /api/themes/{id}/vote`

**Conditions préalables:**

1. Utilisateur authentifié
2. Rôle: TEACHER ou DA ou ADMIN
3. Thème avec statut `PENDING_VALIDATION`
4. Votes parallèles: chaque validateur vote indépendamment

**Requête (Teacher ou DA):**

```json
{
  "decision": "approved",
  "comment": "Thème pertinent sur le plan pédagogique."
}
```

**Traitement interne (validateThemeVotingV2):**

1. Vérification thème = `PENDING_VALIDATION`
2. Enregistrement vote:
   - Teacher: `teacherVote`, `teacherComment`, `teacherVotedAt`
   - DA: `daVote`, `daComment`, `daVotedAt`
3. Si les 2 ont voté:
   - Approuvent tous les 2 → `VALIDATED`
   - Un rejette → `REJECTED`
4. Notification automatique à l'étudiant

**Résultat:**

- 1er votant: `{ ok: true, status: "PENDING_VALIDATION", message: "En attente de l'autre validateur" }`
- 2ème votant: `{ ok: true, status: "VALIDATED" ou "REJECTED" }`
- Notification étudiant automatique

**UI/UX:**

- Liste des thèmes en attente
- Bouton "Approuver" ou "Rejeter" pour chaque rôle
- Affichage en temps réel du statut des votes

---

### 2.4 Consultation des Rapports

**Endpoint:** `GET /api/reports`

**Conditions préalables:**

- Enseignant authentifié
- Rôle: TEACHER, DA ou ADMIN

**Résultat:**

```json
{
  "ok": true,
  "reports": [
    {
      "id": "1",
      "documentId": "25",
      "globalSimilarity": "15",
      "riskLevel": "low",
      "analyzedAt": "2026-04-19T11:00:00Z"
    }
  ]
}
```

**UI/UX:**

- Panneau "Rapports" avec liste des rapports générés
- Affichage: ID rapport, ID document, similarité globale, niveau de risque, date d'analyse
- Clic sur rapport = navigation détaillée (voir section 2.5)

---

### 2.5 Consultation Détaillée d'un Rapport

**Endpoint:** `GET /api/reports/{report}`

**Conditions préalables:**

- Enseignant authentifié
- Rapport existe
- Rôle: TEACHER, DA ou ADMIN

**Résultat:**

```json
{
  "ok": true,
  "report": {
    "id": "1",
    "documentId": "25",
    "globalSimilarity": "15",
    "aiScore": "5",
    "riskLevel": "low",
    "matchedSources": ["source1.txt", "source2.pdf"],
    "highlightedSegments": [
      {
        "text": "The rapid evolution of...",
        "offset": 150,
        "length": 45
      }
    ],
    "analyzedAt": "2026-04-19T11:00:00Z"
  },
  "finalAppreciation": {
    "teacherDecision": "APPROVED",
    "daDecision": null,
    "finalDecision": null,
    "mention": null
  }
}
```

**UI/UX:**

- Affichage des résultats d'analyse:
  - Score de similarité global
  - Score IA
  - Niveau de risque
  - Sources correspondantes
  - Segments surlignés
- Affichage des votes d'appréciation (Teacher/DA) si déjà saisis
- Bouton "Retour à la liste" ou navigation vers thème/document

---

### 2.6 Consultation des Analyses et Appréciation Finale

L'enseignant participe à deux étapes:

**Étape 1: Consultation des Rapports d'Analyse**

**Endpoint:** `GET /api/reports` et `GET /api/reports/{id}`

Une fois un document analyser (Phase 2), l'enseignant peut consulter les rapports contenant:

- Score de plagiat sémantique
- Score de détection IA
- Sources correspondantes
- Segments surlignés

**Étape 2: Appréciation Finale Conjointe avec DA**

**Endpoint:** `POST /api/documents/{id}/final-appreciation` (Identique à section 1.7)

L'enseignant:

1. Consulte le rapport d'analyse
2. Ajoute son commentaire pédagogique
3. En coordination avec DA, enregistre la décision finale:
   - `APPROVED`
   - `APPROVED_WITH_MENTION`
   - `CONDITIONAL_APPROVAL`
   - `REQUESTED_REVIEW`
   - `REJECTED`

Voir section 1.7 pour détails complets.

---

### 2.7 Workflow Complet Enseignant (Diagramme v2)

```
┌─────────────────────────────────────────────────────────┐
│ 1. AUTHENTIFICATION                                     │
│    ├─ Email + mot de passe                            │
│    └─ Redirection → /teacher                          │
└─────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────┐
│ 2. PHASE 1 - VOTE THÈME (Parallèle)                  │
│    ├─ GET /api/themes/pending                         │
│    ├─ Vote: POST /api/themes/{id}/vote               │
│    │   ├─ Decision: approved/rejected                │
│    │   └─ Commentaire pédagogique                   │
│    └─ Résultat: VALIDATED (2 approbations)          │
│       ou REJECTED (1 rejet)                           │
└─────────────────────────────────────────────────────────┘
                               ↓
     ┌──────────────────────────┴──────────────────────┐
     ↓                                                  ↓
Thème VALIDATED                             Thème REJECTED
 (étudiant dépose)                          (fin)
     │                                            │
     └──────────────────────────┬──────────────────┘
                               ↓
     ┌─────────────────────────────────────────────────┐
     │ PHASE 2 - ANALYSE AUTOMATIQUE (Déclenchée)     │
     │ Document → Plagiat + IA → CLEAN/FLAGGED        │
     └─────────────────────────────────────────────────┘
                               ↓
     ┌─────────────────────────────────────────────────┐
     │ 3. PHASE 3 - APPRÉCIATION FINALE                │
     │    ├─ Consultation rapport                       │
     │    ├─ POST /api/documents/{id}/final-appreciation│
     │    │   ├─ Decision + commentaire                 │
     │    │   └─ En attente vote DA                    │
     │    └─ Résultat: APPROVED/REJECTED              │
     └─────────────────────────────────────────────────┘
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. AUTHENTIFICATION                                             │
│    ├─ Email + mot de passe                                      │
│    └─ Redirection → /teacher                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. PHASE 1 - VALIDATION SIMULTANÉE DU THÈME                     │
│    ├─ GET /api/themes/pending                                   │
│    ├─ Affiche thèmes PENDING_VALIDATION + résultat auto-check   │
│    ├─ PATCH /api/themes/{id}/validate-joint                     │
│    │   ├─ Envoi decision (approved/rejected) + commentaire      │
│    │   └─ En attente vote DA (si DA n'a pas voté)              │
│    └─ Résultat: Thème VALIDATED ou REJECTED                     │
│       (Coordonné avec DA)                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
    ┌──────────────────────────┴──────────────────────┐
    ↓                                                  ↓
Thème VALIDATED                             Thème REJECTED
(étudiant peut déposer)                     (fin du processus)
    │                                            │
    └──────────────────────────┬──────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────┐
    │ ÉTUDIANT DÉPOSE DOCUMENT                        │
    │ (Phase 2 - Analyse Automatique lancée)          │
    └─────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────┐
    │ 3. PHASE 3 - APPRÉCIATION FINALE CONJOINTE      │
    │    ├─ GET /api/reports                          │
    │    ├─ GET /api/reports/{id}                     │
    │    │   (Consultation rapport plagiat + IA)      │
    │    ├─ POST /api/documents/{id}/final-appreciation│
    │    │   ├─ Envoi decision + comment pédagogique  │
    │    │   ├─ En attente validation DA              │
    │    │   └─ Décisions: APPROVED, CONDITIONAL,     │
    │    │       REQUESTED_REVIEW, REJECTED           │
    │    └─ Résultat: Document APPROVED ou autre      │
    └─────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────┐
    │ 4. NOTIFICATION ÉTUDIANT                        │
    │    ├─ Si APPROVED: Soutenance autorisée         │
    │    ├─ Si CONDITIONAL: Avec conditions           │
    │    ├─ Si REQUESTED_REVIEW: Révision requise     │
    │    └─ Si REJECTED: Rejet académique             │
    └─────────────────────────────────────────────────┘
```

---

---

## 3. WORKFLOW DIRECTION ACADÉMIQUE (DA)

### 3.1 Authentification & Accès

**Point d'entrée:** Page d'accueil `/`

- Le responsable DA saisit son **email** et mot de passe
- Le système valide via `/api/login`
- Redirection vers `/da` (tableau de bord DA)

**Comptes de démo:**

- Email: `da@handal.local`
- Mot de passe: `mon926732`

**Permissions:**

- Accès exclusif à `/da`
- Accès en lecture aux thèmes en attente de validation académique
- Accès en lecture/écriture aux rapports et délibérations
- Consultation profiles étudiants/enseignants

---

### 3.2 Consultation des Thèmes en Attente (Validation Conjointe)

**Endpoint:** `GET /api/themes/pending`

**Conditions préalables:**

- DA authentifié
- Rôle: DA ou ADMIN

**Résultat:**

Liste de thèmes en état `PENDING_VALIDATION` (attend votes Teacher + DA)

```json
{
  "ok": true,
  "themes": [
    {
      "id": "12",
      "title": "Détection de plagiat multilingue",
      "status": "PENDING_VALIDATION",
      "teacherVote": null,
      "daVote": null,
      "student": {
        "name": "Jean Dupont",
        "ine": "N01331820231"
      }
    }
  ]
}
```

**UI/UX:**

- Panneau "Thèmes en attente de validation"
- Affichage: titre, ID, nom étudiant, état des votes Teacher/DA
- Clic → formulaire de vote DA

---

### 3.3 Validation Simultanée du Thème (Phase 1, Étape 2)

Identique à section 2.3. La DA utilise le même endpoint `PATCH /api/themes/{theme}/validate-joint` avec `validator_role = "DA"`.

Voir section 2.3 pour la documentation complète.

---

### 3.4 Consultation des Rapports d'Analyse

**Endpoint:** `GET /api/reports` et `GET /api/reports/{id}`

Identique au workflow TEACHER (section 2.4).

La DA a accès à **tous** les rapports du système.

---

### 3.5 Appréciation Finale Conjointe avec Teacher

**Endpoint:** `POST /api/documents/{id}/final-appreciation` ✅ Implémenté

La DA:

1. Consulte le rapport d'analyse (plagiat + IA)
2. Vote via l'API (décision + commentaire)
3. En coordination avec Teacher, enregistre la décision finale
4. Décisions possibles:
   - `APPROVED` → Soutenance autorisée
   - `APPROVED_WITH_MENTION` → Avec mention
   - `CONDITIONAL_APPROVAL` → Sous conditions
   - `REQUESTED_REVIEW` → Révision demandée
   - `REJECTED` → Rejeté

**Traitement:**
- Si les 2 approuvent → `APPROVED`, Document = `APPROVED`
- Si l'un rejette → Document = `REJECTED`
- Notification automatique à l'étudiant

---

### 3.6 Workflow Complet DA (Diagramme)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. AUTHENTIFICATION                                             │
│    ├─ Email + mot de passe                                      │
│    └─ Redirection → /da                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. PHASE 1 - VALIDATION SIMULTANÉE DU THÈME                     │
│    ├─ GET /api/themes/pending                                   │
│    ├─ Affiche thèmes PENDING_VALIDATION + résultat auto-check   │
│    ├─ PATCH /api/themes/{id}/validate-joint                     │
│    │   ├─ Envoi decision (approved/rejected) + commentaire      │
│    │   └─ En attente vote Chef de département (si Chef n'a pas) │
│    └─ Résultat: Thème VALIDATED ou REJECTED                     │
│       (Coordonné avec Chef)                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
    ┌──────────────────────────┴──────────────────────┐
    ↓                                                  ↓
Thème VALIDATED                             Thème REJECTED
(étudiant peut déposer)                     (fin du processus)
    │                                            │
    └──────────────────────────┬──────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────┐
    │ ÉTUDIANT DÉPOSE DOCUMENT                        │
    │ (Phase 2 - Analyse Automatique lancée)          │
    │ • Plagiat sémantique (0-100%)                   │
    │ • Détection IA (0-100%)                         │
    │ • Rapport généré après ~24h                     │
    └─────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────┐
    │ 3. PHASE 3 - FILTRE AUTOMATIQUE 20%             │
    │    IF score < 20%: → CLEAN                      │
    │    ELSE: → FLAGGED_PLAGIARISM                   │
    └─────────────────────────────────────────────────┘
                    ↓               ↓
    ┌──────────────────┐    ┌──────────────────┐
    ↓                  ↓    ↓                  ↓
  CLEAN           FLAGGED_PLAGIARISM
    │                  │
    └────────┬─────────┘
             ↓
    ┌─────────────────────────────────────────────────┐
    │ 4. APPRÉCIATION FINALE CONJOINTE AVEC CHEF      │
    │    ├─ GET /api/reports/{id}                     │
    │    │   (Consultation rapport complet)           │
    │    ├─ POST /api/documents/{id}/final-appreciation│
    │    │   ├─ Envoi decision + commentaire DA       │
    │    │   ├─ En attente validation Chef            │
    │    │   └─ Décisions: APPROVED, MENTION, etc.    │
    │    └─ Résultat: Document finalisé               │
    └─────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────┐
    │ 5. NOTIFICATION ÉTUDIANT & ARCHIVAGE             │
    │    ├─ Si APPROVED: Soutenance autorisée         │
    │    ├─ Si MENTION: Avec distinction              │
    │    ├─ Si REQUESTED_REVIEW: Révision requise     │
    │    └─ Si REJECTED: Rejet définitif              │
    │                                                  │
    │ Dossier académique complet et traçable          │
    │ Étudiant → Chef → DA → Décision Finale         │
    └─────────────────────────────────────────────────┘
```

---

---

## 4. WORKFLOW ADMINISTRATEUR (ADMIN)

### 4.1 Authentification & Accès

**Point d'entrée:** Page d'accueil `/`

- L'administrateur saisit son **email** et mot de passe
- Le système valide via `/api/login`
- Redirection vers `/admin` (tableau de bord admin)

**Comptes de démo:**

- Email: `admin@handal.local`
- Mot de passe: `mon926732`

**Permissions:**

- Accès exclusif à `/admin`
- **Hérite de tous les rôles:** STUDENT, TEACHER, DA
- Peut accéder à toutes les routes protégées
- Consultation des états serveur et logs

---

### 4.2 Superposition des Permissions

L'admin peut effectuer **toutes les actions** des trois rôles:

#### Actions TEACHER:

- Modérer les thèmes (validation locale CD)
- Lancer l'analyse officielle sur documents
- Consulter rapports

#### Actions DA:

- Valider les thèmes académiquement (validation DA)
- Enregistrer délibérations
- Consulter rapports

#### Actions STUDENT:

- Proposer des thèmes pour testing
- Déposer des documents
- Lancer auto-tests

---

### 4.3 Tableau de Bord Admin

**Endpoint:** `GET /api/me/overview`

Le dashboard admin affiche:

- Profil: nom, rôle = ADMIN
- Raccourcis rapides vers:
  - `/student` (tableau de bord étudiant)
  - `/teacher` (tableau de bord enseignant)
  - `/da` (tableau de bord DA)
  - `/api/reports` (JSON des rapports)
- État du serveur:
  - Santé API (ping)
  - Messages système
  - Logs (si disponibles)

**UI/UX:**

- Vue centralisée avec cards shortcut
- Accès direct à chaque espace fonctionnel
- Console admin pour monitoring

---

### 4.4 Workflow Admin (Résumé)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. AUTHENTIFICATION ADMIN                                       │
│    ├─ Email: admin@handal.local + mot de passe                 │
│    └─ Redirection → /admin (dashboard central)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. ACCÈS CENTRALISÉ À TOUS LES ESPACES                          │
│    ├─ Lien → /student (agir comme étudiant)                     │
│    ├─ Lien → /teacher (modérer thèmes + analyses)               │
│    ├─ Lien → /da (validation académique + délibération)         │
│    └─ Lien → /api/reports (JSON rapports)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. ACTIONS POSSIBLES (SUPER-UTILISATEUR)                        │
│    ├─ Créer/proposer des thèmes de test                         │
│    ├─ Modérer thèmes (approve/reject comme TEACHER)             │
│    ├─ Valider académiquement (approve/reject comme DA)          │
│    ├─ Déposer documents                                          │
│    ├─ Lancer analyses officielles                                │
│    ├─ Enregistrer délibérations                                  │
│    └─ Consulter tous les rapports et états                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. MONITORING / CONSOLE ADMIN                                   │
│    ├─ État serveur (ping API)                                   │
│    ├─ Messages système                                          │
│    └─ Accès rapide à l'API JSON pour debug                      │
└─────────────────────────────────────────────────────────────────┘
```

---

---

## 5. ÉTATS ET TRANSITIONS GLOBALES (Nouveau Système 3 Phases)

### 5.1 États du Thème (NOUVEAU)

```
┌──────────────────────────────────────────────────────────────┐
│                 PENDING_VALIDATION (Nouveau)                 │
│    (Créé après auto-check algo OK, attend votes)             │
│                          ↓                                    │
│          ┌───────────────┴───────────────┐                   │
│          ↓                               ↓                   │
│    Vote TEACHER                    Vote DA                   │
│          ├─ approved                ├─ approved              │
│          ├─ rejected                ├─ rejected              │
│          └─ (En attente DA)          └─ (En attente TEACHER) │
│                          ↓                                    │
│     Si les deux approuvent:                                  │
│              ↓                                                │
│         VALIDATED (Nouveau)                                  │
│    (Étudiant peut déposer)                                   │
│              ↓                                                │
│     Si au moins un rejette:                                  │
│              ↓                                                │
│         REJECTED (Final)                                     │
│    (Étudiant ne peut pas déposer)                            │
│                                                               │
│     Après dépôt et analyse:                                  │
│              ↓                                                │
│     ANALYSIS_PENDING (Nouveau)                               │
│     (En attente appréciation Chef + DA)                      │
│              ↓                                                │
│     APPROVED / APPROVED_WITH_MENTION (Nouveaux)              │
│     CONDITIONAL_APPROVAL / REJECTED (Nouveaux)               │
│     FLAGGED_PLAGIARISM (Nouveau - si score ≥ 20%)            │
└──────────────────────────────────────────────────────────────┘
```

**Transitions possibles:**

PHASE 1:

- `PENDING_VALIDATION` → `VALIDATED` (votes conjoints OK)
- `PENDING_VALIDATION` → `REJECTED` (au moins un vote rejeté)

PHASE 2:

- `VALIDATED` → `DOCUMENT_SUBMITTED` (étudiant dépose)
- `DOCUMENT_SUBMITTED` → `ANALYSIS_COMPLETE` (analyse auto termine)

PHASE 3:

- `ANALYSIS_COMPLETE` → `CLEAN` ou `FLAGGED_PLAGIARISM` (filtre 20%)
- `CLEAN` → `ANALYSIS_PENDING` (en attente appréciation humaine)
- `FLAGGED_PLAGIARISM` → `DOCUMENT_REJECTED` ou dépôt révision
- `ANALYSIS_PENDING` → `APPROVED`, `APPROVED_WITH_MENTION`, etc.

**Règles:**

- Un thème REJECTED (Phase 1) est définitif - pas de dépôt possible
- Un thème FLAGGED_PLAGIARISM peut permettre une révision et re-upload
- Un thème APPROVED peut avoir plusieurs mentions ou conditions

---

### 5.2 États du Document

```
┌──────────────────────────────────────────────────────────────┐
│                    SUBMITTED (Nouveau)                       │
│         (Créé après upload, thème = VALIDATED)               │
│                          ↓                                    │
│                ANALYSIS_IN_PROGRESS                          │
│         (Plagiat sémantique + Détection IA)                 │
│                          ↓                                    │
│                ANALYSIS_COMPLETE (Nouveau)                   │
│         (Scores générés)                                      │
│                          ↓                                    │
│    ┌────────────────────┴────────────────────┐               │
│    ↓                                         ↓               │
│ CLEAN (score < 20%)              FLAGGED_PLAGIARISM         │
│    ↓                              (score ≥ 20%)             │
│ Appréciation Teacher + DA          Dépôt révision           │
│    ↓                                (nouvelle analyse)      │
│ Décisions finales:                                           │
│ • APPROVED                                                   │
│ • APPROVED_WITH_MENTION                                      │
│ • CONDITIONAL_APPROVAL                                       │
│ • REQUESTED_REVIEW                                           │
│ • REJECTED                                                   │
└──────────────────────────────────────────────────────────────┘
```

**Règles:**

- Un document ne peut être uploadé que si thème = VALIDATED
- Analyse automatique se lance dès upload (no manual trigger needed)
- Seuil 20% détermine automatiquement CLEAN vs FLAGGED
- Appréciation humaine nécessite les deux rôles (Chef + DA)

---

### 5.3 États du Rapport

```
┌──────────────────────────────────────────────────────────────┐
│               GENERATED (Rapport généré auto)                │
│         Scores plagiat sémantique + détection IA             │
│         Sources correspondantes et segments surlignés        │
│                          ↓                                    │
│            ┌─────────────┴──────────────┐                   │
│            ↓                            ↓                   │
│     CLEAN                    FLAGGED_PLAGIARISM             │
│ (score < 20%)                (score ≥ 20%)                  │
│     ↓                            ↓                          │
│ AWAITING_APPRECIATION       AWAITING_STUDENT_RESPONSE      │
│ (En attente Teacher + DA)   (Étudiant doit réviser)        │
│     ↓                            ↓                          │
│ APPRECIATED                REVISION_SUBMITTED              │
│ (Décision enregistrée)      (Nouveau dépôt)                │
│                                 ↓                          │
│                         Nouvelle analyse                    │
│                                 ↓                          │
│                         Nouveau rapport                    │
└──────────────────────────────────────────────────────────────┘
```

---

---

## 6. PROTECTION ET CONTRÔLES D'ACCÈS

### 6.1 Garde-Fous par Endpoint

| Endpoint                                      | Statut | Rôles Autorisés             | Conditions Supplémentaires              |
| --------------------------------------------- | ------ | --------------------------- | --------------------------------------- |
| `POST /api/themes/propose`                    | ✅     | STUDENT                     | Vérification unicité titre              |
| `GET /api/themes/pending`                     | ✅     | TEACHER, DA, ADMIN          | Retourne thèmes PENDING_VALIDATION      |
| `POST /api/themes/{id}/vote`                  | ✅     | TEACHER, DA, ADMIN          | Vote parallèle                          |
| `POST /api/documents/upload-file`             | ✅     | STUDENT                     | Thème VALIDATED requis                  |
| `GET /api/documents/{id}/analysis`            | 🔲     | STUDENT, TEACHER, DA, ADMIN | **Cible v2** — consultation scores      |
| `GET /api/reports`                            | ✅     | TEACHER, DA, ADMIN          | Lecture seule                           |
| `GET /api/reports/{id}`                       | ✅     | TEACHER, DA, ADMIN          | Lecture seule                           |
| `POST /api/reports/{id}/deliberate`           | 🔲     | DA, ADMIN                   | Legacy v1 (non utilisé en v2)           |
| `POST /api/documents/{id}/final-appreciation` | ✅     | TEACHER, DA, ADMIN          | Appréciation conjointe                  |

### 6.2 Seuils Critiques

| Seuil                      | Signification                              | Action                           |
| -------------------------- | ------------------------------------------ | -------------------------------- |
| **70% (Auto-Check Thème)** | Similarité titre/description vs historique | Rejet automatique si ≥ 70%       |
| **20% (Filtre Plagiat)**   | Score plagiat + (score IA \* 0.5)          | CLEAN si < 20%, FLAGGED si ≥ 20% |

### 6.3 Sécurité Transversale

- **Same-origin check:** `/api` routes vérifient l'en-tête Origin
- **Authentification:** Tous les endpoints requièrent une session valide
- **Autorisation:** Vérification du rôle via guard functions
- **Validation d'input:** Zod schemas côté backend
- **Persistance:** Enregistrements liés à l'utilisateur authentifié
- **Audit:** Historique complet des votes, commentaires, décisions

---

---

## 7. FLUX DE DONNÉES CLÉS (Nouveau Système 3 Phases)

### 7.1 Flux Principal: Thème → Analyse → Verdict

```
PHASE 1: LE THÈME (Double Barrière)
════════════════════════════════════════════════════════════════

STUDENT crée THÈME
  ↓
  POST /api/themes/propose {title, description}
  ↓
  Auto-Check Algorithmique vs Historique
  ├─ IF ≥ 70% similarité: REJECTED (fin)
  └─ IF < 70%: Thème PENDING_VALIDATION
  ↓
TEACHER vote (vote 1)
   ↓
  POST /api/themes/{id}/vote
  {decision: "approved/rejected", comment}
  ├─ Si TEACHER rejette: Vote TEACHER = rejected
  ├─ Si TEACHER approuve: Vote TEACHER = approved (attend DA)
  └─ En attente vote DA
  ↓
DA vote (vote 2)
   ↓
  POST /api/themes/{id}/vote
  {decision: "approved/rejected", comment}
  ├─ Si DA rejette: DECISION = REJECTED (fin)
  ├─ Si DA approuve + TEACHER a approuvé: DECISION = VALIDATED
  └─ Thème VALIDATED → Étudiant peut déposer

════════════════════════════════════════════════════════════════

PHASE 2: LE DOCUMENT (Analyse Technique)
════════════════════════════════════════════════════════════════

STUDENT dépose DOCUMENT
  ↓
  POST /api/documents/upload-file {file, themeId}
  → Conditions: thème VALIDATED
  → État document: SUBMITTED
  ↓
SYSTÈME lance ANALYSE AUTOMATIQUE (parallèle)
  ├─ Détection Plagiat Sémantique
  │  └─ Comparaison vs tous mémoires + sources web
  │  └─ Résultat: plagiarism_score (0-100%)
  ├─ Détection IA Automatisée
  │  └─ Analyse motifs linguistiques
  │  └─ Résultat: ai_detection_score (0-100%)
  └─ Création Rapport
     └─ État document: ANALYSIS_COMPLETE
     └─ Rapport disponible

════════════════════════════════════════════════════════════════

PHASE 3: LE VERDICT (Appréciation Finale avec Seuil 20%)
════════════════════════════════════════════════════════════════

SYSTÈME applique FILTRE AUTOMATIQUE 20%
  ↓
  Calcul: combined_score = plagiarism_score + (ai_detection_score * 0.5)
  ├─ SI combined_score < 20%:
  │  └─ État: CLEAN
  │  └─ Débit: Appréciation Humaine
  └─ SI combined_score ≥ 20%:
     └─ État: FLAGGED_PLAGIARISM
     └─ Notification Étudiant: "Alerte plagiat détectée"
     └─ Option: Déposer version révisée

  TEACHER consulte & apprécie
  ↓
  GET /api/reports/{id} → Affichage rapport complet
  ↓
  POST /api/documents/{id}/final-appreciation
  { decision: "APPROVED" | "APPROVED_WITH_MENTION" | etc, comment: "..." }
  ↓
  État: CLEAN (en attente du vote DA)
  ↓
  DA consulte & apprécie
  ↓
  GET /api/reports/{id} → Affichage rapport + vote TEACHER
  ↓
  POST /api/documents/{id}/final-appreciation
  { decision: "APPROVED", comment: "..." }
  ↓
  DECISION FINALE ENREGISTRÉE
  ├─ État Document: APPROVED ou REJECTED
  └─ Décision finale stockée dans FinalAppreciation
  └─ Notification Étudiant: "Appréciation finale: APPROVED. Soutenance autorisée."

════════════════════════════════════════════════════════════════
```

### 7.2 Flux Alternatif: Document Flagged (Score ≥ 20%)

```
SYSTÈME détecte Plagiat (score ≥ 20%)
  ↓
  État: FLAGGED_PLAGIARISM
  ↓
ÉTUDIANT reçoit notification
  ├─ Message: "Votre document contient {score}% de contenu similaire/IA."
  └─ Options:
     ├─ Déposer version corrigée
     └─ Contester le résultat

ÉTUDIANT dépose révision
  ↓
  POST /api/documents/upload-file (NEW submission)
  ↓
  Nouvelle analyse lancée automatiquement
  ↓
  Scores recalculés
  ├─ IF new_score < 20%: → CLEAN (accès à appréciation)
  └─ IF new_score ≥ 20%: → Maintient FLAGGED (peut re-réviser)
```

---

---

## 8. MESSAGES D'ERREUR COURANTS (Nouveau Système)

| Code | Contexte                                | Message                                                    | Solution                           |
| ---- | --------------------------------------- | ---------------------------------------------------------- | ---------------------------------- |
| 409  | POST /themes/propose                    | "Theme is 87% similar to existing #5. Please reformulate." | Reformuler le titre/description    |
| 400  | POST /themes/propose                    | "Theme title must contain at least 8 characters"           | Augmenter longueur titre           |
| 409  | PATCH /themes/{id}/validate-joint       | "Theme is not PENDING_VALIDATION"                          | Thème déjà validé/rejeté           |
| 409  | PATCH /themes/{id}/validate-joint       | "You have already voted on this theme"                     | Validateur a déjà voté             |
| 403  | POST /documents/upload                  | "Theme must be VALIDATED before document upload"           | Attendre votes Chef + DA           |
| 400  | GET /documents/{id}/analysis            | "Document has not completed analysis yet"                  | Attendre ~24h pour analyse         |
| 403  | POST /documents/{id}/final-appreciation | "Document is FLAGGED_PLAGIARISM (score ≥ 20%)"             | Score trop élevé, révision requise |
| 401  | Any protected route                     | "Unauthenticated"                                          | Se reconnecter                     |

---

## 9. CHECKLIST DE RECETTE MINIMALE (3 Phases)

### Phase 1: Thème

- [ ] STUDENT propose thème unique → Thème PENDING_VALIDATION créé
- [ ] STUDENT propose thème très similaire (≥70%) → 409 Rejected automatiquement
- [ ] TEACHER vote "approved" sur thème PENDING_VALIDATION → Votes enregistrés, attente DA
- [ ] DA vote "approved" sur thème (après TEACHER) → Thème VALIDATED
- [ ] TEACHER rejette → Thème REJECTED immédiatement
- [ ] DA rejette → Thème REJECTED (même si TEACHER avait approuvé)

### Phase 2: Document

- [ ] STUDENT ne peut pas upload si thème ≠ VALIDATED → 403 Forbidden
- [ ] STUDENT upload document valide (PDF/DOCX ≤50MB) → Document SUBMITTED
- [ ] Analyse automatique se lance → État passe à ANALYSIS_COMPLETE après ~24h (ou immédiat en dev)
- [ ] Rapport généré avec scores plagiat + IA → Scores dans gamme 0-100%

### Phase 3: Verdict

- [ ] Document avec score plagiat < 20% → État CLEAN
- [ ] Document avec score plagiat ≥ 20% → État FLAGGED_PLAGIARISM + notification
- [ ] TEACHER consulte rapport CLEAN → Peut enregistrer appréciation
- [ ] DA consulte rapport et valide appréciation → Document APPROVED
- [ ] STUDENT reçoit notification APPROVED → Soutenance autorisée
- [ ] STUDENT avec FLAGGED peut uploader révision → Nouvelle analyse lancée

### Validation Globale

- [ ] Non-authentifié → 401 Unauthenticated
- [ ] ADMIN peut effectuer toutes actions des 3 rôles
- [ ] Historique complet des votes/commentaires/décisions enregistré
- [ ] Tous les seuils (70%, 20%) correctement appliqués

---

## 10. NOTES IMPORTANTES (Nouveau Système)

### 10.1 Seuils Critiques

- **70% (Auto-Check Thème):** Doublon détecté → Rejet automatique immédiat
- **20% (Filtre Plagiat):** Seuil strict de similarité (plagiat + IA\*0.5) → Décide CLEAN vs FLAGGED

### 10.2 Statuts et États

- Tous les statuts sont en **MAJUSCULES**: `PENDING_VALIDATION`, `VALIDATED`, `REJECTED`, `CLEAN`, `FLAGGED_PLAGIARISM`, etc.
- États intermédiaires: `SUBMITTED`, `ANALYSIS_IN_PROGRESS`, `ANALYSIS_COMPLETE`, `ANALYSIS_PENDING`, `APPROVED`, etc.

### 10.3 Validation Simultanée (Phase 1)

- Chef de département (TEACHER) et DA doivent **TOUS DEUX** voter
- Les deux votes sont indépendants mais coordonnés
- Décision finale: VALIDATED si les deux approuvent, REJECTED si au moins un rejette
- Historique complet des votes enregistré (qui a voté quoi et quand)

### 10.4 Analyse Automatique (Phase 2)

- **Actuellement simulée** (random 0-100%)
- Prête pour intégration vrai moteur Python (similarité sémantique + détection IA)
- Structures JSON pour `matched_sources` et `highlighted_segments` déjà définies
- Analyse se lance automatiquement après upload (pas de trigger manuel)

### 10.5 Appréciation Humaine (Phase 3)

- Chef et DA consultent le rapport **ENSEMBLE** (pas séquentiellement)
- Décisions possibles:
  - `APPROVED`: Soutenance autorisée
  - `APPROVED_WITH_MENTION`: Avec distinction académique
  - `CONDITIONAL_APPROVAL`: Avec conditions/commentaires
  - `REQUESTED_REVIEW`: Demande révision plus approfondie
  - `REJECTED`: Rejet académique

### 10.6 Upload de Fichiers

- Frontend calcule SHA-256 client-side
- Backend crée métadonnée document + checksum
- Structure prête pour real file storage (S3, filesystem, database blobs)
- Supports PDF et DOCX, max 50MB

### 10.7 Révisions et Corrections

- STUDENT peut déposer nouvelle version si score ≥ 20%
- Chaque déposition déclenche nouvelle analyse automatique
- Score doit repasser sous 20% pour accéder à appréciation
- Historique complet de chaque dépôt enregistré

### 10.8 Audit et Traçabilité

- **Complet:** Toutes les actions enregistrées (qui, quand, quoi)
- **Votes:** Historique des approbations/rejets par rôle
- **Commentaires:** Tous les commentaires pédagogiques conservés
- **Scores:** Tous les scores de plagiat/IA pour chaque analyse
- **Décisions:** Décision finale avec date et responsable

### 10.9 Notifications (À Implémenter)

- Étudiant averti quand:
  - Thème VALIDATED (peut déposer)
  - Document en ANALYSIS_IN_PROGRESS
  - Document CLEAN ou FLAGGED_PLAGIARISM
  - Appréciation finale enregistrée
- Actuellement: Refresh manuel requis

---

**Dernière mise à jour:** 19 avril 2026
**Version:** 2.0 (Complet - Nouveau système 3 phases avec seuil 20% implémenté)
