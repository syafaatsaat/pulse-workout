# Migration plan: Field Manual → Pulse

Audit of the codebase against `docs/redesign/REDESIGN.md` (authoritative), `src/styles/tokens.pulse.css`
(becomes tokens.css in step 1) and `docs/redesign/design-reference/`. One commit per step; no push.

Confirmed decisions:
- **Lead-in**: small engine change — `needsSetup` flows exercise → Step; the 5 s lead-in (and its
  share of `estimateMs`) only applies when set.
- **Rest "New best"**: takes over the one line (`● New best · 12 reps`, ember dot); "Last set" card dropped.
- **Extras built**: Progress Goal streak stat, PB sparklines (last 6 weeks), Settings "Voice cues".
- **Rename**: visible names only; Dexie DB `'field-manual'` and localStorage `'fm-theme'` stay
  (renaming would drop existing users' data / theme), with a comment saying why.

### 0. Decisions (from audit Q&A)
Defaults chosen during the audit (flag if wrong):
- **Missing tokens.** The refs use colours that tokens.pulse.css doesn't define. The "no raw hex" rule means they get added to `tokens.css` in step 1 instead of being hard-coded:
  `--work-faint` (.35 video ink), `--work-btn` (.10 ⓘ button), `--work-handle` (.20 sheet handle / step-number ring),
  `--work-past` (.55 session-bar past), `--scrim` `rgba(8,9,11,.55)`, `--sheet-shadow`,
  `--tab-ink` `rgba(244,242,238,.45)` / `--tab-ink-active`, `--on-hero-muted` (.55/.6), `--on-hero-dim` (.2/.35 shape bar),
  `--rest-chip` (#E6ECF4 / #22304A), `--rest-past` (.45), `--rest-video-ink` (.3/.35). The Switch knob `#fff` becomes `--knob`.
- **Wake-lock notice.** Today it's an extra line under the header, which would break the fixed player layout. It becomes a small chip overlaid at the top-centre of the video card, so no height changes.
- **Desktop player.** Follow GD-Player: drop the "Coming up" list (`upNext()` rows) and the block labels under the session bar. `upNext.ts` keeps `dose()`, and the `upNext()` function plus its desktop usage are deleted.
- **Hold ±15s.** Removed on timed holds and −15s removed on rest, per the §4.1 table. Keys: ← → = reps only, ↑ = +15s on rest only, `I` = info sheet.
- **Kept motion.** Kept as they are: the work/rest Sweep, the 3-2-1 pulse (its scale tuning in a931dcc was there to clear the ±15 buttons and can be re-checked now they're gone) and the rep tick. Reduced-motion rules still apply.
- **Today.** The Resume-unfinished card stays, restyled as a `--surface` card above the hero (the ref doesn't show it). Quick start shows 2 cards plus "See all" → /library, per the ref.
- **Tempo.** The UI shows it nowhere today. It stays in the data/engine because it drives `estimateMs`, so there's nothing to remove in the UI.
- **Out of scope.** The Builder (G-Builder): the app has no builder route. The web manifest: none exists (`public/` has only favicon.svg), so only the `<title>` and theme-color metas change.
- `CLAUDE.md` is deleted in the working tree and `CLAUDE.design-rules.md` is new. Step 5 recreates CLAUDE.md with the Pulse rules.

### 1. Audit — files touching old styles / removed things
**Old tokens** (`--font-display/-mono/-body`, `--t-eyebrow`, `--rest`, `--bar`, `--dim`, `--hatch`, `--card`, old `--work`/`--rest-bg` meaning):
- styles: `src/styles/tokens.css` (replace), `base.css` (`.eyebrow`, `.page-title`, `--font-body`), `fonts.ts`
- shell: `app/Sidebar.module.css`, `TabBar.module.css`, `Layout.module.css`, `PageHeader.*`, `ErrorScreen.*`
- components: `ImagePlaceholder.module.css` (--dim, --hatch), `Segmented.module.css` (--card), `SessionBar.module.css` (--rest, --dim), `Stepper.module.css` (--dim, mono), `Switch.module.css` (raw #fff + rgba), `Ring.module.css`
- features: `today/TodayPage.module.css`, `library/LibraryPage.module.css`, `library/ExerciseDetailPage.module.css`, `log/LogPage.module.css`, `player/Player.module.css`, `player/Desktop.module.css`, `player/Dialog.module.css`, `player/Progress.module.css`, `summary/SummaryPage.module.css`, `settings/SettingsPage.module.css`
- `--card` → `--card-shadow` rename in: Sidebar, Segmented, Library, Detail, Log, Dialog, Settings, Summary, Today.
- **Note.** `--work` changes meaning: it was orange ground, it's now a dark ground. `--work-ink` was dark, it's now light. Every player CSS rule that uses them must be redone, not just mapped.

**Fonts:** `src/styles/fonts.ts`, `package.json` (`@fontsource/barlow-condensed`, `ibm-plex-sans`, `ibm-plex-mono` → `@fontsource/geist`).

**Uppercase / letter-spacing / mono / `.eyebrow`:**
- CSS: `base.css`, Sidebar, Stepper, Today, Library, Detail, Log, Player, Desktop, Dialog, Summary, Settings module CSS.
- TSX `className="eyebrow"` / `eyebrow` prop: `PageHeader.tsx`, `TodayPage.tsx`, `LibraryPage.tsx`, `ExerciseDetailPage.tsx`, `LogPage.tsx`, `SettingsPage.tsx`, `FormDialog.tsx`, `ErrorScreen.tsx`.

**RepTicks:** `components/RepTicks.tsx` + `.module.css`. Already unused (the player draws `Progress` from `parts.tsx`), so it's just deleted.

**Tempo:** `data/types.ts`, `data/demoWorkouts.ts`, `engine/compile.ts` (+test), `data/demoSessions.ts`. None of these are UI. They stay (see Decisions).

**/log route:** `app/routes.tsx`, `app/nav.ts` (label "Log"), `app/App.test.tsx` (`renderAt('/log')`), `summary/SummaryPage.tsx` (`/log?month=` link), `features/log/*` (folder + `LogPage`).

**"Field Manual" name:** `index.html` (title, theme-color metas `#F4F3EF/#121214`), `Sidebar.tsx` (FM mark + wordmark), `ErrorScreen.tsx` (×2), `README.md`, `package.json` name, `tokens.css` header. Kept on purpose: `data/db.ts` DB name and `app/theme.ts` + `index.html` `fm-theme` key.

**Lead-in (§4.3):** `engine/compile.ts` (`LEAD_IN_MS`, `estimateMs`), `engine/playerReducer.ts` (`leadInMs`, start-of-step at ~l.137, `startNow`), `features/player/screen.ts`, `useCues.ts`, tests `compile.test.ts`, `playerReducer.test.ts`, `screen.test.ts`.

### 2. Component-by-component changes (→ REDESIGN §)
| Item | Change | § |
|---|---|---|
| `tokens.css` | Replace with tokens.pulse.css content + the missing tokens above; delete tokens.pulse.css | 2 |
| `fonts.ts`, package.json | Geist 300/400/500/600 only | 2 |
| `base.css` | body `--font`; delete `.eyebrow`; `.page-title` = 30px/500/-0.02em sentence case; add `.num` helper (300, -0.04em, lh 1, tabular) | 1, 2 |
| `components/Rings.tsx` (new) | SVG concentric circles, props `radii, startOpacity, step, color`, `aria-hidden`, `pointer-events:none`; positioned by caller | 3 |
| `Ring.tsx` | Keep (weekly-goal arc): ember arc, `--dot` track, 52px on Today | 5 |
| `TabBar` | Floating pill per G-Today nav; icon-only, `aria-label`, 4px ember dot on active; Progress label | 3 |
| `Sidebar` | Ring logo + "Pulse" wordmark; active = ink pill (GD-Today); goal block restyled | 3 |
| `Layout` | Page-corner `<Rings>` (`--ring`, 40–200, .09→.03); bottom padding for floating tab bar + safe-area | 3 |
| `PageHeader` | `eyebrow` prop → `kicker` (13–14px `--muted`, sentence case) above 30px title | 1 |
| `SessionBar` | 3px/4px, gap 3; past ink-55% / current accent / future ink-12%; no rest colour; preview variant uses hero tints | 3 |
| `Segmented`, `Stepper`, `Switch` | Pill shapes, `--fill2` track, ember switch, no mono | 3, 5 |
| `ImagePlaceholder` | Drop hatch; `--work-video`/`--fill` + faint icon | 3 |
| `RepTicks` | Delete | 3 |
| `player/PhoneView` | Fixed layout per §4.1 order; only video flexes; ⓘ button; one-line text; no cards | 4.1 |
| `player/DesktopView` | GD-Player: video flex 3 / column flex 2 ≤540px, footer key hints, "Exercise info I" pill | 4.1 |
| `player/parts.tsx` | `Progress` → 180×4 bar + 10px PB dot w/ 3px bg ring; `AdjustButton` reps only (40px circles); new `AddTimeButton` (+15s, rest) | 3, 4.1 |
| `player/screen.ts` | `cards[]` → `line: { text, dot?: 'accent' }`; tag → "Up next · X"; counter `kind: 'reps'|'time'|'ready'`; adjust `'reps'|null`; `addTime` flag on rest; New best goes to line | 4.1 |
| `player/Player.tsx` | Keys: ↑ +15s rest, ← → reps, `I` info; `dialog: 'info'` replaces `'form'` | 4.1, 4.2 |
| `player/FormDialog.tsx` → `InfoSheet.tsx` | Bottom sheet / 420px right panel; level·equipment, name, muscle chips, Key cue (`formCue`), numbered steps, Your best; does not pause | 4.2 |
| `player/format.ts` | Use `timer()` (MM:SS) everywhere times show | 4.1 |
| `engine/compile.ts`, `playerReducer.ts` | `Step.needsSetup?`; lead-in + estimate only when set | 4.3 |
| `exerciseTypes.ts`, import script, overrides | `needsSetup?: boolean` via `exercise-overrides.json` `needsSetup: [...]` (Plank, wall sit, holds) | 4.3 |
| Today | Greeting + date, goal ring, week dots, hero card w/ rings + ember pill w/ arrow circle, Quick start 2-col | 5 |
| Library | Search pill, chips (ink selected), row cards w/ ring thumbs; desktop list+detail panes | 5 |
| Detail | Photo card + Start/End segmented crossfade, Best tag (`--pb-ink`), outlined step numbers, Try it / Add to workout | 5 |
| Log → Progress | Route `/progress` + redirect from `/log` (keep `?month=`); month calendar; stats Goal streak / Per week / Time; PB sparklines | 5 |
| Summary | Check badge + rings, stats card, dark PB card, moves card, ink Done | 5 |
| Settings | Steppers, switches incl. **Voice cues**, Appearance (already live — restyle only), Reset in `--danger` | 4.4, 5 |
| `stats.ts` (additive) | `goalStreak(sessions, goal, now)`, `bestSeries(sessions, exerciseId, weeks=6)` + tests | 5 |
| Voice cues | `Settings.voice` (default false), `useCues` speaks "Set done / Rest / Go" via `speechSynthesis` when on | 5 |

### 3. Order of work (one commit per step, no push)
**Step 1. Tokens, font, Rings, tab bar/sidebar**
- Swap tokens.css and add the missing tokens. Install Geist and remove the three old font packages.
- Update base.css, PageHeader and the `--card` → `--card-shadow` rename.
- Add `Rings.tsx` and put it in the Layout corner.
- Do TabBar, Sidebar, SessionBar, Segmented, Stepper, Switch and ImagePlaceholder.
- Delete RepTicks.
- Remove the mono/uppercase rules in every module CSS. This is a neutral pass so pages aren't broken; the page-specific polish comes in steps 4–5.
- Check: tokens, base, shell and Today all render in both themes.

**Step 2. Player**
- `screen.ts` model change (line, counter kind, adjust/addTime, New best in the line) plus `screen.test.ts`.
- PhoneView fixed layout, Player.module.css rewrite, DesktopView per GD-Player.
- parts.tsx: Progress, Adjust and AddTime. New keys in Player.tsx.
- Rest uses `--rest-*` and shows the "Up next" chip.
- Wake-lock chip.

**Step 3. Info sheet + needsSetup**
- Replace FormDialog with InfoSheet: focus trap, return focus to ⓘ, Esc/scrim close, no pause, shows the next exercise on rest.
- `needsSetup` across the import script, overrides, exercises.json, Exercise type, compile Step, reducer and estimateMs, with test updates (lead-in only when flagged; "Start now" skips it).
- useCues: only schedule lead-in beeps when the set has a lead-in.

**Step 4. Today, Library, Detail**
- Phone and desktop (GD-Today, GD-Library).

**Step 5. Progress, Summary, Settings + rename**
- Move `features/log` → `features/progress`, add the `/progress` route and the `/log` redirect, update nav, update the App.test and Summary link.
- Add the stats.ts functions and tests, the sparklines and Goal streak.
- Summary, Settings and Voice cues.
- Rename to Pulse in index.html (title, theme-color = `--bg` values), Sidebar, ErrorScreen, README and package.json.
- Recreate CLAUDE.md from CLAUDE.design-rules.md.

### 4. Verification per step
- `npm run test`, `npm run build` and `npm run lint` pass.
- Playwright screenshots at 390×844 and 1440×900, light and dark, compared with the matching refs.
- Step 2 and later: assert the video card height is identical across work, rest, get-ready and holding.
- Final: `grep -ri "barlow\|plex\|uppercase" src` is empty, there's no raw hex outside tokens.css, and Lighthouse a11y is ≥ 95.
