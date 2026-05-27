---
type: prompt
status: pending
created: 2026-05-27T02:47:48Z
updated: 2026-05-27T02:47:48Z
dotmd_version: 0.39.8
context: "Resume Dotmd Backlog"
related_plans:
---

Resume the dotmd backlog. State (2026-05-26 evening):

**Shipped this session:**
- 0.39.7 — F19 runlist primitive (`dotmd runlist <hub>` / `runlist next <hub>`, `runlist:` field, back-pointer validator).
- 0.39.8 — F21 reorder `dotmd new --help` so `@path`/`-` come before inline, plus PreToolUse-hook agent tip (closes issue #11).

**Queued plans (`docs/plans/`):**
- `command-aliases.md` (F20) — `prompt`↔`prompts` + `resume`↔`use` aliases. Cheapest, decisive. Default next.
- `hud-reads-journal.md` (F17b) — three new hud sections from journal data; window has elapsed.
- `die-self-correcting-hints.md` (F17c) — verbose hint on repeat-failure argv; downstream of F17b but independent.
- `filed-primitive.md` (F15) — `archive: true` → sugar for `filed: true + terminal: true`. Biggest. **`/tmp/` spike REQUIRED before commit.**

**Where to look:** `docs/audit-beyond-platform.md` top status line lists ship/scope state; each plan body has locked decisions, scope estimate, key files, gotchas. Don't re-derive — pick up and execute.

**State:** no lease held; working tree clean; on `main`.

**Next decision:** `dotmd pickup docs/plans/command-aliases.md` (recommended) — or pick a different one from the queue if priorities shifted.

**Memory reminders:** SIMPLE concrete proposals (no multi-option design). "ready to X?" is a question, not a directive. Agent-first lens on every UX call.

