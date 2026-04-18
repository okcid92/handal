# Roadmap de migration vers Next.js (Origina)

Objectif: reconstruire le frontend en Next.js sans casser le contrat API Laravel existant, puis faire evoluer progressivement la securite, la qualite et les fonctions metier avancees.

## 1. Principes de migration

- Preserver le contrat API existant en priorite.
- Migrer par increments (pas de big-bang).
- Garder les regles metier identiques sur les statuts et les roles.
- Mettre des garde-fous de regression sur les parcours critiques.
- Traiter les fonctions non finalisees (auth, upload binaire, moteur IA) comme des chantiers distincts.

## 2. Cible technique

- Frontend: Next.js App Router + TypeScript.
- Couche data: client API unique (fetch server/client) avec types partages cotes frontend.
- Etat UI: cache de requetes (ex: React Query) + etat local minimal.
- Auth temporaire: compatibilite avec X-User-Id et user_id selon l API actuelle.
- Auth cible: session/token robuste (phase ulterieure).

## 3. Decoupage en phases

## Phase 0 - Cadrage et baseline (Semaine 1)

Livrables:
- Inventaire complet des ecrans React/Vite existants et mapping vers routes Next.js.
- Inventaire des endpoints Laravel utilises par ecran.
- Definition des types metier (User, Theme, Document, SimilarityReport, Deliberation).
- Environnement local stable (API Laravel + Next.js + DB seedee).

Actions:
- Verifier les comptes seeds reels et les utiliser comme references de test.
- Documenter les statuts autorises: PENDING, VALIDATED_CD, VALIDATED_DA, REJECTED.
- Clarifier le role var: ignore pour l instant sauf exigence metier explicite.

Critere d acceptance:
- Matrice Ecran -> Endpoint -> Role validee.

## Phase 1 - Socle frontend Next.js (Semaines 1-2)

Livrables:
- Architecture dossiers et conventions (routes, composants, services, types).
- Client API centralise (gestion headers, erreurs, parsing).
- Layout global, theme UI, gestion localStorage (origina_theme, origina_user).

Actions:
- Creer un module api-client avec injection de X-User-Id.
- Uniformiser gestion des erreurs API (401, 403, 422, 500).
- Poser un design system minimal (boutons, tableaux, badges de statut, formulaires).

Critere d acceptance:
- Le socle permet d implementer un ecran metier sans dupliquer la logique reseau.

## Phase 2 - Auth demo compatible backend actuel (Semaine 2)

Livrables:
- Ecran login connecte a POST /api/login.
- Persistance utilisateur dans localStorage (compatibilite existant).
- Middleware/guards de pages par role cote Next.js.

Actions:
- Reproduire le mecanisme de connexion actuel sans le casser.
- Ajouter controle d acces par role: student, teacher, da, admin.
- Ajouter deconnexion via /api/logout et purge etat local.

Critere d acceptance:
- Les 4 comptes de demonstration peuvent se connecter et acceder a leurs vues autorisees.

## Phase 3 - Parcours student (Semaines 2-3)

Livrables:
- Proposition de theme: POST /api/themes/propose.
- Liste des themes de l etudiant.
- Depot de memoire (metadata): POST /api/documents/upload.
- Auto-test document: POST /api/documents/{document}/auto-test.

Actions:
- Valider cote UI les regles visibles (titre >= 8 caracteres).
- Afficher explicitement les erreurs de doublon de titre.
- Afficher etat des statuts de theme avec badges clairs.

Critere d acceptance:
- Un etudiant peut completer le flux jusqu a l auto-test sans contournement de regles.

## Phase 4 - Parcours teacher/admin (Semaines 3-4)

Livrables:
- File des themes a moderer: GET /api/themes/pending.
- Validation locale: PATCH /api/themes/{theme}/validate-cd.
- Analyse officielle: POST /api/documents/{document}/analyze.
- Liste et detail des rapports: GET /api/reports et GET /api/reports/{report}.

Actions:
- Gestions des decisions approved/rejected + commentaire.
- Visualisation des scores (local, web, IA, global) et risque low/medium/high.
- Tableaux filtres par statut/risque/date.

Critere d acceptance:
- Teacher et admin executent l analyse officielle sur document final valide DA.

## Phase 5 - Parcours DA/admin (Semaines 4-5)

Livrables:
- Validation academique: PATCH /api/themes/{theme}/validate-da.
- Deliberation finale: POST /api/reports/{report}/deliberate.

Actions:
- Imposer note finale 0..20 a l approbation DA.
- Gestions des decisions: final_validation, sanction, rewrite_required.
- Historisation visuelle des decisions et acteurs.

Critere d acceptance:
- Le workflow complet du theme a la deliberation est executable end-to-end.

## Phase 6 - Stabilisation qualite et non-regression (Semaines 5-6)

Livrables:
- Suite de tests e2e sur les parcours critiques.
- Tests d integration du client API.
- Observabilite frontend (logs erreurs, traces de parcours).

Actions:
- Ecrire des tests par role sur les etapes critiques.
- Ajouter tests de regression sur transitions de statuts.
- Ajouter pages d erreur et fallback UX robustes.

Critere d acceptance:
- Zero regression sur les parcours critiques par rapport au frontend actuel.

## Phase 7 - Evolution cible (post-migration)

Livrables:
- Proposition technique pour auth robuste (Sanctum/JWT/session).
- Plan upload binaire reel (backend + stockage + UI).
- Plan d integration moteur Python (ou alternative) dans pipeline analyse.

Actions:
- Prioriser selon impact metier et risque securite.
- Definir une migration progressive sans interruption de service.

Critere d acceptance:
- Backlog d evolution priorise, chiffre et approuve.

## 4. Backlog prioritaire (ordre de build)

1. Types metier partages et client API central.
2. Login demo + guards de role.
3. Dashboard role-based (overview).
4. Parcours student complet.
5. Parcours teacher/admin.
6. Parcours DA/admin.
7. Tests e2e et hardening UX.

## 5. Definition of Done globale

- Toutes les routes React/Vite critiques ont un equivalent Next.js.
- Tous les endpoints API listes dans la documentation sont relies.
- Les contraintes metier de statuts et roles sont respectees.
- Les erreurs API sont gerees de maniere explicite cote UI.
- La documentation d exploitation est a jour.

## 6. Risques majeurs et mitigation

- Risque: derive du contrat API pendant la migration.
  Mitigation: tests de contrat et mocks bases sur reponses reelles.

- Risque: confusion sur role var non supporte backend.
  Mitigation: exclure role var de la logique metier jusqu a clarification.

- Risque: incoherences de statuts (pending vs PENDING).
  Mitigation: normalisation stricte cote frontend via enums.

- Risque: auth faible (X-User-Id) en production.
  Mitigation: limiter a environnement demo et planifier phase auth robuste.

## 7. Jalons de livraison proposes

- Jalon A: socle + auth demo + dashboard.
- Jalon B: flux student complet.
- Jalon C: flux teacher/admin + rapports.
- Jalon D: flux DA/admin + deliberation.
- Jalon E: tests, recette metier, go-live.

## 8. Checklist de recette metier minimale

- Student propose un theme unique et voit son statut evoluer.
- Teacher valide/rejette un theme PENDING uniquement.
- DA valide un theme VALIDATED_CD avec note finale obligatoire.
- Student depose un document final uniquement apres validation DA.
- Teacher lance analyse officielle uniquement sur document final valide.
- DA enregistre une deliberation valide sur un rapport existant.
