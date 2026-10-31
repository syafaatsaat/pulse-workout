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

## 2. Player — `/session/:id` (F-Player work, F-Rest rest, DT-Player)
Redesigned after real-phone testing, inspired by other fitness apps; where the F-Player / F-Rest
mock-ups differ, this list wins. All player timers are MM:SS (`00:05`); no totals ("of 0:40") or elapsed time.
Work:
- Session bar, close / end (→ confirm → Today), "Set 2 of 4", (i) how-to button (→ form overlay: photos, steps).
- Exercise slideshow: start ⇄ end photo every second (still while paused or with reduced motion).
- Exercise name; big counter (140px): reps with − / + beside it, or the MM:SS countdown for timed moves.
- One line: "Last time 10 reps · Next Rest 0:45" (last time in the main phase only).
- Buttons: Pause, Set done (→ rest or next work). Timed moves: Set done auto-fires at 00:00.
- Timed moves start with a 5 s lead-in: "Get into position" over a 00:05 countdown and a Start now button
  that skips it; beeps 3-2-1-go at the end of the lead-in and of the hold.
Rest:
- Blue screen, "Set 1 of 4 done", MM:SS countdown in a draining ring.
- Next card: "Next · Set 2 of 4", name, dose, slideshow of the next move. Buttons: Pause, +15s, Skip rest
  (Resume while paused).
Desktop: full screen, numbers scale with viewport, side panel (form photos crossfading, last time / next +
target, up next 3); same removals, MM:SS and lead-in as the phone. Keyboard: Space = set done / skip rest /
start now, P = pause, ← → = adjust reps, ↑ = +15s, Esc = end.
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
