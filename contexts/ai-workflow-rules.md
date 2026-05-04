# ai-workflow-rules.md — Handal AI Development Process

## Philosophy

**Spec-driven development** > vibe coding. Always follow feature specs exactly.

## Development Flow

### 1. Before Starting Any Task
```
1. Read /Agent.md (at project root)
2. Read contexts/features-spec/{feature}.md
3. Check contexts/progress-tracer.md for current status
4. Review contexts/architecture-context.md
5. Review contexts/code-standards.md
```

### 2. During Implementation
- Implement exactly as specified in the feature spec
- Do not add extra features not in the spec
- Do not skip any requirement
- Use TypeScript strict mode

### 3. After Implementation
- Verify against "check when done" section
- Update progress-tracer.md to mark feature as completed
- Commit all changes

## Critical Rules

1. **Always display `detectedTitle`** — never ID or filename
2. **Always apply content filter** before any analysis
3. Score < 20% → `CLEAN`
4. Score ≥ 20% → `FLAGGED_PLAGIARISM`
5. All statuses in UPPERCASE

## Valid Statuses (from Prisma)

```
PENDING, PENDING_VALIDATION, VALIDATED_CD, VALIDATED_DA, VALIDATED, REJECTED
DOCUMENT_SUBMITTED, ANALYSIS_PENDING, ANALYSIS_IN_PROGRESS, ANALYSIS_COMPLETE
CLEAN, FLAGGED_PLAGIARISM, APPROVED, APPROVED_WITH_MENTION
```

## Prohibited Actions

- Skip content filter before analysis
- Use lowercase statuses
- Display raw file IDs or filenames
- Leave console.log or dead code
- Commit without testing

## Issue Management

### Creating an Issue
- Create file in `contexts/issues/to-be-fixed/`
- Include: problem description, steps to reproduce, expected behavior

### Fixing an Issue
- Move fixed issue to `contexts/issues/fixed-issues/`
- Add fix details to the issue file
- Update progress-tracer.md