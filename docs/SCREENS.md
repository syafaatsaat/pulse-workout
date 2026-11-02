# Field Manual — Screens

Reference mock-ups: `docs/design-reference/`. Phone files `F-*.dc.html` (390×844), desktop `DT-*.dc.html`.
Lean scope = screens 1–6 and 8. Screen 7 (Builder) is an add-on.

## 1. Today — `/` (F-Today, DT-Today)
- Header: eyebrow date, title "TODAY", weekly goal ring (sessions done / goal).
- Week strip: 7 date circles; done = filled ink, today = orange ring, future = dim.
- Up-next card: eyebrow, session name (hero), info pills (moves, minutes, equipment), session bar with block
  labels, Start (orange, → Player), Edit (→ Builder, add-on; hide in lean build).
- Quick start: 3 cards of ready-made workouts → Player.
- Desktop: two columns — up-next card (with full move list) | This week, Quick start (every workout, as a
  list), Recent bests (top 3, number only; no sparklines, no New workout / Edit until the add-ons).

## 2. Player — `/session/:id` (2a work, 2b rest, 2c timed, Desktop · Player PNGs)
Redesigned twice after real-phone testing; the PNG mock-ups in `docs/design-reference/` win over the older
F-Player / F-Rest / DT-Player `.dc.html` files. All player timers are MM:SS (`00:05`); no totals or elapsed time.
Phone, work and rest share one layout:
- Session bar; close / end (→ confirm → Today) beside "Move 4 of 9 · Set 2 of 4" ("… done" on a rest).
- Big name ("Rest" on a rest), then the exercise slideshow taking the spare height: start ⇄ end photo every
  second (still while paused or with reduced motion). On a rest it shows the next move with an
  "Up next · Push-up · Set 3 of 4" pill.
- Counter with round − / + at the edges: reps ± 1, or −15 / +15 s on a rest or a timed hold.
- Progress bar under it: reps done of the target, time held, or rest left; a tick marks last time.
- Two-part card: work = Form cue (short hand-written cue, taps open the form overlay) | Last time (main phase
  only); rest = Next target | Last set.
- Buttons: Pause, then Set done / Skip rest (Resume while paused). Timed moves: Set done auto-fires at 00:00.
- Timed moves start with a 5 s lead-in: "Get into position" pill on the slideshow over a 00:05 countdown, no
  − / +, and Start now skips it; beeps 3-2-1-go at the end of the lead-in and of the hold.
Desktop: full screen. Header: End session (Esc), "Push & Core · Move 4 of 9 · Set 2 of 4", session bar with
block labels. Large slideshow | name, counter with − / +, progress bar, key hint, the same two-part card, and
a Coming up list (next 3 steps; after the next move during a rest). Footer: Pause (P) | primary (Space).
Keyboard: Space = set done / skip rest / start now / resume, P = pause, ← → = − / + (reps, or 15 s on a rest
or hold), Esc = end.
After the last step → Summary.

## 3. Summary — `/session/:id/summary` (F-Summary)
- Check badge + "SESSION COMPLETE" + date, session name, completed session bar.
- Stats card: time, sets done/total, total reps.
- New personal best banner (only if one happened).
- Per-move card: name, sets, best (PB highlighted orange). "+N more" row.
- Effort selector 1–5 (add-on; hide in lean build). Save to log → Log.

## 4. Library — `/library` (F-Library, DT-Library)
- Title, search field, filter button (equipment), muscle chips (scroll).
- Results card: thumbnail, name, primary · secondary muscle, level badge (BEG / INT / EXP) → Detail.
- Equipment filter defaults to the equipment set in Settings.
- Desktop: list pane | detail pane (selection in the URL: `/library/:exerciseId`, filters carried along;
  `/library` alone shows the first result). `/` focuses search. Equipment and muscle chips wrap inline.

## 5. Exercise detail — `/library/:exerciseId` (F-Detail)
- Back, image card with START / END toggle (crossfade in the app), name, tags (best in orange, level, force,
  mechanic, equipment), primary / also muscles, numbered steps card.
- Bottom bar: Try it (single-exercise session) · Add to workout (add-on; hide in lean build).
- Desktop: the Library's detail pane — START and END photos side by side, name, tags, Try it now, steps card |
  muscles card with your best and last session (no 6-week bars until the Trends add-on).

## 6. Log — `/log` (F-Log)
- Eyebrow totals, title, month calendar card (done = filled, today = orange ring, tap → that summary).
- Stat cards: streak (weeks meeting goal), average per week, goal weeks this month.
- Personal bests card: name, sparkline (add-on; lean = best number only), best value, delta.
- Desktop: calendar on the left, stats and personal bests on the right.

## 7. Builder — `/workouts/:id/edit` (F-Builder) — ADD-ON
- Cancel / Edit workout / Save. Name + live session bar + estimate card.
- Block cards (letter badge, name, type pill) with rows: drag handle, name, sets×reps button, rest button.
- + Exercise (→ Library picker), + Block.

## 8. Settings — `/settings` (F-Settings)
Lean: default rest, weekly goal (steppers); keep screen awake, beeps (switches); appearance
Light / Dark / Auto (segmented); Reset demo data.
Add-on: voice cues, 3-second lead-in, equipment owned, export log as JSON.

## Navigation
Phone: tab bar (Today, Library, Log, Settings) on 1, 4, 6, 8. Player, Summary, Detail, Builder are full-screen
pushes without the tab bar. Desktop: sidebar replaces the tab bar.
