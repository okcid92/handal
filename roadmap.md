# Roadmap full Next.js — Handal

Objectif: livrer une application 100% Next.js (frontend + backend API) sur MySQL, en reprenant les regles metier d Origina sans dependre de Laravel.

## 1. Principes directeurs

- Full stack dans une seule base de code Next.js.
- Contrat metier preserve, meme si l implementation backend change.
- Migration par increment avec validation fonctionnelle continue.
- Priorite aux workflows critiques: theme, validation, depot, analyse, deliberation.
- Securite et observabilite traitees des le socle.

## 2. Cible technique full Next.js

- Framework: Next.js App Router + Route Handlers.
- Runtime: Node.js pour les routes API metier.
- Base de donnees: MySQL.
- ORM: Prisma (schema, migrations, seed, transactions).
- Auth: Auth.js (session) + RBAC par role (student, teacher, da, admin).
- Validation: Zod (payloads API + formulaires).
- Front data: React Query pour cache/requetes.
- Tests: Vitest (unit/integration) + Playwright (e2e).

## 3. Architecture proposee

- src/app: pages et layouts.
- src/app/api: endpoints Route Handlers (remplace Laravel).
- src/server: services metier, policies RBAC, repositories.
- src/lib: utilitaires partages (db, auth, errors, logger).
- prisma: schema, migrations, seed.
- tests: unit/integration/e2e.

Decision structurante:

- Garder les memes routes HTTP metier cote Next.js pour simplifier la migration du frontend et des tests.

## 4. Phases de delivery

## Phase 0 - Cadrage full stack (Semaine 1)

Statut actuel: COMPLETE (artefacts dans docs/domain-dictionary.md, docs/phase-0-validation.md et prisma/schema.prisma)

Livrables:

- Mapping complet des regles metier issues de l existant.
- Definition des contrats API cibles dans Next.js.
- Schema Prisma initial base sur users, themes, documents, similarity_reports, deliberations.

Actions:

- Figer les enums de statuts: PENDING, VALIDATED_CD, VALIDATED_DA, REJECTED.
- Figer les decisions: final_validation, sanction, rewrite_required.
- Clarifier le role var: exclu tant qu il n a pas de regle metier.

Critere d acceptance:

- Dictionnaire metier + schema de donnees valides par l equipe.

## Phase 1 - Fondation backend Next.js (Semaines 1-2)

Statut actuel: COMPLETE (Prisma configure, migration appliquee, couche db/erreurs/logger/session en place, endpoints /api/ping /api/login /api/logout /api/me/overview operationnels)

Livrables:

- Prisma configure avec migrations MySQL.
- Couche db + gestion erreurs centralisee.
- Base des Route Handlers: /api/ping, /api/login, /api/logout, /api/me/overview.

Actions:

- Implementer transactions pour operations critiques.
- Standardiser format reponse erreur/succes.
- Ajouter logging structure cote serveur.

Critere d acceptance:

- API minimale fonctionnelle sans Laravel.

## Phase 2 - Auth et RBAC robustes (Semaine 2)

Statut actuel: COMPLETE (session cookie signee, proxy de protection, helpers RBAC, comptes demo seedes)

Livrables:

- Auth.js (session) avec login par INE/mot de passe pour student, et email/mot de passe pour teacher/da/admin.
- Middleware de protection des pages et API.
- Policies RBAC reutilisables cote server.

Actions:

- Mapper roles: student, teacher, da, admin.
- Remplacer X-User-Id par session serveur.
- Ajouter audit minimal (qui a fait quoi, quand).

Critere d acceptance:

- Les 4 comptes de demo se connectent avec permissions correctes.

## Phase 3 - Domain themes (Semaines 2-3)

Statut actuel: COMPLETE (unicite globale du titre, routes propose/pending/validate-cd/validate-da, migration et build valides)

Livrables:

- POST /api/themes/propose.
- GET /api/themes/pending.
- PATCH /api/themes/{theme}/validate-cd.
- PATCH /api/themes/{theme}/validate-da.

Actions:

- Regle titre unique insensible a la casse.
- Validation titre >= 8 caracteres.
- Transitions de statuts strictes avec verifications role et etat.

Critere d acceptance:

- Le workflow de validation de theme fonctionne de bout en bout.

## Phase 4 - Domain documents et analyses (Semaines 3-4)

Statut actuel: COMPLETE (upload metadata, auto-test, analyse officielle, liste/detail des rapports)

Livrables:

- POST /api/documents/upload (metadata puis upload reel en sous-phase).
- POST /api/documents/{document}/auto-test.
- POST /api/documents/{document}/analyze.
- GET /api/reports et GET /api/reports/{report}.

