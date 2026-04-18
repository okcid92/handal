# Application Next.js avec MySQL local

Projet initialise avec Next.js (App Router, TypeScript) et integration MySQL via le package mysql2.

## Prerequis

- Node.js installe
- MySQL installe et demarre sur votre PC

## Configuration

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

Si la connexion fonctionne, vous verrez un JSON avec ok: true.

## Fichiers importants

- src/lib/db.ts: creation du pool MySQL
- src/app/api/db-test/route.ts: endpoint de verification connexion
- .env.example: variables d environnement a renseigner
