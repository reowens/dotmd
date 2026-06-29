---
type: plan
status: queued-after
created: 2026-06-29T06:30:29Z
updated: 2026-06-29T06:31:13Z
surfaces:
modules:
domain:
audience: internal
parent_plan: dotmd-forward.md
related_plans:
related_docs:
current_state: A roadmap tier that sits *above* runlists, organized by time/priority horizon (now/next/later) rather than dependency order (runlist) or domain (coordination hub). The idea surfaced because the dotmd-forward hub is itself a hand-built roadmap improvised out of coordination-hub parts — evidence the existing primitive is being stretched. Queued after dotmd-runlist-mutation: composing runlists cleanly needs them to be first-class, mutable structures first.
next_step: Don't build yet — this is queued-after the runlist-mutation work. When picked up, START with Phase 0 (the earn-its-keep decision: thin preset on the coordination hub vs. a new third-tier primitive), because everything downstream depends on that ruling.
---

# Dotmd Roadmap Layer

> A roadmap is a third tier above runlists, organized by **time/priority horizon**.
> It composes runlists *and* loose plans into now/next/later buckets — an axis
> neither existing hub flavor owns. The motivating evidence: `dotmd-forward` is a
> roadmap that had to be improvised out of coordination-hub primitives (a
> recommended-not-gated order, a hand-written "Deliberately dormant" bucket,
> one-way refs to preserve child back-links).

## Problem

dotmd's hierarchy is two-tier with two hub flavors, each owning a distinct axis:

| tier | concept | organizing axis |
|------|---------|-----------------|
| hub | **runlist** (`runlist:` array) | dependency *sequence* (extract → rewrite → cleanup) |
| hub | **coordination hub** (`execution_mode: coordination`) | *domain/area*, often unordered |
| leaf | **plan** | a unit of work |

There is no concept whose axis is **time/priority horizon**. When you want to say
"this quarter: now / next / later," you reach for a coordination hub and bend it —
exactly what happened with `dotmd-forward`. A roadmap fills that gap:

```
roadmap     → horizon buckets (now / next / later / icebox)   ← axis: time/priority
  runlist   → ordered plans                                    ← axis: dependency
    plan    → unit of work
```

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

## Caution — premature until there are runlists to compose

The repo currently has **one** runlist. Building a layer to compose runlists you
don't have is textbook premature. This plan reserves the *shape* and the decision;
it should only be picked up once (a) the runlist-mutation work has made runlists
first-class and mutable, and (b) there are ≥2 runlists that actually want
composing. Until both hold, leave it `queued-after`.

## Phases

<!-- Status markers in heading text: ⬜ not started · 🟡 in progress (pickup
targets this) · ✅ shipped · ⏭ skipped · 🚧 blocked. -->

### Phase 0 — Earn-its-keep ruling: preset vs. primitive ⬜

Decide, against the bar above, whether a roadmap is a thin `roadmap` preset of the
coordination hub (horizon buckets + a view, no new tier semantics) or a real
third-tier primitive (children-can-be-runlists + rollup). **Recommendation going
in: start as the preset.** Everything below is contingent on this ruling.

### Phase 1 — Horizon buckets + `dotmd new plan <hub> --roadmap` ⬜

Introduce horizon as the organizing axis: a `## Now / ## Next / ## Later /
## Icebox` body structure (or a `horizon:` field per child). Scaffold a roadmap
hub. Reuse the coordination-hub plumbing (pinned, held out of active count).

### Phase 2 — `dotmd roadmap` dashboard view ⬜

Render a roadmap by horizon with per-bucket contents and (if Phase 0 went
"primitive") runlist progress rollup. Mirror `dotmd modules` / `dotmd runlists`.

### Phase 3 — (primitive path only) runlist children + rollup ⬜

Let a roadmap point at runlists, not just plans, and roll their done/total up into
the horizon view. Only build if Phase 0 ruled "primitive" and ≥2 runlists exist.

## Open questions

- **Horizon as body sections vs. a `horizon:` frontmatter field on children?**
  Sections keep it prose-first (coordination-hub-like); a field makes it queryable
  (`dotmd query --horizon now`) but adds taxonomy.
- **Does "roadmap" risk confusion with "coordination hub"?** Three hub-ish concepts
  is a lot. Part of Phase 0 is deciding whether roadmap *replaces/absorbs* the
  coordination hub rather than adding alongside it.
- **Time-dated milestones** (Q3, dates) vs. relative horizons (now/next/later)?
  Relative is lower-maintenance and matches the solo-dev + Claude audience.

## Version History

- **2026-06-29T06:31:13Z** Status: active → queued-after — Sequenced behind dotmd-runlist-mutation — composing runlists needs them first-class + mutable first.
- **2026-06-29T06:30:29Z** Created as a Track 2 successor (queued-after runlist-mutation).
