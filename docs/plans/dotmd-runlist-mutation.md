---
type: plan
status: partial
created: 2026-06-29T05:42:30Z
updated: 2026-06-29T08:47:49Z
surfaces:
modules:
domain:
audience: internal
parent_plan: dotmd-forward.md
related_plans:
related_docs:
current_state: Roadmap Track 2 — the live feature frontier. Runlists/coordination has been the dominant recent investment (0.39→0.64) but the structure is read/walk-only — adding or reordering children means hand-editing the `runlist:` array, which directly contradicts dotmd's own "never hand-edit frontmatter" ethos. This track makes runlists a first-class managed structure. Several sub-items were flagged across three prior closeouts.
next_step: Phase 1 — `runlist add <hub> <child...>`. Append to the hub's `runlist:`/ranked-queue, set each child's `parent_plan` back-ref, and scaffold a stub if the child doesn't exist yet.
---

# Dotmd Runlist Mutation

> Runlists can be read, folded, walked (`runlist next`), and dashboarded — but
> never **mutated** through the CLI. Adding or reordering a child means
> hand-editing the `runlist:` YAML array, the exact move dotmd tells agents never
> to make. This track closes that self-inflicted contradiction.

## Problem

The runlist/coordination surface is rich on consumption (folding in `dotmd plans`,
the `runlists` dashboard, body-parsed `## Ranked queue` order, `runlist next`
pickup) but has **zero mutation verbs**. So the one structure dotmd most wants
managed is the one you must hand-edit. Both the feature-surface and trajectory
audits flagged this as the #1 asymmetry, and three separate archived closeouts
parked the "point a hub at an existing plan" sub-item as the most-wanted carryover.

## Phases

<!-- Status markers in heading text: ⬜ not started · 🟡 in progress (pickup
targets this) · ✅ shipped · ⏭ skipped · 🚧 blocked. -->

### Phase 1 — `runlist add <hub> <child...>` ✅

Shipped. `runlist add` appends children to the hub's `runlist:` array, sets each
child's `parent_plan:` back-ref, and scaffolds a `planned` stub `<hub>-NN-<slug>.md`
for any bare-slug child that doesn't exist (mirrors `new plan --runlist`). A plain
plan with no `runlist:` becomes a hub. `--dry-run` / `--json`. Coordination
(body-order) hubs are guarded with an actionable message — their `## Ranked queue`
order stays hand-authored (prose-first by design); not folded into `add`.

### Phase 2 — `runlist remove` / `runlist reorder` ✅

Shipped. `remove <hub> <child...>` drops from the array (`--clear-parent` blanks
the removed child's back-ref). `reorder <hub> <child> --before|--after <other>`
moves one child; `reorder <hub> <c1> <c2>…` sets a full new order (permutation).
Both — and `add` — keep any body `## Order of operations` link list in sync,
preserving per-item ⬜/✅ markers (regenerated from the authoritative array via
`syncOrderList`). Children match by full path or short slug (`cleanup` →
`<hub>-03-cleanup.md`, unique-or-bust).

### Phase 3 — Point a hub at an *existing* plan (hub-relative refs) ✅

Folded into Phase 1's `add` path. A child token that resolves to an existing plan
(hub-relative via `resolveRefPath`, then by slug/basename via `resolveDocArg`) is
wired in by a hub-relative ref and gets its `parent_plan:` set back at the hub
(without clobbering a parent_plan that points elsewhere — warns instead). The
thrice-parked carryover is closed.

### Phase 4 — Item D: pin Runlists under `--status` filter ✅ (ruled)

**Ruling: respect the filter — don't always-pin.** Always-pinning would make the
leaf header count ("1 plans") disagree with a Runlists section shown below it and
would violate the literal contract of an explicit `--status`. So the Runlists
section still shows a coordination hub only when the hub's *own* status matches.
The actual complaint ("the section just vanishes") is solved instead with a dim
discoverability footer — `N runlists hidden by filter · dotmd runlists` — emitted
when a narrowing filter hides live hubs. Filter respected, nav map never lost.

### Phase 5 — Hub status auto-rollup (stretch) ⏭ deferred

Not built. After Phases 1–4, manual hub-status upkeep isn't visibly annoying — and
`runlist`/`runlists` already nudge "All children archived. Hub is ready for
archive." Silently archiving a hub from its children is surprising automation;
keep the explicit nudge. Revisit only if the manual step proves a real friction.

## Version History

- **2026-06-29T08:47:49Z** Status: in-session → partial — Phases 1-4 shipped (add/remove/reorder + body order-list sync, existing-plan refs, Runlists --status discoverability footer, fold-in-runlist-order, runlists held out of headline plan counts). Phase 5 (hub status auto-rollup) deferred as premature automation — revisit only if manual hub-status upkeep proves a real friction.
- **2026-06-29** Follow-up from review: hold runlists OUT of the headline plan count everywhere. `dotmd plans` and `dotmd briefing` now count leaf plans only and show runlists as a separate sibling/pointer (was: hubs summed into "N plans"), matching `dotmd health`'s held-out model. Touched `src/render.mjs` + `src/query.mjs`; updated the 2 affected count assertions.
- **2026-06-29** Shipped Phases 1–4 (Phase 3 folded into `add`; Phase 5 deferred). New `runlist add|remove|reorder` verbs in `src/runlist.mjs` with body `## Order of operations` sync; `--status` Runlists discoverability footer in `src/query.mjs`; fold renders children in runlist order; help + CLAUDE.md + SKILL.md synced; +25 tests (test suite 1230 → 1255).
- **2026-06-29T07:13:35Z** Started (planned → in-session).
- **2026-06-29T05:44:34Z** Status: active → planned.
- **2026-06-29T05:42:30Z** Created as roadmap Track 2.
