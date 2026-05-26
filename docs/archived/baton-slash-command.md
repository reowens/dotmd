---
type: prompt
status: archived
created: 2026-05-24T22:40:25Z
updated: 2026-05-25T21:22:33Z
dotmd_version: 0.32.1
context: "Baton Slash Command"
related_plans:
---

Build the `/baton` slash command per `docs/plans/baton-slash-command.md`.

The plan captures: problem, surface, decisions, constraints, phases (template + tests + release), deferred items. Read it.

Next decision when picking up: confirm `baton.md` template lives alongside existing slash-command templates (likely `src/init.mjs` `scaffoldClaudeCommands`), then execute Phase 1. Honor `[[feedback-one-handoff-prompt-per-session]]` when writing the slash-command body — short, Claude-driven, ~10-20 lines.

Bundle release with modules-dashboard + agent-UX A1/A2/A3 if shipping together (0.33.0).

