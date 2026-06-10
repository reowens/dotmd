---
type: plan
status: archived
created: 2026-06-10T07:45:49Z
updated: 2026-06-10T08:17:50Z
surfaces: [cli]
modules: [cli, render]
domain: agent-ux
audience: internal
parent_plan: docs/plans/agent-ux-round-b.md
related_plans:
related_docs:
current_state: Closed. Phase 1 (exit codes) refuted — the exit-0 readings were a `| head` pipe artifact; everything already exits 1. Phase 2 (live-first briefing headline) shipped with 2 tests.
next_step:
---

# B2 Exit Codes And Briefing Wording

> Unknown-command and non-TTY missing-args paths must exit 1 (agents branch on exit codes); briefing headline should count live plans, not archived ones.

## Problem

Two error paths exit 0, and the briefing headline contradicts `dotmd plans`. Verified 2026-06-10:

- `dotmd plnas` → prints ``Did you mean `dotmd plans`?`` but **exits 0**
- `dotmd new plan` (no name, non-TTY) → prints usage, **exits 0**
- `dotmd briefing` opens with "24 plans: 24 archived" while `dotmd plans` says "No plans found."

Agents and hooks branch on exit codes: a zero exit on a no-op reads as success, so the agent proceeds believing the command ran. And "24 plans" skims as live work when zero plans are live.

## Goals

- Unknown command → exit 1 (keep the did-you-mean hint).
- Missing required args in non-TTY mode → exit 1 with usage (sweep all interactive-prompt fallbacks: `new`, `set`/`status`, `rename`).
- Audit other usage-print-and-exit-0 paths in `bin/dotmd.mjs`.
- Briefing headline counts live plans first: e.g. `0 live plans (24 archived)` — adjust `src/summary.mjs`/`src/render.mjs` wherever the count line renders.

## Non-Goals

- Changing exit semantics of successful-but-empty results (`dotmd plans` with no plans is still exit 0 — empty is not an error).

## Phases

### Phase 1 — exit codes ⏭
Dispatcher + non-TTY arg validation. Tests assert exit codes via `node:test` subprocess runs.

### Phase 2 — briefing wording ✅
Live-count-first headline; keep `--json` shape backwards compatible (add a `live` count field rather than renaming).

## Closeout

- **Phase 1 refuted, not fixed.** The exit-0 finding was a measurement artifact in the original review: the probe ran `dotmd plnas | head -8; echo $?`, so `$?` reported `head`'s exit status, not dotmd's. Re-verified without the pipe: unknown command, `new` with missing args, `set`/`rename`/`archive` with no args, and `use` on a miss **all already exit 1** — every `die()` funnels through the `main().catch` in `bin/dotmd.mjs`, which sets `process.exitCode = 1` unconditionally. No code change needed or made. (Lesson for future audits: never read `$?` after a pipe.)
- **Phase 2 shipped.** `renderBriefing` (`src/render.mjs`) now counts live plans first — `5 live plans (25 archived): 1 active, …`, or `0 live plans (24 archived)` when everything is closed. "Live" mirrors the `dotmd plans` filter exactly: not in `archiveStatuses`/`terminalStatuses` and not physically under `archived/` (path is source of truth, per issue #13).
- The `--json` shape was untouched (the headline is text-render only; `agent-context`/`context --json` already expose per-status counts).
- Tests: 2 new integration cases (live-first headline, all-archived headline); suite at 1049 passing.
