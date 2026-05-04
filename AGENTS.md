# 🤖 Agent Instructions — Handal

Lisez ce fichier au début de chaque session.

---

## 🚀 Démarrage

### Première chose à faire
1. Lire ce fichier en entier
2. Ouvrir `contexts/project-overview.md` (vision globale Handal)
3. Consulter `contexts/progress-tracer.md` (état actuel)

---

## 🧠 Contexte métier obligatoire (Handal)

Avant toute implémentation, garder en tête :

### 🔁 Workflow principal (3 phases)

1. **PHASE 1 — Thème**
   - Proposition étudiant
   - Auto-check anti-doublon (≥70% → rejet auto)
   - Validation conjointe TEACHER + DA

2. **PHASE 2 — Document**
   - Upload PDF/DOCX
   - Extraction + filtrage contenu institutionnel
   - Analyse plagiat + IA

3. **PHASE 3 — Verdict**
   - Score combiné
   - ✅ < 20% → CLEAN → appréciation humaine
   - ❌ ≥ 20% → FLAGGED → réécriture obligatoire

---

## ⚠️ Règles critiques (NON NÉGOCIABLES)

- Toujours utiliser le **titre détecté** (jamais nom fichier / ID)
- Toujours appliquer le **filtrage IBAM** (`content-filter.ts`)
- Ne JAMAIS scorer :
  - pages de garde
  - remerciements
  - contenu institutionnel
- Si score < 20% → **validation automatique CD**
- Tous les statuts doivent être en **MAJUSCULES**

---

## 📂 Avant d’implémenter une feature

1. Lire la spec → `contexts/features-spec/`
2. Vérifier architecture → `contexts/architecture-context.md`
3. Respecter conventions → `contexts/code-standards.md`
4. Vérifier UI → `contexts/ui-context.md`

---

## ⚙️ Workflow standard

Analyser    → Comprendre logique métier (Handal first)
Planifier   → Étapes simples + cohérentes
Implémenter → Code propre, typé, modulaire
Tester      → Cas réels (workflow complet)
Documenter → progress-tracer.md
Commiter   → message clair


---

## 🧩 Spécificités techniques Handal

### Frontend
- Next.js App Router
- Mobile-first obligatoire
- Composants réutilisables :
  - `StatsCard`
  - `AnalysisTable`
  - `ReportModal`

### Backend
- API Routes Next.js
- Prisma ORM
- PostgreSQL

### Analyse
- TF-IDF
- Cosine similarity
- Jaccard
- N-grams

---

## 🎨 UI / UX Rules

- Design épuré (IBAM style)
- Couleur principale : `#6c5448`
- Toujours afficher :
  → titre détecté
  → score clair (CLEAN vs FLAGGED)
- Mobile priorité :
  - `grid-cols-1`
  - `overflow-x-auto`

---

## 🧪 Tests obligatoires

- Tester workflow complet :
  - login → upload → analyse → verdict
- Vérifier :
  - seuil 20%
  - filtrage contenu
  - statuts transitions

---

## 📝 Messages de commit

| Type | Description |
|------|-------------|
| feat: | Nouvelle fonctionnalité |
| fix: | Bug |
| refactor: | Refactoring |
| docs: | Documentation |
| test: | Tests |
| chore: | Maintenance |

Exemples :
- `feat: implement plagiarism threshold logic (20%)`
- `fix: content filter ignoring IBAM headers`
- `refactor: extract analysis service`

---

## 🚫 À éviter absolument

- Ignorer le workflow métier
- Scorer du contenu institutionnel
- Afficher des IDs techniques
- Code non typé (TypeScript strict obligatoire)
- Console.log en production
- Logique métier côté UI uniquement

---

## 🛠️ Gestion des problèmes

### Si bloqué
1. Documenter → `contexts/issues/to-be-fixed/`
2. Update progress-tracer
3. Continuer autre tâche

### Si changement métier
1. Modifier la spec
2. Mettre à jour progress-tracer
3. Adapter code

---

## 🎯 Philosophie

> Handal n’est pas juste une app.
> C’est un système académique intelligent.

Donc :
- priorité à la **logique métier**
- pas juste du code → **du sens**