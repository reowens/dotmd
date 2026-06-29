---
type: plan
status: in-session
created: 2026-06-29T06:30:29Z
updated: 2026-06-29T21:03:50Z
surfaces:
modules:
domain:
audience: internal
parent_plan: dotmd-forward.md
related_plans:
related_docs:
current_state: A roadmap tier that sits *above* runlists, organized by time/priority horizon (now/next/later) rather than dependency order (runlist) or domain (coordination hub). The idea surfaced because the dotmd-forward hub is itself a hand-built roadmap improvised out of coordination-hub parts — evidence the existing primitive is being stretched. Queued after dotmd-runlist-mutation: composing runlists cleanly needs them to be first-class, mutable structures first.
next_step: Unparked (Track 2 runlist-mutation shipped, so runlists are now mutable). START with Phase 0 — the earn-its-keep decision: thin preset on the coordination hub vs. a new third-tier primitive. Everything downstream depends on that ruling, so don't build until it's made.
---

# Dotmd Roadmap Layer

> A roadmap is a third tier that **composes runlists** — a hub whose children are
> themselves hubs, with **done/total progress rolled up** across them and a
> dashboard + nested view over the whole. Its organizing axis is **domain/module
> composition** (corrected in Phase 0 from the original time-horizon thesis);
> now/next/later horizons are an *optional grouping flavor*, not the core.
>
> The motivating evidence is no longer one improvised hub — it's the consuming
> repo. **`beyond/platform` has 28 coordination-hub runlists, 1,120 plan files
> (281 live / 815 archived), and a hand-built `master-runlist` composing 24 of
> them in prose** — maintaining, by hand, the exact rollup a tier-3 primitive
> would compute. dotmd renders all 28 flat today: `master` shows as one row among
> its own children, with zero progress aggregation anywhere.

## Problem

dotmd's hierarchy is two-tier with two hub flavors:

| tier | concept | organizing axis | progress |
|------|---------|-----------------|----------|
| hub | **runlist** (`runlist:` array) | dependency *sequence* (extract → rewrite → cleanup) | `done/total` rollup ✅ |
| hub | **coordination hub** (`execution_mode: coordination`) | *domain/area*, often unordered | **none** ✗ |
| leaf | **plan** | a unit of work | — |

Two gaps, both proven by the platform's 28-hub `master-runlist`:

1. **No composition.** Nothing models a hub *of hubs*. `master-runlist` points its
   `related_plans:` at 24 other runlists, but dotmd treats it as a peer of its own
   children — flat, one row each.
2. **No rollup across hubs.** Sprint `runlist:` hubs get `done/total`; coordination
   hubs get only a fuzzy "N related". So there is no number anywhere that says how
   much of a domain — or of the whole platform — has shipped.

A roadmap fills both: a tier-3 hub that points at runlists and rolls their
progress up.

```
roadmap     → runlists, with done/total rolled up           ← axis: domain composition
  runlist   → ordered / clustered plans, done/total          ← axis: dependency or domain
    plan    → unit of work
```

(Time horizons — now/next/later/icebox — are a *grouping* a roadmap may optionally
apply over its child runlists; see Phase 5. They are not the organizing axis, since
the real consumer organizes by module/domain.)

## The bar this must clear (do not skip)

dotmd has spent the last year *consolidating* concepts (5 status verbs → `set`),
and it deliberately declines speculative features. A new tier is a real complexity
tax — rollup logic, fold/pin rendering, active-count exclusion all gain a level.
So the gating question is **"what can a roadmap do that a coordination hub
can't?"** If the honest answer is "just framing," this ships as a *preset/template*
on the coordination hub, NOT a new primitive. The only answers that justify a real
tier:

- **Horizon buckets** as the organizing structure (not a flat ranked queue) — the
  one shape neither hub does today.
- **Children can be runlists**, with progress rollup (`auth-revamp 2/3 · billing
  0/4`) — genuine tier-3 composition, not just pointing at leaf plans.
- **A `dotmd roadmap` view** — a dashboard over horizons, the way `dotmd modules`
  is a dashboard over plans.
- **"Icebox/dormant" as a first-class horizon** — model the parked-but-real bucket
  instead of writing it as prose (as `dotmd-forward` had to).

## ~~Caution — premature until there are runlists to compose~~ (CLEARED)

