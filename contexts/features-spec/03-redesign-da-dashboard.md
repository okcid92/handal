# Prompt de Redesign — Espace DA (Direction Académique) Handal

---

## Contexte global à fournir à l'agent

```
Tu es un expert UI/UX senior spécialisé en interfaces académiques institutionnelles.
Tu travailles sur Handal, une plateforme de détection de plagiat pour l'IBAM 
(Institut Burkinabè des Arts et Métiers).

Stack : Next.js 16, TypeScript, Tailwind CSS, Lucide React
Couleur principale : #6c5448 (Bronze/Marron IBAM) + variantes bordeaux (#7c1c3c)
Background actuel : beige chaud (#f5f0e8)
Police : système sans-serif professionnel

L'espace DA (Direction Académique) contient 4 pages :
1. Tableau de bord (/da)
2. Rapports finaux (/da/reports)
3. Délibérations (/da/deliberations)
4. Base de Référence (/da/references)

L'utilisateur connecté est : Dr. Lucien Zaongo — DIRECTION ACADÉMIQUE
La sidebar contient : Logo Handal, profil DA, bouton "DÉLIBÉRATION FINALE" (CTA principal),
Déconnexion, Navigation (4 items), Ressources, Statistiques rapides.
```

---

## PAGE 1 — Tableau de Bord (`/da`)

```
Redesigne entièrement la page "Tableau de bord" de la Direction Académique 
de Handal en gardant TOUTE la logique métier existante mais en modernisant 
radicalement le visuel.

=== ÉTAT ACTUEL ===
- Bannière bordeaux foncé "2 rapports en attente de délibération" avec CTA
- 4 stat cards (Rapports totaux, Risque élevé, Risque moyen, Risque faible)
- Liste des étudiants à traiter avec score % et niveau de risque coloré
- Section "Distribution des risques" avec barres colorées (rouge/orange/vert)
- Section "Activité récente" (liste de logs avec dates)
- Card "Base de Référence" en bas

=== REDESIGN DEMANDÉ ===

LAYOUT : Passe d'une colonne unique à un layout 2 colonnes sur desktop
(colonne principale 2/3 + sidebar droite 1/3)

HEADER DE PAGE :
- Titre "Tableau de bord" remplacé par un greeting contextuel :
  "Bonjour, Dr. Zaongo" en grand + sous-titre "Voici l'état de vos délibérations"
- Date du jour affichée à droite (format : "Lundi 5 mai 2026")

BANNIÈRE D'ALERTE :
- Remplace la bannière bordeaux plate par une card avec gradient subtil
  bordeaux → bordeaux foncé, coins arrondis xl, ombre portée
- Icône animée (pulse) sur le badge de compteur
- Le bouton "Délibérer maintenant" devient plus proéminent avec icône flèche

STAT CARDS (4 cards) :
- Design "glassmorphism léger" : fond blanc semi-transparent, bordure 1px 
  rgba(108,84,72,0.15), ombre douce
- Chaque card a une icône Lucide colorée en haut à gauche dans un cercle teinté
- Le chiffre principal en très grande typographie (4xl bold)
- Ajoute une micro-tendance sous chaque chiffre (ex: "↑ 2 depuis hier")
- Couleurs sémantiques : Élevé=rouge (#dc2626), Moyen=orange (#f59e0b), 
  Faible=vert (#16a34a), Total=bordeaux

LISTE ÉTUDIANTS À TRAITER :
- Remplace les cards plates par des rows avec hover effect (fond qui change)
- Ajoute un avatar placeholder circulaire avec initiales de l'étudiant 
  (généré depuis le titre du rapport, 2 premières lettres)
- Le score de plagiat devient un badge circulaire coloré (comme un gauge)
  avec le % en son centre — rouge si >50%, orange si 20-50%, vert si <20%
- Badge "Risque élevé/faible" avec icône warning/check
- Bouton action "Délibérer →" visible au hover sur chaque row

COLONNE DROITE (sidebar) :
- Card "Distribution des risques" redesignée avec barres horizontales 
  animées (transition CSS) + pourcentages
- Card "Activité récente" avec timeline verticale (ligne pointillée 
  + points colorés) au lieu d'une liste plate
- Chaque log d'activité montre : titre tronqué (max 40 chars), 
  badge de risque coloré, date relative ("il y a 2h")

BASE DE RÉFÉRENCE :
- Transforme la card du bas en une "Quick Access Card" avec 3 stats :
  nombre de documents, dernière mise à jour, bouton consulter
- Fond légèrement différent (bordeaux très clair) pour la distinguer

SIDEBAR GAUCHE (composant DALayout) :
- Le bouton "DÉLIBÉRATION FINALE" devient une pill animée avec shimmer effect
- Les items de navigation actifs ont un indicateur de barre gauche colorée
  + fond teinté bordeaux très léger
- Les "Statistiques rapides" en bas deviennent des badges inline plutôt 
  que des rows séparées

RESPONSIVE :
- Mobile : toutes les sections en colonne unique, cards scrollables 
  horizontalement pour les stats
- Le greeting masque la date sur mobile

Technologies : Next.js + Tailwind CSS + Lucide React
Ne pas changer la logique API ni les appels fetch existants.
Respecte la palette : #6c5448, #7c1c3c, fond #f5f0e8, blanc #ffffff
```

