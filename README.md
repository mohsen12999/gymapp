# gymapp

A mobile-first web app that lists gym exercises with a small picture next to each
name. Pick the moves you want for a given day; each day keeps its own list, and a
fresh day always starts empty.

Built with React and Vite, installable to a phone home screen as a PWA.

## Features

- **Exercise list** — 16 exercises, each showing its name, primary muscle group, a
  one-line description of how the move is performed, and a thumbnail.
- **Day by day** — the header shows the selected day with `‹` / `›` buttons to step
  through dates and a "Back to today" shortcut. Every day has its own saved list,
  and a day you have not picked anything for shows an empty state instead of
  inheriting yesterday's choices.
- **Saved list panel** — the exercises chosen for the selected day appear as chips at the top; tapping a chip removes it from that day. Rows in the full list are buttons with `aria-pressed`, and the header counts them (`4 saved for this day`).
- **Installable** — the header shows an **Install** button that triggers the browser's native PWA prompt; when the app is already running as an installed standalone app it shows an **Installed** label instead. Browsers that never offer a prompt (Safari on iOS) get a one-line "add to home screen" hint rather than a dead button.
- **Offline SVG thumbnails** — every picture is an inline SVG stick figure drawn from pose data, so there are no image files, no external requests, and nothing to load on a slow connection.
- **Works with no network** — `public/sw.js` caches the shell, script, and styles on first visit, so a built or previewed copy opens and stays tappable with the server stopped. Navigations go to the network first and fall back to the cached shell; assets are served from cache. The worker is registered only in production builds, so `npm run dev` keeps HMR uncached.
- **Persistence** — the plan for every day is stored in `localStorage` under one date-keyed record and restored when you reopen the app.
- **Mobile-ready** — dark theme, `viewport-fit=cover` with safe-area insets, 52px tap targets, no tap flash, and reduced-motion support.
- **Accessible** — rows expose `aria-pressed`, chips announce "Remove … from this day", and the day buttons have labels.

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 18 |
| Build & dev server | Vite 5 |
| Language | JavaScript (JSX) |
| Styling | Plain CSS with custom properties |
| Graphics | Inline SVG |
| Storage | `localStorage` |
| Offline | Service worker, no build plugin |

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
npm run icons     # re-render the PNG icons after editing the icon geometry
```

## Project structure

```
index.html                   app shell, viewport + PWA meta tags
vite.config.js               dev server (host: true so phones can reach it), injects the footer name/version from package.json
public/manifest.webmanifest  name, theme colour, standalone display, icons
public/icon.svg              vector app icon
public/icons/icon-192.png    raster icons for install criteria
public/icons/icon-512.png
public/sw.js                 offline caching worker (registered in builds only)
src/
  main.jsx                   React root
  App.jsx                    day navigation, saved list, toggle logic
  ExerciseIcon.jsx           renders a pose as SVG
  exercises.js               exercise data + pose definitions
  install.js                 beforeinstallprompt capture and install state
  db.js                      date keys, reading and writing the stored plans
  styles.css                 mobile layout and theme
scripts/
  make-icons.mjs             renders public/icons/*.png from the icon geometry
```

## Data model

Each entry in `src/exercises.js` is:

```js
{
  id: "squat",          // stable key, used for persistence
  name: "Barbell Squat",
  muscle: "Legs",
  description: "Back squat: brace, sit the hips down and back, ...",
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

`src/db.js` keeps the whole history in one `localStorage` value, `gym.day-plans`,
keyed by the local date:

```json
{
  "2026-11-10": ["squat", "bench-press"],
  "2026-11-11": []
}
```

`App.jsx` holds that map plus the selected day, and derives the day's `Set` of
chosen ids from it, so switching days never re-reads storage and a tap only
rewrites the current day's array. A day with no entry — or an empty array —
renders the empty list, which is why a new day starts blank rather than copying
the previous one. Corrupt or missing storage falls back to `{}`.

Install state is not stored: `src/install.js` captures
`beforeinstallprompt` at module load, and `App.jsx` reads it through
`useSyncExternalStore`, so the header re-renders when the prompt arrives, when
`appinstalled` fires, or when the `display-mode: standalone` media query flips.

## Roadmap ideas

- Filter between all / saved / not saved
- A week strip instead of `‹` / `›` so several days are visible at once
- Set, rep, and weight fields per exercise
- Sync the day plans to a real backend so history survives a cleared browser
- A maskable icon variant, with the figure inside the 80% safe zone
