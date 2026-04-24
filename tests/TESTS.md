# Commandes de test — Handal

Toutes les commandes sont à exécuter depuis la racine du projet :

```bash
cd /home/okcid/Documents/handal
```

---

## 1. Tests unitaires — Vitest

Fichiers couverts : `tests/*.test.ts`

| Fichier                     | Ce qui est testé                                |
| --------------------------- | ------------------------------------------------ |
| `login-route.test.ts`     | Route POST `/api/login` (session, credentials) |
| `security.test.ts`        | `assertSameOrigin`, `assertRateLimit`        |
| `proxy.test.ts`           | Middleware RBAC `proxy.ts`                     |
| `domain.test.ts`          | Règles métier (statuts, transitions)           |
| `content-filter.test.ts`  | Filtre du contenu institutionnel                 |
| `cover-extractor.test.ts` | Extraction titre page de garde                   |
| `text-extraction.test.ts` | Extraction texte PDF/DOCX/TXT                    |

```bash
# Lancer tous les tests unitaires (une seule fois)
npm run test:unit

# Mode watch (relance à chaque modification)
npm run test:unit:watch

# Avec rapport de couverture de code
npx vitest run --coverage
```

---

## 2. Tests E2E — Playwright

Fichiers couverts : `tests/e2e/home.spec.ts`

| Test                                                     | Ce qui est testé                      |
| -------------------------------------------------------- | -------------------------------------- |
| `home page exposes the login panel`                    | H1 + bouton "Se connecter" visibles    |
| `login mode toggle switches placeholder`               | Toggle Etudiant ↔ Personnel           |
| `demo account selector pre-fills the form`             | Sélecteur de comptes démo            |
| `invalid login shows error message`                    | Message d'erreur credentials invalides |
| `student login redirects to /student`                  | Login étudiant valide →`/student`  |
| `staff login redirects to role dashboard`              | Login enseignant →`/teacher`        |
| `unauthenticated access to /student redirects to home` | Protection des routes                  |
| `navbar links are present on home page`                | Liens Connexion, Solutions, Workflow   |

> Playwright démarre `next dev` automatiquement via `webServer` dans `playwright.config.ts`.

```bash
# Lancer tous les tests E2E (Chromium)
npm run test:e2e

# Lancer un seul test par nom
npx playwright test --grep "login mode toggle"

# Mode headed (navigateur visible)
npx playwright test --headed

# Rapport HTML interactif après exécution
npx playwright show-report
```

---

## 3. Tests Selenium — Python

Fichiers couverts : `tests/selenium/test_home.py`

| Test        | Ce qui est testé                                                                   |
| ----------- | ----------------------------------------------------------------------------------- |
| `test_01` | Page d'accueil — H1 + bouton login                                                 |
| `test_02` | Login invalide → message d'erreur                                                  |
| `test_03` | Soumission thème étudiant (succès + erreurs validation)                          |
| `test_04` | Validation CD enseignant (approve/reject + erreur doc inexistant)                   |
| `test_05` | Validation DA (score invalide, thème non-CD, succès + délibération inexistante) |
| `test_06` | Upload étudiant + auto-test                                                        |
| `test_07` | Analyse officielle par l'enseignant                                                 |
| `test_08` | Délibération finale par le DA                                                     |
| `test_09` | Connexion admin → dashboard supervision                                            |
| `test_10` | Logout → redirection vers `/`                                                    |
| `test_11` | Navigation sidebar CD (Dashboard → Thèmes → Rapports)                            |
| `test_12` | Navigation sidebar DA (Dashboard → Rapports finaux)                                |
| `test_13` | Navigation sidebar Admin (Dashboard → Documents → Staging)                        |
| `test_14` | Vue verdict étudiant branche "Réécriture requise"                                |
| `test_15` | Toggle Etudiant/Personnel change le placeholder                                     |
| `test_16` | Sélecteur de comptes démo pré-remplit le formulaire                              |

```bash
npx playwright test --grep "login mode toggle"# Installer les dépendances Python (une seule fois)
npm run test:selenium:install

# Lancer les tests en headless (serveur démarré automatiquement)
npm run test:selenium

# Lancer les tests avec navigateur visible
npm run test:selenium:headed

# Lancer un seul test par nom
python3 -m pytest tests/selenium/test_home.py::HomePageSeleniumTests::test_01_home_page_shows_login_panel -v

# Lancer contre un serveur déjà actif sur un port différent
BASE_URL=http://localhost:3001 npm run test:selenium
```

> Les résultats sont générés dans `tests/selenium/results/` :
>
> - `selenium-summary.md` — rapport lisible
> - `selenium-summary.json` — rapport machine

---

## 4. Tous les tests d'un coup

```bash
# Unitaires + E2E Playwright (sans Selenium)
npm test

# Tout : unitaires + E2E + Selenium
npm run test:unit && npm run test:e2e && npm run test:selenium
```

---

## Prérequis

| Outil   | Version minimale | Vérification               |
| ------- | ---------------- | --------------------------- |
| Node.js | 18+              | `node --version`          |
| Python  | 3.8+             | `python3 --version`       |
| Chrome  | installé        | `google-chrome --version` |
| MySQL   | démarré        | `npm run prisma:migrate`  |

```bash
# Installer les navigateurs Playwright (une seule fois)
npx playwright install chromium
```
