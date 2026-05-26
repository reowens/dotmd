---
type: plan
status: archived
created: 2026-05-26T01:54:59Z
updated: 2026-05-26T02:02:34Z
surfaces:
modules:
domain:
audience: internal
parent_plan:
related_plans:
related_docs:
  - ../audit-beyond-platform.md
summary: Batch six P2/P3 polish findings (F5, F7, F8, F9, F10, F12) from the beyond-platform audit. No JSON/schema breaks. Ships as 0.36.2.
current_state: Implementation + tests complete (863/863 passing). Pending audit-doc update, plan archive, and `npm version patch`.
next_step: Append 0.36.2 verified-impact section to docs/audit-beyond-platform.md, then archive this plan and run `npm version patch`.
---
# 0.36.2 polish bundle

Six P2/P3 findings from `docs/audit-beyond-platform.md` batched as a no-breakage polish release. Shared theme: dotmd silently swallows information the user needs to act on.

## Scope

- **F5** — `dotmd glossary` lies when section is missing. Split into "not found" vs "found but no entries". `src/glossary.mjs`.
- **F12** — `dotmd glossary --list` config-diagnostic when misconfigured. Pairs with F5. `src/glossary.mjs`.
- **F7** — `dotmd query` shows "results: N of M (use --all)" when truncated. `src/query.mjs:254`.
- **F9** — `dotmd plans` truncation footer in grouped/sort=status views (currently only triage view). `src/query.mjs:385`.
- **F10** — Cap `_renderContext` stale-slug tail at 8 + "… and N more". `src/render.mjs:276`.
- **F8** — Warn at config-load on contradictory rich-status flags (`skipStale:true + staleDays`, `skipWarnings:true + requiresModule`). `src/config.mjs:118`.

All additive or pure-render. No JSON shape changes, no schema changes, no behavior breaks.

## Non-Goals

F4, F6, F11, F13, F14, F15 — see audit doc and harness plan for rationale.

## Verification

`npm test` (847+ tests pass), `dotmd check` clean, manual checks per harness plan §Verification. Ships as 0.36.2 via `npm version patch`.

## Refs

- audit: docs/audit-beyond-platform.md
