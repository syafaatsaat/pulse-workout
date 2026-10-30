# Field Manual — home workout tracker

Portfolio project. A local-first web app for home workouts, designed to be readable from the floor 2 m away mid-set.
Live demo must work instantly for any visitor: no sign-up, seeded demo data.

## Read these first
- `docs/BUILD_PLAN.md` — the 7-day lean build + optional add-ons. Work the current day's checklist only.
- `docs/DESIGN_SYSTEM.md` — tokens, type, components, layout rules. Never invent colours or sizes.
- `docs/SCREENS.md` — what each screen contains and how screens link.
- `docs/design-reference/*.dc.html` — the approved mock-ups. Inline styles are the source of truth for spacing,
  sizes and colours. `F-*` = phone (390×844), `DT-*` = desktop (1440×900). Ignore the `<x-dc>`, `{{holes}}`,
  `<sc-for>` and `class Component extends DCLogic` wrapper: it is the design tool's format, not app code.

## Stack
React + TypeScript (strict) + Vite · CSS custom properties + CSS Modules · React Router · Zustand ·
Dexie (IndexedDB) · Vitest · Playwright · Vercel. Fonts self-hosted via Fontsource
(Barlow Condensed, IBM Plex Sans, IBM Plex Mono). No UI kit, no Tailwind, no chart library.
Add-on only: vite-plugin-pwa, dnd-kit.

## Architecture rules (non-negotiable)
- **Compiled timeline.** `engine/compile.ts` turns a workout into a flat array of steps
  (`{ kind: 'work' | 'rest', exerciseId, setIndex, target, durationMs }`). The player, the session bar,
  the time estimate and the summary all read this one array.
- **Pure player reducer.** `engine/playerReducer.ts`, no React, no side effects. Actions: start, setDone,
  adjustReps, skipRest, addTime, pause, resume, end. Fully unit-tested.
- **Timestamps, not ticks.** Store `endsAt`; remaining = `endsAt - Date.now()`. Never count setInterval ticks.
- **Side effects live outside the reducer:** Wake Lock (re-request on `visibilitychange`), Web Audio beeps
  (unlock the AudioContext on the Start tap), save each completed set to IndexedDB immediately.
- **Derived stats are computed, never stored:** personal bests, streaks, weekly goal, trends come from
  `sessions` via `engine/stats.ts`.
- Exercise data comes from free-exercise-db (Unlicense), imported at build time by
  `scripts/import-exercises.ts` into `src/data/exercises.json` + WebP images in `public/exercises/`.

## Design rules
- Use only the variables in `src/styles/tokens.css`. Theme = `data-theme="light|dark"` on `<html>`,
  default follows `prefers-color-scheme`.
- Player work screen: background `--work` (#FF5A1F) with `--work-ink`; rest screen: `--rest-bg` (#1E3FAE)
  with white. Both themes use the same player colours.
- Orange is an accent: Start button, today marker, personal bests, active switches. Nothing else.
- Touch targets ≥ 44px; primary actions 56–64px. Respect `env(safe-area-inset-*)`.
- Breakpoint 1024px: bottom tab bar below, left sidebar at and above.
- Numbers use `font-variant-numeric: tabular-nums`. Big numerals: line-height 1, never clipped.
- Every interactive element is a real `<button>`, `<a>` or `<input>` with a label.
- Respect `prefers-reduced-motion`.

## Folder structure
```
src/
  app/          routes, layout (tab bar / sidebar), theme
  styles/       tokens.css, base.css
  data/         dexie schema, seed demo data, exercises.json
  engine/       compile.ts, playerReducer.ts, stats.ts (+ *.test.ts)
  features/     today/ player/ summary/ library/ log/ settings/   (builder/ is an add-on)
  components/   SessionBar, Card, Chip, Stepper, Switch, Segmented, Ring, RepTicks, Sparkline, ImagePlaceholder
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
  relative to today. To reseed in the browser, delete the `field-manual` IndexedDB database.
- Theme is in localStorage (`fm-theme`) until Settings moves to Dexie; `index.html` applies it pre-paint.
- Read Dexie in components with `useLiveQuery` from `src/data/useLiveQuery.ts`.
- Until Today has a Start button (Day 5), start a workout from `/debug`.
- Phone testing: `npm run dev -- --host`, open the LAN address. Plain http is not a secure context, so
  Wake Lock is unavailable there (the player shows its hint); everything else works.
