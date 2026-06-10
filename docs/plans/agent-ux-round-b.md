---
type: plan
status: active
created: 2026-06-10T07:45:49Z
updated: 2026-06-10T07:45:49Z
surfaces: [cli]
modules: [cli]
domain: agent-ux
audience: internal
parent_plan:
related_plans:
related_docs: "> docs/agent-ux-audit.md"
runlist:
  - ../archived/b1-slug-resolution-everywhere.md
  - ../archived/b2-exit-codes-and-briefing-wording.md
  - ../archived/b3-set-note-worklog.md
  - b4-body-keyword-search.md
  - b5-guard-sed-gap-misuse-recap.md
current_state: Runlist hub for the 2026-06-10 round-B agent-UX findings; all five children drafted and queued.
next_step: dotmd runlist next docs/plans/agent-ux-round-b.md (starts b1).
---

# Agent UX Round B

> Runlist hub for the second-round agent-as-user audit (2026-06-10): five verified friction findings against 0.59.0, sequenced b1→b5 by priority.

## Problem

Second-round agent-UX audit (2026-06-10 review session, agent-as-user lens — successor to `docs/agent-ux-audit.md`, whose A1–A5 all shipped). Five new findings, each verified live against 0.59.0, sequenced here as a runlist in priority order:

1. **b1-slug-resolution-everywhere** (P1) — `archive` resolves bare slugs, `use`/`set` don't; no did-you-mean on file args.
2. **b2-exit-codes-and-briefing-wording** (P1) — unknown command and non-TTY missing-args exit 0; briefing headline counts archived plans as "plans".
3. **b3-set-note-worklog** (P2) — every closure is two tool calls (set + Edit for Version History); `--note` makes it one.
4. **b4-body-keyword-search** (P2) — `query --keyword` can't see bodies; dotmd loses to raw grep on "which doc discussed X".
5. **b5-guard-sed-gap-misuse-recap** (P2) — sed/perl status edits bypass the guard; warn-only edit-status shows repeat offenses in the misuse log.

## Goals

- Drain the runlist top-down: `dotmd runlist next docs/plans/agent-ux-round-b.md`.
- Each child archives independently; this hub archives when the list is drained.

## Non-Goals

- In-session orphan detection (already handled — `staleDays: 1` applies pressure the next day).
- JSON output for the plan card (current text card is already token-optimal for agents).
