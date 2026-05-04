# ui-context.md — Handal Design System & UI Rules

## Brand Guidelines

- Primary color: #6c5448 (IBAM official)
- Secondary colors: Neutral grays for backgrounds, white for cards
- Font: System sans-serif stack (clean, academic)

## Design System

### Spacing
- 4px base unit (Tailwind default)
- Consistent padding/margins across all views

### Typography
- Headings: Bold, primary color for section titles
- Body: Regular weight, high contrast for readability

### Components
- Status badges: UPPERCASE text, color-coded:
  - `CLEAN`: Green
  - `FLAGGED_PLAGIARISM`: Red
  - `PENDING_VALIDATION`: Yellow
  - `VALIDATED`: Blue
- Score displays: Show percentage with 1 decimal place
- Document cards: Always display `detectedTitle` as primary label (never ID/filename)

## Mandatory UI Rules

1. All status text in UPPERCASE
2. No raw file IDs or filenames in any UI view
3. `detectedTitle` must be the first visible text for any document/theme
4. Apply primary color #6c5448 to all CTAs and section headers
5. Filter IBAM institutional content from all document previews

## Page Structure

### Theme List
- Show `detectedTitle`, status badge, validation state

### Document Analysis View
- Show `detectedTitle`, score, analysis breakdown, verdict

### Verdict Page
- Show `detectedTitle`, full score breakdown, action buttons