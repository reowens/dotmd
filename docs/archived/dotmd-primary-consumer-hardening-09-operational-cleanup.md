---
type: plan
status: archived
created: 2026-07-10T05:53:02Z
updated: 2026-07-14T00:10:40Z
parent_plan: dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> dotmd-primary-consumer-audit.md"
current_state: All dependencies are complete. This plan now owns immediate public documentation consolidation and closure of the three drained partial/roadmap entries; there is no remaining wait condition.
next_step: Narrow README, backfill changelog entries, add changelog-version enforcement, then archive Runlist Mutation, Plugin / Skill Drift, and Dotmd Forward with explicit closeouts.
---

# Documentation And Deck Hygiene

> Runlist child of [Dotmd Primary Consumer Hardening](dotmd-primary-consumer-hardening.md).

## Problem

Public documentation restates command inventories that already drifted, the changelog stops eight releases behind, and quiet partial plans preserve operational text for work their own bodies say shipped or was rejected.

## Phases

### Phase 1 - README Consolidation ✅

- Narrow README to onboarding/concepts and rely on generated command reference.
- Correct current roadmap/runlist/HUD/context/lifecycle claims.

### Phase 2 - Changelog Continuity ✅

- Backfill changelog 0.62.0 through current version and guard future version headings.

### Phase 3 - Close The Drained Deck ✅

- Archive runlist-mutation, plugin-skill-drift, then dotmd-forward with closeouts naming rejected tails.
- Treat their explicit defer/reject rulings as final decisions, not reasons to leave plans partial.
- Archive this plan after documentation verification and those three closeouts.

## Acceptance

- README reflects current runlist/roadmap/HUD/context behavior without an exhaustive hand-maintained catalog.
- CHANGELOG includes each package release through the current version and CI rejects future omissions.
- `dotmd-runlist-mutation`, `dotmd-plugin-skill-drift`, and `dotmd-forward` are archived in that order; unrelated future partial plans do not affect acceptance.
- `dotmd check` remains clean and historical archived plans are untouched.
- No release is scheduled, required, or performed by this plan.

## Closeout

- Outcomes: README is now a concise onboarding and concepts guide that delegates complete syntax to generated CLI help and accurately describes briefing, lifecycle, runlist mutation, parked-child selection, coordination runlists, and roadmaps.
- Changelog: every package release from 0.62.0 through 0.69.0 is documented, and `test/changelog.test.mjs` enforces both continuity and a heading matching the current package version.
- Deck closure: Runlist Mutation, Plugin / Skill Drift, and Dotmd Forward were archived in order with their rejected tails recorded as final decisions.
- Verification: focused changelog and removed-surface tests pass; `dotmd check --verbose` reports zero errors and zero warnings.


## Version History

- **2026-07-14T00:10:40Z** Archived — Consolidated README, restored changelog continuity with enforcement, and archived the drained roadmap deck.
- **2026-07-14T00:07:05Z** Started (planned → in-session).
- **2026-07-14T00:05:55Z** Status: in-session → planned — Execution consolidated into the final-closeout coordination runlist.
- **2026-07-13T23:47:36Z** Started (planned → in-session).
- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
