# Production readiness — 2026-10-06

The connected application passed the local staging release checks. Local tests cannot certify an unseen hosting environment or guarantee that no defects exist. No public deployment was performed.

## Audit repairs

- Account changes synchronize across tabs; cache keys and private forms are bound to the current user. Expected identity headers reject stale domain/native-auth requests before another account can be affected.
- Pending answers flush before internal navigation. Failed saves retain the quiz and offer a shadcn retry dialog. Tab-scoped selection drafts recover interrupted saves without storing answer keys or credentials.
- Profile and quiz no longer depend on activity/catalog requests succeeding. Timer preferences apply to editable assessments; Competitive retains its required timer.
- Profile/privacy changes publish live ranking invalidation. Existing SSE streams revalidate session revocation, with per-process connection bounds. Ranking page, total and viewer position use one database snapshot.
- Calendar, select, confirmation and form controls use shadcn. Lint prohibits native application controls and browser alert/confirm/prompt. Mutating controls prevent concurrent form edits, and confirmation dialogs close after their action.
- Light-mode muted text has sufficient contrast on muted surfaces. Table scrolling is keyboard focusable. Browser checks cover responsive overflow and WCAG A/AA rules; manual screenshots complement automated checks.
- Admin import, publication, policy and audit flows use authenticated API operations. Account recovery has configurable delivery, one-time token validation and session revocation. Expiry sweeps run automatically in the backend.
- Both repositories have non-root Docker builds. The frontend serves Next standalone output with baseline security headers. API input/output schemas, ownership, CSRF origins, quota locking and immutable history remain the authoritative boundary.

## Verification

Completed checks:

- Backend: 42 unit/database integration tests passed, including stale identity/sign-out rejection, privacy updates, revoked SSE sessions and mocked-provider one-time password recovery.
- Frontend: 7 unit tests, lint, types, formatting and generated API contract checks passed.
- Browser: all 18 integration tests passed against the Docker standalone frontend on port 3001 and compiled backend on port 4001. This includes auth, answers/resume/finalization, response-loss replay, microphone cleanup, cross-tab editing/account changes, SSE, admin import/publication/config/audit and activity outages.
- Accessibility/overflow: 28 light/dark mobile/desktop workspace views, 28 palette/compact views, auth/preflight/quiz/results and mobile admin views passed the automated WCAG checks. Screenshots of populated statistics, results, mobile quizzes and representative workspace/admin pages were visually inspected.
- Both non-root Docker images built and their runtime health checks passed. The local API container used development cookie settings for HTTP; real HTTPS secure-cookie behavior still needs deployment verification.
- The compiled API HTTP smoke passed auth, catalog, answers, integrity, submit replay, results, history, stats, leaderboard, SSE, documentation and logout. Temporary audit containers were stopped after verification; existing development servers were preserved.
- Both production dependency audits reported zero known vulnerabilities. Frontend peer dependency checks passed. The development-only advisory below remains an explicit limit.

Browser artifacts live in ignored `test-results` and `playwright-report`; the browser suite uses disposable development fixtures. Backend integration tests only truncate the isolated `_test` database.

Dependency audit checks production dependencies separately from development tools. Next.js was patched to 16.3.6 and source-map-js to 1.2.2. The development-only braces advisory has no published fix as of this audit; it occurs through lint/shadcn glob tooling and is not shipped in the standalone application. Do not expose these tools to user-supplied patterns. Recheck before each release: [Next advisory](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j), [source-map advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q), [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

## Before public launch

1. Configure the real same-site HTTPS frontend/API origins and build `NEXT_PUBLIC_API_URL` accordingly. Supply a random auth secret and production PostgreSQL credentials through the deployment secret manager. Do not seed demo credentials into production.
2. Apply reviewed database migrations once before traffic. Verify a backup restore and retention policy using the production database service.
3. Configure both Resend values with a verified sender and test an actual reset email, one-time reset and revoked sessions on the deployed origin. The provider is mocked in integration tests; real delivery is not certified locally.
4. Run the browser suite and live smoke check through the production-like ingress. Verify cookies, exact CORS/trusted origins, SSE reconnection and proxy timeouts/buffering. Enable TLS/HSTS at ingress.
5. Configure readiness/expiry error monitoring, log retention and alerts. Validate representative database/HTTP load against the target infrastructure before claiming capacity. SSE bounds are per process; ingress must bound shared connections.
6. Populate the promised launch topics. The seed bank demonstrates five topics; unavailable topics are displayed honestly. Scheduled reminders/summaries are unavailable and disabled; email verification and social login are not implemented.

The frontend CI currently checks one repository only. Full browser tests require both applications and should be part of the deployment pipeline. The baseline CSP prevents framing/object embedding and restricts base URIs; it is not a full nonce-based script policy. Browser integrity telemetry is untrusted and is not a proctoring guarantee.
