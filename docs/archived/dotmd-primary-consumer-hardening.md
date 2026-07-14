---
type: plan
status: archived
created: 2026-07-10T05:53:02Z
updated: 2026-07-14T00:15:32Z
surfaces:
  - cli
  - plugin
  - docs
modules:
  - lifecycle
  - guard
  - release
  - index
domain: agent-ux
audience: internal
parent_plan:
related_plans:
related_docs:
  - "> dotmd-primary-consumer-audit.md"
current_state: All fifteen children are archived, findings F1-F15 have implemented or explicit remove/reject outcomes, and the source audit is archived. The program exit criteria are satisfied.
next_step: Archive this runlist. No successor, release, or additional planning pass is required.
runlist:
  - dotmd-primary-consumer-hardening-01-release-integrity.md
  - dotmd-primary-consumer-hardening-02-passive-dry-run.md
  - dotmd-primary-consumer-hardening-07-guard-privacy.md
  - dotmd-primary-consumer-hardening-11-notion-removal.md
  - dotmd-primary-consumer-hardening-03-managed-path-containment.md
  - dotmd-primary-consumer-hardening-04-atomic-mutation.md
  - dotmd-primary-consumer-hardening-05-lifecycle-ownership.md
  - dotmd-primary-consumer-hardening-06-transactional-moves.md
  - dotmd-primary-consumer-hardening-12-path-identity-outputs.md
  - dotmd-primary-consumer-hardening-08-command-agent-contracts.md
  - dotmd-primary-consumer-hardening-13-agent-context-v1.md
  - dotmd-primary-consumer-hardening-14-bounded-git-metadata.md
  - dotmd-primary-consumer-hardening-15-cross-platform-contract.md
  - dotmd-primary-consumer-hardening-09-operational-cleanup.md
  - dotmd-primary-consumer-hardening-10-mcp-readonly.md
---

# Dotmd Primary Consumer Hardening

> Convert the primary-consumer audit into a dependency-aware hardening program. The goal is not more feature surface; it is one trustworthy lifecycle, mutation, command, and agent contract.

## Problem

dotmd has broad capability and strong happy-path coverage, but central invariants are split across independent implementations. Pickup, prompt claim, baton, runlists, status moves, command metadata, HUD, and release tooling each make slightly different assumptions about ownership, paths, side effects, and generated state.

Fixing findings independently would duplicate logic and preserve the underlying drift. This runlist lands the shared foundations first and delays MCP mutation tooling until the CLI contracts it would expose are stable.

## Program Rules

- Zero required runtime dependencies remain a constraint.
- Silent wrong behavior outranks loud errors and cosmetic drift.
- Dry-run and passive session surfaces must be side-effect free.
- Mutation identity is canonical path, never basename.
- Journal data remains observability, never authorization.
- Each child ships with adversarial tests plus the full suite.
- Historical audit findings already marked shipped are not reopened.
- No future release is required to close this program. Release Integrity closes on its completed implementation and automated acceptance; live publication checks remain standard release procedure.
- Deferred tails with explicit reject/defer decisions are closed as decisions, not kept open indefinitely.
- Complete the remaining sequence in one execution pass without introducing another planning layer.

## Dependency Map

- Release integrity and passive dry-run safety are independent first cuts.
- Containment precedes every new mutation primitive.
- Atomic single-file mutation precedes durable ownership and multi-file transactions.
- Ownership precedes transactional baton/consume behavior.
- Command schema work starts after unsupported command removal; agent-context work follows the schema/status metadata seam.
- The read-only MCP experiment technically depends on agent-context v1 and passive safety, but remains strategically last until P0 hardening is closed.
- Operational cleanup may run in parallel except cross-platform root work must reuse the containment primitive.

## Final Closeout Directive

This sequence is authoritative for the remaining deck. All entries close before any future release:

1. Finish Documentation and Deck Hygiene: consolidate README guidance, restore changelog continuity, and add changelog-version enforcement.
2. Add final closeouts and archive Runlist Mutation and Plugin / Skill Drift; their deferred tails are rejected work, not future blockers.
3. Archive the drained Dotmd Forward roadmap, then archive Documentation and Deck Hygiene.
4. Execute the MCP Read-Only Experiment now. Record the measured graduate/remove decision and archive the plan either way.
5. Close Release Integrity from its completed implementation and automated acceptance. Preserve live publication checks only in release procedure documentation.
6. Record the audit disposition, archive the audit, add this hub's final Closeout, and archive this runlist.

Do not schedule, require, or perform a release as part of this closeout.

## Finding Ownership

