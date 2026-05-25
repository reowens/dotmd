# Docs

<!-- GENERATED:dotmd:start -->

## Active

| Doc | Status Snapshot |
|-----|-----------------|
| [Agent UX Audit — 2026-05-24](agent-ux-audit.md) | Active: No current_state set |
| [dotmd audit against Beyond platform — 2026-05-24](audit-beyond-platform.md) | Active: No current_state set |
| [Modules Dashboard (F16)](plans/modules-dashboard.md) | Active: Spec finalized; awaiting implementation. |

## Archived

Archived docs are indexed by the CLI/JSON output. Showing 2 recent or high-signal highlights out of 8 archived docs:

| Doc | Status Snapshot |
|-----|-----------------|
| [Fix Init Silent Claude Commands Rewrite](archived/fix-init-silent-claude-commands-rewrite.md) | Archived: Discovered during dogfood audit on 2026-05-23 — `dotmd init` silently regenerates `.claude/commands/{plans,docs}.md` from older versions but reports nothing in its create/update/exists output, and dry-run omits them entirely. |
| [Fix Stale `next` Command In Generated Slash Commands](archived/fix-stale-next-command-in-generated-slash-cmds.md) | Archived: Discovered during dogfood audit on 2026-05-23 — the regenerated `.claude/commands/plans.md` (v0.31.0) lists `dotmd next` as a real command, but it doesn't exist (`Unknown command: next. Did you mean dotmd new?`). |

- Use `dotmd list` or `dotmd json` for the full inventory.
<!-- GENERATED:dotmd:end -->
