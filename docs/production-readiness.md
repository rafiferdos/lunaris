# Production readiness — 2026-10-06

The frontend and API are deployed on Vercel Hobby, with Neon Free PostgreSQL 18.6 in Singapore. The main quiz workflow passed a real HTTPS release check. Email delivery and a database restore exercise remain pending owner action; this is a small-launch release, not a capacity or high-stakes assessment certification.

## Live configuration

- App: https://lunaris-brown.vercel.app
- API: https://lunaris-api-self.vercel.app
- The browser calls `/api/*` on the app origin. `NEXT_PUBLIC_API_URL=same-origin` and the server-side `API_UPSTREAM` point to the actual API. Both backend trusted/auth origins are the exact app HTTPS origin.
- Production secrets remain in Vercel. Only the API production environment is connected to Neon; previews do not share the production database.
- Migrations run under an advisory lock, followed by an idempotent import of 285 immutable questions across all 26 topics. Release imports never seed demo credentials.
- Serverless PostgreSQL connections use verified TLS, a pooled URL, attachDatabasePool, bounded pools and short idle timeouts. A daily authenticated cron and bounded active-request work process expiry/notification jobs. Persistent Node/Docker deployments remain supported.

## Completed verification

- Backend: 52 unit/PostgreSQL integration tests passed, including ownership, quota/concurrency, immutable content, scoring/replay, native email verification, verified owner promotion, password reset, explicit notification consent, concurrent delivery deduplication and SMTP failure handling. Lint, types, formatting, build and production dependency audit passed.
- Frontend: 7 unit tests, lint, types, formatting, generated contracts and production dependency audit passed. Vercel's Turbopack production build succeeded; the local standalone QA build used Next's supported Webpack fallback because the local Turbopack worker was restricted.
- Browser: the complete 18-case suite passed through the same-origin proxy on the standalone app. Focused reruns passed the final signup-cache repair and new mobile verification/unsubscribe regression, covering 19 distinct cases. Automated checks include light/dark, all palettes, compact mode, desktop/mobile accessibility and overflow, microphone cleanup, cross-tab identity/editing, admin import/publication/audit, outages and failed/lost-response recovery. New public email routes also passed accessibility checks.
- Real production HTTPS smoke passed secure HttpOnly host-only cookies, all 26 topics/78 default modes, sanitized questions, answer writes, finalization/replay, results/history/stats, live stream greeting, admin isolation and revoked logout sessions. The check created one random private fixture and removed only that invocation's account/cascading data. It never truncated production tables or sent fake recipient emails.
- Public production readiness returns `ready`; unauthenticated quiz/admin/job routes remain protected. Proxy compression buffering discovered by the browser suite was fixed using SSE `no-transform` and no-buffering headers.
- Shared panels/cards use shadcn with asynchronous LazyMotion features and short, once-visible transitions. System and account reduced-motion settings are honored. Lint rejects raw application controls and browser alert/confirm/prompt.

## Owner actions still required

1. Create a Gmail App Password for `rafiferdos@gmail.com` and save it directly as the API's Vercel Production Secret `SMTP_PASSWORD`. Never use the main Google password or paste a secret into chat. Then configure SMTP_HOST=smtp.gmail.com, SMTP_USER and EMAIL_FROM matching that address and redeploy the API. Until then, capabilities correctly disable email verification, reset delivery and opted-in notifications. Verify an actual verification/reset email and session revocation after activation. The configured owner becomes ADMIN only after native email verification proves inbox access.
2. Finish the Neon console verification email. Its console sign-in currently awaits owner verification, and the Vercel query surface also requires two-factor verification. Then verify the project's history settings and a restore into a separate branch without resetting the active production database. Free Neon currently provides a six-hour restore window, so plan additional durable exports if longer retention is required. [Neon's current Free plan](https://neon.com/blog/neon-free-plan-1-gb-per-project).
3. Validate representative user load before claiming capacity. A public-repository GitHub Actions health check runs every six hours, checking the app, same-origin database readiness and direct API readiness, with failed runs visible in Actions. Email notifications follow the owner’s GitHub settings. Vercel request/job logs are also available; this basic monitor is not real-time incident paging, and a restore drill is not yet certified. Free-plan quotas and cold starts bound usage. Gmail also applies sending limits, so use it for a small launch rather than assuming unlimited delivery. [Google sending limits](https://support.google.com/mail/answer/22839?hl=en).

## Practical limits

Question labels/interpersonal weights are editorial and have not been statistically calibrated. Browser integrity telemetry is untrusted and does not certify proctoring; no recordings/transcripts are stored. Social OAuth and account deletion are outside the implemented contract. The CSP provides baseline framing/object/base protection, not a complete nonce-based script policy. Ranking movement is unavailable until historical snapshots exist. These limits are represented honestly in the application.

Both non-root container builds passed the earlier audit. Integration tests truncate only a distinct isolated `_test` database; browser fixtures stay in development. Check dependency advisories before subsequent releases. The known development-only braces advisory remains confined to lint/shadcn tooling and is not included in the standalone application.
