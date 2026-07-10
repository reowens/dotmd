---
type: plan
status: planned
created: 2026-07-10T05:53:02Z
updated: 2026-07-10T05:53:02Z
parent_plan: dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: Audit F1/F2 confirmed divergent pickup gates and cross-session baton mutation when journaling is disabled. This child depends on containment and atomic/exclusive writes and makes ownership independent of observability.
next_step: Define authoritative session identity and a pure pickup classifier before choosing the durable `.dotmd/` ownership record shape.
---

# Lifecycle Ownership

> Runlist child of [Dotmd Primary Consumer Hardening](dotmd-primary-consumer-hardening.md).

## Problem

Direct use, prompt claim, runlist next, and roadmap next disagree about startable statuses. Baton treats opt-in journal entries and the sole global in-session plan as ownership, allowing one session to release another session's work.

## Decisions

- Journal remains analytics only.
- Ownership is local, gitignored, schema-versioned state under `.dotmd/`.
- Startable statuses are explicit/configurable; archive path, terminal, parked, and busy states are distinct outcomes.
- Implicit mutations require exactly one plan owned by the authoritative session.
- Recovery of another session's plan requires explicit path plus `--force`.

## Phases

### Phase 1 - Pickup Classifier ⬜

- Centralize type, configured status, terminal/archive path, parked, and ownership decisions.
- Reuse it in direct use, prompt claim, runlist, and roadmap selection.

### Phase 2 - Durable Ownership ⬜

- Resolve authoritative session IDs with an explicit override for non-Claude hosts.
- Add atomic claim/resume/release records and safe legacy adoption of unowned in-session plans.
- Remove journal-based authorization and sole-in-session fallback.

### Phase 3 - Unified Pickup Transition ⬜

- One claim operation updates status, timestamp, history, ownership, index, and hooks exactly once.
- Implement safe optional-target `set` only after ownership is authoritative.
- Make same-owner resume idempotent and different-owner pickup fail busy.

## Acceptance

- Every parked/default terminal/physically archived case is rejected by every pickup entrypoint.
- Configured terminal `done` cannot be claimed.
- Two sessions racing for one plan produce one owner.
- Prompt claim has identical timestamp/history/index/hook behavior to direct use.
- Journaling disabled changes no ownership outcome.
- No-target baton/set can never select another session's sole in-session plan.


## Version History

- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
