# Redesign: Field Manual → Pulse

The app is functionally done. This is a **visual + small-behaviour migration**, not a rebuild.
Keep the engine (`compile.ts`, `playerReducer.ts`, `stats.ts`), the Dexie schema, routing and tests.
Change the look, and the handful of behaviours listed in §4.

Source of truth: `docs/redesign/design-reference/*.dc.html`. Inline styles in those files are exact
(sizes, spacing, colours). Ignore the `<x-dc>`, `{{holes}}`, `<sc-for>`, `<sc-if>` and
`class Component extends DCLogic` wrapper — that is the design tool's format, not app code.
`G-*` = phone (390×844), `GD-*` = desktop (1440×900). Each file takes `theme="light|dark"`;
the `.pl-light / .pl-dark` and `.rt-light / .rt-dark` classes in their `<style>` show the token values,
which are already in `src/styles/tokens.pulse.css`.

| Screen | Phone ref | Desktop ref | Was (Field Manual) |
|---|---|---|---|
| Today | G-Today | GD-Today | F-Today / DT-Today |
| Player — work (reps) | G-Player | GD-Player `phase=work` | F-Player / DT-Player |
| Player — rest | G-Rest | GD-Player `phase=rest` | F-Rest |
| Player — timed (get into position → hold) | G-Timed | GD-Player `phase=get-ready / holding` | F-Timed |
| Session complete | G-Summary | — (phone layout centred) | F-Summary |
| Library | G-Library | GD-Library (list + detail panes) | F-Library / DT-Library |
| Exercise detail | G-Detail | right pane of GD-Library | F-Detail |
| Progress (was Log) | G-Progress | — | F-Log |
| Settings | G-Settings | — | F-Settings |
| Builder (add-on) | G-Builder | — | F-Builder |

## 1. Identity
- Name: **Pulse** (title, manifest, meta, README, sidebar wordmark). Was "Field Manual".
- Character: minimal, calm, premium. Decoration = thin **concentric rings**, nothing else.
- No uppercase eyebrows, no mono labels, no letter-spaced caps. Sentence case everywhere.

## 2. Tokens & type
- Replace `src/styles/tokens.css` with `tokens.pulse.css` (rename it to `tokens.css`).
- One font: **Geist** 300/400/500/600 via `@fontsource/geist`. Remove Barlow Condensed + IBM Plex packages.
- Weights: 300 for big numbers, 500 for titles, 400 body, 600 for primary-button labels.
- Titles: `letter-spacing: -0.02em`. Big numbers: `-0.04em`, `line-height: 1`, `tabular-nums`.
- Everything is rounded: buttons are pills (height/2 radius) or circles; cards 22–28px.
- Theme switching works exactly as before (`data-theme` on `<html>`, default follows the OS).

## 3. Components
- **`<Rings>`** (new, replaces nothing): absolutely positioned SVG of concentric circles, `stroke` =
  `currentColor`, `fill: none`, `stroke-width: 1`, opacity falling per ring. `aria-hidden`, `pointer-events: none`.
  Props: `radii: number[]`, `startOpacity`, `step`, `color` (CSS var). Used on: page corners
  (`--ring`, radii 40–200, opacity .09 → .03, positioned `right:-210px; top:-170px`), the Today hero
  (`--accent`, .55 → .15), behind the player counter (`--accent` on work, `--rest-accent` on rest),
  card thumbnails, summary badge.
- **Tab bar (phone)**: floating pill, `left/right 24px`, `bottom 30px + safe-area`, 64px tall,
  `background: --tabbar`, `box-shadow: --tabbar-shadow`. Icon-only (labels in `aria-label`);
  inactive icon `rgba(244,242,238,.45)`, active `#F1EFEA` + a 4px ember dot under it.
  Tabs: Today, Library, Progress, Settings.
- **Sidebar (≥1024px)**: ring logo + "Pulse" wordmark; active nav item is an ink pill (see GD-Today).
- **Cards**: `background: --surface; box-shadow: --card-shadow; border-radius: 22px`. No borders.
- **Hero card** (Today "Up next", Builder name, Summary PB): `--hero` / `--on-hero`, ember rings inside.
- **Primary button**: 56–64px pill. Ember (`--accent` / `--accent-ink`) for Start + Set done;
  ink (`--ink` / `--bg`) for neutral primaries (Done, Add to workout, Skip rest uses `--rest-btn`).
- **Progress bar (player)** — replaces `RepTicks`: 180px × 4px track, filled part, and a 10px ember dot
  marking last time's best (`box-shadow: 0 0 0 3px <screen bg>`). Delete `RepTicks`.
- **Session bar**: thin segmented line (3px phone / 4px desktop). Past = ink 55%, current = accent,
  future = ink 12%. No separate rest colour.
- **Exercise info sheet** (new, see §4.2).

