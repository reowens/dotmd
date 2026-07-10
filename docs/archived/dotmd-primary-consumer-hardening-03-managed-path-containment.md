---
type: plan
status: archived
created: 2026-07-10T05:53:02Z
updated: 2026-07-10T21:09:02Z
parent_plan: ../plans/dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: Audit F3 reproduced a managed mutation changing an absolute Markdown path outside both the repository and configured document roots. Existing resolution helpers establish existence but not authorization.
next_step: Specify canonical source/destination containment semantics, including symlink and nonexistent-destination cases, before changing any resolver used by read-only commands.
---

# Managed Path Containment

> Runlist child of [Dotmd Primary Consumer Hardening](../plans/dotmd-primary-consumer-hardening.md).

## Problem

Mutation commands accept absolute paths, traversal, and destinations without proving they belong to a configured document root. Tightening the generic resolver would risk breaking legitimate read-only and body-input workflows, so mutation authorization needs a separate primitive.

## Decisions

- Existing sources are authorized after `realpath` canonicalization.
- New destinations are authorized through their nearest existing canonical ancestor plus lexical checks.
- Managed document destinations stay under one configured root and end in `.md`.
- Index/export/body-input paths use separate explicit policies.

## Phases

### Phase 1 - Managed Path Primitive ✅

- Add a dedicated module returning canonical path, owning root, and repo-relative identity.
- Handle multi-root configs, roots that are symlinks, sibling-prefix traps, and destination parent symlinks.

### Phase 2 - Mutation Adoption ✅

- Apply to lifecycle, new, rename, prompts, runlists, bulk-tag, lint/fix, migrations, and integration writes.
- Keep read-only `use` and external `@draft` inputs intentionally broader.

### Phase 3 - Configuration Boundaries ✅

- Constrain generated index writes to the repository.
- Emit actionable errors naming the configured roots rather than generic file-not-found messages.

## Acceptance

- Absolute, `..`, source-symlink, and destination-parent-symlink escapes fail before writes.
- Valid operations in every configured root still work.
- A root that is itself a symlink remains supported.
- Read-only access and `@/tmp/draft.md` body input retain current behavior.
- A table-driven inventory maps every mutating dispatcher branch to the authorization primitive; the test fails when a new mutator is added without a policy.

## Closeout

Shipped a dedicated symlink-aware managed-path policy without narrowing read-only resolution. Existing mutation sources now require canonical membership in the most-specific configured document root; destinations require lexical ownership plus canonical containment of their nearest existing ancestor; moves preserve source-root ownership; and generated indexes remain repository-contained. Lifecycle, creation, rename, prompt/baton, runlist, bulk, lint/fix, and migration writes adopt the policy, while external document reads, body inputs, and export outputs retain their explicit broader contracts. A centralized dispatcher policy registry makes every command choose managed, repository, configured-file, external, global-state, read-only, or proxy behavior. Regression coverage includes traversal, absolute paths, source and parent symlinks, dangling links, sibling prefixes, symlinked roots, overlapping and multi-root ownership, preflight-before-write ordering, and external-path exceptions. The full 1,414-test suite, `dotmd check`, and independent adversarial closure review passed with no findings. Post-authorization filesystem races remain intentionally assigned to Atomic Mutation.


## Version History

- **2026-07-10T21:09:02Z** Archived — Shipped canonical symlink-aware managed/repo path authorization across mutation surfaces; 1,414 tests and adversarial closure review passed with TOCTOU deferred to Atomic Mutation.
- **2026-07-10T20:23:51Z** Started (planned → in-session).
- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
