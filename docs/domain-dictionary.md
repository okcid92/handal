# Dictionnaire metier (Phase 0)

Ce document formalise les objets metier et regles de base pour la version full Next.js.

## Roles

- STUDENT: propose un theme, depose un document final, lance auto-test.
- TEACHER: modere themes, lance analyse officielle.
- DA: valide académiquement les themes, delibere sur rapports.
- ADMIN: cumule les permissions teacher + da.

Le role `var` n est pas retenu dans la logique metier.

## Authentification

- Etudiant (STUDENT): connexion avec INE + mot de passe.
- Exemple INE: N01331820231.
- Personnel (TEACHER, DA, ADMIN): connexion avec email + mot de passe.

Regle de donnees:

- `ine` doit etre unique lorsqu il est renseigne.
- `email` doit etre unique lorsqu il est renseigne.

## Statuts themes

- PENDING: theme en attente de moderation locale.
- VALIDATED_CD: validation locale enseignant/departement.
- VALIDATED_DA: validation academique DA.
- REJECTED: theme rejete.

## Regles de transitions themes

- Creation theme: statut initial PENDING.
- Validation CD: PENDING -> VALIDATED_CD.
- Rejet CD: PENDING -> REJECTED.
- Validation DA: VALIDATED_CD -> VALIDATED_DA (note finale obligatoire 0..20).
- Rejet DA: VALIDATED_CD -> REJECTED.

## Entites

- User: compte applicatif et role.
- Theme: sujet de memoire et cycle de validation.
- Document: depot final lie a un theme.
- SimilarityReport: resultat d analyse du document.
- Deliberation: decision finale sur un rapport.

## Contraintes critiques

- Unicite globale de theme sur le titre, insensible a la casse.
- Le document final n est autorise que si le theme est VALIDATED_DA. La note finale (0..20) est requise par la regle metier lors de la validation DA ; sa presence n est pas re-verifiee a l upload (verification cote validation DA).
- Analyse officielle reservee a TEACHER/ADMIN.
- Deliberation reservee a DA/ADMIN.

## Decisions de deliberation

- final_validation
- sanction
- rewrite_required

## Endpoints metier cibles (full Next.js)

- POST /api/login
- POST /api/logout
- GET /api/me/overview
- POST /api/themes/propose
- GET /api/themes/pending
- PATCH /api/themes/{theme}/validate-cd
- PATCH /api/themes/{theme}/validate-da
- POST /api/documents/upload-file (upload reel multipart — route active)
- POST /api/documents/upload (route metadata seule — conservee pour compatibilite)
- POST /api/documents/{document}/auto-test
- POST /api/documents/{document}/analyze
- GET /api/reports
- GET /api/reports/{report}
- POST /api/reports/{report}/deliberate
