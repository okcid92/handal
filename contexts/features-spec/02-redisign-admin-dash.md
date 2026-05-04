# Prompt Complet — Redesign Dashboard Admin Handal (Simplifié)

---

> **Redesign the Handal admin dashboard page using Next.js, TypeScript, and Tailwind CSS. Primary brand color: `#6c5448` (bronze/brown). The admin's sole responsibilities are: uploading reference documents, viewing the list of users, and consulting the reference document library. The interface must be simple, clean, and focused — no unnecessary complexity.**

---

## 📐 LAYOUT GLOBAL

```
Layout 2 colonnes :
- Sidebar fixe gauche : 240px, fond blanc, bordure droite #e8e0db
- Zone principale : flex-1, fond #faf7f5, overflow-y-auto, padding 32px
```

---

## 🗂️ SIDEBAR

```
Header :
- Logo HANDAL + icône, texte bold #6c5448
- Badge "ADMINISTRATION" pill xs, fond #6c5448/10, texte #6c5448

Bloc profil :
- Avatar circulaire initiales "A", fond #6c5448, texte blanc
- Nom "Administration", rôle "Administrateur" xs gris

Bouton "Déconnexion" :
- Width full, bordure #6c5448/30, texte #6c5448, icône LogOut

Séparateur + label "MENU"

Navigation — 3 items UNIQUEMENT :
┌────────────────────────────────────────┐
│  ⬆  Uploader un document              │  ← Upload
│  📚 Documents de référence            │  ← Liste docs
│  👥 Utilisateurs                      │  ← Liste users
└────────────────────────────────────────┘

Item ACTIF :
- Fond #6c5448, texte blanc, rounded-lg

Item INACTIF :
- Texte #4b5563
- Hover : fond #faf7f5, texte #6c5448
```

---

## 🏠 ZONE PRINCIPALE

### Vue par défaut — Tableau de bord

```
En-tête :
┌─────────────────────────────────────────────────────┐
│  Bonjour, Administrateur 👋                          │
│  Voici un aperçu rapide de vos tâches               │
└─────────────────────────────────────────────────────┘
- Titre text-2xl font-bold #1a1a1a
- Sous-titre text-sm #6b7280
- Séparateur <hr> #e8e0db margin-y 24px
```

---

### 📊 3 Cards de résumé

```
Grid 3 colonnes, gap-4 :

┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│  📄               │ │  👥               │ │  ✅               │
│  Documents        │ │  Utilisateurs     │ │  Dernière         │
│  de référence     │ │  enregistrés      │ │  importation      │
│                   │ │                   │ │                   │
│       12          │ │       47          │ │   Il y a 2j       │
└───────────────────┘ └───────────────────┘ └───────────────────┘

Chaque card :
- Fond blanc, rounded-xl, shadow-sm, bordure #e8e0db
- Bordure top 3px :
  * Documents    → #6c5448
  * Utilisateurs → blue-400
  * Importation  → green-400
- Icône 20px dans carré arrondi fond coloré/10
- Label uppercase xs #9ca3af
- Valeur text-3xl font-bold #1a1a1a
- Hover : shadow-md transition 200ms
```

---

### ⬆️ Zone d'upload — Section principale

```
Card centrale :
- Fond blanc, rounded-xl, shadow-sm, bordure #e8e0db, padding 32px
- Label section : "IMPORTER UN DOCUMENT DE RÉFÉRENCE" 
  uppercase xs #9ca3af, avec icône Upload 14px

Zone drag-and-drop :
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              ☁️  Glissez votre PDF ici                      │
│                                                             │
│         ou  [ Parcourir les fichiers ]                      │
│                                                             │
│         Formats acceptés : PDF uniquement · Max 50MB        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Styling zone drop :
- Bordure dashed 2px #6c5448/30, rounded-xl
- Fond #faf7f5
- Au survol (drag over) : bordure #6c5448, fond #6c5448/5
- Icône nuage : 48px, couleur #6c5448/40
- Bouton "Parcourir" : fond #6c5448, texte blanc, rounded-lg, px-6 py-2

Après sélection du fichier :
┌─────────────────────────────────────────────────────────────┐
│  📄  rapport_stage_2024.pdf              2.5 MB    [✕]      │
│  ████████████████░░░░  75%  En cours d'envoi...             │
└─────────────────────────────────────────────────────────────┘
- Fond blanc, bordure #e8e0db, rounded-lg, padding 16px
- Barre de progression : fond #6c5448/20, remplissage #6c5448
- Bouton supprimer [✕] : texte red-400, hover red-600

Message succès après upload :
┌─────────────────────────────────────────────────────────────┐
│  ✅  Document importé avec succès !                          │
│      Le fichier a été ajouté à la base de référence.        │
└─────────────────────────────────────────────────────────────┘
- Fond #f0fdf4, bordure green-200, texte green-800
- Disparaît après 4 secondes
```

---

### 📚 Liste des documents récents

