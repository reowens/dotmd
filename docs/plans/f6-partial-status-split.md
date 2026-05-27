---
type: plan
status: in-session
created: 2026-05-27T01:46:07Z
updated: 2026-05-27T01:46:44Z
surfaces: [cli]
modules: [stats, index]
domain: agent-ux
audience: internal
parent_plan:
related_plans:
related_docs:
  - > ../audit-beyond-platform.md
summary: F6 — split `partial` totals in `dotmd stats` by doc type so `plan/partial` (work shipped + tail deferred) and `doc/partial` (incomplete reference material) don't render as one number.
current_state: Plan scaffolded; no code yet.
next_step: Read `buildIndex`'s `countsByStatus` shape, add a typed sibling `countsByType`, and render `Status` block in `_renderStats` grouped by type.
---

# F6 Partial Status Split

> `dotmd stats` reports flat per-status totals (`partial: 84`) that lump semantically distinct plan/partial and doc/partial buckets. Briefing already splits these — `stats` does not. F6 from `docs/audit-beyond-platform.md`.

## Problem

Per-type status taxonomies (`plan` statuses ≠ `doc` statuses) intentionally allow a status name to recur under multiple types with different meanings. `partial` is the canonical example: under `plan` it means "shipped most of the scope, tail deferred to a successor"; under `doc` it means "incomplete reference material". Both legit, both useful — but `dotmd stats` collapses them into one flat dict (`countsByStatus`), so the human render and the JSON output both forfeit the type information. Plan-pipeline health is obscured by doc completeness counts (and vice versa).

`dotmd briefing` already splits correctly (it renders a separate plans line and docs line). The fix is local to `stats` + the underlying `countsByStatus` shape that `stats` consumes.

## Goals

- `dotmd stats` Status block renders one line per type (`Plans`, `Docs`, …) when more than one type exists.
- JSON output gains a typed `countsByType: { plan: {...}, doc: {...}, prompt: {...} }` field.
- Flat `countsByStatus` stays (back-compat for any external consumer); it remains the sum across all types.
- Single-type corpora render identically to today (no needless grouping for repos with only one type).

## Non-Goals

- No change to status taxonomy or validation rules.
- No briefing rewrite — it already splits.
- No deprecation of `countsByStatus` — keep flat for back-compat.

## What Exists Today

- `src/index.mjs:66-75` produces flat `countsByStatus` keyed by status string only.
- `src/stats.mjs:48` passes that through into the stats blob untouched.
- `src/stats.mjs:95-110` renders one combined `Status` line: `in-session: 8  active: 34  …  partial: 84  …`.
- `dotmd briefing` (`src/render.mjs`) already type-splits because it iterates docs filtered by type per line.

## Constraints

- JSON consumers may rely on `countsByStatus` — keep it.
- The plan / doc / prompt type set is config-driven (`config.validTypes`), so the renderer must iterate dynamically, not hardcode type names.
- Single-type corpora shouldn't grow a redundant `Plans:` header.

## Decisions

- **Add** `countsByType` (typed) alongside the existing `countsByStatus` (flat); don't replace. Cheap to compute (one extra loop pass), cheap to back-compat.
- **Render rule:** if exactly one type has docs, render the existing flat Status line. If 2+ types have docs, render one labeled line per type (sorted by `config.validTypes` order with fallback to alpha).
- **Untyped docs** (no `type:` field, edge case for pre-0.30 corpora): bucket into `unknown` and render as `Untyped` in the human view. JSON gets a literal `unknown` key.

## Open Questions

None — design is mechanical.

## Phases

### Phase 1 — index: add `countsByType` ⬜

- `src/index.mjs:66-75`: extend the existing `countsByStatus` block to also produce `countsByType = { [type]: { [status]: count } }`. Same fallback rules for unknown statuses; untyped docs land under `unknown`.
- Expose in the return object: `{ docs, countsByStatus, countsByType, warnings, errors }`.
- Test: `test/index.test.mjs` — seed a multi-type corpus, assert both shapes.

### Phase 2 — stats: render grouped by type ⬜

- `src/stats.mjs:buildStats`: pass `countsByType` through into the stats blob.
- `src/stats.mjs:_renderStats`: replace the single-line Status block with a per-type render when `Object.keys(countsByType).length > 1`. Sort types by `config.validTypes` order (so `plan` comes before `doc` for the built-in vocab). Indent each line under the existing `Status` bold heading.
- JSON renderer: include `countsByType` in the output.
- Test: `test/stats.test.mjs` — assert single-type renders flat, multi-type renders grouped.

### Phase 3 — verification ⬜

- `npm test` — all pass.
- `dotmd stats` on this repo (single-type plans + docs + prompts) — verify grouped render shape.
- `dotmd stats --json | jq .countsByType` — verify typed shape; `jq .countsByStatus` still works.

## Deferred

- Migrating `briefing` to consume `countsByType` directly — it already produces the right output via a different code path; touching it risks regression for no user-visible benefit.

## Version History

- **2026-05-27T01:46:44Z** Picked up (active → in-session).
- **2026-05-27T01:46:07Z** Created.

## Closeout

<!-- Filled on archive: what shipped, key commits, deferrals dispositioned. -->
