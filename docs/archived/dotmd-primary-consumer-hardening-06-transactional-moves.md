---
type: plan
status: archived
created: 2026-07-10T05:53:02Z
updated: 2026-07-12T10:07:26Z
parent_plan: dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> dotmd-primary-consumer-audit.md"
current_state: Shipped durable multi-file transactions, crash recovery, canonical reference planning, Git-index CAS, and truthful mutation result contracts.
next_step: Continue the parent runlist with Path Identity Outputs.
---

# Transactional Moves

> Runlist child of [Dotmd Primary Consumer Hardening](dotmd-primary-consumer-hardening.md).

## Problem

Moves update status, paths, references, ownership, prompts, and indexes across several files. Current ordering can leave partial state, rename replaces basename text indiscriminately, and baton reports a narrower commit boundary than the files it changes.

## Phases

### Phase 1 - Reference And Transaction Planning ✅

- Resolve frontmatter refs and Markdown links by canonical target path.
- Precompute all new content and destinations before mutation.
- Acquire canonical sorted locks and record recoverable transaction intent.

### Phase 2 - Lifecycle Moves ✅

- Migrate archive/unarchive/file/unfile and bulk archive.
- Roll back caught failures and recover demonstrably abandoned transactions.
- Keep derived index regeneration atomic but outside canonical-document rollback.
- Bulk archive remains explicitly per-item transactional (not all-or-none); its result/JSON reports each archived or failed item truthfully.

### Phase 3 - Rename Path Identity ✅

- Rewrite only actual refs resolving to the old path, including refs inside the moved document.
- Preserve fragments and ignore prose, URLs, suffix-sharing names, and duplicate basenames.
- Move active ownership records with renamed plans.

### Phase 4 - Baton And Consume Boundary ✅

- Atomically create prompt plus release owned plan; consume prompt plus eligible claim before body emission.
- Defer shared index regeneration by default and report exact repository/session/generated files.
- Add JSON output and derive human staging/commit guidance from the same result.

## Acceptance

- Named fault injection covers lock acquisition, transaction record, content staging, move, each referrer write, ownership move, and canonical commit; every point leaves or restores complete prior state.
- Cross-directory rename fixes valid refs and leaves `grandchild.md` prose unchanged.
- Baton changes all intended repository files or none; prompt stays session-local.
- Tracked index stays byte-identical when baton declares deferred mode.
- Bulk archive acceptance is per-item atomicity with explicit partial-result reporting; cross-item all-or-none rollback is out of scope.
- Abandoned recovery never deletes destination directories from persisted evidence. It reports retained directory paths for manual inspection; only the still-running transaction may remove directories held in its in-memory creation set.

## Closeout

- Added durable, schema-validated transaction manifests with idempotent crash recovery and fail-closed manual evidence retention.
- Made lifecycle moves, rename referrers, ownership migration, prompt handoff, and Git-index staging participate in explicit transaction boundaries.
- Added canonical path-aware rewriting for configured frontmatter references and Markdown links while preserving code, HTML, fragments, titles, and ambiguous identities.
- Added atomic whole-index CAS compatible with alternate, unborn, SHA-256, and split indexes, including external staging and SIGKILL coverage.
- Made baton, consume, and bulk archive results report actual repository, session, generated, deferred, preview, and failure effects.
- Verified with 1,540 passing tests, clean `dotmd check`, clean skill drift, and a final adversarial review with no findings.
- Retained boundaries: bulk archive is per-item transactional; generated indexes and hooks remain outside canonical rollback; abandoned recovery reports rather than deletes empty directories; descriptor-relative filesystem APIs would be required to eliminate ancestor-swap TOCTOU completely.


## Version History

- **2026-07-12T10:07:26Z** Archived — Shipped durable transaction manifests and crash recovery, all-document rename locking and canonical reference planning, atomic Git-index CAS, truthful mutation result contracts, and adversarial SIGKILL coverage; 1,540 tests passed and final review found no issues.
- **2026-07-11T22:50:46Z** Started (planned → in-session).
- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
