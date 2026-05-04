# ai-workflow-rules.md — AI Development Process

Define standardized process for AI agents contributing to Handal project.

## Mandatory Alignment

All development must adhere to:
- 3-phase Handal workflow (Theme → Document → Verdict)
- Critical non-negotiable rules (detectedTitle, content filter, thresholds, uppercase statuses)
- Valid status list
- IBAM brand color #6c5448

## Task Execution Flow

### 1. Context Loading
- Read all files in `contexts/` before starting any task
- Verify current task aligns with 3-phase workflow

### 2. Requirement Analysis
- Map task to relevant workflow phase
- Apply phase-specific rules (e.g., content filter before Phase 2 analysis)

### 3. Implementation
- Follow `code-standards.md` conventions
- Use UI components per `ui-context.md`
- Integrate analysis algorithms per `architecture-context.md`

### 4. Validation
- Verify all statuses are UPPERCASE
- Confirm `detectedTitle` is displayed (not ID/filename)
- Check score thresholds (<20% = CLEAN, ≥20% = FLAGGED_PLAGIARISM)
- Run lint/typecheck per project config

### 5. Documentation
- Update `progress-tracer.md` with task status
- Modify relevant context files if scope changes

## Prohibited Actions

- Skip `content-filter.ts` before analysis
- Use lowercase statuses
- Display raw file IDs/filenames instead of `detectedTitle`
- Include generic code unrelated to Handal
- Leave console.log or dead code
- Commit without testing