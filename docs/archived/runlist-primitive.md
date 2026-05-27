---
type: plan
status: archived
created: 2026-05-27T02:05:00Z
updated: 2026-05-27T02:28:31Z
surfaces:
modules:
domain:
audience: internal
parent_plan:
related_plans:
related_docs:
current_state:
next_step:
---

# Runlist Primitive

**F19 — runlist primitive.** Audit ref: `docs/audit-beyond-platform.md:316-328`. User-requested 2026-05-26 mid-session: "support for runlists that group plans like in platform". Bump target: **0.39.7** (additive field + new command family, no schema migration).

## Goal

Give agents a first-class way to group multiple plans into an ordered execution sequence. Today the only options are bilateral `queued-after` chaining (per-pair, fragile), prose inside a hub plan (un-machine-readable), or eyeballing `dotmd plans --status active` (loses order). One hub plan should be able to declare "these N plans run in this order" and a `runlist next` command should walk them.

## Design (decisions locked)

1. **Doc type:** `type: plan` with a new `runlist:` array field on the hub plan. No new doc type. Reuses the existing plan vocabulary; the hub itself has a normal plan status (active while items running, partial/archived when done).
2. **Commands:**
   - `dotmd runlist <hub>` — shows the hub's children with their statuses, in order.
   - `dotmd runlist next <hub>` — picks up (`dotmd pickup`) the first non-archived child. Stops/errors if the first non-archived child is in a non-pickup-able status (in-session by someone else, awaiting, etc.) so the caller resolves it.
