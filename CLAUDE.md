# Pulse — home workout tracker

Portfolio project. A local-first web app for home workouts, designed to be readable from the floor 2 m away mid-set.
Live demo must work instantly for any visitor: no sign-up, seeded demo data.
(The app was called Field Manual before the Pulse redesign.)

## Read these first
- `docs/redesign/REDESIGN.md` — the Pulse brief: tokens, components, behaviours, page notes. Authoritative.
- `docs/redesign/design-reference/*.dc.html` — the approved mock-ups. Inline styles are the source of truth
  for spacing, sizes and colours. `G-*` = phone (390×844), `GD-*` = desktop (1440×900). Ignore the `<x-dc>`,
  `{{holes}}`, `<sc-for>` and `class Component extends DCLogic` wrapper: it is the design tool's format, not app code.
- `docs/redesign/MIGRATION_PLAN.md` — how the app moved from Field Manual to Pulse, and the decisions made.
- `docs/BUILD_PLAN.md` — the original 7-day build + optional add-ons.

## Stack
React + TypeScript (strict) + Vite · CSS custom properties + CSS Modules · React Router · Zustand ·
Dexie (IndexedDB) · Vitest · Playwright · Vercel. Font self-hosted via Fontsource (Geist).
No UI kit, no Tailwind, no chart library. Add-on only: vite-plugin-pwa, dnd-kit.

## Architecture rules (non-negotiable)
- **Compiled timeline.** `engine/compile.ts` turns a workout into a flat array of steps
  (`{ kind: 'work' | 'rest', exerciseId, setIndex, target, durationMs, needsSetup? }`). The player, the session
  bar, the time estimate and the summary all read this one array.
- **Pure player reducer.** `engine/playerReducer.ts`, no React, no side effects. Actions: start, setDone,
  adjustReps, skipRest, startNow, addTime, pause, resume, end. Fully unit-tested.
- **Timestamps, not ticks.** Store `endsAt`; remaining = `endsAt - Date.now()`. Never count setInterval ticks.
- **Side effects live outside the reducer:** Wake Lock (re-request on `visibilitychange`), Web Audio beeps
  (unlock the AudioContext on the Start tap), voice cues (`speechSynthesis`), save each completed set to
  IndexedDB immediately.
- **Derived stats are computed, never stored:** personal bests, goal streak, weekly goal, sparklines come from
  `sessions` via `engine/stats.ts`.
- Exercise data comes from free-exercise-db (Unlicense), imported at build time by
  `scripts/import-exercises.ts` into `src/data/exercises.json` + WebP images in `public/exercises/`.
  Holds that need a "get into position" lead-in are listed under `needsSetup` in `scripts/exercise-overrides.json`.

## Design rules
- Design = **Pulse**. Brief: `docs/redesign/REDESIGN.md`. Mock-ups: `docs/redesign/design-reference/`
  (`G-*` phone 390×844, `GD-*` desktop 1440×900). Their inline styles are the source of truth.
- Use only the variables in `src/styles/tokens.css`. No raw hex in components.
  Theme = `data-theme="light|dark"` on `<html>`, default follows `prefers-color-scheme`.
- One font: Geist (300 big numbers, 400 body, 500 titles, 600 button labels). Sentence case.
  No uppercase eyebrows, no mono labels.
- Decoration is concentric rings only (`<Rings>`), always `aria-hidden` and non-interactive.
- Player: work + timed screens use `--work*` in both themes; rest uses `--rest-*` (mist light / navy dark).
  Ember (`--accent`) is for Start, Set done, active tab dot, PB markers, current session segment, switches.
- Player layout is fixed: only the video card flexes, so it is the same size in every phase.
  Counter = `--t-counter` for reps and time; nothing beside the counter; exactly one line of text
  under the bar; times always `MM:SS`. No tempo, no phase labels, no elapsed time.
- Exercise instructions live in the info sheet (ⓘ on the video card), never on the player screen.
- Touch targets ≥ 44px; primary actions 56–64px pills. Respect `env(safe-area-inset-*)`.
- Breakpoint 1024px: floating tab bar below, sidebar at and above.
- Numbers: `tabular-nums`, `line-height: 1`, never clipped.
- Every interactive element is a real `<button>`, `<a>` or `<input>` with a label.
- Respect `prefers-reduced-motion`.

## Folder structure
```
src/
  app/          routes, layout (tab bar / sidebar), theme
  styles/       tokens.css, base.css, fonts.ts
  data/         dexie schema, seed demo data, exercises.json
  engine/       compile.ts, playerReducer.ts, stats.ts (+ *.test.ts)
  features/     today/ player/ summary/ library/ progress/ settings/   (builder/ is an add-on)
  components/   Rings, Ring, SessionBar, Segmented, Stepper, Switch, ExercisePhoto, ExerciseSlideshow, ImagePlaceholder
scripts/
  import-exercises.ts
```

## Working agreement
- One feature per session. Plan first, then implement, then run `npm run test` and `npm run build`.
- Write engine tests before engine code.
- Commit at the end of each feature with a clear message. Don't push unless asked.
- Stay inside the lean scope in `docs/BUILD_PLAN.md`. If something is an add-on, say so and stop.
- Ask before adding any dependency not listed above.

## Commands
- `npm run dev` — Vite dev server
- `npm run build` — type-check (`tsc -b`) + production build to `dist/`
- `npm run preview` — serve `dist/`
- `npm run test` — Vitest once (jsdom; Dexie tests use `fake-indexeddb/auto`) · `npm run test:watch`
- `npm run lint` — ESLint · `npm run format` — Prettier (skips docs/, prompts/, CLAUDE.md, README, tokens.css)
- `npm run import:exercises` — re-import free-exercise-db (pinned commit, cached in `.cache/`) into
  `src/data/exercises.json` + `public/exercises/`. `-- --list` prints the kept ids without writing.
  Tune the filter in `scripts/exercise-overrides.json`.
- `npm run e2e` — Playwright, added on Day 7

## Dev notes
- Demo data is seeded on first load by `ensureSeeded()` (`src/data/seed.ts`); demo sessions are dated
  relative to today. To reseed in the browser, use Settings → Reset demo data, or delete the `field-manual`
  IndexedDB database.
- Kept Field Manual names on purpose: the Dexie DB `'field-manual'` and the localStorage key `'fm-theme'`.
  Renaming them would drop existing visitors' data and theme choice.
- Theme lives in localStorage (`fm-theme`), not Dexie: `index.html` must read it synchronously pre-paint.
  Every other setting is the Dexie `settings` row (settings saved before Voice cues existed lack `voice` = off).
- Read Dexie in components with `useLiveQuery` from `src/data/useLiveQuery.ts`.
- Start a workout from Today (up-next card or Quick start); an unfinished session shows a Resume card there.
- `/log` redirects to `/progress` (keeping `?month=`) for old links.
- Phone testing: `npm run dev -- --host`, open the LAN address. Plain http is not a secure context, so
  Wake Lock is unavailable there (the player shows its hint); everything else works.
