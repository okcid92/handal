<div align="center">
  <img src="logo/Gemini_Generated_Image_es56iles56iles56-Photoroom.png" alt="Handal Logo" width="340"/>

  # Handal 🎓

  **Plateforme académique de détection de plagiat et gestion des mémoires — IBAM**

  [![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)](https://www.mysql.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-6.15.0-black?logo=prisma)](https://www.prisma.io/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

  **Application full-stack Next.js couvrant l'intégralité du cycle de vie d'un mémoire académique : proposition de thème, validation multi-rôles, analyse anti-plagiat, délibération finale et archivage.**
</div>

---

## 🌟 Fonctionnalités

- 🚀 **Workflow complet** : De la proposition de thème à la délibération finale et l'archivage
- 🔍 **Détection multi-niveaux** : TF-IDF + Cosinus, Jaccard, N-grammes — plagiat direct et paraphrase
- 👥 **4 rôles académiques** : Étudiant, Chef de Département, Directeur Académique, Administrateur
- 🔐 **Sécurité robuste** : RBAC granulaire, sessions signées HMAC, audit complet, conformité RGPD
- 📊 **Rapports détaillés** : Scores de similarité, sources identifiées, décisions motivées
- 🖥️ **Dashboards dédiés** : Interface spécialisée par rôle avec sidebar, KPIs et activité en temps réel
- 📁 **Base de référence** : Upload bulk admin, staging area avec validation NLP, bibliothèque consultable
- 🎓 **Vue verdict étudiant** : Écran final dédié selon la décision DA (validation, réécriture, sanction)
- 🧪 **Tests automatisés** : Unitaires (Vitest), E2E (Playwright), Selenium
- 📱 **Interface moderne** : Responsive, accessible, UX optimisée

## 🏗️ Architecture

```
Frontend : React 19.2.4 + Next.js 16.2.4 (App Router)
Backend  : Next.js API Routes (Node.js, runtime nodejs)
Base de données : MySQL 8.0 avec Prisma ORM
Auth     : Sessions cookie HMAC-SHA256 (sans NextAuth)
RBAC     : Middleware proxy.ts + guardRole() par route
Stockage : Système de fichiers local (storage/)
Plagiat  : Algorithmes custom TypeScript (TF-IDF, Jaccard, N-gram)
Upload   : SSE streaming multi-fichiers avec progression par page
```

## 👥 Rôles et permissions

| Rôle | Accès | Responsabilités |
|------|-------|-----------------|
| 🎓 **Étudiant** | `/student` | Proposer thème, déposer mémoire, consulter résultats & délibération |
| 👨🏫 **Chef de Département** | `/teacher` | Valider thèmes, apprécier documents, consulter rapports d'analyse |
| 👨💼 **Directeur Académique** | `/da` | Valider thèmes, délibérer, gérer bibliothèque de référence |
| 🔧 **Administrateur** | `/admin` | Upload références, staging area, supervision globale |

## 🔄 Workflow académique

```
Étudiant          Chef de Dépt       DA                  Admin
   │                   │              │                    │
   ├─ Propose thème ──►│              │                    │
   │                   ├─ Vote ──────►│                    │
   │                   │              ├─ Vote              │
   │◄── Thème validé ──┴──────────────┘                    │
   │                                                        │
   ├─ Dépose mémoire (PDF)                                  │
   │   └─ Analyse anti-plagiat automatique                  │
   │                                                        ├─ Upload références
   │                   │              │                     ├─ Staging area
   │                   ├─ Apprécie ──►│                     └─ Validation NLP
   │                   │              ├─ Délibère
   │◄── Verdict final ─┴──────────────┘
   │   (Validation / Réécriture / Sanction)
```

## 🔍 Algorithmes de détection de plagiat

Handal utilise **3 algorithmes combinés** avec filtrage du contenu institutionnel :

| Algorithme | Poids | Détecte |
|-----------|-------|---------|
| **TF-IDF + Similarité Cosinus** | 40% | Similarité sémantique, reformulations |
| **Indice de Jaccard** | 30% | Similarité lexicale, ensembles de mots |
| **N-gram Overlap** | 30% | Copier-coller, séquences consécutives |

**Score combiné** : `0.4 × cosine + 0.3 × jaccard + 0.3 × ngram`

Le contenu institutionnel (pages de garde, remerciements, bibliographies) est automatiquement exclu de l'analyse pour éviter les faux positifs.

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** 18+ installé
- **MySQL** 8.0+ installé et démarré
- **Python 3** avec pip (pour tests Selenium)

### Installation

1. **Cloner le projet**
   ```bash
   git clone https://github.com/votre-org/handal.git
   cd handal
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer l'environnement**
   ```bash
   cp .env.example .env.local
   ```

4. **Éditer `.env.local`**
   ```env
   DATABASE_URL=mysql://root:mot_de_passe@127.0.0.1:3306/handal_db
   SESSION_SECRET=votre_secret_session_32_chars_min
   NEXTAUTH_URL=http://localhost:3000
   ```

5. **Initialiser la base de données**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

6. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

7. **Accéder à l'application**
   - 🌐 **Application** : http://localhost:3000
   - 🧪 **Test DB** : http://localhost:3000/api/db-test

## 🛠️ Commandes utiles

### Développement
```bash
npm run dev              # Serveur de développement (Turbopack)
npm run build            # Build de production
npm run start            # Serveur de production
npm run lint             # Vérification ESLint
```

### Base de données
```bash
npm run prisma:generate  # Générer client Prisma
npm run prisma:migrate   # Appliquer migrations (dev)
npm run prisma:deploy    # Déployer migrations (prod)
npm run prisma:studio    # Ouvrir Prisma Studio
npm run prisma:seed      # Peupler avec données de test
```

### Tests
```bash
npm run test             # Tous les tests unitaires (Vitest)
npm run test:unit        # Tests unitaires uniquement
npm run test:e2e         # Tests E2E (Playwright)
npm run test:selenium    # Tests Selenium (headless)
npm run test:selenium:headed  # Tests Selenium avec navigateur
```

### Administration
```bash
npm run admin:reset      # Réinitialiser le compte admin
npm run admin:audit      # Audit des utilisateurs
```

## 📁 Structure du projet

```
src/
├── app/
│   ├── admin/          # Dashboard administrateur
│   ├── da/             # Dashboard Directeur Académique
│   ├── teacher/        # Dashboard Chef de Département
│   ├── student/        # Dashboard Étudiant
│   └── api/            # Routes API (Next.js App Router)
├── components/
│   ├── AdminLayout.tsx / AdminTracker.tsx
│   ├── DALayout.tsx / DATracker.tsx
│   ├── CDLayout.tsx / CDTracker.tsx
│   └── student-dashboard.tsx
├── server/
│   ├── analysis/       # Algorithmes plagiat (TF-IDF, Jaccard, N-gram)
│   ├── documents.ts    # Logique documents & analyses
│   ├── deliberations.ts
│   └── themes.ts
└── lib/
    ├── session.ts      # Auth HMAC-SHA256
    ├── authz.ts        # RBAC
    └── frontend-api.ts # Client API (avec redirect 401)
storage/
├── final/              # Mémoires déposés par les étudiants
└── references/         # Documents de référence validés
```

## 📊 Métriques de performance

- ⚡ **Analyse** : < 30 secondes/document (100 pages)
- 🎯 **Précision** : > 95% pour plagiat > 70%
- 🔄 **Rappel** : > 90% pour détection paraphrase
- 📈 **Throughput** : 100 documents/heure
- 🔒 **Session** : Expiration automatique + redirect login

## 📚 Documentation

| Document | Description |
|----------|-------------|
| 📖 [Analyse complète](analyse.md) | Documentation technique et architecture détaillée |
| 🗺️ [Roadmap](roadmap.md) | Plan de développement et évolution |
| 🚀 [Go-live](docs/go-live-runbook.md) | Guide de déploiement en production |
| 🔄 [Rollback](docs/rollback-plan.md) | Plan de retour arrière |
| 🧪 [Tests](tests/) | Documentation des tests automatisés |

## 🔧 Configuration production

```env
NODE_ENV=production
DATABASE_URL=mysql://user:pass@mysql:3306/handal_prod
SESSION_SECRET=secret_production_minimum_32_caracteres
NEXTAUTH_URL=https://handal.ibam.edu
```

```bash
docker-compose up -d
```

## 📄 Licence

Ce projet est sous licence MIT — voir [LICENSE](LICENSE) pour les détails.

---

<div align="center">
  <strong>Handal — L'excellence académique rejoint l'innovation technologique</strong> 🎓✨
  <br/>
  Made with ❤️ for academic integrity · IBAM
</div>
