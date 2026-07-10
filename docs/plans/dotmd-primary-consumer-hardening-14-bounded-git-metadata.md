---
type: plan
status: planned
created: 2026-07-10T06:00:55Z
updated: 2026-07-10T06:00:55Z
parent_plan: dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: Audit F13 confirmed ordinary index builds can scan unbounded repository history and silently lose all Git-derived dates after maxBuffer failure. Mutation callers cannot distinguish complete history from degradation.
next_step: Change the batch API to accept current managed paths and return explicit completeness/reason metadata before adding commit/output limits.
---

# Bounded Git Metadata

> Runlist child of [Dotmd Primary Consumer Hardening](dotmd-primary-consumer-hardening.md).

## Problem

Git staleness currently runs a full-history synchronous command with a fixed buffer. Large repositories pay increasing latency and eventually receive empty results with no diagnostic; `touch --git` can then make decisions from incomplete data.

## Phases

### Phase 1 - Bounded API ⬜

- Scope to configured/current document paths.
- Add explicit commit and output limits.
- Return dates plus `complete` and degradation reason.

### Phase 2 - Caller Semantics ⬜

- Check/query use known dates and emit one warning on partial history.
- `touch --git` fails closed before any write when history is incomplete.
- Non-Git repositories retain graceful behavior.

### Phase 3 - Stress Coverage ⬜

- Build synthetic history fixtures and force low limits/buffer failures deterministically.

## Acceptance

- No Git metadata subprocess is unbounded.
- Known docs still receive correct latest dates.
- Truncation never silently suppresses all staleness evidence.
- `touch --git` cannot report success or mutate from incomplete history.


## Version History

- **2026-07-10T06:00:55Z** Created (runlist child of dotmd-primary-consumer-hardening).
