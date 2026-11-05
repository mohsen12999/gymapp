# gymapp

A mobile-first web app that lists gym exercises with a small picture next to each
name. Tap any row to mark the exercise **active** or **inactive** — useful for
picking the moves you want in today's session.

Built with React and Vite, installable to a phone home screen as a PWA.

## Features

- **Exercise list** — 16 exercises, each showing its name, primary muscle group, and a thumbnail.
- **Tap to toggle** — the whole row is a button; active rows turn green and the header shows how many are selected (`6 of 16 active`).
- **Offline SVG thumbnails** — every picture is an inline SVG stick figure drawn from pose data, so there are no image files, no external requests, and nothing to load on a slow connection.
- **Persistence** — your selection is saved to `localStorage` and restored next time you open the app.
- **Mobile-ready** — dark theme, `viewport-fit=cover` with safe-area insets, 52px tap targets, no tap flash, and reduced-motion support.
- **Accessible** — rows expose `aria-pressed`, so screen readers announce the active state.

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 18 |
| Build & dev server | Vite 5 |
| Language | JavaScript (JSX) |
| Styling | Plain CSS with custom properties |
| Graphics | Inline SVG |
| Storage | `localStorage` |

## Getting started

```bash
npm install
npm run dev
```

Vite prints a local and a network URL; open the network URL on a phone connected
to the same Wi-Fi to test it for real.

```bash
npm run build     # production bundle in dist/
npm run preview   # serve the built bundle locally
```

## Project structure

```
index.html                   app shell, viewport + PWA meta tags
vite.config.js               dev server (host: true so phones can reach it)
public/manifest.webmanifest  name, theme colour, standalone display
src/
  main.jsx                   React root
  App.jsx                    list, toggle logic, active count
  ExerciseIcon.jsx           renders a pose as SVG
  exercises.js               exercise data + pose definitions
  styles.css                 mobile layout and theme
```

## Data model

Each entry in `src/exercises.js` is:

```js
{
  id: "squat",          // stable key, used for persistence
  name: "Barbell Squat",
  muscle: "Legs",
  pose: {
    head: [32, 13],                        // x, y of the head dot
    body: [[[32, 21], [32, 37]], ...],     // polylines: torso, arms, legs
    gear: [[11, 11, 3], [53, 11, 3]],      // circles: dumbbells / barbell plates
  },
}
```

`pose` is drawn on a 64×64 canvas. To add an exercise, append an object with a
unique `id` and a pose — no other file needs changing.

## State

Active ids live in one `Set` in `App.jsx`, written back to `localStorage` under
the key `gym.active-exercises` on every change. On first run (no stored value)
three exercises start active as a demo.

## Roadmap ideas

- Filter between all / active / inactive
- Group by muscle or build a session from the active set
- Set, rep, and weight fields per exercise
- App icons for a fully installable PWA (the manifest currently ships without them)
