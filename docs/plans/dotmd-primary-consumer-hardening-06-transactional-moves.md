---
type: plan
status: planned
created: 2026-07-10T05:53:02Z
updated: 2026-07-10T05:53:02Z
parent_plan: dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: This child completes F4 and F9/F12 after atomic writes and ownership exist. Archive/file/rename/baton operations need one multi-file transaction and path-aware reference engine rather than ordered best-effort writes.
next_step: Extract a pure reference rewrite planner that resolves tokens against canonical paths, then define transaction locking, staging, rollback, and recovery boundaries.
---

# Transactional Moves

> Runlist child of [Dotmd Primary Consumer Hardening](dotmd-primary-consumer-hardening.md).

## Problem

Moves update status, paths, references, ownership, prompts, and indexes across several files. Current ordering can leave partial state, rename replaces basename text indiscriminately, and baton reports a narrower commit boundary than the files it changes.

## Phases

### Phase 1 - Reference And Transaction Planning ⬜

- Resolve frontmatter refs and Markdown links by canonical target path.
- Precompute all new content and destinations before mutation.
- Acquire canonical sorted locks and record recoverable transaction intent.

### Phase 2 - Lifecycle Moves ⬜

- Migrate archive/unarchive/file/unfile and bulk archive.
- Roll back caught failures and recover demonstrably abandoned transactions.
- Keep derived index regeneration atomic but outside canonical-document rollback.

### Phase 3 - Rename Path Identity ⬜

- Rewrite only actual refs resolving to the old path, including refs inside the moved document.
- Preserve fragments and ignore prose, URLs, suffix-sharing names, and duplicate basenames.
- Move active ownership records with renamed plans.

### Phase 4 - Baton And Consume Boundary ⬜

- Atomically create prompt plus release owned plan; consume prompt plus eligible claim before body emission.
- Defer shared index regeneration by default and report exact repository/session/generated files.
- Add JSON output and derive human staging/commit guidance from the same result.

## Acceptance

- Named fault injection covers lock acquisition, transaction record, content staging, move, each referrer write, ownership move, and canonical commit; every point leaves or restores complete prior state.
- Cross-directory rename fixes valid refs and leaves `grandchild.md` prose unchanged.
- Baton changes all intended repository files or none; prompt stays session-local.
- Tracked index stays byte-identical when baton declares deferred mode.


## Version History

- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
