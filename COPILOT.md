# 🤖 COPILOT.md - Contexte Handal pour GitHub Copilot CLI

**Date**: 24 Avril 2026  
**Version**: 1.0  
**Dernier Fix**: Affichage messages erreur login (allowedDevOrigins + frontend-api.ts)

---

## 📋 Résumé du Projet

**Handal** est une **plateforme académique full-stack Next.js** pour la gestion complète du cycle de vie des mémoires universitaires avec détection de plagiat intégrée. Développée pour l'Institut Burkinabé des Arts et Métiers (IBAM), elle couvre :

- 🎓 Proposition et validation des thèmes
- 📄 Dépôt et analyse anti-plagiat des mémoires
- 👥 Workflows multi-rôles (Étudiant, Chef de Département, Directeur Académique, Admin)
- 📊 Rapports détaillés et appréciation finale
- 🔐 Sécurité robuste avec RBAC et audit complet

**Statut**: ✅ Production-Ready (tous les tests passent)

---

## 🏗️ Stack Technique

```
Frontend    : React 19.2.4 + Next.js 16.2.4 (App Router, TypeScript 5)
Backend     : Next.js API Routes (Node.js runtime)
Database    : MySQL 8.0 (Prisma 6.15.0 ORM)
Auth        : Sessions HMAC-SHA256 (custom, sans NextAuth)
RBAC        : Middleware proxy.ts + guardRole()
Plagiat     : Algorithmes custom (TF-IDF, Jaccard, N-gram)
Tests       : Vitest (unit), Playwright (E2E), Selenium (Python)
Build       : ESLint, TypeScript compiler
```

---

## 👥 Rôles et Responsabilités

| Rôle | Route | Responsabilités |
|------|-------|-----------------|
| 🎓 **Étudiant** | `/student` | Proposer thème, déposer mémoire, consulter verdict |
| 👨🏫 **Chef de Dépt** | `/teacher` | Valider thèmes, apprécier documents, consulter rapports |
| 👔 **Directeur Académique** | `/da` | Valider thèmes, délibérer, gérer références |
| 🔧 **Admin** | `/admin` | Upload références, staging area, supervision |

---

## 🔄 Workflow Principal

### Phases du Processus

1. **Thème (PENDING → PENDING_VALIDATION → VALIDATED/REJECTED)**
   - Étudiant propose thème + description
   - Teacher et DA votent en parallèle
   - État final: VALIDATED si les deux approuvent, REJECTED sinon

2. **Document (Upload + Analyse)**
   - Étudiant dépose PDF du mémoire
   - Validation page de garde (titre vs thème)
   - Analyse automatique plagiat
   - Extraction contenu + calcul scores (TF-IDF, Jaccard, N-gram)

3. **Verdict (Score + Appréciation finale)**
   - **Seuil 20%**: Score < 20% = "propre"
   - Teacher + DA consultent rapport
   - Décision: APPROVED / APPROVED_WITH_MENTION / CONDITIONAL_APPROVAL / REQUESTED_REVIEW / REJECTED
   - Archivage final

---

## 🔍 Algorithmes de Détection Plagiat

**Score Combiné** = `0.4 × cosine + 0.3 × jaccard + 0.3 × ngram`

| Algo | Poids | Détecte |
|------|-------|---------|
| TF-IDF + Cosinus | 40% | Similarité sémantique, reformulations |
| Jaccard | 30% | Similarité lexicale, ensembles |
| N-gram | 30% | Copier-coller, séquences directes |

**Filtrage**: Contenu institutionnel automatiquement exclu (pages de garde, remerciements, bibliographies)

---

## 📁 Structure du Projet