---

## PAGE 2 — Rapports Finaux (`/da/reports`)

```
Redesigne entièrement la page "Rapports finaux" de la Direction Académique 
de Handal.

=== ÉTAT ACTUEL ===
- Header simple "Rapports finaux d'analyse" + compteur "2 rapports disponibles"
- Tableau avec colonnes : ÉTUDIANT | FILIÈRE | SCORE PLAGIAT | TENTATIVES
- Chaque row affiche : titre du rapport (en gras) + sous-titre répété,
  filière (tiret si vide), barre de progression colorée + pourcentage,
  nombre de tentatives + flèche chevron
- Fond blanc sur la table, beige sur le reste

=== PROBLÈMES IDENTIFIÉS ===
- Le titre du rapport est répété deux fois (bold + normal) — redondant
- La colonne FILIÈRE affiche "—" partout — inutile visuellement
- La barre de progression est trop petite et peu lisible
- Pas de filtre, pas de tri, pas de recherche active
- Pas d'indication claire sur l'action à faire

=== REDESIGN DEMANDÉ ===

HEADER SECTION :
- Icône + titre + sous-titre conservés MAIS ajoute à droite :
  3 filtres pill cliquables : [Tous] [Risque élevé 🔴] [Risque faible 🟢]
  (filtre client-side sur le state, pas d'appel API)
- Compteur dynamique qui change selon le filtre actif

LAYOUT TABLE → CARDS :
- Abandonne le tableau HTML au profit d'une liste de "Report Cards"
- Chaque card occupe toute la largeur, hauteur ~100px, fond blanc,
  coins arrondis lg, ombre xs, bordure gauche 4px colorée selon le risque
  (rouge si HIGH, orange si MEDIUM, vert si LOW)

CONTENU DE CHAQUE REPORT CARD :
Disposition en 3 zones horizontales :
  
  [ZONE GAUCHE - 50%]
  - Titre détecté du rapport en font-semibold, taille base, 2 lignes max
    avec ellipsis (line-clamp-2) — PAS de répétition du titre
  - Sous-ligne : "1 tentative · Analysé le 4 mai 2026"
  - Badge filière si disponible (sinon masqué complètement)

  [ZONE CENTRE - 25%]
  - Score de plagiat affiché comme un "Score Ring" (cercle SVG simple)
    avec le % au centre en bold coloré
  - Sous le ring : label "Score plagiat"
  - Couleur du ring : rouge (#dc2626) si >50%, 
                      orange (#f59e0b) si 20-50%,
                      vert (#16a34a) si <20%

  [ZONE DROITE - 25%]
  - Badge de risque prominent : pill colorée "Risque élevé" ou "Risque faible"
    avec icône (AlertTriangle ou CheckCircle)
  - Bouton "Délibérer" en bordeaux si pas encore délibéré
  - Badge "Délibéré ✓" en vert si déjà traité
  - Nombre de tentatives (ex: "1×") en texte gris discret

ÉTAT VIDE :
- Si aucun rapport : illustration simple (icône FileText géante en gris pâle)
  + message "Aucun rapport à traiter" + sous-texte

ÉTAT CHARGEMENT :
- 3 skeleton cards animées (pulse) pendant le fetch

HOVER & INTERACTION :
- Au hover sur une card : légère élévation (shadow-md), 
  curseur pointer, le bouton "Délibérer" s'illumine
- Click sur toute la card (sauf le bouton) → ouvre un modal de détail

MODAL DE DÉTAIL (nouveau) :
Quand on clique sur une report card, ouvre un slide-over panel depuis la droite :
  - Titre complet du rapport
  - Scores détaillés (similarité globale, score IA si disponible)
  - Sources matchées listées
  - Section délibération inline (formulaire compact :
    Décision [select], Notes [textarea], bouton Enregistrer)
  - Fermeture par bouton X ou clic sur l'overlay

RESPONSIVE :
- Mobile : les 3 zones passent en colonne, le Score Ring se réduit à 48px
- Tableau masqué sur mobile, cards conservées

Technologies : Next.js + Tailwind CSS + Lucide React
Conserve tous les appels API existants (GET /api/reports, POST /api/reports/{id}/deliberate)
```