Actions:

- Verifier preconditions: theme VALIDATED_DA + note finale avant depot final.
- Calculs analyses: mode simulation initial, interface prete pour vrai moteur.
- Persister matched_sources et highlighted_segments en JSON.

Critere d acceptance:

- Teacher/admin peuvent produire et consulter un rapport persiste.

## Phase 5 - Domain deliberations (Semaine 4)

Statut actuel: COMPLETE (POST deliberate, historique des decisions expose dans le detail de rapport)

Livrables:

- POST /api/reports/{report}/deliberate.
- Historique des decisions et consultation securisee.

Actions:

- Verifier decisions autorisees.
- Verifier role da/admin obligatoire.
- Journaliser les actions sensibles.

Critere d acceptance:

- Deliberation finale exploitable avec traces completees.

## Phase 6 - Frontend Next.js complet (Semaines 4-6)

Statut actuel: COMPLETE (login UX, dashboards student/teacher/DA/admin, formulaires metier, navigation role-based)

Livrables:

- Login et dashboard par role.
- Parcours student complet (proposition, depot, auto-test).
- Parcours teacher/admin (moderation, analyse, rapports).
- Parcours da/admin (validation finale, deliberation).

Actions:

- UI forms avec validation Zod.
- Etats loading/error/success sur tous les ecrans metier.
- Composants de visualisation des scores et risques.

Critere d acceptance:

- Tous les cas d usage metier sont realisables dans l interface Next.js.

## Phase 7 - Qualite, performance, securite (Semaines 6-7)

Statut actuel: EN COURS (tests unitaires partiels presents, couverture e2e incomplète, hardening securite non valide)

Livrables:

- Tests unitaires services metier.
- Tests integration API Route Handlers.
- Tests e2e par role et par workflow.
- Hardening securite (rate limit, CSRF, secure cookies, headers).

Actions:

- Ajouter tests de transitions invalides.
- Ajouter monitoring erreurs backend/frontend.
- Verifier indexes DB et requetes critiques.

Critere d acceptance:

- Aucun bug bloquant sur les workflows critiques en recette.

## Phase 8 - Go-live et decommission Laravel (Semaine 8)

Statut actuel: EN ATTENTE (runbook et rollback plan documentes, mais Phase 7 non completee — go-live bloque jusqu'a validation Phase 7)

Livrables:

- Plan de bascule prod.
- Plan de rollback.
- Documentation exploitation et runbooks.

Actions:

- Repetition generale sur environnement de preproduction.
- Migration des donnees si necessaire.
- Coupure progressive du backend Laravel.
- Archivage de la documentation Laravel legacy pour reference historique uniquement.

Critere d acceptance:

- Service stable en production sur stack full Next.js.

Validation:

- Runbook de go-live documente dans [docs/go-live-runbook.md](docs/go-live-runbook.md).
- Procedure de rollback documentee dans [docs/rollback-plan.md](docs/rollback-plan.md).
- README aligne sur le fonctionnement full Next.js.

## 5. Ordre de build recommande

1. Prisma + MySQL + migrations.
2. Auth session + RBAC.
3. Endpoints themes.
4. Endpoints documents/analyses.
5. Endpoints rapports/deliberations.
6. UI role-based complete.
7. Test e2e + securite + observabilite.

## 6. Definition of Done

- Plus aucune dependance au backend Laravel pour les fonctions metier.
- Tous les endpoints metier existent en Route Handlers Next.js.
- Regles de roles, transitions et validations appliquees cote serveur.
- Donnees persistees en MySQL via Prisma avec migrations versionnees.
- Couverture de tests suffisante sur les parcours critiques.
- Documentation technique et metier a jour.

## 7. Risques et mitigation

- Risque: surcharge de scope full stack.
  Mitigation: livrer par domaines metier (themes, documents, rapports).

- Risque: regressions fonctionnelles pendant le rewrite.
  Mitigation: tests e2e centres sur workflows et jeux de donnees seedes.

- Risque: auth/session mal configuree.
  Mitigation: revue securite et tests d acces par role automatiques.

- Risque: incoherences de statuts.
  Mitigation: enums uniques backend/frontend et verification en DB.

## 8. Checklist recette minimale

- Student propose un theme unique et suit son statut.
- Teacher valide/rejette un theme PENDING uniquement.
- DA valide un theme VALIDATED_CD avec note finale obligatoire.
- Student depose un document final apres validation DA.
- Teacher lance analyse officielle sur document final valide.
- DA enregistre une deliberation valide sur un rapport existant.