> Original caution: "the repo has **one** runlist; building a layer to compose
> runlists you don't have is textbook premature; gate on (a) runlist-mutation
> shipped + (b) ≥2 runlists that want composing."
>
> **Both gates now met.** (a) Track 2 (runlist mutation) shipped. (b) The
> prematurity test was mis-scoped to *dotmd's own* repo — dotmd is a product, so
> the test is the *consuming* repo. `beyond/platform` has **28** runlists and a
> hand-built tier-3 hub already composing them. Not premature; overdue.

## Phases

<!-- Status markers in heading text: ⬜ not started · 🟡 in progress (pickup
targets this) · ✅ shipped · ⏭ skipped · 🚧 blocked. -->

### Phase 0 — Earn-its-keep ruling ✅ (REVERSED → PRIMITIVE, axis-corrected)

**Original ruling: preset, not primitive.** It rested on one load-bearing claim —
"the only genuine primitive justification (runlist children + rollup) is premature:
repo has 1 runlist." **That claim was scoped to the wrong repo.** dotmd is a
product; the earn-its-keep test is the *consuming* repo, not dotmd's dogfood repo.

**Platform eval (`beyond/platform`, 2026-06-29):**

- **28** coordination-hub runlists; **1,120** plan files (281 live / 815 archived).
- A `master-runlist` (`execution_mode: coordination`) whose `related_plans:` point
  at **24** of those runlists — a tier-3 hub built entirely from tier-2 parts.
- Its `current_state:` frontmatter is a paragraph-long, *hand-maintained* status
  digest of those 24 children — a human computing the rollup by hand.
- `dotmd runlists` renders all 28 **flat**: `master` is one row among its own
  children; **no done/total anywhere** (coordination hubs have no rollup).

So justification #2 (runlist children + rollup) is **real and not premature** — met
~24×. **Ruling reversed: PRIMITIVE.**

**Axis correction (the important nuance).** The platform organizes by
**domain/module**, not time horizon — not one of the 28 hubs is now/next/later. So
the original headline thesis ("roadmap = horizon layer") had the axis *wrong*. The
primitive is **recursive hub composition + done/total rollup + nested dashboard +
cross-runlist next-pickup**, axis-agnostic (domain in practice). Horizon buckets
survive only as an *optional grouping flavor* (Phase 5), not the spine.

