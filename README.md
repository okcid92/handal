# Origina Next.js

Application full Next.js pour Origina, avec MySQL, Prisma, RBAC, tests unitaires et e2e, et documentation de go-live.

## Prerequisites

- Node.js installe
- MySQL installe et demarre sur votre PC

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
- `npm run build` pour valider la compilation de production.
- `npm run prisma:deploy` pour appliquer les migrations en production.

## Exploitation

- Lire [docs/go-live-runbook.md](docs/go-live-runbook.md) avant toute bascule prod.
- Lire [docs/rollback-plan.md](docs/rollback-plan.md) pour la procedure de retour arriere.
- Le plan de livraison est decrit dans [roadmap.md](roadmap.md).

## Fichiers importants

- src/lib/db.ts: creation du pool MySQL
- src/app/api/db-test/route.ts: endpoint de verification connexion
- .env.example: variables d environnement a renseigner
