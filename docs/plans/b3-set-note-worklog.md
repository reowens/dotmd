---
type: plan
status: planned
created: 2026-06-10T07:45:49Z
updated: 2026-06-10T07:47:01Z
surfaces: [cli]
modules: [cli, lifecycle]
domain: agent-ux
audience: internal
parent_plan: docs/plans/agent-ux-round-b.md
related_plans:
related_docs:
current_state: Drafted from the 2026-06-10 review.
next_step: Add --note to set/archive, appending a dated Version History line.
---

# B3 Set Note Worklog

> Add --note to set/archive so a closure writes its Version History line in the same atomic call, instead of set + manual Edit.

## Problem

Closing a plan is in practice always two tool calls: `dotmd set <status> <file>` plus a separate Edit to append a worklog line (`## Version History` entry, or the "tail tracked in <successor>" note that the `partial` convention requires). For the single most common lifecycle operation, that's a wasted round-trip — and the successor-reference convention for `partial` is currently unenforceable because it lives in a hand-Edit.

## Goals

- `dotmd set <status> <file> --note "..."` appends a dated line to `## Version History` in the same atomic operation (lifecycle already knows how to create the section if missing — reuse that path).
- Note format mirrors the existing Version History convention: `**<ISO date>** <status-change>: <note>`.
- `dotmd archive <file> --note "..."` gets the same flag (archive is sugar for `set archived`).
- Stretch: when `set partial` runs *without* `--note` and the body contains no successor reference, print a one-line reminder of the convention (warn, don't block).

## Non-Goals

- A general body-editing primitive (sections, checkboxes). Version History append is the one high-frequency case; the plan card's line-numbered outline already serves targeted Edits for everything else.

## Phases

### Phase 1 — --note on set/archive ⬜
Flag parsing in `bin/dotmd.mjs`, append logic in `src/lifecycle.mjs`/`src/update.mjs`, `--dry-run` shows the would-be line. Tests: note lands under existing section, section created when missing, dry-run writes nothing.

### Phase 2 — partial-closure reminder ⬜
Successor-reference heuristic (any `docs/plans/` link or `related_plans` entry added) + warn. Keep it advisory.
