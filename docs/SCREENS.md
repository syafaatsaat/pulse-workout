# Field Manual — Screens

Reference mock-ups: `docs/design-reference/`. Phone files `F-*.dc.html` (390×844), desktop `DT-*.dc.html`.
Lean scope = screens 1–6 and 8. Screen 7 (Builder) is an add-on.

## 1. Today — `/` (F-Today, DT-Today)
- Header: eyebrow date, title "TODAY", weekly goal ring (sessions done / goal).
- Week strip: 7 date circles; done = filled ink, today = orange ring, future = dim.
- Up-next card: eyebrow, session name (hero), info pills (moves, minutes, equipment), session bar with block
  labels, Start (orange, → Player), Edit (→ Builder, add-on; hide in lean build).
- Quick start: 3 cards of ready-made workouts → Player.
- Desktop: two columns — up-next card (with full move list) | This week, Quick start, Recent bests.

## 2. Player — `/session/:id` (F-Player work, F-Rest rest, DT-Player)
Work:
- Session bar (progress), close / end (→ confirm → Today), "Move 4 of 9 · Set 2 of 4", elapsed time,
  Form button (→ exercise detail overlay).
- WORK pill, exercise name, big rep counter, "OF 12 REPS", rep ticks (ring on last best), − / + adjust.
- Info panel: tempo, last time, next. Buttons: Pause, Set done (→ rest or next work).
- Time-based exercises: counter shows a countdown instead of reps; Set done auto-fires at zero.
Rest:
- Blue screen, REST pill, countdown in a draining ring, "OF 0:30".
- Up-next card with thumbnail. Buttons: +15s, Skip rest.
Desktop: full screen, numbers scale with viewport, side panel (form photo, tempo/last time, up next 3),
keyboard: Space = set done / skip rest, P = pause, ← → = adjust reps, ↑ = +15s, Esc = end.
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
- Desktop: list pane | detail pane (selection in the URL: `/library/:exerciseId`). `/` focuses search.

## 5. Exercise detail — `/library/:exerciseId` (F-Detail)
- Back, image card with START / END toggle (crossfade in the app), name, tags (best in orange, level, force,
  mechanic, equipment), primary / also muscles, numbered steps card.
- Bottom bar: Try it (single-exercise session) · Add to workout (add-on; hide in lean build).

## 6. Log — `/log` (F-Log)
- Eyebrow totals, title, month calendar card (done = filled, today = orange ring, tap → that summary).
- Stat cards: streak (weeks meeting goal), average per week, goal weeks this month.
- Personal bests card: name, sparkline (add-on; lean = best number only), best value, delta.

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
