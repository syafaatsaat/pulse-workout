# Field Manual — Design system

Direction: **Field Manual** — utilitarian grid and mono labels, condensed display type, premium finish
(cards, soft edges, generous space). Core principle: **the in-session screen must be readable from 2 m away.**

Tokens live in `src/styles/tokens.css`. This file explains how to use them.

## Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | #F4F3EF | #121214 | Page background |
| `--surface` | #FFFFFF | #1A1A1D | Cards, inputs, raised buttons |
| `--ink` | #111113 | #EDEBE6 | Primary text, primary dark buttons |
| `--muted` | #66666D | #9D9CA3 | Secondary text, eyebrows, inactive tabs |
| `--line` | #DCDAD3 | #2A2A2E | Hairlines inside cards, tab bar border |
| `--line2` | #C9C6BE | #3A3A40 | Stronger outlines, switch off-track |
| `--fill` | #E9E7E1 | #232328 | Pills, chips, active tab pill, segmented track |
| `--dim` | #9C9AA1 | #6C6C73 | Chevrons, future dates, warm-up / cool-down segments |
| `--rest` | #CFCCC4 | #3A3A40 | Rest segments in the session bar |
| `--bar` | #BDBAB2 | #4A4A50 | Past values in sparklines |
| `--danger` | #B42318 | #FF7A6B | Destructive actions only |
| `--accent` | #FF5A1F | same | Start button, today marker, personal bests, switches on |
| `--work` / `--work-ink` | #FF5A1F / #111113 | same | Player work screen |
| `--rest-bg` / `--rest-ink` | #1E3FAE / #FFFFFF | same | Player rest screen |

Text on orange is always `#111113`, never white (white on #FF5A1F fails contrast).

## Type

| Role | Font | Size / weight | Notes |
|---|---|---|---|
| Eyebrow / label | IBM Plex Mono | 11px / 500, letter-spacing 0.08em | Uppercase, `--muted` |
| Body | IBM Plex Sans | 15px / 400–500 | Secondary 13px |
| Buttons (secondary) | IBM Plex Sans | 14–15px / 600 | Sentence case |
| Page title | Barlow Condensed | 36px / 700 | Uppercase, line-height 1 |
| Hero (session name) | Barlow Condensed | 52px phone, 88px desktop / 700 | Uppercase, line-height 0.92 |
| Primary button | Barlow Condensed | 24px / 700 | Uppercase, letter-spacing 0.5px |
| List item name | Barlow Condensed | 19–21px / 600 | Uppercase |
| Stat value | Barlow Condensed | 26–32px / 600 | `tabular-nums` |
| Rep counter, timers | Barlow Condensed | 18dvh, max 180px phone, clamp(200px, 24vw, 360px) desktop / 800 | line-height 1, never clipped |
| Rest countdown | Barlow Condensed | 120px / 800 | Inside the ring |

## Layout

- Phone: 20px side gutter, 56px top (status bar), tab bar 56px + 30px bottom (home indicator).
  Use `env(safe-area-inset-*)` in the app instead of fixed numbers.
- Desktop (≥1024px): 220px left sidebar, content max-width 1160px, 48px padding.
- Between 640 and 1023px: phone layout with wider margins.
- Cards: `--surface`, `--card` shadow, radius 18–20px, 14–20px padding. Rows inside cards are separated by
  1px `--line`; the first row has no top border.

## Components

| Component | Spec |
|---|---|
| **SessionBar** | Flex row, 3px gap. One segment per timeline step, `flex-grow` = duration weight (work 3, rest 1, warm-up 4, cool-down 3). Preview (Today, Builder): work `--ink` full height, rest `--rest` ~1/3 height, warm/cool `--dim` ~1/2 height. Player: 6px tall (10px desktop), past = ink 55%, current = solid, future = ink 16%. |
| **TabBar** (phone) | 4 items: Today, Library, Log, Settings. Icon in a 56×30 pill; active pill `--fill`, label `--ink`; inactive `--muted`. 11px / 600 labels. `aria-current="page"`. |
| **Sidebar** (desktop) | Logo mark (28px orange square "FM") + wordmark. Items 44px, radius 12; active = `--surface` + `--card`. Weekly goal card pinned at bottom. |
| **Card** | See Layout. |
| **Chip / filter** | 34–36px tall pill. Off: `--surface` + `--card`; on: `--ink` bg, `--bg` text. `aria-pressed`. |
| **Info pill** | 26–30px, `--fill`, mono 10–11px / 600. Orange variant for personal bests. |
| **Stepper** | 36px tall `--fill` rounded rect: − / value (mono) / +. |
| **Switch** | 50×30, on = `--accent`, off = `--line2`, white 24px knob with small shadow. `role="switch"`. |
| **Segmented** | `--fill` track, 4px padding; selected segment `--surface` + `--card`. Used for theme and effort. |
| **Ring** | Progress ring. Weekly goal: 40px, 4px stroke, `--line` track, `--accent` arc. Rest: 280px, 10px stroke, white arc on rest-tint track. |
| **RepTicks** | 12 squares (14px phone, 18px desktop), filled = done; a 2px ring marks last time's best. |
| **Sparkline** | 6 bars, 3px gap, past `--bar`, latest `--accent`. |
| **ImagePlaceholder** | `repeating-linear-gradient(135deg, var(--hatch) 0 8px, transparent 8px 16px), var(--fill)` + small figure icon. Used until images load. |
| **Primary button** | 56px phone / 60px desktop, radius 14–16. Orange (Start) or `--ink` (Save, Add). |
| **Player buttons** | Pill 64px (phone) / 84px (desktop) tall. Work: Set done = `#111113` bg, orange text. Rest: Skip = white bg, blue text. Secondary = tint bg. |

## Icons
Inline stroke SVGs, 1.8px stroke, 20px in nav, round caps and joins. No emoji, no icon font.

## Motion (Day 6–7 polish)
- Work ↔ rest: background colour cross-fade, 250ms.
- Session bar: current segment fills; rest ring drains smoothly (use the timestamp, not steps).
- Counter: number change with a short 120ms scale/opacity, no bounce.
- All disabled under `prefers-reduced-motion`.
