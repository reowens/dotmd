---
type: plan
status: archived
created: 2026-07-10T05:53:02Z
updated: 2026-07-14T00:14:09Z
parent_plan: dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> dotmd-primary-consumer-audit.md"
current_state: Implementation complete. Release preflight, staged-index isolation, durable intent/recovery, atomic branch-plus-tag push, failed-workflow rerun, npm-owned global synchronization, and canonical plugin verification are covered by adversarial tests. Live publication checks are release procedure, not unfinished plan work.
next_step: Add the final Closeout and archive this plan before any future release. Keep the GitHub/npm/global CLI/plugin checks in release procedure documentation without using publication as a plan gate.
---

# Release Integrity

> Runlist child of [Dotmd Primary Consumer Hardening](dotmd-primary-consumer-hardening.md).

## Problem

The documented one-command release can fail after creating a local tag, and completed releases previously updated only one of several global npm prefixes. Separately, `dotmd ship` can commit unrelated files that were staged before it ran.

## Decisions

- `npm version` remains the canonical publisher.
- `npm run release:resume` is the recovery authority: it rolls back incomplete pre-tag attempts or resumes the exact durable target; once a tag exists, never bump again.
- Every PATH-visible global `dotmd` copy must report the target version before local release success.
- A release command never resets or unstages caller state; unexpected staged files cause refusal.
- Live publication verification remains mandatory when a release occurs, but it does not keep implementation work or this plan open.

## Phases

### Phase 1 - Preserve The Dogfooded Recovery Flow ✅

- Keep push retries, tag-SHA workflow lookup, idempotent GitHub Release handling, registry polling, and plugin refresh.
- Keep explicit-prefix synchronization for Homebrew/NVM-style duplicate installs.
- Validate both plugin manifest shapes before either file is written and before version commit/tag creation.
- Verify the installed plugin version after refresh; keep refresh failure recoverable but do not print in-sync success.

### Phase 2 - Bound The Git Index ✅

- Add a shared staged-path inspector.
- Refuse `npm version` when the index is non-empty before version lifecycle staging.
- Refuse `dotmd ship` on inherited staged paths; after staging its allowlist, assert the index exactly matches the accepted set.
- Preserve skipped working-tree files byte-for-byte.

### Phase 3 - Collapse Release Guidance ✅

- Describe `dotmd ship` as optional release preparation, not a second publisher.
- Keep one recovery instruction in CLI help, CLAUDE.md, and failure output.

## Automated Acceptance

- A pre-staged `secret.env` causes both release entrypoints to fail before commit/tag.
- A failed push can resume the same tag without duplicate release or version bump.
- Missing/malformed plugin manifests abort before either manifest write and before commit/tag creation.
- Homebrew and NVM fixtures both update to the target version.

## Operational Release Checklist (Non-Blocking)

These checks remain part of release operations. They are not acceptance gates for closing this implementation plan.

- Published npm version and GitHub Release target the same tag SHA.
- Plugin refresh is verified or reported as the sole incomplete local step.
- Every PATH-visible CLI agrees with the published version.

## Closure Decision

- Release-integrity implementation and adversarial acceptance are complete.
- No additional code is expected before closeout.
- Archive this plan from the evidence above; do not schedule or perform a release to manufacture plan closure.
- Preserve the live checklist as operational guidance for whenever a future release is independently authorized.

## Verification

- Real `npm version patch` fixture verifies npm's actual preversion/version/commit/tag ordering.
- Release intent prevents previous-version fallback and blocks a second bump while recovery is pending.
- Feature branches, dirty trees, inherited staged paths, tag collisions, malformed manifests, stale foreign PATH copies, and concurrent release-path edits fail without collateral mutation.
- Atomic push targets only `refs/heads/main` plus the intended tag and permits recovery after a remote-main merge while keeping the tag unchanged.
- Focused release suite: 56/56 passing.
- Full suite: 1,339/1,339 passing; `dotmd check --verbose`, syntax checks, and `git diff --check` clean.

## Closeout

- Outcomes: release preflight rejects unsafe branch, worktree, staged-index, tag, manifest, and remote states before publication can begin.
- Recovery: durable intent preserves the exact target across failures, resumes branch-plus-tag publication atomically, and never creates a second version bump after a tag exists.
- Local completion: every PATH-visible CLI and the Claude Code plugin must match the target before release automation reports success.
- Closure basis: implementation and adversarial automated acceptance are complete. Live publication checks remain mandatory operational procedure but are not unfinished engineering or a reason to keep this plan open.


## Version History

- **2026-07-14T00:14:09Z** Archived — Implementation and adversarial acceptance are complete; live publication checks remain operational procedure rather than an open-plan gate.
- **2026-07-10T10:03:31Z** Status: in-session → awaiting — Implementation and adversarial verification complete (1,339 tests); awaiting the next user-authorized publication to dogfood the live GitHub/npm/global CLI/plugin path.
- **2026-07-10T06:04:24Z** Started (active → in-session).
- **2026-07-10T05:56:24Z** Status: planned → active — Release recovery shipped and dogfooded in v0.69.0; retain the worktree hardening and close staged-index safety next.
- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
