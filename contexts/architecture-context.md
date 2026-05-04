# architecture-context.md — Handal Technical Structure

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js Frontend                        │
│         (TypeScript + Tailwind CSS v4)                │
└─────────────────────┬───────────────────────────────────┘
                    │ API Routes
┌─────────────────────▼───────────────────────────────────┐
│                  Next.js API Layer                     │
└─────────────────────┬───────────────────────────────────┘
                    │ Prisma ORM
┌─────────────────────▼───────────────────────────────────┐
│               MySQL Database                         │
└─────────────────────────────────────────────────────────┘
                    │
┌─────────────────────▼───────────────────────────────────┐
│           Analysis Engine (Node.js)                    │
│    TF-IDF │ Cosine │ Jaccard │ N-gram                  │
└─────────────────────────────────────────────────────────┘
```

## API Routes Structure

| Module | Routes |
|--------|--------|
| `/api/themes` | CRUD for theme proposals |
| `/api/documents` | PDF upload, management |
| `/api/analysis` | Plagiarism analysis |
| `/api/reference-library` | Reference documents |
| `/api/reports` | Similarity reports |
| `/api/me` | Current user |
| `/api/admin` | Admin functions |

## Database Schema (Prisma)

### Models

- **User**: id, name, ine, email, password, role (STUDENT/TEACHER/DA/ADMIN)
- **Theme**: id, title, detectedTitle, status, studentId, validation fields
- **Document**: id, detectedTitle, storagePath, status, analysisStatus
- **SimilarityReport**: id, documentId, scores (global, ai, plagiarism)
- **FinalAppreciation**: decision by teacher and DA
- **ReferenceDocument**: uploaded reference documents for comparison
- **AnalysisHistory**: track all analysis attempts
- **Deliberation**: committee decisions

### Enums (Status Values)

```prisma
enum Role {
  STUDENT
  TEACHER
  DA
  ADMIN
}

enum ThemeStatus {
  PENDING
  PENDING_VALIDATION
  VALIDATED_CD
  VALIDATED_DA
  VALIDATED
  REJECTED
  DOCUMENT_SUBMITTED
  ANALYSIS_PENDING
  APPROVED
  APPROVED_WITH_MENTION
  CONDITIONAL_APPROVAL
  REQUESTED_REVIEW
  FLAGGED_PLAGIARISM
}

enum DocumentStatus {
  SUBMITTED
  ANALYSIS_IN_PROGRESS
  ANALYSIS_COMPLETE
  CLEAN
  FLAGGED_PLAGIARISM
  ANALYSIS_PENDING
  APPROVED
  APPROVED_WITH_MENTION
  CONDITIONAL_APPROVAL
  REQUESTED_REVIEW
  REJECTED
  PENDING_ADMIN_REVIEW
}

enum AnalysisStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

## Core Modules

### 1. Theme Module
- Routes: `src/app/api/themes/`
- Function: Handle student theme proposals
- Validation: Auto-duplicate check (≥70% → REJECTED)
- Flow: PENDING → VALIDATED_CD → VALIDATED_DA → VALIDATED

### 2. Document Module
- Routes: `src/app/api/documents/`
- Function: PDF upload, parsing, storage
- Status tracking: SUBMITTED → ANALYSIS_IN_PROGRESS → ANALYSIS_COMPLETE

### 3. Analysis Module
- Routes: `src/app/api/analysis/`
- Algorithms:
  - TF-IDF + Cosine: 40%
  - Jaccard: 30%
  - N-gram: 30%

### 4. Verdict Module
- Logic:
  - Score < 20%: CLEAN
  - Score ≥ 20%: FLAGGED_PLAGIARISM
- FinalAppreciation by Teacher + DA

## Files Structure

```
src/
├── app/
│   ├── api/
│   │   ├── themes/
│   │   ├── documents/
│   │   ├── analysis/
│   │   ├── reference-library/
│   │   └── reports/
│   ├── student/
│   ├── teacher/
│   ├── da/
│   └── admin/
├── components/
│   ├── CDTracker.tsx
│   ├── DATracker.tsx
│   ├── student-dashboard.tsx
│   ├── admin-staging-panel.tsx
│   └── ...
├── lib/
│   ├── prisma.ts       # Prisma client
│   ├── authz.ts       # Authorization
│   ├── route-guards.ts
│   ├── security.ts
│   └── extract-report-metadata.ts
└── types/
```

## Environment Variables

```env
DATABASE_URL=mysql://...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```