**Resolves the two real Open Questions:** roadmap does **not** replace the
coordination hub (Open Q #2) — it sits *above* it; and horizon is a body-section
flavor, not a frontmatter taxonomy (Open Q #1).

**User's build-scope call: C — full primitive (axis-corrected).** (A defer / B
horizon preset both rejected: A because the platform is real demand, B because it
builds the wrong axis.)

---

## Design (the axis-corrected primitive)

**The model.** A *roadmap* is a coordination hub one level up: `execution_mode:
roadmap`. Its children (via `related_plans:`, or `runlist:` for an ordered
roadmap) are themselves **hubs** (sprint runlists or coordination hubs), not leaf
plans. Detection mirrors `isCoordinationHub`: explicit `execution_mode: roadmap`,
with a structural fallback (a coordination hub whose children are themselves hubs)
surfaced as a `dotmd check` nudge rather than auto-promoted.

**Rollup is the spine.** Two levels:

1. *Per coordination hub:* give `buildCoordinationIndex` a `done/total` (count
   archived vs. resolved children) — today it only has `childCount`. This is the
   biggest single win and it's independently shippable (Phase 1).
2. *Per roadmap:* aggregate the children's rollups — `master 280/520 · billing 4/9
   · identity 8/27 · …` plus a grand total. Recursive: a roadmap child that is
   itself a runlist contributes its own `done/total`.

**Reuse, don't reinvent.** `buildRunlistIndex` already computes
`total/doneCount/parkedCount/nextChildPath` for sprint hubs; `buildCoordinationIndex`
already resolves children + body-order `nextPickup`. Phase 1 brings coordination
hubs up to parity (rollup), then `buildRoadmapIndex` composes both.

### Phase 1 — Rollup for coordination hubs ⬜  *(independently shippable)*

Extend `buildCoordinationIndex` (`src/runlist.mjs`) so each hub carries
`total / doneCount / parkedCount` over its resolved `related_plans` children
(reusing the archive/parked logic from `buildRunlistIndex`). Surface `done/total`
in `dotmd runlists`, the `dotmd plans` Runlists section, and `dotmd health`'s
Runlists tally — replacing/augmenting the fuzzy "N related". On the platform this
alone turns 28 opaque hubs into 28 progress bars. Tests + docs.

### Phase 2 — The roadmap tier: detector + `buildRoadmapIndex` + scaffold ⬜

- `isRoadmapHub(doc)` — `execution_mode: roadmap` (+ structural fallback for the
  check nudge). `buildRoadmapIndex(index, config)` — roadmap → child hubs, each
  resolved through `buildRunlistIndex`/`buildCoordinationIndex`, with recursive
  rollup + a grand total.
- Reclassify roadmap hubs **out** of the active-plan and runlist counts in
  `dotmd plans` / `briefing` / `health` (a new tier above the existing Runlists
  reclassification), so they don't double-count their own children.
- `dotmd new plan <hub> --roadmap` scaffolds a roadmap hub (mutually exclusive
  with `--runlist`/`--coordination`/`--lite`/`--audit`). HELP + `check` nudge.

### Phase 3 — `dotmd roadmap` / `roadmaps` views + nesting ⬜

- `dotmd roadmap [<hub>]` — render one roadmap: child runlists with `done/total`,
  each child's own next-pickup `→`, and the grand total. `--json`.
- `dotmd roadmaps` — dashboard over all roadmap hubs (mirrors `dotmd runlists`).
- `dotmd plans` nests child runlists under their roadmap hub (one more fold level).

### Phase 4 — `dotmd roadmap next` — cross-runlist next-pickup ⬜

Walk the roadmap's child hubs in order; resolve each one's next-pickup (existing
sprint/coordination resolvers); pick up the first startable plan across the whole
roadmap. The "what do I do next across the entire platform?" verb. If every child
hub is parked/done, emit a roadmap-aware error listing each hub + its blocker.

### Phase 5 — Horizon grouping (optional flavor) + closeout ⬜

If a roadmap body has `## Now / ## Next / ## Later / ## Icebox` sections that
bucket its child runlists, group the `dotmd roadmap` view by those (else group by
order/domain). Strictly additive over Phases 1–4. Final: CLAUDE.md ⇄ SKILL.md
lockstep block update (the canonical workflow gains the tier-3 verbs), full test
pass, dogfood `dotmd-forward` (migrate it to `execution_mode: roadmap`).

## Open Questions

- ~~**Horizon as body sections vs. a `horizon:` frontmatter field?**~~ **Resolved:**
  body sections (Phase 5), prose-first like coordination hubs. No new taxonomy —
  and horizon is optional flavor anyway, so a queryable field isn't worth the tax.
- ~~**Does "roadmap" risk confusion with "coordination hub"? Does it replace it?**~~
  **Resolved:** roadmap sits *above* the coordination hub, it does not replace it.
  The platform proves both tiers are needed (24 coordination hubs + 1 hub over
  them). Detection is explicit (`execution_mode: roadmap`), so no ambiguity.
- **Time-dated milestones** (Q3, dates) vs. relative horizons (now/next/later)?
  Deferred — horizons are optional flavor (Phase 5). Relative stays the default
  (lower-maintenance, matches the solo-dev + Claude audience).
- **NEW — structural auto-detect vs. explicit only?** Phase 2 ships explicit
  `execution_mode: roadmap` + a `check` *nudge* for hub-of-hubs. Open whether to
  ever auto-promote; leaning no (explicit beats magic for a primitive).

## Version History

- **2026-06-29T21:03:50Z** Status: awaiting → in-session — Platform eval flips Phase 0: the prematurity finding was scoped to dotmd's own repo (1 runlist), but the consuming repo (beyond/platform) has 28 coordination-hub runlists + 1120 plans + a hand-built master-runlist hub composing 24 of them in prose — tier-3 composition + rollup is justified, not premature. User chose FULL PRIMITIVE (axis-corrected): build around DOMAIN composition + done/total rollup + nested dashboard + cross-runlist next-pickup; horizon buckets demoted to optional flavor (the platform organizes by module, not now/next/later).
- **2026-06-29T12:42:13Z** Status: in-session → awaiting — Phase 0 ruled preset-not-primitive on technical merits; awaiting the user's build-scope call (A defer / B minimal preset / C full primitive — all written into the Phase 0 section).
- **2026-06-29T11:37:11Z** Started (active → in-session).
- **2026-06-29T10:16:19Z** Status: queued-after → active — Predecessor Track 2 (runlist mutation) shipped — runlists are now mutable, so the queued-after gate is satisfied. Ready to pick up; first step is still the Phase 0 earn-its-keep ruling (preset vs. primitive).
- **2026-06-29T06:31:13Z** Status: active → queued-after — Sequenced behind dotmd-runlist-mutation — composing runlists needs them first-class + mutable first.
- **2026-06-29T06:30:29Z** Created as a Track 2 successor (queued-after runlist-mutation).