| Finding | Primary child | Shared completion |
|---|---|---|
| F1 pickup invariants | Lifecycle Ownership | Transactional Moves (consume) |
| F2 session ownership | Lifecycle Ownership | Transactional Moves (baton) |
| F3 containment | Managed Path Containment | Cross-Platform Contract |
| F4 atomicity/concurrency | Atomic Mutation | Transactional Moves |
| F5 release safety | Release Integrity | - |
| F6 guard/privacy | Guard Privacy | - |
| F7 Notion | Notion Removal | Documentation Hygiene |
| F8 command contracts | Command Schema Contracts | - |
| F9 path identity | Transactional Moves (rename) | Path Identity Outputs |
| F10 agent context | Agent Context V1 | MCP consumer |
| F11 passive side effects | Passive Dry Run | Atomic Mutation/MCP enforce |
| F12 baton boundary | Transactional Moves | Lifecycle Ownership |
| F13 Git/platform | Bounded Git Metadata | Cross-Platform Contract |
| F14 docs/deck drift | Documentation And Deck Hygiene | Command schema output |
| F15 MCP decision | MCP Read-Only Experiment | - |


## Order of Operations

1. [Release Integrity](dotmd-primary-consumer-hardening-01-release-integrity.md) ✅
2. [Passive Dry Run](dotmd-primary-consumer-hardening-02-passive-dry-run.md) ✅
3. [Guard Privacy](dotmd-primary-consumer-hardening-07-guard-privacy.md) ✅
4. [Notion Removal](dotmd-primary-consumer-hardening-11-notion-removal.md) ✅
5. [Managed Path Containment](dotmd-primary-consumer-hardening-03-managed-path-containment.md) ✅
6. [Atomic Mutation](dotmd-primary-consumer-hardening-04-atomic-mutation.md) ✅
7. [Lifecycle Ownership](dotmd-primary-consumer-hardening-05-lifecycle-ownership.md) ✅
8. [Transactional Moves](dotmd-primary-consumer-hardening-06-transactional-moves.md) ✅
9. [Path Identity Outputs](dotmd-primary-consumer-hardening-12-path-identity-outputs.md) ✅
10. [Command Schema Contracts](dotmd-primary-consumer-hardening-08-command-agent-contracts.md) ✅
11. [Agent Context V1](dotmd-primary-consumer-hardening-13-agent-context-v1.md) ✅
12. [Bounded Git Metadata](dotmd-primary-consumer-hardening-14-bounded-git-metadata.md) ✅
13. [Cross Platform Contract](dotmd-primary-consumer-hardening-15-cross-platform-contract.md) ✅
14. [Documentation And Deck Hygiene](dotmd-primary-consumer-hardening-09-operational-cleanup.md) ✅
15. [MCP Read-Only Experiment](dotmd-primary-consumer-hardening-10-mcp-readonly.md) ✅

Pick up the next child with `dotmd runlist next dotmd-primary-consumer-hardening` - it targets the
first pickup-able child. `dotmd runlist dotmd-primary-consumer-hardening` shows the sequence + status.

## Program Exit Criteria

- Findings F1-F14 are closed with direct reproductions converted into tests or explicit de-scoping decisions.
- No managed mutation can escape configured roots or expose partial file content.
- Pickup and baton never infer ownership from a global in-session plan.
- Dry-run and SessionStart produce no local or external writes.
- Command syntax/help/completion derive from one specification.
- Agent context is versioned, bounded, type-correct, and configuration-derived.
- F15 ends with a written graduate/remove decision; the read-only MCP experiment either demonstrates lower agent friction or is removed without becoming product surface.
- Release Integrity is archived without waiting for publication; its live checks survive as operational documentation only.
- Runlist Mutation, Plugin / Skill Drift, Dotmd Forward, the primary-consumer audit, and this hub are archived with explicit closeouts rather than left partial/review.

## Closeout

- Outcomes: all fifteen children are archived and every F1-F15 audit finding has an implemented, removed, or explicitly rejected disposition.
- Safety: managed containment, atomic mutation, durable ownership, transactional moves, passive dry-run behavior, bounded Git metadata, and Linux/macOS/Windows CI now share tested contracts.
- Agent surface: command schema, agent-context v1, canonical workflow drift detection, prompt consume-to-claim, and baton ownership now use centralized lifecycle and identity rules.
- Operational closure: README and changelog drift were corrected, drained partial plans and the forward roadmap were archived, Release Integrity closed from automated evidence, and the MCP experiment was removed after measuring no tool-call benefit.
- Verification: each child records focused and full-suite evidence; the final closeout run runs the complete suite and `dotmd check` before completion.
- Deferrals: none. Dormant ideas require future concrete demand and are not successors to this program.

## Version History

- **2026-07-14T00:15:32Z** Archived — All fifteen children and F1-F15 dispositions are closed; the hardening program has no deferred successor work.
- **2026-07-10** Planning review expanded the runlist from 10 to 15 executable children, moved guard/privacy earlier, ordered Notion removal before command inventory, and added explicit F1-F15 ownership.
- **2026-07-10T05:53:02Z** Created (runlist hub, 10 children).
