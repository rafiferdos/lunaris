# Lunaris

The Next.js frontend for Lunaris, connected to the sibling `lunaris-api` Hono/PostgreSQL backend. The existing shadcn Base UI Rhea components, taupe theme, Outfit typography and responsive shell remain the UI foundation. Authentication, assessment history, scoring, XP, rating, quotas and rankings now come from the API. No answer bank or scoring engine ships in the public frontend bundle.

## Run locally

Use Node 24 and pnpm 12. Start `lunaris-api` first using that repository's README: PostgreSQL, migrations, seed, then the API on port 4000. Its `FRONTEND_ORIGIN` must be `http://localhost:3000` and `BETTER_AUTH_URL` must match the API origin.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000. `/` opens the authenticated assessment workspace; unauthenticated users go to login. Register a real development account, or use the backend's seeded accounts and configured seed password. Signup and login send credentials to Better Auth over the configured API connection; passwords and session tokens are never stored in browser storage.

`NEXT_PUBLIC_API_URL` accepts an origin or `same-origin` for the frontend API proxy, and defaults to `http://localhost:4000`, and is embedded by Next.js at build time. Set it before a production build. Serve both apps over HTTPS on same-site hosts, for example `app.example.com` and `api.example.com`, and configure the backend's exact trusted frontend origin. Browser calls include cookies. Client route guards are presentation controls; backend session, role and ownership checks remain the security boundary.

## Organization

- `lib/api/schema.d.ts` is generated from the checked-in `openapi.json`. `openapi-fetch` infers endpoint parameters, request bodies and responses from it. No backend database types are imported.
- `lib/api/client.ts` handles the API origin, credentialed requests, cancellation/timeouts and typed Problem Details errors. `queries.ts` keeps reusable TanStack Query options and cache keys together.
- `components/app-providers.tsx` supplies a browser query cache, retry policy and cross-tab account/logout synchronization. Private keys include the authenticated user ID. Account changes clear private cache and remount private forms. Identity-bound requests carry X-Lunaris-User; stale account requests receive SESSION_CHANGED instead of reading or writing another account. Domain 401 responses end the local session. No private query cache is persisted.
- `features/auth` owns Better Auth transport, session validation and protected-route context. `features/workspace` requires profile and preferences for the shell; pages fetch catalog, overview and activity independently so a secondary outage cannot block unrelated work.
- `features/assessments` owns preflight, typed attempt actions, retry-safe start keys, server-aligned countdown, single-tab editing leases and answer controls. The server chooses question order, expires attempts and calculates results.
- `features/integrity` collects focus/fullscreen signals and optional local voice activity summaries. `features/leaderboard` owns scoped ranking queries and live SSE invalidation. Profile, settings, stats, history and admin content/configuration/audit remain feature modules.
- `components/shared` composes shadcn primitives for query states, mutation feedback, confirmation dialogs and cursor pagination. Presentation helpers format values without inventing missing metrics.

The initial authenticated workspace loads through client queries because the separate API owns host-scoped session cookies. Static Next.js route shells do not cache user data on the server. Query failures render retry states; empty results stay empty instead of falling back to mock data. Catalog visual metadata contains only monograms and accent colors.

## Connected flows

- Real signup, login, session validation and logout; ADMIN-only import UI and server-enforced authorization.
- Catalog, mode availability, server quotas and per-topic progress. Starting consumes quota. The start request UUID survives network errors so retrying cannot reserve another attempt.
- Active attempts resume by URL from history, with exact question and option order, saved selections and committed-answer state. Easy/Medium answers autosave after 500 ms; internal navigation flushes pending answers through a shared shadcn confirmation/retry flow. Immediate tab-scoped drafts recover selections on reload or browser-back before a save completes. Competitive answers commit on continue and skipped answers require confirmation. A failed save keeps the question open.
- The countdown uses server time and the persisted deadline. Easy/Medium respect the timer visibility preference; Competitive always shows its timer. Periodic reads and the expiry boundary reconcile server finalization. Results display authoritative normalized score, raw score, XP, overall/topic rating deltas, integrity, eligibility and answer review. Weighted-only objective accuracy stays `null` and displays `—`.
- Web Locks prevent concurrent editors of one attempt across tabs on browsers supporting that API. Without Web Locks, backend transactional safeguards still apply. Leaving a Competitive tab is a critical integrity event, even when opening another tab to inspect the same attempt.
- Integrity sequence numbers and queued activity metadata survive reload in sessionStorage. Exact failed-event replay reuses the original sequence. Reconnection and heartbeats retry pending delivery; the backend deduplicates and determines penalties. Closing every tab while offline can still prevent telemetry delivery: browser signals are not a security guarantee.
- Cursor-paginated history with topic/mode/status/category and shadcn Calendar UTC date filters. Pages use backend chronological ordering. Dashboard and skill/activity charts use persisted aggregate metrics.
- XP leaderboards with period/category/topic/mode filters, nullable current-user ranking and SSE updates. Reconnection or an update invalidates ranking/overview queries and resets pagination to the first page. Rank movement is not fabricated.
- Server-backed profile/preferences. Only appearance is mirrored locally for prepaint rendering. Public-profile changes invalidate ranking data. Admin publication, assessment policy and audit pages use the real API. JSON uploads validate first and import atomically; changing the input invalidates the prior validation report.

