# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> login mode toggle switches placeholder
- Location: tests/e2e/home.spec.ts:14:5

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: locator('input[autocomplete="username"]')
Expected pattern: /handal\.local/
Received string:  "N01331820231"
Timeout: 5000ms

Call log:
  - Expect "toHaveAttribute" with timeout 5000ms
  - waiting for locator('input[autocomplete="username"]')
    9 × locator resolved to <input value="N01331820231" autocomplete="username" placeholder="N01331820231" class="mt-2 w-full rounded-lg border border-[#ddd4c4] bg-[#f4efe8] px-4 py-[0.8rem] text-[1rem] text-[#1e1410] outline-none transition placeholder:text-[#6b5649] focus:border-[#7d1c2a] focus:shadow-[0_0_0_3px_rgba(125,28,42,0.08)] sm:py-[0.95rem] sm:text-[1.1rem]"/>
      - unexpected value "N01331820231"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - generic [ref=e4]:
      - link "Handal HANDAL Academic Integrity Platform" [ref=e5] [cursor=pointer]:
        - /url: "#"
        - img "Handal" [ref=e7]
        - generic [ref=e8]:
          - strong [ref=e9]: HANDAL
          - generic [ref=e10]: Academic Integrity Platform
      - generic [ref=e11]:
        - link "Solutions" [ref=e12] [cursor=pointer]:
          - /url: "#features"
        - link "Workflow" [ref=e13] [cursor=pointer]:
          - /url: "#workflow"
        - link "Sécurité" [ref=e14] [cursor=pointer]:
          - /url: "#security"
        - link "Connexion" [ref=e15] [cursor=pointer]:
          - /url: "#connexion"
  - generic [ref=e17]:
    - generic [ref=e18]:
      - generic [ref=e19]: Plateforme académique
      - heading "Handal orchestre la détection, la validation et la délibération des mémoires." [level=1] [ref=e21]:
        - text: Handal orchestre la détection, la validation
        - text: et la
        - emphasis [ref=e22]: délibération
        - text: des mémoires.
      - paragraph [ref=e23]: Un flux académique structuré en trois phases — thème, document, verdict — pour chaque acteur de l'institution.
      - link "Explorer la plateforme" [ref=e25] [cursor=pointer]:
        - /url: "#features"
    - generic [ref=e27]:
      - generic [ref=e28]:
        - button "Etudiant" [ref=e29]
        - button "Personnel" [active] [ref=e30]
      - generic [ref=e31]:
        - generic [ref=e32]:
          - text: INE
          - textbox "N01331820231" [ref=e33]
        - generic [ref=e34]:
          - text: Mot de passe
          - textbox [ref=e35]: mon926732
        - button "Se connecter" [ref=e36]
      - generic [ref=e37]:
        - generic [ref=e38]: Comptes de demonstration
        - combobox [ref=e39] [cursor=pointer]:
          - option "Choisir un compte..." [selected]
          - option "Etudiant - N01331820231"
          - option "Enseignant - teacher@handal.local"
          - option "DA - da@handal.local"
          - option "Admin - admin@handal.local"
  - generic [ref=e41]:
    - generic [ref=e42]:
      - generic [ref=e43]: Moteur
      - heading "Tout ce dont une institution a besoin" [level=2] [ref=e44]
      - paragraph [ref=e45]: Six modules intégrés couvrent l'intégralité du parcours académique, de la proposition du thème à la délibération finale.
    - generic [ref=e46]:
      - generic [ref=e47]:
        - img [ref=e49]
        - generic [ref=e52]: Moteur
        - heading "Détection multi-niveaux" [level=3] [ref=e53]
        - paragraph [ref=e54]: Analyse du plagiat direct, de la paraphrase et des reformulations issues de traduction automatique sur un seul parcours.
      - generic [ref=e55]:
        - img [ref=e57]
        - generic [ref=e60]: Reporting
        - heading "Rapports exploitables" [level=3] [ref=e61]
        - paragraph [ref=e62]: Résultats structurés, scores, décisions et traces d'analyse pour suivre un mémoire de bout en bout.
      - generic [ref=e63]:
        - img [ref=e65]
        - generic [ref=e68]: Protection
        - heading "Sécurité active" [level=3] [ref=e69]
        - paragraph [ref=e70]: Contrôles same-origin, cookies signés et garde-fous serveur pour protéger les actions sensibles.
      - generic [ref=e71]:
        - img [ref=e73]
        - generic [ref=e75]: Workflow
        - heading "Flux par rôle" [level=3] [ref=e76]
        - paragraph [ref=e77]: Espaces dédiés aux étudiants, enseignants, DA et administrateurs avec des étapes claires et contrôlées.
      - generic [ref=e78]:
        - img [ref=e80]
        - generic [ref=e83]: Décision
        - heading "Délibérations finales" [level=3] [ref=e84]
        - paragraph [ref=e85]: Validation académique, délibération et archivage final au même endroit, sans navigation superflue.
      - generic [ref=e86]:
        - img [ref=e88]
        - generic [ref=e90]: Analyse
        - heading "Intelligence sémantique" [level=3] [ref=e91]
        - paragraph [ref=e92]: Score combiné plagiat + détection IA, seuil strict à 20 % et signalement automatique des cas critiques.
  - generic [ref=e95]:
    - generic [ref=e96]:
      - generic [ref=e97]: Pourquoi Handal
      - heading "Conçu pour les institutions qui veulent du contrôle sans surcharge" [level=2] [ref=e98]
      - paragraph [ref=e99]: Chaque rôle reste dans son corridor d'action, avec des checkpoints explicites et une gouvernance lisible pour l'administration et la DA.
      - generic [ref=e100]:
        - generic [ref=e103]: Navigation pensée pour les institutions IBAM et MIAGE.
        - generic [ref=e106]: Interface claire, premium et focalisée sur les décisions.
        - generic [ref=e109]: Toutes les actions critiques restent centralisées et auditables.
    - generic [ref=e110]:
      - article [ref=e111]:
        - generic [ref=e112]: 0 1
        - heading "Accès étudiant" [level=3] [ref=e113]
        - paragraph [ref=e114]: Connexion par INE, proposition de thème, dépôt final et lancement des auto-tests de conformité.
      - article [ref=e115]:
        - generic [ref=e116]: 0 2
        - heading "Validation enseignant" [level=3] [ref=e117]
        - paragraph [ref=e118]: Contrôle du thème, analyse officielle du document et saisie du rapport de conformité académique.
      - article [ref=e119]:
        - generic [ref=e120]: 0 3
        - heading "Délibération DA" [level=3] [ref=e121]
        - paragraph [ref=e122]: Validation académique, note finale et délibération conjointe avant publication du statut définitif.
  - generic [ref=e126]:
    - generic [ref=e127]:
      - generic [ref=e128]: Sécurité & Exploitation
      - heading "Une base visuelle robuste et prête pour les parcours critiques" [level=2] [ref=e129]
      - paragraph [ref=e130]: Le front conserve la lisibilité opérationnelle de vos flux, tout en gagnant en caractère visuel et en impact institutionnel.
    - generic [ref=e131]:
      - generic [ref=e132]:
        - heading "Intégration" [level=4] [ref=e133]
        - paragraph [ref=e134]: Pages rôle, login et suivi unifiés dans un flux cohérent.
      - generic [ref=e135]:
        - heading "Lisibilité" [level=4] [ref=e136]
        - paragraph [ref=e137]: Hiérarchie nette, blocs denses, CTA explicites à chaque étape.
      - generic [ref=e138]:
        - heading "Contraste" [level=4] [ref=e139]
        - paragraph [ref=e140]: Palette sobre, accents maroon et crème — accessible en toute condition.
      - generic [ref=e141]:
        - heading "Évolution" [level=4] [ref=e142]
        - paragraph [ref=e143]: Base prête pour l'ajout de nouveaux écrans et workflows sans refonte.
  - generic [ref=e145]:
    - generic [ref=e146]:
      - heading "Prêt à moderniser votre processus académique ?" [level=2] [ref=e147]
      - paragraph [ref=e148]: Rejoignez les institutions qui ont choisi Handal pour la rigueur et la traçabilité.
    - link "Accéder à la plateforme →" [ref=e149] [cursor=pointer]:
      - /url: "#"
  - contentinfo [ref=e150]:
    - generic [ref=e151]:
      - generic [ref=e152]:
        - generic [ref=e153]: Handal
        - generic [ref=e154]: 2026 Handal Academic Systems. Tous droits réservés.
      - generic [ref=e155]:
        - link "Privacy" [ref=e156] [cursor=pointer]:
          - /url: "#"
        - link "Terms" [ref=e157] [cursor=pointer]:
          - /url: "#"
        - link "Support" [ref=e158] [cursor=pointer]:
          - /url: "#"
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("home page exposes the login panel", async ({ page }) => {
  4  |   await page.goto("/");
  5  | 
  6  |   await expect(
  7  |     page.getByRole("heading", { name: /handal orchestre/i }),
  8  |   ).toBeVisible();
  9  |   await expect(
  10 |     page.getByRole("button", { name: /se connecter/i }),
  11 |   ).toBeVisible();
  12 | });
  13 | 
  14 | test("login mode toggle switches placeholder", async ({ page }) => {
  15 |   await page.goto("/");
  16 | 
  17 |   const loginInput = page.locator('input[autocomplete="username"]');
  18 |   await expect(loginInput).toHaveAttribute("placeholder", /N0/);
  19 | 
  20 |   await page.getByRole("button", { name: "Personnel" }).click();
> 21 |   await expect(loginInput).toHaveAttribute("placeholder", /handal\.local/);
     |                            ^ Error: expect(locator).toHaveAttribute(expected) failed
  22 | 
  23 |   await page.getByRole("button", { name: "Etudiant" }).click();
  24 |   await expect(loginInput).toHaveAttribute("placeholder", /N0/);
  25 | });
  26 | 
  27 | test("demo account selector pre-fills the form", async ({ page }) => {
  28 |   await page.goto("/");
  29 | 
  30 |   await page.selectOption("select", "teacher");
  31 |   const loginInput = page.locator('input[autocomplete="username"]');
  32 |   await expect(loginInput).toHaveValue(/handal\.local/);
  33 | });
  34 | 
  35 | test("invalid login shows error message", async ({ page }) => {
  36 |   await page.goto("/");
  37 | 
  38 |   await page.getByRole("button", { name: "Etudiant" }).click();
  39 |   await page.locator('input[autocomplete="username"]').fill("N01331820231");
  40 |   await page.locator('input[autocomplete="current-password"]').fill("wrong-password");
  41 |   await page.getByRole("button", { name: "Se connecter" }).click();
  42 | 
  43 |   await expect(page.locator("body")).toContainText(
  44 |     /identifiant ou mot de passe incorrect|invalid credentials/i,
  45 |   );
  46 | });
  47 | 
  48 | test("student login redirects to /student", async ({ page }) => {
  49 |   await page.goto("/");
  50 | 
  51 |   await page.getByRole("button", { name: "Etudiant" }).click();
  52 |   await page.locator('input[autocomplete="username"]').fill("N01331820231");
  53 |   await page.locator('input[autocomplete="current-password"]').fill("mon926732");
  54 |   await page.getByRole("button", { name: "Se connecter" }).click();
  55 | 
  56 |   await page.waitForURL(/\/student/);
  57 |   await expect(page.locator("body")).toContainText(/HANDAL/i);
  58 | });
  59 | 
  60 | test("staff login redirects to role dashboard", async ({ page }) => {
  61 |   await page.goto("/");
  62 | 
  63 |   await page.getByRole("button", { name: "Personnel" }).click();
  64 |   await page.locator('input[autocomplete="username"]').fill("teacher@handal.local");
  65 |   await page.locator('input[autocomplete="current-password"]').fill("mon926732");
  66 |   await page.getByRole("button", { name: "Se connecter" }).click();
  67 | 
  68 |   await page.waitForURL(/\/teacher/);
  69 |   await expect(page.locator("body")).toContainText(/Tableau de Bord/i);
  70 | });
  71 | 
  72 | test("unauthenticated access to /student redirects to home", async ({ page }) => {
  73 |   await page.goto("/student");
  74 |   await page.waitForURL(/\//);
  75 |   await expect(
  76 |     page.getByRole("button", { name: /se connecter/i }),
  77 |   ).toBeVisible();
  78 | });
  79 | 
  80 | test("navbar links are present on home page", async ({ page }) => {
  81 |   await page.goto("/");
  82 | 
  83 |   await expect(page.getByRole("link", { name: /connexion/i })).toBeVisible();
  84 |   await expect(page.getByRole("link", { name: /solutions/i })).toBeVisible();
  85 |   await expect(page.getByRole("link", { name: /workflow/i })).toBeVisible();
  86 | });
  87 | 
```