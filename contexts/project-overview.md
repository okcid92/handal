# project-overview.md — Handal Product Vision

## Mission

Build an intelligent academic plagiarism detection platform for IBAM (Institut Burkinabè des Arts et Métiers) to ensure academic integrity for student submissions.

## What is Handal?

Handal is a web application that helps educators detect plagiarism in student documents through a 3-phase workflow:

1. **Theme Proposal** - Students submit research themes
2. **Document Analysis** - System analyzes submitted PDFs
3. **Verdict** - Automated plagiarism scoring with human appreciation

## Core Features

### Phase 1: Theme Management
- Student submits theme proposal (title + description)
- System auto-checks for duplicates (≥70% similarity → auto-reject)
- Joint validation by TEACHER + DA (Direction Adjoint)
- Final decision by CD (Chef de Département)

### Phase 2: Document Analysis
- PDF upload for student documents
- Automatic filtering of IBAM institutional content
- Multi-algorithm analysis:
  - TF-IDF + Cosine Similarity: 40%
  - Jaccard Similarity: 30%
  - N-gram Analysis: 30%

### Phase 3: Verdict & Action
- Score < 20%: `CLEAN` → human appreciation
- Score ≥ 20%: `FLAGGED_PLAGIARISM` → student must rewrite

## Tech Stack (Actual)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | MySQL |
| ORM | Prisma |
| Auth | Custom (session-based) |
| File Storage | Local filesystem |

## User Roles

| Role | Description |
|------|------------|
| Student | Submit themes, upload documents, view own results |
| Teacher | Validate themes, view analysis, provide appreciation |
| DA (Direction Adjoint) | Validate themes, manage committee, final decision |
| CD (Chef Département) | Final theme approval |
| Admin | System administration |

## Design System

- **Primary Color**: #6c5448 (IBAM brown)
- **Secondary Color**: Neutral grays
- **Font**: System sans-serif
- **Spacing**: 4px base unit (Tailwind)

## Critical Rules (Non-Negotiable)

1. Always display `detectedTitle` — never ID or filename
2. Always apply content filter before analysis
3. Ignore: cover pages, acknowledgements, IBAM institutional content
4. Score < 20% = `CLEAN`, ≥ 20% = `FLAGGED_PLAGIARISM`
5. All statuses in UPPERCASE

## Project Structure

```
/handal
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes
│   │   ├── student/      # Student pages
│   │   ├── teacher/      # Teacher pages
│   │   ├── da/          # Direction Adjoint pages
│   │   └── admin/       # Admin pages
│   ├── components/       # React components
│   ├── lib/            # Utilities (Prisma, auth, etc.)
│   └── types/          # TypeScript types
├── prisma/
│   └── schema.prisma   # Database schema
├── contexts/          # Context files
│   ├── features-spec/ # Feature specifications
│   └── issues/     # Issue tracking
└── storage/         # File uploads
```

## Success Metrics

- ✅ 100% compliance with threshold rules
- ✅ All statuses in UPPERCASE
- ✅ `detectedTitle` always displayed
- ✅ Content filter always runs before analysis