# Roadmap full Next.js — Handal

Objectif: livrer une application 100% Next.js (frontend + backend API) sur MySQL, en reprenant les regles metier d Origina sans dependre de Laravel.

## 1. Principes directeurs

- Full stack dans une seule base de code Next.js.
- Contrat metier preserve, meme si l implementation backend change.
- Migration par increment avec validation fonctionnelle continue.
- Priorite aux workflows critiques: theme, validation, depot, analyse, appreciation finale.
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

## Phase 0 - Auth v2 (Semaine 1)

Statut actuel: COMPLETE (sessions, RBAC et comptes demo fonctionnels)

Livrables:

- Authentification session HMAC-SHA256.
- RBAC par role (student, teacher, da, admin).
- Comptes de demo seedes.

Actions:

- Verifier la creation de session et la persistance cookie.
- Standardiser les roles et les guard helpers.

Critere d acceptance:

- Les 4 comptes de demo se connectent avec permissions correctes.

## Phase 1 - Thème validation v2 (Semaines 1-2)

Statut actuel: COMPLETE (validation conjointe Teacher + DA, statut PENDING_VALIDATION, route vote)

Livrables:

- POST /api/themes/propose.
- GET /api/themes/pending.
- POST /api/themes/{id}/vote (vote parallele Teacher + DA).

Actions:

- Regle titre unique + auto-check 70%.
- Votes paralleles et statut final VALIDATED/REJECTED.

Critere d acceptance:

- Theme valide uniquement si Teacher + DA approuvent.

## Phase 2 - Document upload v2 (Semaines 2-3)

Statut actuel: COMPLETE (precondition VALIDATED, upload metadata, analyse declenchee)

Livrables:

- POST /api/documents/upload-file.
- POST /api/documents/{document}/auto-test.
- POST /api/documents/{document}/analyze.
- GET /api/reports et GET /api/reports/{report}.

Actions:

- Verifier preconditions: theme VALIDATED uniquement.
- Analyse plagiat + IA, seuil 20%.

Critere d acceptance:

- Document upload bloque si theme non VALIDATED.

## Phase 3 - Appreciation finale v2 (Semaines 3-4)

Statut actuel: COMPLETE (route final-appreciation, votes Teacher + DA, decision finale)

Livrables:

- POST /api/documents/{id}/final-appreciation.
- FinalAppreciation modele et calcul finalDecision.

Actions:

- Decisions possibles: APPROVED, APPROVED_WITH_MENTION, CONDITIONAL_APPROVAL, REQUESTED_REVIEW, REJECTED.
- Statut document mis a jour (APPROVED/REJECTED).

Critere d acceptance:

- Decision finale enregistree apres 2 votes.

## Phase 4 - Stabilisation & qualite (Semaines 4-6)

Statut actuel: EN COURS (tests, hardening, monitoring)

Livrables:

- Tests unitaires services metier.
- Tests integration API Route Handlers.
- Tests e2e par role et par workflow.

Actions:

- Ajouter tests de transitions invalides.
- Hardening securite (rate limit, headers, CSRF).

Critere d acceptance:

- Aucun bug bloquant sur workflows critiques.

## Phase 5 - Frontend Next.js complet (Semaines 6-7)

Statut actuel: COMPLETE (login UX, dashboards student/teacher/DA/admin, formulaires metier, navigation role-based)

Livrables:

- Login et dashboard par role.
- Parcours student complet (proposition, depot, auto-test).
- Parcours teacher/admin (votes, analyse, rapports).
- Parcours da/admin (votes, appreciation finale).

Actions:

- UI forms avec validation Zod.
- Etats loading/error/success sur tous les ecrans metier.
- Composants de visualisation des scores et risques.

Critere d acceptance:

- Tous les cas d usage metier sont realisables dans l interface Next.js.

## Phase 6 - Qualite, performance, securite (Semaines 7-8)

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

## Phase 7 - Go-live et decommission Laravel (Semaine 8+)

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
5. Endpoints rapports/appreciations finales.
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
- Teacher vote sur un theme PENDING_VALIDATION.
- DA vote sur un theme PENDING_VALIDATION.
- Student depose un document final apres theme VALIDATED.
- Teacher lance analyse officielle sur document final valide.
- DA enregistre une appreciation finale sur un document analyse.
