# Go-Live Runbook

This runbook covers the final production cutover for Origina on the full Next.js stack.

## Preflight

- Confirm `npm run lint`, `npm run test:unit`, `npx playwright test --list`, and `npm run build` are green.
- Confirm MySQL is reachable from the production host.
- Confirm `DATABASE_URL` and `SESSION_SECRET` are set in the target environment.
- Confirm the seed/demo accounts are either disabled or protected for production.
- Confirm the production domain is ready for the Next.js app.

## Database rollout

- Apply the latest Prisma schema changes with `npm run prisma:deploy`.
- If the production database is empty, seed only the minimum required reference data.
- Validate that login, theme, document, report, and deliberation tables are present.

## Application launch

- Build the application with `npm run build`.
- Start the server with `npm run start` behind the production reverse proxy.
- Verify `/api/ping` and `/api/db-test` respond as expected.
- Verify role-based access for student, teacher, DA, and admin accounts.

## Cutover checks

- Student login with INE and password works.
- Teacher login with email and password works.
- Theme proposal, validation, and final DA validation work.
- Final document upload and analysis work.
- Deliberation creation and report history work.

## Laravel decommission

- Freeze the old Laravel deployment after the cutover window.
- Redirect any remaining legacy entry points to the Next.js app.
- Archive the old deployment config and operational notes.
- Remove the Laravel stack from the active runbook once the production window is stable.

## Exit criteria

- Production traffic is served by the Next.js app.
- No business-critical route depends on Laravel.
- Rollback instructions are tested and available to the ops team.
