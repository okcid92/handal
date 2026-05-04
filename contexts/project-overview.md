# project-overview.md — Handal Product Vision

## Mission

Provide IBAM with an intelligent academic plagiarism detection platform to ensure academic integrity for student submissions.

## Core Features

### Phase 1: Theme Management
- Student theme proposal submission
- Auto-duplicate detection (≥70% similarity → auto-reject)
- Joint TEACHER + DA validation workflow

### Phase 2: Document Analysis
- PDF upload for student documents
- Automatic filtering of IBAM institutional content (cover pages, acknowledgements, etc.)
- Multi-algorithm plagiarism scoring:
  - TF-IDF + Cosine Similarity (40%)
  - Jaccard Similarity (30%)
  - N-gram Analysis (30%)

### Phase 3: Verdict & Action
- Automated verdict based on score threshold:
  - <20%: `CLEAN` → automatic CD validation → human appreciation
  - ≥20%: `FLAGGED_PLAGIARISM` → mandatory rewrite

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Prisma ORM, PostgreSQL |
| Analysis Engine | TF-IDF, Cosine Similarity, Jaccard, N-gram |
| Branding | Primary color #6c5448 (IBAM official) |

## Critical Rules

1. Always display `detectedTitle` (never ID or filename)
2. Always apply `content-filter.ts` before analysis
3. Ignore: cover pages, acknowledgements, IBAM institutional content
4. Score < 20% → automatic `CLEAN` validation
5. All statuses in UPPERCASE

## Success Metrics

- 100% compliance with threshold rules
- All statuses displayed in UPPERCASE
- Zero instances of raw ID/filename display (always `detectedTitle`)