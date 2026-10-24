# BESS Module 1 — Energy, power, time, money

A single-page, offline-capable drill app for the first module of a design-weighted
BESS curriculum (German market).

- **Learn** — power vs energy, duration and C-rate, units, grossing up losses
- **Calculate** — plant sizing and cell/string arithmetic, live
- **Drill** — 12 questions with an explanation after each answer
- Progress is stored locally; nothing leaves the device.

Anchor example: 100 MW / 400 MWh at 110 kV.

## Run locally

    python3 -m http.server 8787 --directory .
    # then open http://127.0.0.1:8787

## Test

    node tests/calc.test.js        # arithmetic
    node tests/structure.test.js   # DOM ids, content integrity, answer consistency
    node tests/dom.smoke.js        # boots the page in jsdom (needs: npm i jsdom)

## Install on Android

Open the site in Chrome → menu → *Add to Home screen*. The service worker caches the
shell, so it keeps working offline.

## Stack

No framework, no build step, no dependencies at runtime. Four files do the work:
`calc.js` (pure arithmetic), `content.js` (lesson and drills), `app.js` (UI), `sw.js` (offline).