---

## PAGE 3 — Délibérations (`/da/deliberations`)

```
Redesigne entièrement la page "Délibérations" de la Direction Académique 
de Handal.

=== ÉTAT ACTUEL ===
- Formulaire minimaliste : "Délibération directe — Saisie par ID de rapport"
- Champs : Report ID (text), Décision (select), Commission (text), Notes (textarea)
- Bouton "Enregistrer" bordeaux pleine largeur
- Message d'info : "Préférez la vue Rapports finaux pour délibérer directement"
- Page quasi vide, peu d'affordance

=== PROBLÈMES IDENTIFIÉS ===
- Formulaire isolé sans contexte — l'utilisateur ne sait pas quel rapport il délibère
- Pas d'historique des délibérations passées
- "Report ID" est un champ technique peu user-friendly
- Aucun feedback visuel sur les délibérations précédentes

=== REDESIGN DEMANDÉ ===

LAYOUT EN 2 COLONNES :
  Colonne gauche (60%) : Formulaire de délibération amélioré
  Colonne droite (40%) : Historique des délibérations

=== COLONNE GAUCHE — FORMULAIRE ===

HEADER :
- Titre "Nouvelle délibération" + sous-titre "Enregistrer une décision officielle"
- Badge statut session : "Session active · Dr. Zaongo"

CARD FORMULAIRE (fond blanc, ombre, coins xl) :

Étape 1 — Sélection du rapport :
- Remplace le champ "Report ID" texte libre par un SELECT ENRICHI :
  Dropdown qui liste les rapports disponibles avec leur titre et score
  Format option : "Rapport #11 — Titre tronqué (100.0% · Risque élevé)"
  Si le rapport est déjà délibéré : option grisée avec "✓ Délibéré"
- Quand un rapport est sélectionné : affiche une mini-card de prévisualisation
  sous le select montrant : titre, score, risque, étudiant

Étape 2 — Décision :
- Le select "Décision" devient 3 boutons radio visuels (cards cliquables) :
  
  [✅ Validation finale]     [📝 Réécriture requise]    [⚠️ Sanction]
  fond vert clair            fond orange clair           fond rouge clair
  Texte descriptif sous      Texte descriptif sous       Texte descriptif sous
  chaque option              chaque option               chaque option

  Le bouton sélectionné a une bordure colorée épaisse + fond plus saturé

Étape 3 — Commission & Notes :
- Champ Commission : input avec suggestions autocomplete 
  (["Commission pédagogique", "Commission d'honneur", "Jury de délibération"])
- Notes : textarea avec compteur de caractères (ex: "45/500")
- Placeholder plus guidant : "Détaillez les motifs de la décision..."

BOUTON SOUMETTRE :
- Texte contextuel selon la décision choisie :
  "Valider définitivement" / "Demander une réécriture" / "Appliquer une sanction"
- État loading avec spinner pendant la soumission
- Désactivé si aucun rapport sélectionné ou aucune décision choisie

FEEDBACK POST-SOUMISSION :
- Toast notification en haut à droite (3 secondes) : "✓ Délibération enregistrée"
- La mini-card de prévisualisation passe en état "Délibéré" avec animation

=== COLONNE DROITE — HISTORIQUE ===

HEADER : "Délibérations récentes" + badge compteur

LISTE TIMELINE :
- Chaque délibération affichée comme un item de timeline vertical :
  [Ligne pointillée verticale]
  [Point coloré selon décision] 
  [Card compacte] :
    - Titre du rapport (tronqué, max 2 lignes)
    - Badge décision coloré (vert/orange/rouge)
    - "Par Dr. Zaongo · Commission pédagogique"  
    - Date relative : "il y a 3 jours"
    - Notes tronquées en italique gris (si présentes)

ÉTAT VIDE :
- Icône Scale (Lucide) en gris pâle
- "Aucune délibération enregistrée"

RESPONSIVE :
- Mobile : colonne droite passe sous le formulaire (accordion masqué par défaut)
- Les radio buttons décision passent en colonne sur mobile

Technologies : Next.js + Tailwind CSS + Lucide React
Conserve l'appel API POST /api/reports/{id}/deliberate et GET /api/reports
```

