# Docs

<!-- GENERATED:dotmd:start -->

## Active

| Doc | Status Snapshot |
|-----|-----------------|
| [Agent UX Audit — 2026-05-24](agent-ux-audit.md) | Active: No current_state set |
| [dotmd audit against Beyond platform — 2026-05-24](audit-beyond-platform.md) | Active: No current_state set |

## Archived

Archived docs are indexed by the CLI/JSON output. Showing 8 recent or high-signal highlights out of 19 archived docs:

| Doc | Status Snapshot |
|-----|-----------------|
| [0.36.2 polish bundle](archived/polish-0362.md) | Archived: Implementation + tests complete (863/863 passing). Pending audit-doc update, plan archive, and `npm version patch`. |
| [Modules Dashboard (F16)](archived/modules-dashboard.md) | Archived: Phases 1-5 shipped. Tests green (844/844). CHANGELOG drafted for 0.36.0. |
| [A4 — per-field unidirectional refs](archived/a4-unidirectional-refs.md) | Archived: Phases 1-3 shipped. Tests green (836/836). `dotmd check` warnings: 7 → 0. README + CHANGELOG drafted for 0.35.0. |
| [Agent UX fixes — A1, A2, A3](archived/agent-ux-a1-a3.md) | Archived: Plan drafted. Spec lives in the audit doc; this plan sequences and bounds the work. |
| [`/baton` slash command](archived/baton-slash-command-20260525T221316Z.md) | Archived: Phases 1+2 shipped — baton.md template + wiring landed in src/claude-commands.mjs; tests green (809/809). Awaiting Phase 3 release decision. |
| [Slash commands self-heal](archived/slash-commands-self-heal.md) | Archived: Phases 1+2 shipped. `refreshStaleSlashCommands` helper added, wired into `runHud`, dogfooded against this repo (v0.31.4 → v0.32.1 refresh fired). Tests green (813/813, +4 new). |
| [Fix Init Silent Claude Commands Rewrite](archived/fix-init-silent-claude-commands-rewrite.md) | Archived: Discovered during dogfood audit on 2026-05-23 — `dotmd init` silently regenerates `.claude/commands/{plans,docs}.md` from older versions but reports nothing in its create/update/exists output, and dry-run omits them entirely. |
| [Fix Stale `next` Command In Generated Slash Commands](archived/fix-stale-next-command-in-generated-slash-cmds.md) | Archived: Discovered during dogfood audit on 2026-05-23 — the regenerated `.claude/commands/plans.md` (v0.31.0) lists `dotmd next` as a real command, but it doesn't exist (`Unknown command: next. Did you mean dotmd new?`). |

- Use `dotmd list` or `dotmd json` for the full inventory.
<!-- GENERATED:dotmd:end -->
