---
type: plan
status: active
created: 2026-05-24T22:22:49Z
updated: 2026-05-24T22:22:49Z
surfaces: [cli]
modules: [modules, query]
domain: cli-ux
audience: internal
parent_plan:
related_plans:
related_docs: docs/audit-beyond-platform.md
current_state: Spec finalized; awaiting implementation.
next_step: Write `src/modules.mjs` + tests, wire dispatcher.
dotmd_version: 0.32.1
---

# Modules Dashboard (F16)

> Second-pass plan for F16 from `docs/audit-beyond-platform.md`. Audit spec is directionally right (drowning in 222 flat plans, no triage ladder; three additive commands; pure view-only) but optimistic about a few real edges the primitives map surfaces. This plan tightens those before implementation.

## Problem

At Beyond's scale (222 non-archived plans across ~54 modules, 8 roots), `dotmd plans` is a flat wall and `dotmd stats` is global. Nothing composes the existing primitives (`--module`, staleness, status breakdown, has-next-step, age) into the question that actually matters: *which modules are drowning, which are stale, which need triage today?* The user's direct framing in the audit: "The number of plans is drowning me … to be able to go through them systematically and clean up AND to see what is most-likely stale and needs review without having to go into the file tree would be nice."

## Goals

After this ships, the workflow `dotmd modules --sort cleanup` → walk top row → `dotmd module <name>` → triage/archive → next is the systematic cleanup loop the user asked for. No file-tree spelunking, no manual cross-referencing.

## Non-Goals

- No schema change, no migration, no churn. Three pure view-only commands.
- Not extending the dashboard to docs/prompts in v1. Default `--type plan`; `--type doc` works because the index already carries `modules: []` on docs, but the column set may look weird for non-plan types. Second-priority.
- No `taxonomy.modules` config. Modules stay free-form strings discovered from doc frontmatter, same as today.
- No new global filter. `--module` already works per-command (in `query`); `dotmd modules` is the dashboard, not a filter.

## What Exists Today

Already integrated:

- `doc.modules: []` — canonical array set in `src/index.mjs:163-194` (singular `module:` merged into plural).
- `doc.isStale` boolean — set at index time via `computeIsStale` from `src/validate.mjs`.
- `doc.daysSinceUpdate` — set via `computeDaysSinceUpdate` from `src/validate.mjs`.
- `doc.hasNextStep` boolean — extracted in `src/index.mjs:159, 214`.
- `STATUS_COLORS` + `colorTag` — `src/query.mjs:11-28`.
- `config.lifecycle.skipStaleFor` Set — pattern at `bin/dotmd.mjs:978`.
- `dotmd query --group module` — already groups for plans (`src/query.mjs:336`), uses `(none)` for empty (`:383`).

Doesn't exist:

- Cross-module aggregation (the dashboard).
- Per-module deep view with status grouping + inline stale flagging.
- Cleanup-rank sort.

## Surface

Two new verbs + one documentation update:

### `dotmd modules` — dashboard

One row per module discovered in the index. Flags:

