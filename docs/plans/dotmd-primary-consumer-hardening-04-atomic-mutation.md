---
type: plan
status: planned
created: 2026-07-10T05:53:02Z
updated: 2026-07-10T05:53:02Z
parent_plan: dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: Audit F4 reproduced truncated reads, lost history entries, and status/history changes surviving failed moves. This child provides the single-file and lock substrate required by later ownership and transaction work.
next_step: Design the smallest atomic write API around snapshot identity, exclusive creation, ordered locks, and sibling-temp replacement using Node built-ins only.
---

# Atomic Mutation

> Runlist child of [Dotmd Primary Consumer Hardening](dotmd-primary-consumer-hardening.md).

## Problem

Core mutations perform independent read/replace/write steps. Concurrent agents can read truncated files, overwrite newer content, choose the same archive/prompt destination, or lose Version History entries.

## Phases

### Phase 1 - Atomic File API ⬜

- Snapshot content hash plus stat identity.
- Render complete new content before writing.
- Replace through a sibling temp file while preserving mode.
- Reject stale snapshots instead of silently overwriting.

### Phase 2 - Locks And Exclusive Creation ⬜

- Add bounded per-canonical-path locks under `.dotmd/` with deterministic ordering.
- Use exclusive creation for new docs, baton prompts, and destination reservations.
- Report lock/conflict ownership without indefinite waits.

### Phase 3 - First Consumers ⬜

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


## Version History

- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
