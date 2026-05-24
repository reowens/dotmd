---
type: prompt
status: pending
created: 2026-05-24T04:36:32Z
updated: 2026-05-24T04:36:32Z
dotmd_version: 0.31.1
context: "Resume Audit Fixes"
related_plans:
---

Pick up the dotmd self-dogfood audit. Six findings shipped in 0.31.2 (committed, not released yet — branch is N commits ahead of origin/main). Four findings remain open. Full status is in `docs/prompts/audit-followup.md`.

## State at handoff

- Branch ahead of origin/main with 7 unpushed commits (6 fixes + the CHANGELOG backfill that names them).
- 0.31.2 CHANGELOG entry is written but NOT released. The user has been holding releases manually since 0.31.1 — ask before running `npm version patch`.
- Tests: 757/757 passing as of the last commit.
- Two scaffolded plans (for findings 6 + 7) archived under `docs/archived/`.

## Remaining audit findings

Listed by the canonical numbering in `docs/prompts/audit-followup.md`:

- **#8** `dotmd briefing` reports `Errors: 1` with no detail. UX gap — should hint to run `dotmd check`. Small.
- **#9** `pickup`'s `Related:` resolver shows same-dir sibling as `(missing)`. Refs across directories work with relative paths; bare basenames in same-dir don't. Investigate `src/pickup-card.mjs` or wherever `Related:` is rendered, and the ref-resolution path. Likely shares logic with graph's ref resolver in `src/graph.mjs` (which DOES resolve same-dir, since it uses `path.resolve(docDir, relPath)`).
- **#10** `dotmd doctor` numbered steps print `1, 2, 3, 4, 6` — no `5.`. Cosmetic. Look at `src/doctor.mjs`.
- **#11** Fresh `dotmd init` (no pre-existing config) skips slash-command scaffolding entirely. Dispatcher passes `null` to runInit when `configFound` is false; the `if (config)` gate in runInit then skips the slash-command block. Fix: re-resolve config inside runInit after the starter config has been written, or synthesize a default-shaped config. Surfaced during the #7 investigation but not folded into that fix.

Recommended next: **#11** (companion to the just-shipped #7 — same file, fresh context) or **#9** (highest user-facing leverage of what's left). Skip #8 and #10 until the meatier ones are done.

## How to work the loop

1. Read `docs/prompts/audit-followup.md` for the canonical finding list with resolved/open status.
2. Pick a finding. Scaffold a plan ONLY if it's complex enough to warrant phases — most of these are single-commit fixes that don't need one.
3. Make the fix + a regression test. Run `npm test` (currently 757 tests).
4. End-to-end verify on this repo where possible (it's the dogfood target — most findings reproduce locally).
5. Update the audit prompt's finding entry to `~~struck through~~ **fixed.** <brief>` style.
6. Commit. Don't release without asking; user has been gating releases.

## Useful pointers

- `src/commands.mjs` is the canonical CLI verb list (added in finding 6's fix).
- `regenIndex(config)` in `src/lifecycle.mjs` is exported — use it from any new mutation path.
- The dogfood repo has its own config + docs/ + audit prompt — when fixing, exercise against it before relying only on test fixtures.
- Don't push without explicit ask. Don't release without explicit ask.

