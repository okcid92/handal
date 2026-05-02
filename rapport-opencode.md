# Rapport d'analyse des incohérences - Handal

## 🔴 CRITIQUE — Incohérences bloquantes

### 1. Hybridation v1/v2 du workflow de validation des thèmes
**Fichiers concernés :** `src/server/themes.ts`, `workflow.md`, `roadmap.md`, `COPILOT.md`

Le code implémente un hybride confus entre deux versions :
- **v1 (sources.md)** : `PENDING → VALIDATED_CD → VALIDATED_DA`
- **v2 (workflow.md)** : `PENDING_VALIDATION → VALIDATED` (validation conjointe)

**Problème dans `themes.ts` :**
- `validateThemeCd()` ligne 443 : passe directement à `VALIDATED` (ignore `VALIDATED_CD`)
- `validateThemeDa()` ligne 491-535 : gère les deux cas avec un flag `isV2`
- Les statuts `VALIDATED_CD` et `VALIDATED_DA` sont dans le schéma mais la logique v2 court-circuite v1

**Impact :** Le workflow réel ne correspond ni à l'ancien système documenté (sources.md), ni au nouveau système cible (workflow.md).

---

### 2. Système d'appréciation finale v2 absent
**Fichiers concernés :** `schema.prisma`, `workflow.md` sections 1.7, 2.6, 3.5, `src/server/deliberations.ts`

- **Documentation :** décrit `POST /api/documents/{id}/final-appreciation` avec `FinalAppreciation` (décisions : `APPROVED`, `APPROVED_WITH_MENTION`, etc.)
- **Schéma :** `FinalAppreciation` model existe (ligne 111-134) + enum `AppreciationDecision`
- **Implémentation :** Aucune route `final-appreciation` trouvée. Le système v1 (`Deliberation` avec `final_validation`/`sanction`/`rewrite_required`) est toujours utilisé via `POST /api/reports/{report}/deliberate`

**Impact :** 2 systèmes coexistent dans le schéma mais seul l'ancien est implémenté.

---

### 3. Prérequis de dépôt de document incohérents
**Fichiers concernés :** `src/server/documents.ts:854-863`, `sources.md`, `COPILOT.md`

- **sources.md ligne 208-212 :** Dépôt autorisé uniquement si `VALIDATED_DA` + note finale
- **COPILOT.md :** "DA valide → Étudiant dépose"
- **Implémentation `createDocument()` :** Accepte `VALIDATED` OU `VALIDATED_DA` (ligne 855-856)

**Impact :** Un étudiant peut déposer son mémoire sans validation DA selon le flot v2.

---

## 🟠 MAJEUR — Incohérences structurelles

### 4. Exigence de la note finale contradictoire
**Fichiers concernés :** `src/server/themes.ts:505-524`, `sources.md:200`, `roadmap.md:133`

- **Documentation :** La note finale (0-20) est obligatoire lors de la validation DA
- **Implémentation :** `validateThemeDa()` ligne 505 : `if (!isV2 && decision === "approved")` → la note n'est requise qu'en v1

---

### 5. Enum `ThemeStatus` surchargé et confus
**Fichiers concernés :** `schema.prisma:227-241`, `workflow.md`

Le schéma contient 13 statuts mélangeant v1 et v2 :
```
PENDING, PENDING_VALIDATION, VALIDATED_CD, VALIDATED_DA, VALIDATED,
REJECTED, DOCUMENT_SUBMITTED, ANALYSIS_PENDING, APPROVED,
APPROVED_WITH_MENTION, CONDITIONAL_APPROVAL, REQUESTED_REVIEW, FLAGGED_PLAGIARISM
```

**Problème :** `DOCUMENT_SUBMITTED` n'existe pas dans l'implémentation (remplacé par `DocumentStatus.SUBMITTED`). Certains statuts sont documentés mais jamais utilisés.

---

### 6. `DeliberationDecision` vs `AppreciationDecision`
**Fichiers concernés :** `schema.prisma:258-276`, `src/server/deliberations.ts`

Deux enums pour les décisions finales coexistent dans le schéma :
- `DeliberationDecision` : `FINAL_VALIDATION`, `SANCTION`, `REWRITE_REQUIRED` (utilisé)
- `AppreciationDecision` : `APPROVED`, `APPROVED_WITH_MENTION`, etc. (non utilisé)

---

## 🟡 MOYEN — Incohérences documentaires

### 7. Routes API documentées vs implémentées
**Fichiers concernés :** `sources.md:311-324`, `src/app/api/**/route.ts`

| Route documentée (sources.md) | Implémentée |
|--------------------------------|-------------|
| `PATCH /api/themes/{theme}/moderate` | ❌ Non trouvée |
| `POST /api/documents/upload` | ❌ (`/upload-file` existe) |
| `POST /api/documents/{id}/final-appreciation` | ❌ Non trouvée |
| `GET /api/documents/{id}/analysis` | ❌ Non trouvée |

---

### 8. Analyse inline après upload non documentée
**Fichiers concernés :** `src/server/documents.ts:1172-1330`, `workflow.md`

- `analyzeDocumentInline()` est appelée automatiquement après l'upload étudiant
- Cette analyse immédiate n'est pas décrite dans `workflow.md` (qui décrit une phase 2 séparée)

---

### 9. Seuil 20% appliqué différemment
**Fichiers concernés :** `workflow.md:364-374`, `src/server/documents.ts:112-132`

- **Documentation :** Le seuil 20% est un filtre de Phase 3 (après analyse complète)
- **Implémentation :** `shouldAutoValidateByChefDept()` applique le seuil 20% + ratio exclu < 0.3 pour auto-valider en `APPROVED`

---

## 🟢 MINEUR — Observations

### 10. Endpoint de validation conjointe documenté mais absent
`workflow.md` section 2.3 documente `PATCH /api/themes/{theme}/validate-joint` comme cible v2 — aucune implémentation trouvée.

### 11. Conflit de rôles DA dans `validateThemeDa()`
Ligne 491-494 accepte `VALIDATED_CD` (v1) et `PENDING_VALIDATION` (v2), mais le commentaire ligne 490 dit "DA peut voter sans attendre CD" — la logique v2 est implicite.

### 12. `perspective.md` hors sujet
Contient une ligne : "rajout d'un systeme qui permet la comparaison avec entre les documents en temps reel" — aucune implémentation correspondante trouvée.

---

## Recommandations

1. **Choisir v1 ou v2** et migrer complètement le code + documentation
2. **Implémenter `FinalAppreciation`** ou supprimer du schéma
3. **Nettoyer `ThemeStatus`** en retirant les statuts inutilisés
4. **Aligner les prérequis de dépôt** avec une seule source de vérité
5. **Mettre à jour `sources.md`** avec un avertissement clair que c'est de la documentation legacy