```
handal/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Page d'accueil + LoginPanel
│   │   ├── api/                        # Route Handlers
│   │   │   ├── login/route.ts          # POST /api/login
│   │   │   ├── logout/route.ts         # POST /api/logout
│   │   │   ├── documents/upload-file/  # POST /api/documents/upload-file
│   │   │   └── analysis/...
│   │   ├── student/                    # Dashboard étudiant
│   │   ├── teacher/                    # Dashboard chef de département
│   │   ├── da/                         # Dashboard DA
│   │   └── admin/                      # Dashboard admin
│   ├── components/
│   │   ├── login-panel.tsx             # Formulaire login
│   │   ├── student-dashboard.tsx
│   │   ├── OriginaLogo.tsx
│   │   └── ...
│   ├── server/
│   │   ├── text-extraction.ts          # Extraction PDF (pdfjs-dist)
│   │   ├── documents.ts                # Logique métier documents
│   │   ├── analysis/                   # Algorithmes plagiat
│   │   │   ├── plagiat-detector.ts
│   │   │   ├── content-filter.ts
│   │   │   ├── cover-extractor.ts
│   │   │   └── themeanalysor.ts
│   │   └── themes.ts                   # Logique métier thèmes
│   └── lib/
│       ├── prisma.ts                   # Client Prisma
│       ├── api-errors.ts               # Classes erreur API
│       ├── frontend-api.ts             # Fetch client avec gestion erreur
│       ├── security.ts                 # Rate-limit, CORS, IP
│       ├── session.ts                  # Gestion sessions HMAC
│       ├── logger.ts                   # Logging structuré
│       └── authz.ts                    # RBAC
├── prisma/
│   ├── schema.prisma                   # Schéma DB complet
│   ├── migrations/                     # Historique migrations
│   └── seed.js                         # Données initiales (comptes démo)
├── tests/
│   ├── *.test.ts                       # Tests Vitest (51 tests)
│   ├── e2e/home.spec.ts                # Tests Playwright (8/8 passing)
│   └── selenium/test_home.py           # Tests Selenium Python (16 tests)
├── public/                             # Assets
├── storage/                            # Fichiers (mémoires, références)
├── next.config.ts                      # Config Next.js
├── playwright.config.ts                # Config Playwright
├── vitest.config.ts                    # Config Vitest
├── tsconfig.json                       # Config TypeScript
├── package.json                        # Dependencies + scripts
└── README.md                           # Documentation principale
```

---

## 🚀 Commandes Essentielles

### Développement
```bash
npm run dev              # Lancer dev server (http://localhost:3000)
npm run build            # Build production
npm start                # Lancer en production
```

### Tests
```bash
npm run test:unit        # Tests Vitest (51 tests)
npm run test:unit:watch  # Mode watch
npm run test:e2e         # Tests Playwright (8/8 tests)
npm run test:selenium    # Tests Selenium Python (16 tests)
npm test                 # Unitaires + E2E (sans Selenium)
```

### Autres
```bash
npm run lint             # ESLint
npm run type-check       # TypeScript
npm run prisma:migrate   # Migrations DB
npx prisma db seed      # Seed données de démo
```

---

## 🔐 Sécurité Clé

1. **Sessions**: HMAC-SHA256, cookie signé, `SESSION_SECRET` requis
2. **RBAC**: Middleware `proxy.ts` + `guardRole()` par route
3. **Rate-Limit**: Implémenté sur `/api/login` (configurable)
4. **CORS/Same-Origin**: Validation stricte, headers sécurité
5. **Validation**: Zod payloads + validation type MIME fichiers
6. **Upload**: Max 50MB par fichier, timeout 10s extraction

---

## 📊 Tests en Détail

### ✅ Tests Unitaires (51 passing, 2.34s)
- `security.test.ts` (4): Rate-limit, CORS, buildRateLimitKey
- `cover-extractor.test.ts` (11): Extraction titre page garde
- `login-route.test.ts` (1): Route POST /api/login
- `content-filter.test.ts` (3): Filtrage contenu institutionnel
- `text-extraction.test.ts` (25): Extraction PDF/DOCX/TXT
- `proxy.test.ts` (3): RBAC middleware
- `domain.test.ts` (4): Règles métier (normalisation, scores, risques)

### ✅ Tests E2E Playwright (8/8 passing, 17.6s)
1. ✅ Home page exposes login panel
2. ✅ Login mode toggle switches placeholder (Étudiant/Personnel)
3. ✅ Demo account selector pre-fills form
4. ✅ **Invalid login shows error message** ← FIX RÉCENT
5. ✅ Student login redirects to /student
6. ✅ Staff login redirects to role dashboard
7. ✅ Unauthenticated access redirects to home
8. ✅ Navbar links present on home page

### ✅ Tests Selenium Python (16 tests)
- Home page + login
- Workflows étudiant complets
- Workflows enseignant
- Workflows DA
- Admin dashboard
- Navigation sidebars

---

## 🐛 Fix Récent (24 Avril 2026)

### Problème
Message d'erreur login invalide ne s'affichait pas en développement.

