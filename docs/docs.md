# Docs

<!-- GENERATED:dotmd:start -->

## Active

| Doc | Status |
|-----|--------|
| [Dotmd Primary Consumer Hardening](plans/dotmd-primary-consumer-hardening.md) | Active |

## Planned

| Doc | Status |
|-----|--------|
| [Documentation And Deck Hygiene](plans/dotmd-primary-consumer-hardening-09-operational-cleanup.md) | Planned |
| [MCP Read-Only Experiment](plans/dotmd-primary-consumer-hardening-10-mcp-readonly.md) | Planned |

## Reference

| Doc | Status |
|-----|--------|
| [Agent UX Audit — 2026-05-24](agent-ux-audit.md) | Reference |
| [dotmd audit against Beyond platform — 2026-05-24](audit-beyond-platform.md) | Reference |

## Archived

Archived docs are indexed by the CLI/JSON output. Showing 8 recent or high-signal highlights out of 82 archived docs:

| Doc | Status Snapshot |
|-----|-----------------|
| [Bounded Git Metadata](archived/dotmd-primary-consumer-hardening-14-bounded-git-metadata.md) | Archived: Audit F13 confirmed ordinary index builds can scan unbounded repository history and silently lose all Git-derived dates after maxBuffer failure. Mutation callers cannot distinguish complete history from degradation. |
| [Agent Context V1](archived/dotmd-primary-consumer-hardening-13-agent-context-v1.md) | Archived: Audit F10 confirmed hard-coded/mixed/duplicated agent buckets, silent truncation, missing dynamic status priming, and body-relative pickup-card offsets. This plan consumes the command-schema seam but owns machine and human agent-state semantics. |
| [Command Schema Contracts](archived/dotmd-primary-consumer-hardening-08-command-agent-contracts.md) | Archived: Audit F8 confirmed duplicated command metadata, silent roadmap grammar drift, and command-local flag ownership loss. Notion removal lands first so the schema inventories the intended command surface once; agent-context concerns live in their own downstream child. |
| [Path Identity Outputs](archived/dotmd-primary-consumer-hardening-12-path-identity-outputs.md) | Archived: Shipped. HTML export now allocates deterministic path-safe identities from the full corpus, rewrites emitted document links, and validates output ancestry before publication; DOT preserves full path IDs and tuple-safe edge identity. |
| [Transactional Moves](archived/dotmd-primary-consumer-hardening-06-transactional-moves.md) | Archived: Shipped durable multi-file transactions, crash recovery, canonical reference planning, Git-index CAS, and truthful mutation result contracts. |
| [Lifecycle Ownership](archived/dotmd-primary-consumer-hardening-05-lifecycle-ownership.md) | Archived: Shipped centralized pickup classification, canonical schema-v2 session ownership, atomic claim/release/baton transitions, and durable operation-bound index/hook completion independent of journals. |
| [Atomic Mutation](archived/dotmd-primary-consumer-hardening-04-atomic-mutation.md) | Archived: Shipped a zero-dependency atomic mutation substrate with stale-snapshot rejection, ordered bounded locks, exclusive publication, CAS-safe rollback, transactional lifecycle moves, and in-lock index rendering. |
| [Managed Path Containment](archived/dotmd-primary-consumer-hardening-03-managed-path-containment.md) | Archived: Audit F3 reproduced a managed mutation changing an absolute Markdown path outside both the repository and configured document roots. Existing resolution helpers establish existence but not authorization. |

- Use `dotmd list` or `dotmd json` for the full inventory.
<!-- GENERATED:dotmd:end -->
