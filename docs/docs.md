# Docs

<!-- GENERATED:dotmd:start -->

## Active

| Doc | Status |
|-----|--------|
| [Dotmd Primary Consumer Hardening](plans/dotmd-primary-consumer-hardening.md) | Active |

## Planned

| Doc | Status |
|-----|--------|
| [Lifecycle Ownership](plans/dotmd-primary-consumer-hardening-05-lifecycle-ownership.md) | Planned |
| [Transactional Moves](plans/dotmd-primary-consumer-hardening-06-transactional-moves.md) | Planned |
| [Command Schema Contracts](plans/dotmd-primary-consumer-hardening-08-command-agent-contracts.md) | Planned |
| [Documentation And Deck Hygiene](plans/dotmd-primary-consumer-hardening-09-operational-cleanup.md) | Planned |
| [MCP Read-Only Experiment](plans/dotmd-primary-consumer-hardening-10-mcp-readonly.md) | Planned |
| [Path Identity Outputs](plans/dotmd-primary-consumer-hardening-12-path-identity-outputs.md) | Planned |
| [Agent Context V1](plans/dotmd-primary-consumer-hardening-13-agent-context-v1.md) | Planned |
| [Bounded Git Metadata](plans/dotmd-primary-consumer-hardening-14-bounded-git-metadata.md) | Planned |
| [Cross Platform Contract](plans/dotmd-primary-consumer-hardening-15-cross-platform-contract.md) | Planned |

## Reference

| Doc | Status |
|-----|--------|
| [Agent UX Audit — 2026-05-24](agent-ux-audit.md) | Reference |
| [dotmd audit against Beyond platform — 2026-05-24](audit-beyond-platform.md) | Reference |

## Archived

Archived docs are indexed by the CLI/JSON output. Showing 8 recent or high-signal highlights out of 76 archived docs:

| Doc | Status Snapshot |
|-----|-----------------|
| [Atomic Mutation](archived/dotmd-primary-consumer-hardening-04-atomic-mutation.md) | Archived: Shipped a zero-dependency atomic mutation substrate with stale-snapshot rejection, ordered bounded locks, exclusive publication, CAS-safe rollback, transactional lifecycle moves, and in-lock index rendering. |
| [Managed Path Containment](archived/dotmd-primary-consumer-hardening-03-managed-path-containment.md) | Archived: Audit F3 reproduced a managed mutation changing an absolute Markdown path outside both the repository and configured document roots. Existing resolution helpers establish existence but not authorization. |
| [Notion Removal](archived/dotmd-primary-consumer-hardening-11-notion-removal.md) | Archived: Audit F7 confirmed the advertised Notion import/export/sync paths are incompatible with the declared SDK and have no API-contract coverage. Repair would require identity, serialization, conflict, partial-failure, and live-workspace decisions beyond this hardening cycle. |
| [Guard Privacy](archived/dotmd-primary-consumer-hardening-07-guard-privacy.md) | Archived: Audit F6 confirmed the global guard acts in non-dotmd repositories, broad Git commands bypass prompt protection, and global logs retain unredacted bodies/commands. Redaction must land before broader guard inspection increases captured data. |
| [Passive Dry Run](archived/dotmd-primary-consumer-hardening-02-passive-dry-run.md) | Archived: Audit F11 confirmed that use --dry-run invokes onPickup, check --dry-run can auto-heal the index, and HUD can rewrite generated state during SessionStart. Earlier full-validation cost was already reduced and is not being reopened. |
| [Dotmd Baton Single-In-Session Misfire](archived/dotmd-baton-single-in-session-misfire.md) | Archived: `dotmd baton @/tmp/draft.md` (no explicit plan arg) can hand off a plan the current session never touched. `findOwnedPlan` (src/baton.mjs) falls back to "the only globally in-session plan" whenever the journal can't confirm ownership — but that fallback fires even when another session legitimately owns that single in-session plan, so baton flips its status, mints a misnamed `resume-<other-plan>.md`, and never touches the plan the current session was actually working on. |
| [Dotmd Baton Exit Nudge](archived/dotmd-baton-exit-nudge.md) | Archived: Baton-on-exit is the only step of dotmd's core loop with no mechanical backstop — it rides entirely on agent memory, which is exactly the failure class dotmd exists to eliminate. Found by dogfooding: an author-session shipped+released Track 3, then narrated the next pickup into chat instead of running `dotmd baton` (the anti-pattern SKILL.md explicitly forbids). The plugin's hooks are all start-side (SessionStart/SubagentStart/CwdChanged → hud) or guard-side (PreToolUse → guard); there is no Stop/SessionEnd hook, and the lone baton reminder is SessionStart-only and gated on an in-session plan owned at session start. |
| [Dotmd Roadmap Layer](archived/dotmd-roadmap-layer.md) | Archived: Tier-3 roadmap primitive (`execution_mode: roadmap`) — composes runlists and rolls their done/total up into a recursive grand total, with `dotmd roadmap`/`roadmaps`/`roadmap next` + plans/briefing/health integration + a `check` nudge. BUILT, tested (1290), and dogfooded (dotmd-forward + beyond/platform master-runlist 100/333). Axis is domain composition; horizon grouping deferred by design. Built but UNRELEASED by user choice. |

- Use `dotmd list` or `dotmd json` for the full inventory.
<!-- GENERATED:dotmd:end -->
