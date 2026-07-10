---
type: plan
status: awaiting
created: 2026-07-10T05:53:02Z
updated: 2026-07-10T10:03:31Z
parent_plan: dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: Implementation complete. Release preflight, staged-index isolation, durable intent/recovery, atomic branch-plus-tag push, failed-workflow rerun, npm-owned global synchronization, and canonical plugin verification are covered by adversarial tests; only live remote dogfood remains.
next_step: At the next user-authorized release, run the canonical npm version command and complete the live GitHub/npm/global CLI/plugin checklist. No additional code is expected unless that dogfood exposes a failure.
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

## Dogfood Release Checklist

- Published npm version and GitHub Release target the same tag SHA.
- Plugin refresh is verified or reported as the sole incomplete local step.
- Every PATH-visible CLI agrees with the published version.

## Verification

- Real `npm version patch` fixture verifies npm's actual preversion/version/commit/tag ordering.
- Release intent prevents previous-version fallback and blocks a second bump while recovery is pending.
- Feature branches, dirty trees, inherited staged paths, tag collisions, malformed manifests, stale foreign PATH copies, and concurrent release-path edits fail without collateral mutation.
- Atomic push targets only `refs/heads/main` plus the intended tag and permits recovery after a remote-main merge while keeping the tag unchanged.
- Focused release suite: 56/56 passing.
- Full suite: 1,339/1,339 passing; `dotmd check --verbose`, syntax checks, and `git diff --check` clean.


## Version History

- **2026-07-10T10:03:31Z** Status: in-session → awaiting — Implementation and adversarial verification complete (1,339 tests); awaiting the next user-authorized publication to dogfood the live GitHub/npm/global CLI/plugin path.
- **2026-07-10T06:04:24Z** Started (active → in-session).
- **2026-07-10T05:56:24Z** Status: planned → active — Release recovery shipped and dogfooded in v0.69.0; retain the worktree hardening and close staged-index safety next.
- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
