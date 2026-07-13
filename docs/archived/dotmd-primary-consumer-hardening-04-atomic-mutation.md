---
type: plan
status: archived
created: 2026-07-10T05:53:02Z
updated: 2026-07-11T18:31:58Z
parent_plan: ../plans/dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: Shipped a zero-dependency atomic mutation substrate with stale-snapshot rejection, ordered bounded locks, exclusive publication, CAS-safe rollback, transactional lifecycle moves, and in-lock index rendering.
next_step: Lifecycle Ownership can now build authoritative pickup and session ownership on top of conflict-safe single-file and multi-file mutation primitives.
---

# Atomic Mutation

> Runlist child of [Dotmd Primary Consumer Hardening](../plans/dotmd-primary-consumer-hardening.md).

## Problem

Core mutations perform independent read/replace/write steps. Concurrent agents can read truncated files, overwrite newer content, choose the same archive/prompt destination, or lose Version History entries.

## Phases

### Phase 1 - Atomic File API ✅

- Snapshot content hash plus stat identity.
- Render complete new content before writing.
- Replace through a sibling temp file while preserving mode.
- Reject stale snapshots instead of silently overwriting.

### Phase 2 - Locks And Exclusive Creation ✅

- Add bounded per-canonical-path locks under `.dotmd/` with deterministic ordering.
- Use exclusive creation for new docs, baton prompts, and destination reservations.
- Report lock/conflict ownership without indefinite waits.

### Phase 3 - First Consumers ✅

- Combine frontmatter and Version History into one render/commit.
- Migrate new, lifecycle single-file transitions, runlist writes, and index writes.
- Keep dry-run lock/temp free.

## Acceptance

- Concurrent creation has exactly one complete winner.
- Six concurrent transitions produce no truncation and preserve every successful history entry.
- An intervening edit causes a conflict, not data loss.
- Index readers observe old or new complete content only.
- Two processes requesting the same pair of locks in reversed order complete or fail within a fixed timeout; neither waits indefinitely.
- No runtime dependency is added.

## Closeout

Shipped a Node-builtins-only mutation substrate with content/stat snapshots, stale-write conflicts, mode-preserving sibling-temp replacement, descriptor-derived publication identity, deterministic bounded path locks, exclusive creation and destination reservation, directory durability syncs, and generation-aware rollback that never clobbers concurrent replacements. Lifecycle transitions, touch, archive moves, prompt consumption, baton stamping, runlist mutations/scaffolding, new documents, doctor/check/index writes, and index auto-heal now render from locked current state. Multi-file lifecycle and runlist operations preflight ordered participants, roll ordinary failures back with compare-and-swap checks, and restore exact Git-index state when staging occurred. Deterministic worker barriers and injected failure phases cover concurrent creation, six transitions, reversed locks, stale edits, destination races, fsync failures, reservation cleanup, Git rollback, prompt emission, index races, and destructive rollback interference. The full 1,449-test suite, clean `dotmd check`, and repeated adversarial closure review passed with no findings. Identifiable hard-crash artifacts and visibility to non-cooperating readers remain the explicit boundary for Transactional Moves.


## Version History

- **2026-07-11T18:31:58Z** Archived — Shipped conflict-safe atomic writes, ordered locks, exclusive publication, transactional lifecycle/runlist/index adoption, and deterministic concurrency coverage; 1,449 tests and adversarial closure review passed.
- **2026-07-10T22:47:01Z** Started (planned → in-session).
- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
