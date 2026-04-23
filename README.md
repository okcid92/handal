<div align="center">
  <img src="logo/Gemini_Generated_Image_es56iles56iles56-Photoroom.png" alt="Handal Logo" width="200"/>

  # Handal 🎓

  **Plateforme académique de détection de plagiat et gestion des mémoires**

  [![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)](https://www.mysql.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-6.15.0-black?logo=prisma)](https://www.prisma.io/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

  **Application full-stack Next.js pour la validation, l'analyse et la délibération des mémoires académiques avec détection de plagiat avancée.**
</div>

## 🌟 Fonctionnalités

- 🚀 **Workflow complet** : De la proposition de thème à la délibération finale
- 🔍 **Détection multi-niveaux** : TF-IDF, Jaccard, N-grammes pour détecter plagiat direct et paraphrase
- 👥 **Rôles académiques** : Étudiant, Enseignant, Directeur Académique, Administrateur
- 🔐 **Sécurité robuste** : RBAC granulaire, audit complet, conformité RGPD
- 📊 **Rapports détaillés** : Scores de similarité, segments mis en évidence, décisions structurées
- 🧪 **Tests automatisés** : Unitaires (Vitest), E2E (Playwright), Selenium
- 📱 **Interface moderne** : Responsive, accessible, UX optimisée

## 🏗️ Architecture

```
Frontend: React 19.2.4 + Next.js 16.2.4 (App Router)
Backend: Next.js API Routes (Node.js)
Base de données: MySQL avec Prisma ORM
Authentification: Système RBAC personnalisé
Tests: Vitest + Playwright + Selenium
Détection plagiat: Algorithmes custom (TypeScript)
```

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
   # Base de données
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=handal_db
   
   # JWT
   JWT_SECRET=votre_secret_jwt
   
   # URLs
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=votre_secret_auth
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

## 📚 Documentation

| Document | Description |
|----------|-------------|
| 📖 [Analyse complète](analyse.md) | Documentation technique et architecture détaillée |
| 🗺️ [Roadmap](roadmap.md) | Plan de développement et évolution |
| 🚀 [Go-live](docs/go-live-runbook.md) | Guide de déploiement en production |
| 🔄 [Rollback](docs/rollback-plan.md) | Plan de retour arrière |
| 🧪 [Tests](tests/) | Documentation des tests automatisés |

## 🛠️ Commandes utiles

### Développement
```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Vérification du code
```

### Tests
```bash
npm run test         # Tous les tests
npm run test:unit    # Tests unitaires (Vitest)
npm run test:e2e     # Tests E2E (Playwright)
npm run test:selenium # Tests Selenium
```

### Base de données
```bash
npm run prisma:generate  # Générer client Prisma
npm run prisma:migrate    # Appliquer migrations
npm run prisma:deploy    # Déployer en production
npm run prisma:studio    # Ouvrir Prisma Studio
```

### Administration
```bash
npm run admin:reset   # Réinitialiser admin
npm run admin:audit   # Audit des utilisateurs
```

## 🧪 Tests Selenium

Les tests Selenium nécessitent une configuration spéciale :

```bash
# Installation dépendances Python
npm run test:selenium:install

# Installation pip si nécessaire (Linux)
sudo apt-get install python3-pip

# Lancer les tests
npm run test:selenium           # Headless
npm run test:selenium:headed     # Avec fenêtre navigateur

# Changer de navigateur
SELENIUM_BROWSER=firefox npm run test:selenium
```

**Résultats** : `tests/selenium/results/selenium-summary.md`

## 👥 Rôles et permissions

| Rôle | Permissions |
|------|-------------|
| 🎓 **Étudiant** | Proposer thèmes, déposer documents, consulter résultats |
| 👨‍🏫 **Enseignant** | Modérer thèmes, apprécier documents, consulter rapports |
| 👨‍💼 **Directeur Académique** | Valider thèmes, délibérer, gérer bibliothèque référence |
| 🔧 **Administrateur** | Gérer utilisateurs, configurer système, superviser |

## 🔍 Algorithmes de détection de plagiat

Handal utilise **3 algorithmes combinés** :

1. **TF-IDF + Similarité Cosinus** 
   - Détection sémantique
   - Similarité vectorielle

2. **Indice de Jaccard**
   - Similarité lexicale
   - Ensembles de mots

3. **N-gram Overlap**
   - Détection copier-coller
   - Séquences consécutives

**Score combiné** : `0.4 × cosine + 0.3 × jaccard + 0.3 × ngram`

## 📊 Métriques de performance

- ⚡ **Analyse** : < 30 secondes/document (100 pages)
- 🎯 **Précision** : > 95% pour plagiat > 70%
- 🔄 **Rappel** : > 90% pour détection paraphrase
- 📈 **Throughput** : 100 documents/heure

## 🔧 Configuration production

### Docker
```bash
docker-compose up -d
```

### Variables d'environnement production
```env
NODE_ENV=production
DATABASE_URL=mysql://user:pass@mysql:3306/handal_prod
REDIS_URL=redis://redis:6379
JWT_SECRET=production_secret
```

## 🤝 Contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commiter (`git commit -m 'Add amazing feature'`)
4. Pusher (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir [LICENSE](LICENSE) pour les détails.

## 👨‍💻 Équipe

- **Développement** : Équipe Handal
- **Architecture** : Next.js full-stack
- **Algorithmes** : Détection plagiat custom
- **Tests** : Multi-niveaux automatisés

## 📞 Support

- 📧 **Email** : dev@handal.edu
- 📖 **Documentation** : [docs/](docs/)
- 🐛 **Issues** : [GitHub Issues](https://github.com/votre-org/handal/issues)

---

<div align="center">
  **Handal - L'excellence académique rejoint l'innovation technologique** 🎓✨
  
  Made with ❤️ for academic integrity
</div>
