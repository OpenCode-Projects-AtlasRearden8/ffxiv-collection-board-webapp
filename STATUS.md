# STATUS — Eorzea Long-Haul Board

Last updated: 2026-10-29

## What was built

A complete, single-file static web app (pure HTML/CSS/JS, zero dependencies, no network calls) for manually tracking FFXIV long-haul collections:

- **Boards:** Mounts, Minions, Barding, and Relic quest milestones, with per-board progress bars and percentages.
- **Method tags:** each item is tagged `Duty`, `Vendor`, or `Ground stage` (FATEs / world / gathering), color-coded.
- **Status chips:** click-to-cycle Not started → Working on it → Obtained, with completed rows struck through.
- **Weekly focus:** an ISO-week–keyed pick among un-collected items, with reroll and manual pick. Auto-advances on Monday; clears itself when the pick is obtained.
- **Celebration log:** obtaining an item records a dated 🎉 entry; un-obtaining removes it. Login-free, tap out a full history of the grind.
- **Overall progress:** overall bar plus per-board counters in the header.
- **Export / import:** JSON download and import with shape validation; badge-confirmation reset to the starter checklists.
- **Seed data:** ~44 starter entries with source hints (Gold Saucer MGP, achievement certificates, beast-tribe vendors, FATEs, relic chains per expansion).
- **Persistence:** everything in `localStorage` (`ffxiv-collection-board-v1`); graceful degradation if storage is blocked.

## How to run

- Open `index.html` in any modern browser. No build step, no dependencies, works offline.
- Tests: `node tests/run-tests.mjs` (plain Node, no test framework needed).

## Verification results

- `node tests/run-tests.mjs` → **19 passed, 0 failed** (status cycle logic, progress math, board split, ISO week keys incl. year-rollover anchors, focus picking, log entries, import validation, seed-data sanity, and static checks for single-file/no-dependencies/no-secrets).
- App script loads cleanly in a Node sandbox (shared source means the tested code is literally the shipped code).

## Known gaps / possible next steps

- No item editing UI for existing names/details (delete + re-add covers it; inline edit is an easy next step).
- Seed lists are accurate starter sets but not exhaustive and not guaranteed current after patches — they're meant to be edited.
- Relic board seeds are chain milestones, not per-weapon checklists; a per-stage expansion for individual relics could be added.
- No dark/light theme toggle (currently dark-only).
- No keyboard shortcuts beyond native tab/enter behavior; accessibility could go further (ARIA on chips, focus management on tab switch).
