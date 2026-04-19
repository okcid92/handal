# Handal

Application full Next.js pour Handal, avec MySQL, Prisma, RBAC, tests unitaires et e2e, et documentation de go-live.

## Prerequisites

- Node.js installe
- MySQL installe et demarre sur votre PC
- Python 3 installe
- pip pour Python 3 (ex: `python3-pip`)

## Configuration locale

1. Copiez le fichier d environnement:

```bash
cp .env.example .env.local
```

2. Editez .env.local avec vos valeurs MySQL:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=handal_db
```

3. Lancez le serveur de dev:

```bash
npm run dev
```

4. Testez la connexion DB:

- http://localhost:3000/api/db-test

Si la connexion fonctionne, vous verrez un JSON avec `ok: true`.

## Commandes utiles

- `npm run lint` pour verifier le code.
- `npm run test:unit` pour les tests Vitest.
- `npm run test:e2e` pour les tests Playwright.
- `npm run test:selenium` pour lancer les tests Selenium.
- `npm run test:selenium:headed` pour lancer Selenium avec une fenetre visible.
- `npm run build` pour valider la compilation de production.
- `npm run prisma:deploy` pour appliquer les migrations en production.

## Tests Selenium

- Les tests Selenium demarrent automatiquement `npm run start` sur le port 3000.
- Installer les dependances Python avec `npm run test:selenium:install`.
- Si `python3 -m pip` n existe pas sur Linux, installez pip via votre systeme: `sudo apt-get install python3-pip`.
- Le navigateur par defaut est Chrome/Chromium. Vous pouvez changer avec `SELENIUM_BROWSER=firefox`.
- L execution est headless par defaut. Utilisez `HEADLESS=false` pour voir la fenetre.
- Si aucun navigateur compatible n est installe, installez Chrome/Chromium ou Firefox avant de lancer le script.
- Un resume complet est genere apres chaque run dans `tests/selenium/results/selenium-summary.md` et `tests/selenium/results/selenium-summary.json`.

## Exploitation

- Lire [docs/go-live-runbook.md](docs/go-live-runbook.md) avant toute bascule prod.
- Lire [docs/rollback-plan.md](docs/rollback-plan.md) pour la procedure de retour arriere.
- Le plan de livraison est decrit dans [roadmap.md](roadmap.md).

## Fichiers importants

- src/lib/db.ts: creation du pool MySQL
- src/app/api/db-test/route.ts: endpoint de verification connexion
- .env.example: variables d environnement a renseigner