- `--sort total|stale|age|nextstep|cleanup` (default: `total` desc). **`cleanup` absorbs the audit's `--cleanup-rank`** — cleaner than a separate flag. Formula: `(stale_count × avg_age_days) / max(total, 1)`.
- `--json` — shape: `{ modules: [{ name, total, byStatus: { ... }, stale, avgAgeDays, oldest: { slug, ageDays }, nextStepPct }], type, sort, _totalUnique }`.
- `--limit N` / `--all` — default 20. F7-style truncation indication ("showing 20 of 54") rendered inline.
- No `--module` filter (the dashboard's whole subject).
- No `--type` at command level; respects the global `--type` strip (default `plan`).

### `dotmd module <name>` — deep view

Plans grouped by status, ordered by `config.statusOrder`, stale flagged inline. Flags:

- `--sort updated|age|status` (default: `status`).
- `--json` — `{ name, total, plans: [{ path, slug, status, daysSinceUpdate, isStale, hasNextStep, summary }] }`.
- Unknown module: error with hint pulled from the dashboard: `Module 'foo' not found. Available: foyer, suite, atlas, identity, … (run \`dotmd modules\` for the full list).`

### `dotmd stale --group module` — no code change

`stale` is a `presets[]` query (`src/config.mjs:102`); `--group` already exists in `query` and forwards through preset expansion. **Action: document this in help text + release notes.** If `--by module` reads better than `--group module`, add `--by` as a sugar alias in `query.mjs` (3 lines + 1 test) — holding as nit, not in core scope.

## Constraints

**M1. Dynamic status columns.** The audit's example output shows columns `Active Planned Blocked Partial Research`. `Research` isn't a default plan status — Beyond has it via custom config. **The table cannot hardcode columns.** Discover from `config.types[type].statuses`, render in `config.statusOrder` order, **show only statuses with at least one non-zero cell across rendered modules**. Auto-handles default vocab (9 plan statuses) and custom vocabs.

**M2. Column overflow strategy.** Default plan vocab = 9 statuses. At terminal width 120: module(15) + 9×6 + stale(6) + avgAge(7) + oldest(15) + nextStep%(10) ≈ 107 chars. Fits. With future custom vocabs >12 statuses, or `--type doc` (separate vocab), may not.

  - **Step 1**: drop empty-column statuses (M1) — usually reduces width 20-40%.
  - **Step 2**: if still > terminal width, collapse to a stacked render (one module per ~3-line block, status counts indented). Detect via `process.stdout.columns`.
  - **Do not** synthesize an "Other" bucket — silently swallowing statuses misleads. Stacked render preserves every value.

**M3. Multi-module accounting.** A plan with `modules: [foyer, suite]` counts +1 in BOTH `foyer` and `suite` rows. Per-module totals therefore sum to more than total plans. **Intended behavior** — users tag multiple modules deliberately to surface in multiple triage views. Document in `--help`; add `_totalUnique: N` to JSON output so callers can detect double-counting. Matches existing `--module` filter semantics (`.some(m => …)`).

**M4. `(none)` bucket.** Always surface as a row when ≥1 plan has empty `modules: []`. Label literally `(none)` to match `query --group module`'s convention (`src/query.mjs:383`). Sort consistently — `(none)` falls naturally by whatever sort is active.

**M5. Status set scoping per type.** `--type plan` is default. If user runs `--type doc`, columns become doc statuses. Same dynamic discovery (M1) handles cleanly; no special-casing.

**M6. Archived + skipStale handling.**

  - Exclude `archived` (and any status with `archive: true` / `quiet: true`) from row totals. Terminal statuses pollute the active-work picture. Count toward `oldest` only if no live docs exist (unlikely useful).
  - `stale_count` uses `config.lifecycle.skipStaleFor` filter — same predicate the global stats use. Statuses like `backlog` (skipStale) contribute 0 to stale even with huge `daysSinceUpdate`.
  - `in-session` always counts and always renders (live work is exactly what the dashboard surfaces).

## Decisions

- **D1.** `cleanup` is a sort mode (`--sort cleanup`), not a separate `--cleanup-rank` flag. One axis of variation, one CLI knob.
- **D2.** Two verbs (`modules` dashboard / `module <name>` detail), not one verb with a positional. Self-documenting wins over compactness; matches audit shape.
- **D3.** Default `--type plan`. Docs/prompts support is a follow-up.
- **D4.** `(none)` label, not `[no module]` or `untagged`. Consistency with `query --group module` matters more than prettiness.
- **D5.** Multi-module double-counting is intentional and surfaced via `_totalUnique` in JSON. No `--unique` flag in v1 — wait for a real ask.
- **D6.** No generic table builder in `render.mjs`. One caller, inline render. If a second caller appears, extract then.

## Open Questions

- **R1. Stacked-fallback render fidelity.** Need to eyeball on a real narrow terminal before sign-off — if noisy, fall back to "top-3 statuses + (others: N)" instead. Decide during implementation, not now.
- **R2. Future `module` subcommand semantics.** Documenting that `module` takes one positional (name) and no subcommands keeps the door open.
- **R3. Cleanup-rank tuning.** Formula `(stale × avg_age) / max(total, 1)` is a starting point. May need adjustment after running on Beyond's real corpus — that's the only true test. Treat as a v1 default, document the formula in `--help`, iterate if telemetry suggests it.

## Phases

### Phase 1 — `src/modules.mjs` + aggregation ⬜

Single pass over `index.docs` filtered by type, building `Map<moduleName, { plans[], byStatus: Map, stale, oldest, nextStepCount }>`. Pure data; no render. ~80 lines.

### Phase 2 — Dashboard render + sort modes ⬜

Render the dashboard table with dynamic columns (M1), overflow fallback (M2), truncation indication. Sort modes: `total | stale | age | nextstep | cleanup`. ~50 lines.

### Phase 3 — `dotmd module <name>` detail view ⬜

Reuses `dotmd query --module <name> --group status` semantics, with inline stale flag + summary preview. ~30 lines.

### Phase 4 — CLI wiring + completions ⬜

- `src/commands.mjs` `KNOWN_COMMANDS` — add `'modules'`, `'module'`.
- `bin/dotmd.mjs` — two dispatcher blocks, two HELP entries (long-form), one line in main HELP.
- `src/completions.mjs` — verify auto-pickup from `KNOWN_COMMANDS`; add explicit entries if needed.
- Help text for `dotmd stale` — add `--group module` example.

### Phase 5 — Tests ⬜

`test/modules.test.mjs`, 8 cases:

1. Dashboard renders one row per discovered module (fixture: 3 modules, 6 plans).
2. `--sort cleanup` orders by formula (fixture: two modules where ratio favors one despite lower stale count).
3. Multi-module accounting: `modules: [foyer, suite]` increments both rows; `_totalUnique` in `--json` reflects dedup.
4. `(none)` bucket surfaces when ≥1 plan has empty `modules:`.
5. Dynamic status columns: custom-status config (mock Beyond's `backlog`/`paused`/`awaiting`) produces columns for those, omitting default-but-unused ones.
6. `dotmd module <name>` groups by status, ordered by `statusOrder`, flags stale inline.
7. `dotmd module unknown-name` errors with "Available: …" hint.
8. JSON shape stability: snapshot `{ modules: [...], type, sort, _totalUnique }`.

### Phase 6 — Release ⬜

Minor bump → **0.33.0**. CHANGELOG entry under `### Added`. Bundle F14 (`shelved` prompt status) if implemented in same session; both additive, neither blocks the other, single "scale triage" release reads cleanly. F15 stays separate (needs spike).

## Deferred

- `--by` alias for `--group` in `query.mjs` (3 lines + 1 test). Nit; only if release notes feel awkward saying `dotmd stale --group module`.
- Module dashboard for docs/prompts. Wait for a real ask.
- `taxonomy.modules` config (declared module list with validation). Wait for a real ask.
- `--unique` flag on dashboard (count each plan once even if multi-module). Wait for a real ask.
- Cleanup-rank formula tuning. Ship v1 default, iterate from corpus feedback.

## Version History

- **2026-05-24T22:22:49Z** Created. Second-pass refinement of audit F16 spec.

## Closeout

<!-- Filled on archive: what shipped, key commits, deferrals dispositioned. -->
