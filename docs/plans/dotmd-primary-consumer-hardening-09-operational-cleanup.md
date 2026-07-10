---
type: plan
status: planned
created: 2026-07-10T05:53:02Z
updated: 2026-07-10T05:53:02Z
parent_plan: dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: Audit F14 confirmed stale README/changelog claims and three drained partial plans. Notion, Git metadata, and platform work now have separate children; this plan owns only public documentation consolidation and deck closure.
next_step: Wait for Notion removal and command-schema generated surfaces, then narrow README, backfill changelog entries, and archive the three named drained plans with explicit closeouts.
---

# Documentation And Deck Hygiene

> Runlist child of [Dotmd Primary Consumer Hardening](dotmd-primary-consumer-hardening.md).

## Problem

Public documentation restates command inventories that already drifted, the changelog stops eight releases behind, and quiet partial plans preserve operational text for work their own bodies say shipped or was rejected.

## Phases

### Phase 1 - README Consolidation ⬜

- Narrow README to onboarding/concepts and rely on generated command reference.
- Correct current roadmap/runlist/HUD/context/lifecycle claims.

### Phase 2 - Changelog Continuity ⬜

- Backfill changelog 0.62.0 through current version and guard future version headings.

### Phase 3 - Close The Drained Deck ⬜

- Archive runlist-mutation, plugin-skill-drift, then dotmd-forward with closeouts naming rejected tails.

## Acceptance

- README reflects current runlist/roadmap/HUD/context behavior without an exhaustive hand-maintained catalog.
- CHANGELOG includes each package release through the current version and CI rejects future omissions.
- `dotmd-runlist-mutation`, `dotmd-plugin-skill-drift`, and `dotmd-forward` are archived in that order; unrelated future partial plans do not affect acceptance.
- `dotmd check` remains clean and historical archived plans are untouched.


## Version History

- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
