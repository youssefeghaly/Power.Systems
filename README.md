# BESS lab

An offline-capable, single-page training app for utility-scale battery storage, aimed at
the German market. Built as a design curriculum: every module ends with something you
produce or compute, not something you read.

**Anchor plant:** 100 MW / 400 MWh, 110 kV, 20 years, augmentation in years 7 and 14.

## Modules

| # | Module | What it makes you able to do |
|---|---|---|
| 01 | Energy, power, time, money | Size a plant from a contract number; C-rate, units, grossing up losses |
| 02 | The machine, end to end | Read and defend the single-line diagram; build a loss budget that lands on ~88 % RTE |
| 03 | Degradation, augmentation, guarantees | Plan twenty years of capacity; decide overbuild vs augmentation; keep warranty and offtake apart |
| 04 | German grid connection 4110/4120 | Find which TAR applies, which certificates and permits are needed, and what the DSO checks |
| 05 | Protection and fault levels | Grade two relays on IEC curves, compute fault level, explain CT burden |
| 06 | Earthing and EMC | Size an electrode, compute earth potential rise, compare against a touch-voltage limit |
| 07 | Cables and laying | Size one cable against thermal, drop and short-circuit; apply derating and laying rules |
| 08 | The HV installation | Read an HV bay, choose switchgear and transformer parameters, spec CTs and VTs |
| 09 | The MV connection | Specify the transfer station: switchgear, metering, NA protection, transformer, earthing |

Each module has three views:

- **Learn** — short sections, one formula each, plus (in module 2) an interactive single-line diagram
- **Calculate** — a live calculator, not a form: change an input and the consequence is visible
- **Drill** — 12 questions; a wrong answer returns until it is right, and the set ends when nothing is left

Progress is stored per module in `localStorage`. Nothing leaves the device.

## Run locally

    python3 -m http.server 8787 --directory .
    # open http://127.0.0.1:8787

## Test

    node tests/calc.test.js        # arithmetic (21 checks)
    node tests/structure.test.js   # module registry, content integrity, answer consistency
    node tests/dom.smoke.js        # boots the page in jsdom and drives it (needs: npm i jsdom)

## Install on Android

Open the site in Chrome → menu → *Add to Home screen*. The service worker caches the
shell, so it keeps working offline.

## Structure

No framework, no build step, no runtime dependencies.

    calc.js       pure arithmetic, shared by every module
    content.js    module 1 data (lesson text and drills)
    m1.js         module 1 registration + calculator
    m2.js         module 2: lesson, diagram, loss calculator, drills
    app.js        shell: module picker, tabs, drill engine, progress
    sw.js         offline cache

To add a module: push an object onto `window.MODULES` with `{id, number, title, lead,
sections, calc:{html,init}, drills}`. The shell picks it up.
