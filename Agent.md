# Agent.md — Handal Session Startup Instructions

Read this file at the start of every work session.

## Startup

### First thing to do

1. Read this file entirely
2. Open `contexts/project-overview.md` to understand the Handal project
3. Check `contexts/progress-tracer.md` to see development progress
4. Review `contexts/ai-workflow-rules.md` for development process

### Before implementing a feature

1. Read the feature spec in `contexts/features-spec/{feature}.md`
2. Read `contexts/architecture-context.md` for technical structure
3. Verify `contexts/code-standards.md` for conventions
4. Review `contexts/ui-context.md` for design system

## Identity

**Handal**: Academic plagiarism detection platform for IBAM (Institut Burkinabè des Arts et Métiers)

## Tech Stack

| Layer     | Technology                   |
| --------- | ---------------------------- |
| Framework | Next.js 16.2.4+ (App Router) |
| Language  | TypeScript (strict)          |
| Styling   | Tailwind CSS v4              |
| Database  | MySQL                        |
| ORM       | Prisma                       |
| Auth      | Custom (session-based)       |

## Critical Non-Negotiable Rules

1. **Always display `detectedTitle`** — never ID or filename
2. **Always apply content filter** before any analysis
3. **Ignore**: cover pages, acknowledgements, IBAM content
4. **Score < 20%** → `CLEAN`
5. **Score ≥ 20%** → `FLAGGED_PLAGIARISM`
6. **All statuses in UPPERCASE**

## ValidStatuses (from Prisma schema)

```
PENDING, PENDING_VALIDATION, VALIDATED_CD, VALIDATED_DA, VALIDATED, REJECTED
DOCUMENT_SUBMITTED, ANALYSIS_PENDING, ANALYSIS_IN_PROGRESS, ANALYSIS_COMPLETE
CLEAN, FLAGGED_PLAGIARISM, APPROVED, APPROVED_WITH_MENTION, CONDITIONAL_APPROVAL
REQUESTED_REVIEW, PENDING_ADMIN_REVIEW
```

## 3-Phase Workflow Handal

### Phase 1 — Theme

- Student submits theme proposal
- Auto-check duplicate (≥70% → reject)
- Validation: TEACHER + DA (Direction Adjoint)

### Phase 2 — Document

- PDF upload
- Content filter (remove IBAM institutional content)
- Analysis: TF-IDF + Cosine (40%) / Jaccard (30%) / N-gram (30%)

### Phase 3 — Verdict

- Score < 20% → `CLEAN` → human appreciation
- Score ≥ 20% → `FLAGGED_PLAGIARISM` → rewrite required

## Standard Workflow

```
1. Read Agent.md (this file)
2. Read feature spec in contexts/features-spec/{feature}.md
3. Update progress-tracer.md to mark feature as in progress
4. Implement exactly as specified
5. Verify against "check when done" section
6. Commit all changes
```

## Commit Protocol

**Always commit after completing a feature:**

```
git add .
git commit -m "feat: implement {feature-name}

- {specific change 1}
- {specific change 2}
- Updated progress-tracer.md"
```

## Problem Management

### If a problem blocks

1. Create issue file in `contexts/issues/to-be-fixed/`
2. Update progress-tracer.md with blocker info
3. Move to another task if possible
