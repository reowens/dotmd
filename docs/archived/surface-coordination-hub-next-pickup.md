---
type: plan
status: archived
created: 2026-06-28T21:43:56Z
updated: 2026-06-28T22:09:35Z
surfaces:
modules:
domain:
audience: internal
parent_plan:
related_plans:
related_docs:
current_state: "Scoped (not started). Coordination hubs encode next-pickup in prose (## Ranked queue tables — 13/27 platform hubs), invisible to the runlist views; only sprint runlist: hubs render a next → marker. Follow-up to the runlist-coordination-hubs branch."
next_step: "Confirm approach, then extend detectBodyRunlistRefs in src/runlist.mjs to parse ## Ranked queue tables and surface next → <child> in renderCoordinationSection + the health Runlists section."
---

# Surface coordination-hub body order (next-pickup) in runlist views

## Problem

Coordination hubs (`execution_mode: coordination` / `*-runlist`) encode their
*ordering and next pickup* in prose — most often a `## Ranked queue` table
(`| Rank | Plan | Status | Next step | … |`), sometimes a `## Order of operations`
link list. The runlist **views** don't read it:

- `dotmd runlists`, the `Runlists` section in `dotmd plans`, and the `Runlists`
  tally in `dotmd health` show only a one-line descriptor + the `related_plans`
  cluster size. None surface *which child to pick up next*.
- `dotmd runlist <hub>` (singular) already parses body links, but only under
  `## Order of operations` / a frontmatter `runlist:` array — **not** the
  `## Ranked queue` table format the hubs actually use.

So a coordination hub reads as "a domain map, N related" but never as "next →
founder-brand-conflicts (active)", the way a *sprint* runlist hub does. The
authoritative next-pickup lives in the body and is invisible to tooling.

### Evidence

On the platform repo (2026-06): **13 of 27** coordination hubs carry a
`## Ranked queue` / order section; the next pickup is buried in that prose. The
canonical example is `founder-runlist.md` — a `| Rank | Plan | Status | Next
step | Cost |` table whose first non-archived row is the real head.

## Goal

Extract a coordination hub's **next pickup** (first non-archived ranked child,
resolved to its live status) from the body, and surface it in the runlist views
— mirroring how sprint `runlist:` hubs already render `next → 01-extract` with a
`→` marker.

## Approach (sketch — confirm before building)

1. Extend `detectBodyRunlistRefs` (or a sibling parser) in `src/runlist.mjs` to
   recognize `## Ranked queue` markdown tables: pull the linked plan from each
   row in rank order, skip rows already archived, resolve live status via the
   index (reuse the `resolveRunlistRefs` / basename-fallback machinery).
2. Add an optional `next → <child> (<status>)` cell to coordination-hub rows in
   `renderCoordinationSection` (and the `health` Runlists section) when a body
   order resolves; leave the row unchanged when it doesn't (graceful, like the
   blank "N related").
3. Optionally teach `dotmd runlist <hub>` (singular) to read the `## Ranked
   queue` shape too, so `runlist next <hub>` works on coordination hubs, not
   just sprint hubs.

## Open questions

- Table shape varies (Rank/Plan/Status/Next step/Cost in founder-runlist; others
  differ). Require a canonical column set, or heuristically find the first
  `*.md` link per row? How much parsing robustness is worth it?
- Where the body order and `related_plans:` disagree, which wins for the
  next-pickup? (Body order is authoritative for sequence; `related_plans` is a
  cluster, not a sequence.)
- Should the dashboard show only the next pickup, or the full ranked list behind
  a flag (`dotmd runlists --next` / a per-hub expand)?

## Non-goals

- Not changing coordination-hub classification or the `*-runlist` nudge.
- Not forcing authors to migrate prose order into a frontmatter `runlist:` array
  (that's the sprint shape; coordination hubs are deliberately prose-first).

## Context / lineage

Builds on the runlist-aware view work on branch `runlist-coordination-hubs`:
`be4156a` (coordination hubs in `dotmd plans`), `2479d94` (briefing + health
awareness), `4df5f65` (`runlists --sort`, shared `hubLabel`, vocab-derived
health pipeline). The body-link parsing precedent is `detectBodyRunlistRefs` /
`resolveRunlistRefs` in `src/runlist.mjs`; the sprint next-pickup `→` rendering
to mirror is `renderHubBlock` / `renderRunlist`.

## Closeout — SHIPPED 2026-06-28

**What shipped.** `detectBodyRunlistRefs` (`src/runlist.mjs`) now parses
`## Ranked queue` tables (first `.md` link per row, in rank order) in addition
to the existing `## Order of operations` link lists. `buildCoordinationIndex`
resolves a `nextPickup` per hub — the first non-archived ranked child, resolved
to its **live** status from the index (not the prose Status column) — and stores
`{ path, status, label }` (label = child slug with the hub's leading module
segment stripped, e.g. `founder-runlist` → `brand-conflicts`). Surfaced as a
green `next → <child> (<status>)` cell in `renderCoordinationSection`
(`dotmd runlists` + the `dotmd plans` Runlists section) and the `dotmd health`
Runlists section; added to both `--json` payloads (`runlists[].nextPickup`,
`health.runlists.hubs[].nextPickup`). Because the parser is shared, the singular
`dotmd runlist <hub>` / `runlist next <hub>` now also walk a coordination hub's
ranked-queue table — picking up the first non-archived child like a sprint hub.

**Key decision — explicit links only (open question #1 resolved).** The repo
data inverted the plan's assumption: only **1/27** platform hubs use a
`## Ranked queue` table; **18/27** use `## Order of operations`, and most of
*those* encode order as backtick-slug numbered lists that are **history
narratives**, not forward queues (items struck through "✅ SHIPPED + ARCHIVED",
numbering that restarts mid-section, non-plan entries like "Track F (research)").
The technically-first-non-archived item in such a list is frequently a deferred
long-tail, *not* the curated head — so guessing at backtick prose would surface
**wrong** next-pickups, worse than none. Resolution: parse only deliberate,
machine-followable **markdown-link** order; leave prose-narrative order
unparsed (no arrow, exactly like a blank "N related"). On platform this
resolves a `next →` for the 4 hubs that encode order as links (founder, billing,
foyer, master); the other 23 correctly show none.

**Open questions #2/#3.** (#2) Body order wins for the next-pickup sequence;
`related_plans` stays the cluster-size hint — no conflict, they're orthogonal.
(#3) Shipped the single `next →` cell, not a `--next`/expand of the full ranked
list — the one head is the actionable signal; the full walk already lives in
`dotmd runlist <hub>`.

**Tests.** `test/runlist.test.mjs` — new `coordination-hub next-pickup (body
ranked queue)` block (5 cases: index resolution, null when no order, `runlists`
text + `--json`, `health` text + `--json`, singular `runlist`). Full suite green
(1147). Docs synced: CLAUDE.md coordination section, `runlist`/`runlists` help.

**Not done (deferred, low value).** Backtick-slug / narrative-prose order
parsing — declined per the decision above. Item D (pin-under-status-filter) and
the "N related" fallback heuristic remain parked on the parent line.

## Version History

- **2026-06-28T22:09:35Z** Archived — Shipped: coordination-hub next-pickup from body ## Ranked queue / ## Order of operations markdown links (next → child in runlists + health + plans, --json, singular runlist). Explicit-link-only by design — backtick/narrative prose order deliberately not guessed (would surface wrong heads). 5 new tests, suite green (1147).