---

## PAGE 4 — Base de Référence (`/da/references`)

```
Redesigne entièrement la page "Base de Référence" de la Direction Académique
de Handal.

=== ÉTAT ACTUEL ===
- 2 champs de recherche côte à côte (titre, filière)
- Tableau avec colonnes : TITRE/FICHIER | SOURCE | AUTEUR | FILIÈRE | TAILLE | DATE
- Chaque row : nom de fichier PDF, badge "Étudiant" bleu, "Administration", 
  "—" pour filière, taille en MB, date, lien "Consulter" rouge
- 5 documents listés

=== PROBLÈMES IDENTIFIÉS ===
- Les noms de fichiers techniques (rapportStageKyLaodou.pdf) peu lisibles
- La colonne FILIÈRE vide pour tous — inutile
- "Consulter" comme seule action — pas de téléchargement, pas d'aperçu
- Pas de stats sur la bibliothèque
- Pas d'indication sur l'utilité de cette base pour la DA

=== REDESIGN DEMANDÉ ===

HEADER SECTION :
- Titre "Base de Référence" + sous-titre "Bibliothèque des mémoires de référence"
- Ajoute une ligne de stats horizontale sous le header :
  [📄 5 documents] [💾 19.4 MB total] [🕒 Dernière mise à jour : 4 mai 2026]
  Ces stats sont en pills horizontales, fond bordeaux très léger

BARRE DE RECHERCHE :
- Fusionne les 2 inputs en 1 seule barre de recherche large (full-width)
  avec icône Search à gauche et bouton clear (×) à droite
- Sous la barre : filtres pills horizontaux scrollables :
  [Tous] [Étudiant] [Administration] [PDF] [DOCX]
  + tri dropdown à droite : "Trier par : Date ↓"

AFFICHAGE — MODE GRILLE (défaut) + MODE LISTE (toggle) :
- Bouton toggle en haut à droite pour switcher entre grille et liste
- Grille : 3 colonnes sur desktop, 2 sur tablet, 1 sur mobile

=== MODE GRILLE — Chaque document card ===
Card (fond blanc, ombre xs, coins lg, hover: shadow-md scale-[1.01]) :
  
  [HAUT DE CARD] : Zone colorée (hauteur 80px)
  - Fond bordeaux très dégradé (bordeaux clair → bordeaux)
  - Icône FileText (Lucide) centré, blanc, taille 32px
  - Badge SOURCE en haut à droite (Étudiant = bleu, Admin = gris)

  [CORPS DE CARD] : padding 16px
  - Nom du fichier nettoyé automatiquement :
    "rapportStageKyLaodou.pdf" → afficher "Rapport Stage Ky Laodou"
    (remplacer les _ et majuscules dans le titre affiché)
  - Nom brut en texte gris petit dessous (le vrai filename)
  - "Administration · 4 mai 2026"
  - Taille : "2.8 MB"

  [PIED DE CARD] : ligne séparateur + 2 boutons
  - [👁 Aperçu] : ouvre un modal de prévisualisation (nom du fichier)
  - [⬇ Consulter] : lien vers le fichier

=== MODE LISTE — Tableau amélioré ===
Conserve le tableau MAIS :
  - Colonne FILIÈRE masquée si vide (display:none si tous vides)
  - Colonne TITRE affiche le nom nettoyé + filename en sous-texte gris
  - Colonne ACTIONS : 2 boutons icône (Eye + Download) au lieu de texte "Consulter"
  - Hover sur row : fond bordeaux très très léger

ÉTAT VIDE (si recherche sans résultats) :
- Icône BookOpen géante gris pâle
- "Aucun document trouvé pour '{terme recherché}'"
- Bouton "Effacer la recherche"

ÉTAT CHARGEMENT :
- Skeleton cards en mode grille (3 cards grises animées)

RESPONSIVE :
- Mobile : grille forcée en 1 colonne
- Barre de recherche full-width
- Filtres pills scrollables horizontalement (overflow-x-auto)

Technologies : Next.js + Tailwind CSS + Lucide React
Conserve l'appel API GET /api/references
Ne pas ajouter de logique d'upload (c'est le rôle de l'Admin)
```

