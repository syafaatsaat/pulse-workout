# Field Manual — Build plan

Two stages, full days with Claude Code: a **lean version in 7 working days**, then **optional add-ons (~5 days)**.
The lean version covers the whole main flow (open → work out → see progress) and is portfolio-ready on its own.
Every day ends deployed.

## Data model (IndexedDB via Dexie)

| Table | Key fields | Notes |
|---|---|---|
| exercises | id, name, level, force, mechanic, equipment, primaryMuscles, secondaryMuscles, instructions, images | From free-exercise-db at build time; read-only |
| workouts | id, name, blocks[] | Block = type (straight / circuit), rounds, items[]; item = exerciseId, mode (reps / time), target, sets, restAfter |
| sessions | id, workoutId, startedAt, endedAt, effort?, sets[] | Set = exerciseId, blockId, setIndex, reps or seconds, completedAt |
| settings | single row | defaultRest, weeklyGoal, beeps, wakeLock, theme (+ add-on fields) |

## Stage 1 — Lean build

### Day 1 — Foundation and data
- [x] Vite + React + TypeScript (strict), ESLint, Prettier, Vitest; deploy to Vercel
      (Vercel deferred: deployed by hand on Day 7)
- [x] `src/styles/tokens.css` (provided) + base.css; theme switch light / dark / auto
- [x] Fontsource fonts; React Router routes; tab bar < 1024px, sidebar ≥ 1024px
- [x] `scripts/import-exercises.ts`: filter free-exercise-db to home-friendly equipment (body only, bands,
      dumbbell, kettlebells, plus chair/bench moves), convert images to WebP, clean null fields
- [x] Dexie schema; seed 5 ready-made workouts and ~6 weeks of demo sessions
Done when: the deployed shell lists real exercises and switches themes.

### Days 2–3 — Workout player
- [x] `compile()` + player reducer, unit tests written first
- [x] Work and rest screens per `docs/SCREENS.md` and the mock-ups
- [x] Timestamp-based timers; pause / resume
- [x] Wake Lock (re-request on visibilitychange); Web Audio beeps unlocked on Start
- [x] Save each set as it completes; resume an interrupted session
- [x] Desktop full-screen player + keyboard shortcuts
Done when: a real workout is finished on a phone, touching it only to tap Set done.

### Day 4 — Summary and Log
- [x] `stats.ts`: personal bests, streak, weekly goal progress (unit-tested)
- [x] Summary with new-best banner
- [x] Log: month calendar, monthly stats, personal bests; tap a day → its summary
Done when: a finished session appears in Log and a new best is detected.

### Day 5 — Today, Library, Exercise detail
- [x] Today: goal ring, week strip, up-next card, quick starts
- [x] Library: search, muscle + equipment filters, lazy images
- [x] Detail: start / end photos, tags, muscles, steps, your best
Done when: any exercise is 3 taps away and any ready-made workout starts from Today.

### Day 6 — Settings and hardening
- [x] Minimal Settings: theme, default rest, weekly goal, beeps, wake lock, reset demo data
- [x] Accessibility pass: keyboard paths, focus rings, labels, contrast in both themes
- [x] Empty and error states; fix issues from real-phone tests

### Day 7 — Ship
- [ ] Lighthouse 90+ on all four scores; one Playwright test (start → finish → see it in Log)
- [ ] README, case study draft, 30–60 s screen recording
Done when: a stranger opens the link and finishes a workout without instructions.

## Stage 2 — Add-ons (optional, any order)

| Add-on | Days | Adds |
|---|---|---|
| Workout builder | 2–3 | Blocks, sets × reps / time, rest per item, dnd-kit reorder, live session bar + estimate |
| Offline + installable | 1 | vite-plugin-pwa manifest, icons, caching app + data + images; works in airplane mode |
| ~~Desktop layouts~~ (done before Day 7) | 1 | Two-pane Library, sidebar Today, side-by-side Log |
| Trends + effort | 0.5 | 6-week sparklines in Log, 1–5 effort rating on Summary |
| Voice + full Settings | 0.5 | Spoken cues, ~~3-second lead-in~~, equipment owned, export JSON |

Pulled in before Day 7 (after real-phone testing): **player redesign** — exercise photo slideshow on the
work and rest screens, fewer labels, MM:SS timers, and a **5-second get-into-position lead-in** before every
timed work set (done; it replaces the 3-second lead-in above).

## Risks

| Risk | Effect | Mitigation |
|---|---|---|
| Wake Lock unsupported / released | Screen sleeps mid-set | Re-request on visibilitychange; show a hint when unsupported |
| iOS blocks audio until a tap | No beeps on first set | Unlock AudioContext on the Start tap |
| Background tab throttles timers | Rest timer drifts | Timestamps, not intervals |
| Heavy image set | Slow load | Filter to home-friendly moves; WebP; lazy load |
| Scope creep | Never ships | Anything outside lean scope → add-on list; Day 7 is ship day |
| free-exercise-db gaps (null equipment, odd names) | Messy filters | Clean in the import script + small overrides file |

Test on a real iPhone and Android phone at the end of Day 3.

## Portfolio deliverables
- Live link with demo data
- Case study: 5 design directions and why 4 were rejected; readable-from-the-floor principle;
  compiled-timeline engine; timer and wake-lock problems solved
- 30–60 s recording of a full set on a phone
- Repo with README, architecture note, passing tests