## Microphone privacy and assets

Microphone monitoring starts only after clicking **Enable local speech monitoring**. Silero VAD runs locally through `@ricky0123/vad-web` and ONNX Runtime. Only speech duration/activity events go to the backend; audio is neither uploaded nor persisted, and no transcript is produced. Model inference necessarily holds short audio buffers in memory. The detector and microphone stream are destroyed when leaving the attempt. Permission/model failures are shown and sent as `MICROPHONE_UNAVAILABLE`, not automatic misconduct.

`dev` and `build` run `scripts/prepare-vad.mjs`, copying the installed v5 model, worklet and required WASM assets into the ignored `public/vad` directory. Assets are lazy-loaded from this app's origin when monitoring is enabled, not a third-party CDN. Include `public` in deployment output. If changing ONNX Runtime versions, rerun the browser microphone test to verify asset names and compatibility. The optional protobufjs postinstall only emits dependency-version warnings and is explicitly disabled in pnpm's build policy.

## API contract changes

Run the updated backend, then:

```sh
pnpm api:sync
pnpm typecheck
```

`api:sync` fetches `/openapi.json` and regenerates the types. `api:generate` regenerates offline from the committed snapshot. Review the snapshot/type diff with each backend contract change. The backend now exposes `answered` per attempt question and `nextIntegritySequence` so a refreshed Competitive session can distinguish an unanswered question from an already committed skip.

## Validation

```sh
pnpm test
pnpm lint
pnpm typecheck
pnpm format:check
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Browser tests require both apps running and create disposable development users/attempts. They do not truncate the database. Use only a development environment. Signup fixtures honor `Retry-After` on an explicit 429 without disabling the real auth limiter, so a full run may include a one-minute cooldown. Set `SEED_PASSWORD` to the backend's local seed password to include the admin import test; otherwise that case explicitly skips. `PLAYWRIGHT_BASE_URL` and `E2E_API_URL` override browser/API addresses; backend trusted origins must agree. Test artifacts and traces are ignored by Git. Fake microphone devices exercise model initialization and verify that audio tracks stop after client navigation without accessing real audio.

Unit tests cover API error handling, credentialed transport, safe redirects, stable start keys, server clock offsets, import boundaries and nullable metrics. Browser coverage includes all supported palettes in compact mode, shadcn controls, light/dark desktop/mobile accessibility and overflow, auth, answer autosave/reload, finalization, profile/preferences, lost responses, Competitive auto-submit, local VAD initialization, admin import, cross-tab editing, integrity replay, live ranking updates and mobile overflow. Backend tests separately verify scoring formulas, quota races, finalization idempotency and database immutability.

The build retains the preset's Google Fonts and needs access to Google Fonts on its first uncached build. No deployment is performed by these scripts.

## Account recovery and deployment

GET `/api/capabilities` declares password-reset availability. With the backend's paired `RESEND_API_KEY` and verified `EMAIL_FROM`, the recovery form sends a one-time email link and `/reset-password` changes the password, revoking existing sessions. Without delivery configuration the UI shows recovery information. Real provider delivery still needs validation on the deployment. Native email verification and durable, opt-in weekly summaries/inactivity reminders are implemented in the API. Capabilities hide unavailable delivery controls until the provider is configured. Gmail SMTP is supported without a purchased domain, using a user-created App Password saved directly in Vercel.

Build the non-root standalone image with the browser-accessible API origin:

```sh
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com -t lunaris:local .
```

The image includes static assets and the local speech model. CI verifies lint/types/unit tests, formatting, generated-contract drift, production dependency audit and build. It does not start the sibling backend or execute the cross-repository browser suite; run that suite in staging/release validation.

See [production readiness and release checks](docs/production-readiness.md) for the audit evidence, current limits and external launch requirements. The database contains 780 source-based original questions across all 26 catalog topics (10 per difficulty per topic). Source question banks are excluded from the repository and deployment; all default modes have sufficient difficulty coverage. Content still needs independent subject-matter review and calibration before high-stakes use. The backend now automatically finalizes expired attempts every minute; no external expiry cron is required. HTTPS/origins/secrets, provider delivery, backup restoration, monitoring and deployment-specific smoke/load tests remain deployment work. Preserve non-buffered SSE connections through the reverse proxy.

## Vercel production

Set `NEXT_PUBLIC_API_URL=same-origin`, `API_UPSTREAM` to the canonical deployed API origin, and `ENABLE_EXPERIMENTAL_COREPACK=1`. Both projects use Node 24/pnpm 12 and Singapore functions. Configure the API's FRONTEND_ORIGIN and BETTER_AUTH_URL to the exact public app origin; the browser reaches native auth and domain endpoints through /api/*, keeping secure HttpOnly cookies on the app host. The proxy readiness URL is /api/health/ready. Avoid attaching the production database to preview deployments.

Motion uses asynchronous LazyMotion features and short, once-visible transitions. System reduced-motion and the user's preference disable movement. Shared panels, page headings and discovery cards retain shadcn primitives; no continuous background animations or large animation library bundle is loaded eagerly.

The public GitHub repository includes a free standard-runner production health workflow, scheduled every six hours and runnable manually. It checks the login page, proxy database readiness and API database readiness without credentials, mutations or test accounts. Failed runs appear in Actions; email notification behavior follows the owner's GitHub notification settings.
