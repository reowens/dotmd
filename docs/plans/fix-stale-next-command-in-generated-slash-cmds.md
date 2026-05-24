---
type: plan
status: active
created: 2026-05-24T03:17:26Z
updated: 2026-05-24T03:17:26Z
surfaces:
  - cli
modules:
  - init
  - doctor
domain:
audience: internal
parent_plan:
related_plans:
  - fix-init-silent-claude-commands-rewrite.md
related_docs:
current_state: Discovered during dogfood audit on 2026-05-23 — the regenerated `.claude/commands/plans.md` (v0.31.0) lists `dotmd next` as a real command, but it doesn't exist (`Unknown command: next. Did you mean dotmd new?`).
next_step: Find the template/template-string in `src/init.mjs` (or wherever .claude/commands content is generated) and either remove `dotmd next` or replace with `dotmd plans --status active`.
---

# Fix Stale `next` Command In Generated Slash Commands

> Generated slash-command docs reference a command that doesn't exist, sending agents down a dead end.

## Problem

The slash command template that `dotmd init` / `doctor` writes to `.claude/commands/plans.md` lists:

```
- `dotmd next` — ready plans with next steps (what to promote)
```

But `dotmd next` is not a registered command:

```
$ dotmd next
Unknown command: next

Did you mean `dotmd new`?
```

This is the dotmd tool actively misleading Claude sessions about its own surface. An agent following the slash command doc will hit a dead end.

The likely intent: `dotmd plans --status active` or `dotmd query --type plan --has-next-step` — both real. Need to confirm what `next` was originally meant to be (maybe it existed in 0.11 and was deleted), then replace.

## Goals

- `.claude/commands/plans.md` template references only real commands.
- Add a test that asserts every backtick command line in the templates parses through the CLI dispatcher.

## Non-Goals

- Resurrecting a `dotmd next` command. If it was deleted intentionally, leave it deleted.

## What Exists Today

- The slash-command template literal lives somewhere in `src/init.mjs` or a sibling. Need to grep.
- Help output (current) lists: hud, list, briefing, context, focus, query, plans, prompts, stale, actionable, stats, health, coverage, graph, deps, unblocks, diff, summary, glossary, check, doctor, lint, fix-refs, pickup, release, finish, status, archive, bulk, touch, rename, migrate, new, index, export, notion, init, statuses, watch, completions. No `next`.

## Constraints

- Whatever replaces `dotmd next`, its description should match what the line was trying to convey: "ready plans with next steps (what to promote)" — probably `dotmd actionable` or `dotmd query --type plan --status active --has-next-step`.

## Decisions

## Open Questions

- Was `dotmd next` ever a real command? `git log -S "next: " src/` should show its removal commit and what replaced it.

## Phases

### Phase 1 — Grep + git-archaeology ⬜

- Find the template string in src/.
- `git log -S "dotmd next"` to find when it was added vs. when the command was removed.

### Phase 2 — Replace with a real command ⬜

- Choose the closest real equivalent.
- Update template literal.

### Phase 3 — Self-check ⬜

- Add a test that extracts every backtick `dotmd <verb>` from the template strings and asserts each `<verb>` is a known command in the CLI dispatcher.

## Deferred

## Version History

- **2026-05-24T03:17:26Z** Created during dogfood audit.

## Closeout

<!-- Filled on archive: what shipped, key commits, deferrals dispositioned. -->