## 4. Behaviour changes
### 4.1 Player — one fixed layout for every phase
The video must be **the same size on work, rest, get-into-position and holding**. So everything below
it has fixed heights; only the video card flexes (`flex: 1 1 auto; min-height: 0`).

Top → bottom (phone): top row (End ✕ 44px circle · "Move 4 of 9 · Set 2 of 4" centred) → session bar →
**video card** (radius 28) → exercise name (30px/500) → counter row (`--player-counter-row` 140px,
rings behind) → bar row (`--player-bar-row` 40px) → **one line** of text (`--player-line`, nowrap,
ellipsis) → button row (64px).

| Phase | Counter | Bar row | One line | Buttons |
|---|---|---|---|---|
| Work (reps) | reps `08` | − · bar · + (40px circles) | `● Last time 10 reps` | Pause · **Set done** (ember) |
| Rest | `MM:SS` | bar (rest accent) | `Next set: 12 reps` | Pause · +15s · **Skip rest** |
| Timed, get ready | "Get into / position" 36px/400 | bar filling over 5 s | `Timer starts when the line fills` | Pause · **Start now** (light) |
| Timed, holding | `MM:SS` | bar + PB dot | `● Last time 00:35` | Pause · **Set done** (ember) |

- Counter size is `--t-counter` for reps **and** time. Never put buttons beside the counter.
- Times always `MM:SS` (`00:05`, not `5`).
- **Removed**: tempo, WORK/REST labels, elapsed time, "of 12 reps"/"of 0:30" text,
  the form-cue line under the bar, −15s on rest.
- Rest screen uses `--rest-*` tokens (mist in light, deep navy in dark). Work/timed use `--work*`
  in both themes. On rest the video shows the **next** exercise with an "Up next · Push-up" chip top-left.
- Desktop (GD-Player): video left (flex 3), counter column right (flex 2, max 540px), footer row
  with keyboard hints: Pause `P`, +15s `↑` (rest only), main action `Space`, End `Esc`, − / + `←` `→`.

### 4.2 Exercise info sheet (new)
- Trigger: a 40px circle ⓘ button at the **top-right of the video card** (phone);
  an "Exercise info `I`" pill there on desktop. On rest it shows the **next** exercise.
- Phone: bottom sheet (radius 28 top, max-height 78%, drag handle, scrim `rgba(8,9,11,.55)`).
  Desktop: right panel 420px, inset 24px, radius 32. Close: ✕, scrim tap, `Esc`.
- Content: "Beginner · No equipment" → name (26px) → primary-muscle chips → "Key cue" card
  (the cue that used to be under the bar) → "How to do it" numbered steps (from free-exercise-db
  `instructions`, outlined number circles) → `● Your best 12 reps`.
- Sheet bg: `--work-sheet` on work/timed, `--rest-surface` on rest.
- Opening it does **not** pause the timer (Pause is right there). Focus-trap it; return focus to ⓘ.

### 4.3 Get into position (timed exercises)
- Only for exercises flagged `needsSetup: true` (planks, wall sits, holds). Add the flag to the
  exercise data (default false; set it for timed holds in the seed/curated list). Others start the
  timer immediately. 5 s, bar fills linearly, "Start now" skips it.

### 4.4 Settings → Appearance
- Segmented control Light / Dark / Auto, applies live. Auto = remove `data-theme`.

## 5. Page notes (match the refs; these are the non-obvious bits)
- **Today**: date + "Good evening" + weekly-goal ring (2/4, ember arc) top row; week dots
  (today = ember ring, done = ink, else `--dot`); hero "Up next" card with session-shape bar and
  ember "Start session" pill with a dark inner arrow circle; "Quick start" 2-column cards.
- **Library**: search pill, filter chips (selected = ink fill), row cards with ring thumbnails.
- **Detail**: photo card with Start/End segmented toggle (crossfade the two free-exercise-db photos),
  "Best 12 reps" tag (ember 12% bg, `--pb-ink` text), outlined step numbers, Try it / Add to workout.
- **Progress** (rename route `/log` → `/progress`, keep a redirect): month calendar (done = ink circle),
  three stat cards, personal bests with sparklines.
- **Summary**: check badge with rings, stats card, dark PB card, moves card, ink "Done".
- **Settings**: steppers, ember switches, Appearance segmented, "Reset demo data" in `--danger`.

## 6. Done when
- No Barlow / Plex / mono / uppercase-eyebrow styles remain (`grep -ri "barlow\|plex\|uppercase" src` is empty
  apart from intentional cases).
- Every colour in `src/` comes from a token (no raw hex outside `tokens.css`).
- Playwright screenshots at 390×844 and 1440×900, light + dark, for every route and every player phase,
  side-by-side with the refs. Video card height identical across the four player phases (assert it).
- `npm run test`, `npm run build`, Lighthouse a11y ≥ 95 still pass.
