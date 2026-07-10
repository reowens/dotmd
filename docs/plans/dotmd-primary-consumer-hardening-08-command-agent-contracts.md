---
type: plan
status: planned
created: 2026-07-10T05:53:02Z
updated: 2026-07-10T05:53:02Z
parent_plan: dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: Audit F8 confirmed duplicated command metadata, silent roadmap grammar drift, and command-local flag ownership loss. Notion removal lands first so the schema inventories the intended command surface once; agent-context concerns live in their own downstream child.
next_step: Inventory every dispatched command, alias, positional form, option, and arity into a declarative schema while preserving current execution handlers.
---

# Command Schema Contracts

> Runlist child of [Dotmd Primary Consumer Hardening](dotmd-primary-consumer-hardening.md).

## Problem

Command names, flags, help, completions, and grammar are maintained separately. Drift tests derive expectations from incomplete registries, allowing silently wrong grammar to pass.

## Phases

### Phase 1 - Declarative Command Inventory ⬜

- Add one schema for commands, aliases, positional forms, subcommands, options/arity, visibility, and help groups.
- Derive `KNOWN_COMMANDS`; validate duplicate/malformed schema entries.
- Leave execution handlers in the dispatcher.

### Phase 2 - Incremental Parser Ownership ⬜

- Normalize roadmap forms and reject extra/unknown arguments.
- Define global-before-command versus command-local-after-command option precedence.
- Restore `bulk-tag --type` and migrate command families incrementally to strict validation.

### Phase 3 - Generated Syntax Surfaces ⬜

- Generate completion command/subcommand/options and baseline help from the schema.
- Retain hand-authored semantic prose without restating syntax inventories.
- Remove parallel flag/command tables after conformance tests cover all handlers.

## Acceptance

- Every dispatched public command appears in schema/help/completions exactly once.
- Both roadmap next forms mutate correctly; invalid flags fail nonzero.
- Missing values and extra positionals fail before handler execution.
- `bulk-tag --type plan` reaches the command-local override while global `--type` remains compatible.
- No command remains on permissive legacy validation at completion.


## Version History

- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
