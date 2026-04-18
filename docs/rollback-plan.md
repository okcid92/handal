# Rollback Plan

Use this plan when a production deployment introduces blocking regressions.

## Triggers

- Authentication breaks for any role.
- Theme, document, report, or deliberation workflows fail.
- A Prisma migration causes data corruption or a startup failure.
- A security regression is detected in production.

## Immediate actions

- Stop new traffic to the released version.
- Keep the previous stable build available.
- Preserve the current production database snapshot before any repair.
- Notify the ops owner and record the failing route or migration.

## Application rollback

- Switch the reverse proxy back to the previous Next.js build.
- Restart the stable process with the last known good environment variables.
- Verify `/api/ping`, login, and `/api/me/overview` before reopening traffic.

## Database rollback

- Restore the most recent validated backup if the migration changed schema or data incorrectly.
- Reapply the last known good Prisma migration set only after the restore is complete.
- Re-seed demo data only if the environment requires it.

## Verification after rollback

- Confirm all four roles can authenticate.
- Confirm route protection still behaves correctly.
- Confirm the core CRUD and workflow routes return healthy responses.

## Postmortem tasks

- Document the root cause.
- Add or update automated tests for the failed path.
- Update the go-live runbook if a procedural gap was found.
