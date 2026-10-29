# Eorzea Long-Haul Board

An offline, single-file web app for tracking the *long-haul* side of Final Fantasy XIV: the mounts that drop from thirty weeks of trials, the minions you'll eventually buy with MGP, the barding you keep forgetting exists, and the relic weapon milestones that stretch across whole expansions.

It is deliberately the opposite of an API-driven tracker: you mark things off yourself, chip by chip, with data that never leaves your browser.

**A fan-made companion tool from [Asdale Dynamics, LLC](https://dylanasdale.github.io) — plain tools, tested, local-first.**

---

## What it does

- **Four boards** — Mounts, Minions, Barding (chocobo attire), and Relic quest milestones.
- **Method tags on every item** — `Duty` (trial / dungeon / raid), `Vendor` (purchase / currency exchange), or `Ground stage` (FATEs, world events, gathering). Color-coded at a glance.
- **Status chips** — each item cycles *Not started → Working on it → Obtained* with one click.
- **Progress bars** — a live overall bar plus a per-board percentage on every tab, so you can see whether your grind is actually moving.
- **Weekly focus** — one un-collected item is picked for the week (or you reroll / hand-pick it). ISO-week based, so a new week means a new target if the old one didn't land.
- **Celebration log** — when an item finally hits *Obtained*, it gets a 🎉 entry with the date. Proof the grind was real.
- **Export / import** — one JSON button; keep a backup or carry progress between browsers.
- **Starter checklists included** — a curated seed set of well-known mounts, minions, bardings, and relic chains, each with a hint about where to get it. Editable — add, edit, or delete anything.

## How to run it

No build, no dependencies, no network calls.

1. Download or clone this folder.
2. Open `index.html` in any modern browser. That's it.

For the cleanest offline experience, double-click the file or open it via your browser's "Open File…" menu. It also works fine served statically (e.g. `python3 -m http.server`) if you prefer.

## Where your data lives

Everything is stored in your browser's `localStorage` under the key `ffxiv-collection-board-v1`. There are no accounts, no servers, no analytics, no API keys, and no requests leaving the page. Clearing site data clears the board — use **Export data** first.

## Tests

The progress, focus, week-key, validation, and seed-data logic is unit-tested against the script that's actually inside `index.html`:

```
node tests/run-tests.mjs
```

19 tests, zero dependencies (plain `node`, no test runner to install).

## Project layout

```
index.html          the entire app (HTML + CSS + JS)
tests/run-tests.mjs dependency-free test suite
LICENSE             MIT — Copyright (c) 2026 Asdale Dynamics, LLC
STATUS.md           current build status and known gaps
```

## Why it exists

Big trackers already list *everything* in Eorzea. This one doesn't want to compete — it wants to be the small manual checklist that complements them: narrow subject (mounts, minions, barding, relics), zero setup, weekly-focus friendly, and a place to celebrate when the drop rates finally pay off.

## Notes

- Fan-made and unofficial. *Final Fantasy XIV* is a trademark of Square Enix Holdings Co., Ltd. This project is not affiliated with or endorsed by Square Enix.
- Seed entries are a starter set and reflect long-standing sources; Square Enix patches change sources and prices over time, so treat any hint text as a starting point you can edit.
- Released under the MIT License.