### Causes
1. **`next.config.ts`** : `allowedDevOrigins` ne contenait que domaine externe (ngrok), pas localhost
   - Résultat: Playwright bloqué cross-origin
2. **`frontend-api.ts`** : Redirection auto 401 → "/" empêchait affichage erreur

### Corrections
```typescript
// next.config.ts - Ajout des origines locales
allowedDevOrigins: [
  "localhost",
  "127.0.0.1",
  "d40c-102-180-110-135.ngrok-free.app",
]

// frontend-api.ts - Suppression redirection 401 auto
// Laisse le composant login-panel afficher le message
```

### Résultat
- ✅ Tests E2E: 3/8 → **8/8 passing**
- ✅ Message d'erreur affiche correctement
- ✅ Logins valides fonctionnent

---

## 📝 Comptes de Test

**Credentials démo** (après `npx prisma db seed`):

| Rôle | Email/INE | Mot de passe |
|------|-----------|-------------|
| 🎓 Étudiant | `N01331820231` (INE) | `mon926732` |
| 👨🏫 Chef Dépt | `teacher@handal.local` | `mon926732` |
| 👔 DA | `da@handal.local` | `mon926732` |
| 🔧 Admin | `admin@handal.local` | `mon926732` |

---

## 📚 Documents de Référence

| Fichier | Contenu |
|---------|---------|
| **analyse.md** (2161 lignes) | Analyse complète architecture + sécurité + performance |
| **README.md** | Documentation produit principale |
| **workflow.md** | Workflow complet par phase (thème, document, verdict) |
| **QUICK_SUMMARY.md** | Résumé exécutif des corrections PDF |
| **DEPLOYMENT_READY.md** | Checklist déploiement production |
| **roadmap.md** | Roadmap full Next.js par phases |
| **tests/TESTS.md** | Guide exécution tests (unitaires, E2E, Selenium) |

---

## 🎯 Points Clés à Retenir

### Architecture
- **Frontend**: React client-side + SSR via Next.js
- **Backend**: API Routes Node.js (pas de serveur séparé)
- **DB**: Prisma ORM + MySQL
- **Auth**: Custom HMAC sessions (pas JWT, pas NextAuth)

### Workflow
- Étudiant → Chef Dépt → DA → Verdict (séquentiel avec validations)
- Plagiat = seuil strict 20% (< 20% = OK)
- 3 algorithmes combinés (TF-IDF, Jaccard, N-gram)

### Security
- Sessions signées, RBAC granulaire, rate-limit, audit complet
- Validation stricte: type MIME, taille fichier, extraction timeout

### Tests
- Vitest unitaires (51 tests)
- Playwright E2E (8 tests) - **tous passing après fix 24/4**
- Selenium Python E2E (16 tests)

### Recent Fix
- **24/4/2026**: Affichage erreur login
  - Cause: `allowedDevOrigins` incomplète + redirection 401
  - Solution: next.config.ts + frontend-api.ts
  - Résultat: 8/8 E2E tests ✅

---

## 🚀 Prêt pour

✅ **Développement**: Tous les outils configurés  
✅ **Testing**: Suite complète (51 unit + 8 E2E + 16 Selenium)  
✅ **Déploiement**: Build production-ready  
✅ **Production**: Sécurité robuste, monitoring, audit trail  

---

## 💡 Conventions du Code

- **Naming**: camelCase variables/functions, PascalCase components/classes
- **Error Handling**: `ApiError` class + `errorResponse()` pour JSON garanti
- **Logging**: `logger.info/warn/error()` structuré avec événements
- **Validation**: Zod schemas pour API payloads
- **Async**: `async/await` partout, pas `.then()`
- **Testing**: Arrange-Act-Assert, mocks vitest

---

## 📞 Contact & Support

Pour comprendre ou modifier:

1. **Architecture globale** → Voir `analyse.md`
2. **Workflows métier** → Voir `workflow.md`
3. **Détection plagiat** → Voir `src/server/analysis/`
4. **Tests** → Voir `tests/TESTS.md`
5. **Déploiement** → Voir `DEPLOYMENT_READY.md`

---

**Dernier commit**: Fix tests E2E (allowedDevOrigins + frontend-api)  
**Test Status**: ✅ 51 unit + 8 E2E + 16 Selenium  
**Build**: ✅ Production-ready  
**Next**: Sélénium tests completion

---

*Document généré pour contextualiser Copilot CLI sur le projet Handal*
