# architecture-context.md — Handal Technical Structure

## High-Level Architecture

```
Frontend (Next.js/TypeScript/Tailwind) ↔ Next.js API Routes ↔ Prisma ↔ PostgreSQL
                                      ↘ Analysis Engine (TF-IDF/Cosine/Jaccard/N-gram)
```

## Core Modules

### 1. Theme Module
- Handles student theme proposals
- Auto-duplicate check (≥70% threshold → `REJECTED`)
- Validation flow: `PENDING_VALIDATION` → `VALIDATED` (TEACHER + DA)

### 2. Document Module
- PDF upload & parsing
- Content filtering via `content-filter.ts` (remove cover pages, acknowledgements, IBAM content)
- Analysis pipeline:
  1. Preprocess text (filter → tokenize)
  2. Run TF-IDF + Cosine (40% weight)
  3. Run Jaccard (30% weight)
  4. Run N-gram (30% weight)
  5. Aggregate final score

### 3. Verdict Module
- Score <20%: Set status `CLEAN` → trigger CD validation
- Score ≥20%: Set status `FLAGGED_PLAGIARISM` → notify student for rewrite
- Always display `detectedTitle` in all verdict views

## Database (Prisma/PostgreSQL)

- Models: `Student`, `Theme`, `Document`, `AnalysisResult`, `Verdict`
- All status fields use UPPERCASE enum values

## Analysis Pipeline Rules

- `content-filter.ts` must run before any analysis
- Never use raw filenames/IDs: map to `detectedTitle` for all outputs
- Score thresholds are non-negotiable: <20% = CLEAN, ≥20% = FLAGGED_PLAGIARISM