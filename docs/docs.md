# Docs

<!-- GENERATED:dotmd:start -->

## Active

| Doc | Status |
|-----|--------|
| [Dotmd Primary Consumer Hardening](plans/dotmd-primary-consumer-hardening.md) | Active |

## Planned

| Doc | Status |
|-----|--------|
| [Command Schema Contracts](plans/dotmd-primary-consumer-hardening-08-command-agent-contracts.md) | Planned |
| [Documentation And Deck Hygiene](plans/dotmd-primary-consumer-hardening-09-operational-cleanup.md) | Planned |
| [MCP Read-Only Experiment](plans/dotmd-primary-consumer-hardening-10-mcp-readonly.md) | Planned |
| [Agent Context V1](plans/dotmd-primary-consumer-hardening-13-agent-context-v1.md) | Planned |
| [Bounded Git Metadata](plans/dotmd-primary-consumer-hardening-14-bounded-git-metadata.md) | Planned |
| [Cross Platform Contract](plans/dotmd-primary-consumer-hardening-15-cross-platform-contract.md) | Planned |

## Reference

| Doc | Status |
|-----|--------|
| [Agent UX Audit — 2026-05-24](agent-ux-audit.md) | Reference |
| [dotmd audit against Beyond platform — 2026-05-24](audit-beyond-platform.md) | Reference |

## Archived

Archived docs are indexed by the CLI/JSON output. Showing 8 recent or high-signal highlights out of 79 archived docs:

| Doc | Status Snapshot |
|-----|-----------------|
| [Path Identity Outputs](archived/dotmd-primary-consumer-hardening-12-path-identity-outputs.md) | Archived: Shipped. HTML export now allocates deterministic path-safe identities from the full corpus, rewrites emitted document links, and validates output ancestry before publication; DOT preserves full path IDs and tuple-safe edge identity. |
| [Transactional Moves](archived/dotmd-primary-consumer-hardening-06-transactional-moves.md) | Archived: Shipped durable multi-file transactions, crash recovery, canonical reference planning, Git-index CAS, and truthful mutation result contracts. |
| [Lifecycle Ownership](archived/dotmd-primary-consumer-hardening-05-lifecycle-ownership.md) | Archived: Shipped centralized pickup classification, canonical schema-v2 session ownership, atomic claim/release/baton transitions, and durable operation-bound index/hook completion independent of journals. |
| [Atomic Mutation](archived/dotmd-primary-consumer-hardening-04-atomic-mutation.md) | Archived: Shipped a zero-dependency atomic mutation substrate with stale-snapshot rejection, ordered bounded locks, exclusive publication, CAS-safe rollback, transactional lifecycle moves, and in-lock index rendering. |
| [Managed Path Containment](archived/dotmd-primary-consumer-hardening-03-managed-path-containment.md) | Archived: Audit F3 reproduced a managed mutation changing an absolute Markdown path outside both the repository and configured document roots. Existing resolution helpers establish existence but not authorization. |
| [Notion Removal](archived/dotmd-primary-consumer-hardening-11-notion-removal.md) | Archived: Audit F7 confirmed the advertised Notion import/export/sync paths are incompatible with the declared SDK and have no API-contract coverage. Repair would require identity, serialization, conflict, partial-failure, and live-workspace decisions beyond this hardening cycle. |
| [Guard Privacy](archived/dotmd-primary-consumer-hardening-07-guard-privacy.md) | Archived: Audit F6 confirmed the global guard acts in non-dotmd repositories, broad Git commands bypass prompt protection, and global logs retain unredacted bodies/commands. Redaction must land before broader guard inspection increases captured data. |
| [Passive Dry Run](archived/dotmd-primary-consumer-hardening-02-passive-dry-run.md) | Archived: Audit F11 confirmed that use --dry-run invokes onPickup, check --dry-run can auto-heal the index, and HUD can rewrite generated state during SessionStart. Earlier full-validation cost was already reduced and is not being reopened. |

- Use `dotmd list` or `dotmd json` for the full inventory.
<!-- GENERATED:dotmd:end -->
