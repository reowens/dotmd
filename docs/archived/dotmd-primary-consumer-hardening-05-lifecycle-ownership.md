---
type: plan
status: archived
created: 2026-07-10T05:53:02Z
updated: 2026-07-11T22:33:30Z
parent_plan: ../plans/dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: Shipped centralized pickup classification, canonical schema-v2 session ownership, atomic claim/release/baton transitions, and durable operation-bound index/hook completion independent of journals.
next_step: Transactional Moves can now carry ownership through rename/archive recovery and finish the multi-file reference and crash-recovery boundary.
---

# Lifecycle Ownership

> Runlist child of [Dotmd Primary Consumer Hardening](../plans/dotmd-primary-consumer-hardening.md).

## Problem

Direct use, prompt claim, runlist next, and roadmap next disagree about startable statuses. Baton treats opt-in journal entries and the sole global in-session plan as ownership, allowing one session to release another session's work.

## Decisions

- Journal remains analytics only.
- Ownership is local, gitignored, schema-versioned state under `.dotmd/`.
- Startable statuses are explicit/configurable; archive path, terminal, parked, and busy states are distinct outcomes.
- Implicit mutations require exactly one plan owned by the authoritative session.
- Recovery of another session's plan requires explicit path plus `--force`.

## Phases

### Phase 1 - Pickup Classifier ✅

- Centralize type, configured status, terminal/archive path, parked, and ownership decisions.
- Reuse it in direct use, prompt claim, runlist, and roadmap selection.

### Phase 2 - Durable Ownership ✅

- Resolve authoritative session IDs with an explicit override for non-Claude hosts.
- Add atomic claim/resume/release records and safe legacy adoption of unowned in-session plans.
- Remove journal-based authorization and sole-in-session fallback.

### Phase 3 - Unified Pickup Transition ✅

- One claim operation atomically updates status, timestamp, history, and ownership, then durably reconciles index and pickup-hook completion. Hook delivery is at-least-once with a stable operation ID; hooks must deduplicate that ID. A persisted PID/host/process-start lease keeps live or unverifiable deliveries busy regardless of age; expired delivery is automatically reclaimed only when the owner is demonstrably dead.
- Implement safe optional-target `set` only after ownership is authoritative.
- Make same-owner resume idempotent and different-owner pickup fail busy.

## Acceptance

- Every parked/default terminal/physically archived case is rejected by every pickup entrypoint.
- Configured terminal `done` cannot be claimed.
- Two sessions racing for one plan produce one owner.
- Prompt claim has identical timestamp/history/index/hook behavior to direct use.
- Retrying pending pickup hooks reuses the same operation ID and never repeats claim history.
- Prompt consumption is at-most-once: archive/claim commits before stdout; output failure cannot roll back consumption and the archived body remains inspectable.
- Journaling disabled changes no ownership outcome.
- No-target baton/set can never select another session's sole in-session plan.

## Closeout

Shipped one configurable pickup classifier across direct use, linked prompts, runlists, and roadmaps, with explicit outcomes for malformed, parked, terminal, physically archived, busy, startable, and same-owner states. Canonical schema-v2 records under gitignored `.dotmd/ownership/` bind plans to authoritative Claude, OpenCode, terminal, or explicit `DOTMD_SESSION_ID` identities; journal data is analytics only and missing identity fails closed. Claims, releases, archives, deprecated status, no-target set, and baton handoff use atomic ownership-aware transactions, while owned rename is blocked until Transactional Moves can migrate identity safely. Index and pickup-hook completion is durable and operation-bound: index retries do not repeat history, hook delivery occurs outside locks with a live-owner lease, and at-least-once hooks deduplicate stable `operationId`. Prompt consume atomically archives and claims before at-most-once stdout; output failures name both archived-body and claim-completion recovery commands. Dry-run invokes none of these effects. The full 1,501-test suite, clean skill-drift/check/diff validation, and repeated adversarial closure review passed with no findings.


## Version History

- **2026-07-11T22:33:30Z** Archived — Shipped canonical session ownership, unified pickup classification, atomic claim/release/baton transitions, and durable operation-bound completion; 1,501 tests and adversarial closure review passed.
- **2026-07-11T21:10:03Z** Started (planned → in-session).
- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
