# Day 1 kickoff prompt — paste into Claude Code

Read CLAUDE.md, docs/BUILD_PLAN.md (Day 1 only), docs/DESIGN_SYSTEM.md and docs/SCREENS.md.
Then propose a plan for Day 1 and wait for my OK before writing code. Commit and push after every step.

Day 1 scope:
1. Scaffold Vite + React + TypeScript (strict) in this folder, keeping the existing CLAUDE.md, docs/,
   prompts/ and src/styles/tokens.css. Add ESLint, Prettier, Vitest, React Router, Zustand, Dexie,
   and Fontsource packages for Barlow Condensed (600, 700, 800), IBM Plex Sans (400, 500, 600) and
   IBM Plex Mono (400, 500, 600).
2. base.css on top of tokens.css; a theme hook that sets data-theme on <html> (light / dark / auto,
   stored in Dexie settings later, localStorage for now).
3. App shell: routes for Today, Library, Library detail, Log, Settings, Session, Summary (placeholders).
   Bottom TabBar under 1024px, Sidebar at 1024px and above, built exactly to DESIGN_SYSTEM.md
   (compare with docs/design-reference/F-Today.dc.html and DT-Today.dc.html).
4. scripts/import-exercises.ts: download free-exercise-db's exercises.json and images, keep home-friendly
   equipment, normalise null fields, write src/data/exercises.json and WebP images to public/exercises/.
   Tell me the resulting exercise count and total image size.
5. Dexie schema (exercises, workouts, sessions, settings) and a seed with 5 ready-made workouts
   (Push & Core, 10-min core, 20-min full body, Mobility reset, Legs & glutes) and ~6 weeks of
   plausible demo sessions.
6. A temporary /debug route listing exercises with images and the seeded sessions.
7. Fill in the Commands section of CLAUDE.md. Commit.

Done when: `npm run build` passes, the shell switches themes, and /debug shows real exercises.
