---
type: plan
status: archived
created: 2026-07-10T05:53:02Z
updated: 2026-07-10T11:02:25Z
parent_plan: ../plans/dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: Audit F11 confirmed that use --dry-run invokes onPickup, check --dry-run can auto-heal the index, and HUD can rewrite generated state during SessionStart. Earlier full-validation cost was already reduced and is not being reopened.
next_step: Define a shared execution context for dry-run/passive behavior and first convert the reproduced hook/index writes into failing invariant tests.
---

# Passive Dry Run

> Runlist child of [Dotmd Primary Consumer Hardening](../plans/dotmd-primary-consumer-hardening.md).

## Problem

Commands advertised as previews and hooks advertised as passive session priming still permit writes to repository files or external systems. The contract must apply across direct code, lifecycle hooks, index healing, journals, and retired-command cleanup.

## Phases

### Phase 1 - Invariant Harness ✅

- Snapshot repository trees before/after representative dry-run commands.
- Add hooks that write sentinels and assert they are not invoked.
- Seed stale indexes and retired command files to capture current behavior.

### Phase 2 - Shared Execution Context ✅

- Carry `dryRun`, `passive`, and allowed-side-effect capabilities through command paths.
- Invoke mutation hooks only after real committed state changes.
- Disable journal/error-log writes for preview/passive invocations where they would create state.

### Phase 3 - Read-Only HUD And Check Preview ✅

- Disable index auto-heal from `check --dry-run`, HUD, and HUD JSON.
- Move retired generated-command cleanup to explicit doctor/maintenance paths.
- Preserve bounded HUD output and existing errors-only performance work.

## Acceptance

- `use --dry-run` invokes no pickup hook and creates no ownership/journal state.
- `check --dry-run`, HUD, and HUD JSON leave a stale index byte-identical.
- SessionStart does not delete retired command files.
- Explicit doctor/apply paths retain intended maintenance behavior.
- Full dry-run fixtures leave no temp files, locks, or external hook sentinels.

## Closeout

Shipped a side-effect-free execution context for dry-run and passive HUD paths, truthful built-in-only preview metadata when custom hooks are skipped, and whole-tree invariants covering repository, Git-lock, temp-directory, journal, and external-hook state. Summary and custom-template previews now disclose omitted execution instead of reporting false failures or guaranteed success. Independent closure review passed after the full preview-fidelity matrix was covered.


## Version History

- **2026-07-10T11:02:25Z** Archived — Shipped side-effect-free dry-run/HUD execution, truthful degraded-preview contracts, and whole-tree/temp/lock invariant coverage; independent closure review passed.
- **2026-07-10T10:03:45Z** Started (planned → in-session).
- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