---

## Instruction finale pour l'agent

```
RÈGLES TRANSVERSALES POUR TOUTES LES PAGES :

1. COHÉRENCE VISUELLE :
   - Palette stricte : #6c5448 (bronze), #7c1c3c (bordeaux), 
     #f5f0e8 (beige fond), #ffffff (cards), #1f2937 (texte)
   - Border radius cohérent : lg (8px) pour inputs, xl (12px) pour cards,
     2xl (16px) pour modals
   - Ombres : shadow-xs pour cards repos, shadow-md pour hover/focus

2. COMPOSANTS PARTAGÉS (créer une fois, réutiliser) :
   - RiskBadge : badge coloré selon niveau (HIGH/MEDIUM/LOW)
   - ScoreRing : cercle SVG avec % au centre
   - TimelineItem : item d'historique avec point coloré
   - PageHeader : titre + sous-titre + slot droit pour actions

3. NE PAS MODIFIER :
   - La logique d'authentification et de session
   - Les appels API existants et leurs endpoints
   - Le composant DALayout (sidebar) sauf améliorations visuelles mineures
   - Le schéma de données Prisma

4. ACCESSIBILITÉ :
   - Tous les boutons ont un aria-label
   - Les couleurs de risque ne sont pas le seul indicateur (toujours un texte)
   - Focus visible sur tous les éléments interactifs

5. ORDRE D'IMPLÉMENTATION RECOMMANDÉ :
   Page 1 (Dashboard) → Page 2 (Rapports) → Page 4 (Base Référence) → Page 3 (Délibérations)
   Commence par le Dashboard car il pose les composants partagés.

Génère le code TSX complet pour chaque page, une à la fois.
Commence par : "Page 1 — Tableau de bord (/da)"
```
