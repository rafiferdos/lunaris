# Lunaris

A frontend assessment and skill-progress workspace built directly on the original Next.js 16 / shadcn Base UI Rhea preset. The taupe tokens, Outfit typography, aliases, and generated button remain the foundation.

## Local development

```bash
pnpm install
pnpm dev
```

`/` opens `/assessments`. Authentication is deliberately a UI demonstration; all routes are public. Login credentials are never saved or transmitted.

## Routes

- `/assessments` — topic discovery, URL filters, current-user overview
- `/assessments/[slug]` — topic performance, levels, recent attempts
- `/assessments/[slug]/take?level=easy|medium|competitive` — preflight and timed assessment
- `/results/[attemptId]` — scores, answer quality, response times, full question review
- `/leaderboard` — rating-based mock rankings with scoped filters and pagination
- `/stats` — overview, skills, and activity
- `/history` — searchable, filterable attempt history
- `/profile` — validated local profile editing
- `/settings` — appearance, accessibility, assessment and account preferences
- `/login`, `/register`, `/forgot-password` — mock authentication screens
- `/admin/questions/import` — JSON upload/paste, Zod validation, diagnostics and preview

## Ownership and data flow

Thin App Router pages compose `features/*` components. Domain types, question schemas, fixtures, level configuration, calculations, and assessment services live inside `features/assessments`. History, leaderboard, profile, and stats expose their own service boundaries. Shared presentation components live in `components/shared`; the shell and chart components have separate directories. The only generated shadcn primitive lives in `components/ui`.

`assessmentService`, `historyService`, `leaderboardService`, `profileService`, and `statsService` currently use deterministic fixtures. Replace these adapters with API-backed implementations in the backend phase. Completed demo attempts, profile edits, and preferences use a small validated local-storage adapter. Server-rendered fixtures provide hydration-safe initial values; persisted values are applied after hydration.

The assessment bank contains **25 authored questions across five playable topics**: JavaScript, TypeScript, React, Next.js, and Communication. Other catalog topics have explicit coming-soon states. All three levels intentionally use the same short demo bank with different timing, navigation and scoring configuration. Production-sized, difficulty-specific content remains content work, not a hidden backend dependency.

## Themes and motion

`app/globals.css` retains the preset's original semantic variables. `app/palettes.css` contains official Neutral, Stone, Zinc, Blue, Green and Rose palettes from [shadcn's theme registry](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/themes.ts); Taupe remains the default. `next-themes` handles light/dark/system. A prepaint script applies saved palette, radius, density and reduced-motion choices. Five radius choices use a single CSS variable.

Motion for React powers short page entrances. CSS handles card hover, progress, button feedback, sidebar transitions and skeleton states. Both the operating-system motion preference and the explicit setting suppress motion. Recharts loads lazily, consumes theme variables, disables unnecessary animation, and provides text equivalents of key values.

## Demo boundaries

- Local limits model one assessment per calendar day and seven per Monday-based week. They are not security enforcement and can be bypassed by changing browser data or opening concurrent sessions.
- Scoring and normalization are explicitly illustrative. Authoritative rating, ranking, XP, mastery and percentiles belong to the future API. Seeded ranking/mastery/rating-history snapshots are distinct from live saved-attempt aggregates.
- Competitive mode requests fullscreen only after the user starts with consent. Optional focus monitoring tracks browser events and submits after three warnings. No microphone access, speech detection, recording or real proctoring is implemented.
- Quiz answers remain in memory until submission. Closing/reloading an active page shows a browser leave warning; incomplete sessions are not restored.
- Notification/privacy switches save preferences only. No email, reminder or account service is contacted.
- Import preview does not add records to the live bank or persist them. The route is intentionally public in this demo; real admin access must be enforced server-side.
- Existing sample history is dated September 2026; new attempts use the local clock. Streaks derive from saved attempt dates.

## Validation

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

The ten domain tests cover all question types, duplicate and invalid imports, exact multi-answer scoring, weighted partial credit, skipped answers, negative raw scores, daily/weekly limits, streaks and result quality summaries.

ESLint is pinned to 9 because the starter's React ESLint plugin crashes with ESLint 10's removed context APIs; no rules were disabled. `tsx` is a development-only runner for Node's built-in test framework. New runtime packages are `motion`, `zod`, and `recharts`; `next-themes` was already installed.

The production build downloads the original Google Fonts, so a first build needs access to Google Fonts. No backend, API routes, database, auth server or external application service has been added.

## Backend phase

Implement real authentication/authorization, question delivery without answer keys, transactional attempt reservation, server-side time and limit enforcement, persistence, versioned question import, authoritative scoring and rankings, preference synchronization, account operations, and consent-based integrity policy. Client validation and browser events are UX features, never trust boundaries.
