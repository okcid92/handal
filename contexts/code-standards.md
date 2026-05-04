# code-standards.md — Handal Code Conventions

## General Rules

- All code in TypeScript (strict mode enabled)
- No generic/unrelated code: all modules must reference Handal business logic
- Follow Next.js best practices per `node_modules/next/dist/docs/` (modified Next.js version per AGENTS.md)

## TypeScript Conventions

- Use explicit types for all variables/functions
- Enum for statuses (UPPERCASE values):

```typescript
enum Status {
  PENDING_VALIDATION = "PENDING_VALIDATION",
  VALIDATED = "VALIDATED",
  SUBMITTED = "SUBMITTED",
  ANALYSIS_COMPLETE = "ANALYSIS_COMPLETE",
  CLEAN = "CLEAN",
  FLAGGED_PLAGIARISM = "FLAGGED_PLAGIARISM",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}
```

- Interface for `DetectedContent` must include `detectedTitle: string` (never `id` or `filename`)

## Backend Rules

- Always import and run `content-filter.ts` before any analysis function
- Prisma schema must use UPPERCASE enums for status fields
- API routes return `detectedTitle` instead of raw IDs/filenames

## Frontend Rules

- All UI components use Tailwind CSS with primary color #6c5448
- No inline styles unless dynamically generated
- Status badges render UPPERCASE text only

## Analysis Code Rules

- TF-IDF + Cosine: 40% weight
- Jaccard: 30% weight
- N-gram: 30% weight
- Score <20% → set status `CLEAN`; ≥20% → `FLAGGED_PLAGIARISM`