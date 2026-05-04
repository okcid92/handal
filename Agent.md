# Agent.md — Handal Session Startup Instructions

Read this file at the start of every work session.

## Startup

### First thing to do
1. Read this file entirely
2. Open `contexts/project-overview.md` to understand the Handal project
3. Check `contexts/progress-tracer.md` to see development progress

### Before implementing a feature
1. Read `contexts/architecture-context.md` for technical structure
2. Verify `contexts/code-standards.md` for conventions
3. Review `contexts/ui-context.md` for design system
4. Go through the critical rules in this file

## Identity

**Handal** : Academic plagiarism detection platform for IBAM (Institut Burkinabè des Arts et Métiers)

**Tech Stack**:
- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Next.js API Routes, Prisma, PostgreSQL
- Analysis: TF-IDF, Cosine Similarity, Jaccard, N-gram
- Primary Color: #6c5448 (IBAM)

## Critical Non-Negotiable Rules

1. **Always display `detectedTitle`** — never ID or filename
2. **Always apply `content-filter.ts`** before any analysis
3. **Ignore**: cover pages, acknowledgements, IBAM institutional content
4. **Score < 20%** → `CLEAN` → automatic CD validation
5. **All statuses in UPPERCASE**

**Valid statuses**: `PENDING_VALIDATION` / `VALIDATED` / `SUBMITTED` / `ANALYSIS_COMPLETE` / `CLEAN` / `FLAGGED_PLAGIARISM` / `APPROVED` / `REJECTED`

## 3-Phase Workflow Handal

### Phase 1 — Theme
- Student theme proposal
- Auto-check duplicate (threshold ≥ 70% → auto-reject)
- Joint validation: TEACHER + DA

### Phase 2 — Document
- PDF upload
- Filter IBAM institutional content
- Analysis: TF-IDF + Cosine (40%) / Jaccard (30%) / N-gram (30%)

### Phase 3 — Verdict
- Score < 20% → `CLEAN` → human appreciation
- Score ≥ 20% → `FLAGGED_PLAGIARISM` → rewrite

## Standard Workflow

### For each task
```
1. Analyze   → Read specs and understand the goal
2. Plan      → Break down into simple steps
3. Implement → Write code according to Handal standards
4. Test      → Verify it works
5. Document → Update progress-tracer.md
6. Commit    → Commit with clear message
```

### Commit messages
| Type | Description |
|------|-------------|
| `feat:` | New Handal feature |
| `fix:` | Bug fix |
| `refactor:` | Code refactoring |
| `docs:` | Documentation |
| `style:` | Formatting, styles |
| `test:` | Tests added |
| `chore:` | Miscellaneous tasks |

Examples:
- `feat: add theme proposal validation workflow`
- `fix: resolve duplicate detection threshold`
- `refactor: extract TF-IDF analysis logic`

## Important Rules

### Do
- Always follow Handal critical rules
- Write modular, reusable code
- Test before committing
- Update progress-tracer after each task
- Use strict TypeScript

### Don't
- Skip `content-filter.ts` before analysis
- Use lowercase statuses
- Display ID or filename instead of `detectedTitle`
- Code without understanding the goal
- Leave console.log or dead code
- Commit without testing

## Problem Management

### If a problem blocks
1. Document the problem clearly
2. Update progress-tracer
3. Move to another task if possible

### If a rule changes
1. Modify the relevant context file
2. Update progress-tracer
3. Reflect the change in commits