```
Sous la zone d'upload, card séparée :

Header :
┌──────────────────────────────────────────────────────────────┐
│  📚 Documents de référence récents          [Voir tous →]    │
└──────────────────────────────────────────────────────────────┘

Tableau simple, 5 derniers documents :

┌──────────────────────────────┬──────────┬────────────┬───────┐
│ Nom du document              │ Taille   │ Importé le │       │
├──────────────────────────────┼──────────┼────────────┼───────┤
│ 📄 rapport_bande_2024.pdf    │ 2.5 MB   │ 04/05/2026 │ [👁]  │
│ 📄 memoire_informatique.pdf  │ 1.8 MB   │ 03/05/2026 │ [👁]  │
│ 📄 these_reseaux_2023.pdf    │ 3.2 MB   │ 01/05/2026 │ [👁]  │
└──────────────────────────────┴──────────┴────────────┴───────┘

Styling tableau :
- Fond blanc, rounded-xl, shadow-sm, bordure #e8e0db
- Header colonnes : texte xs uppercase #9ca3af, fond #faf7f5
- Lignes : bordure bottom #f3f0ee
- Hover ligne : fond #faf7f5
- Bouton [👁] Eye icon : texte #6c5448, hover fond #6c5448/10, rounded

État vide (aucun document) :
┌─────────────────────────────────────────────────────────────┐
│                    📭                                        │
│           Aucun document importé pour l'instant             │
│      Utilisez la zone ci-dessus pour ajouter des fichiers   │
└─────────────────────────────────────────────────────────────┘
- Icône 48px #6c5448/20, texte centré #6b7280
```

---

### 👥 Vue Utilisateurs (page séparée via sidebar)

```
En-tête :
┌─────────────────────────────────────────────────────────────┐
│  [Users icon]  Utilisateurs                    [🔍 Rechercher] │
│  Liste des comptes enregistrés sur la plateforme             │
└─────────────────────────────────────────────────────────────┘

Barre de recherche :
- Input rounded-lg, bordure #e8e0db, icône Search #9ca3af à gauche
- Focus : bordure #6c5448, ring #6c5448/20
- Placeholder : "Rechercher par nom, INE ou email..."

Filtres rapides (pills cliquables) :
[ Tous ]  [ Étudiants ]  [ Enseignants ]  [ DA ]

Pill actif : fond #6c5448, texte blanc
Pill inactif : fond blanc, bordure #e8e0db, texte #4b5563

Tableau utilisateurs :
┌────────┬──────────────────┬─────────────────────┬──────────┐
│ Avatar │ Nom              │ Email / INE          │ Rôle     │
├────────┼──────────────────┼─────────────────────┼──────────┤
│  [JD]  │ Jean Dupont      │ N01331820231         │ Étudiant │
│  [MA]  │ Marie Alou       │ teacher@handal.local │ Enseignant│
│  [DA]  │ Dir. Académique  │ da@handal.local      │ DA       │
└────────┴──────────────────┴─────────────────────┴──────────┘

Styling :
- Avatar circulaire 36px, initiales, fond #6c5448/15, texte #6c5448
- Badge rôle :
  * Étudiant   → fond blue-50, texte blue-700, bordure blue-200
  * Enseignant → fond amber-50, texte amber-700, bordure amber-200
  * DA         → fond purple-50, texte purple-700, bordure purple-200
- Lignes : hover fond #faf7f5
- Pagination simple en bas : [← Précédent]  1 2 3  [Suivant →]
```

---

## 🎨 DESIGN TOKENS

```css
--color-brand:       #6c5448;
--color-brand-light: #faf7f5;
--color-brand-muted: rgba(108, 84, 72, 0.1);
--color-bg:          #faf7f5;
--color-surface:     #ffffff;
--color-border:      #e8e0db;
--color-text:        #1a1a1a;
--color-muted:       #6b7280;
--radius:            12px;
--shadow:            0 1px 3px rgba(108, 84, 72, 0.08);
```

---

## ✨ MICRO-INTERACTIONS

```
- Drag over zone upload → bordure #6c5448 + légère pulsation
- Upload réussi → toast vert slide-in depuis le haut, 4s
- Hover nav item → glissement fluide 150ms
- Hover card KPI → élévation shadow-md 200ms
- Hover ligne tableau → fond #faf7f5 instantané
- Recherche utilisateurs → filtrage en temps réel sans rechargement
- Bouton "Voir tous" → navigation fluide vers la vue complète
```

---

## 📱 RESPONSIVE

```
Mobile < 768px :
- Sidebar → hamburger menu drawer
- Cards KPI → 1 colonne empilée
- Tableau → cards verticales (chaque utilisateur = une card)
- Zone upload → padding réduit, bouton full width

Tablet 768px–1024px :
- Cards KPI → 2 colonnes
- Sidebar → réduite à 200px
```

---

> **Résultat attendu :** Un dashboard épuré, centré sur les 3 seules actions de l'administrateur (uploader, consulter les documents, voir les utilisateurs). Zéro bruit visuel, interface immédiatement compréhensible, identité visuelle bronze `#6c5448` cohérente avec le reste de la plateforme Handal.
>