3. **Partial / awaiting / paused handling:** no special pause logic. `runlist next` skips `archived` and stops at the first non-archived item. A stuck child naturally blocks progression — caller resolves before continuing. Simple > clever.
4. **Relationship to `parent_plan`:** composes, doesn't replace. Hub's `runlist:` entries SHOULD have `parent_plan:` pointing back at the hub; validator emits a P2 warning if not. Order comes from `runlist:`; `parent_plan` keeps existing reverse-link semantics (so existing tools like `pickup-card`'s related-summary still work).

## Open questions to settle DURING implementation, not now

- **Path resolution for `runlist:` entries.** Reuse `resolveRefPath` (same as `related_plans` / `parent_plan`) — relative to docDir with repo-root fallback. Validator should treat them like other ref fields (typo detection, dangling-ref warnings).
- **JSON shape for `dotmd runlist <hub> --json`.** Match the shape of `dotmd plans --json` rows so consumers can pipe through existing tooling.
- **Hub status auto-roll-up?** Probably NOT in v1 — keep the hub's status manually managed. Premature automation. Revisit if it becomes a pain point.
- **`runlist next` when no hub argument given.** Maybe surface "you're inside hub X" if cwd doc has `runlist:`, or scan for hubs that include current plan. Stretch — ship without it first.

## Scope (estimated ~150-200 lines + tests)

**Core (must-ship for 0.39.7):**
- `src/runlist.mjs` — new module. Exports `runRunlist(args, options)` dispatching `<hub>` (show) vs `next <hub>` (pickup).
- `bin/dotmd.mjs` — register `runlist` command + HELP entry + completions if needed.
- `src/validate.mjs` — add `runlist:` to the ref-fields list so dangling-ref + typo detection apply. Add the back-pointer warning (item lacks `parent_plan:` pointing at hub).
- `src/frontmatter.mjs` / index — ensure `runlist:` parses as array of refs (might already work via the generic array path; verify).

**Tests:**
- `test/runlist.test.mjs` — show, next-when-empty, next-when-archived-only, next-skip-archived, next-stops-on-awaiting, parent_plan back-pointer warning, dangling-ref warning, JSON shape.

**Docs:**
- `CLAUDE.md` — add a "Grouping plans into runlists" section under the plan workflow block.
- `bin/dotmd.mjs` HELP — `dotmd help runlist` entry.

**Out of scope for v1:**
- Auto-creating `parent_plan` back-links (validator warns only — manual fix).
- Hub status auto-roll-up.
- Reordering / insert-mid-runlist commands (just edit the YAML).
- `dotmd runlist add <hub> <plan>` / `dotmd runlist remove` (defer until pain shows up).

## Key files to read before starting

- `src/query.mjs` — existing plan listing + status coloring (model for `runlist <hub>` render).
- `src/pickup-card.mjs:114` — how `parent_plan` is already wired into related-summary.
- `src/validate.mjs:290` — existing ref-field type-aware validation.
- `src/init.mjs:67` — `unidirectional: ['parent_plan']` config — `runlist:` should probably join this list (or be its own variant since it's an array, not a single ref).
- `src/config.mjs` — default config block (no schema change needed, but verify).

## Verification plan

- `npm test` clean.
- Build a fixture in `/tmp/dotmd-runlist-fixture/` with one hub + three children (one archived, two active), run `dotmd runlist hub` and `dotmd runlist next hub`; confirm correct selection.
- Run on Beyond's plan tree: pick one existing parent_plan cluster, add `runlist:`, confirm `runlist next` matches what a human would pick.

## Gotchas

- Don't conflate `runlist:` with `related_plans:` — runlist is ordered + execution-intent; related is unordered + "see also". Validator should not collapse warnings between them.
- `runlist next` should respect lease state — if the first non-archived child is `in-session` and the lease is alive + owned by someone else, the underlying `pickup` will refuse. Surface that clearly rather than swallowing it.
- The hub plan itself counts in `dotmd plans` and `stats` — it's just a regular plan. No special exclusion logic.

## Closeout

Shipped 2026-05-26. F19 is functionally complete in working tree (not yet released).

**What landed:**
- `src/runlist.mjs` — `runRunlist(argv, config, opts)` with two subcommands. `show` reads the hub's `runlist:` array, resolves each ref via `resolveRefPath`, looks up each child's status, and renders an ordered list with `→` marking the first non-archived child. `next` pre-checks the target's status (clean runlist-aware error if non-pickup-able) then delegates to `runPickup` for identical lease/VH/card behavior. `--json` shape on `show` covers the child list.
- `bin/dotmd.mjs` — dispatcher entry, `HELP.runlist` with full usage + example YAML, listed in `_main` under Lifecycle.
- `src/config.mjs:91-93` + `src/init.mjs:67` — `'runlist'` added to default `referenceFields.unidirectional`. Free dividend: existence-check + "Did you mean…?" enrichment in `validateDoc` (loop at `src/validate.mjs:228`) now applies to runlist entries automatically.
- `src/validate.mjs` — new exported `checkRunlistBackPointers(docs, config)` post-pass. Warns on each child that's listed in some hub's `runlist:` but doesn't have `parent_plan:` pointing back. Skips terminal/skipWarnings statuses on either side. Wired into `src/index.mjs:96-102`.
- `test/runlist.test.mjs` — 10 tests, all passing. Covers show (4 cases including dangling refs and `--json`), next (3 cases: skip-archived, runlist-aware error on awaiting, all-archived), back-pointer warning (positive + negative), dangling-ref error.
- `CLAUDE.md` — new "Grouping plans into runlists" section under Resume prompts.

**Open questions resolved during implementation (matches plan):**
- Path resolution uses `resolveRefPath` (doc-relative → repo-root fallback), same as `parent_plan`/`related_plans`.
- JSON shape is `{ hub, children: [{ ref, path, status, title, parentPlan, missing }] }`. Different from `dotmd plans` row shape — children carry their hub-reference context, which `plans` rows don't have. Compatible with `jq` filters.
- Hub status NOT auto-rolled up (deferred — premature automation).
- `runlist next` without an argument errors with usage — no "auto-detect hub from cwd" smarts.

**Bump target:** 0.39.7 (additive — new field on `unidirectional`, new command, no schema migration, no behavior change for projects without `runlist:`). Manual fixture verified end-to-end on `/tmp/dotmd-runlist-manual-*`.
