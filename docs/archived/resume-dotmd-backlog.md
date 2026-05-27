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

**Backlog (filed but not yet scoped into plans):**
- **F22** — `dotmd hud` calls full-validation `buildIndex` just for an error count. Measured on platform: 1013ms → 164ms (6.2×) with `fast: true` + targeted `checkIndex`. ~10 LOC fix; preserves error-count fidelity. P3 perf, 0.39.x patch. Easy follow-on if you want a quick win before tackling F20.

**Where to look:** `docs/audit-beyond-platform.md` top status line lists ship/scope state; each plan body has locked decisions, scope estimate, key files, gotchas. Don't re-derive — pick up and execute.

**State:** no lease held; working tree clean; on `main` (last commit `c0b1754`).

**Next decision:** `dotmd pickup docs/plans/command-aliases.md` (recommended) — or knock out F22 first as a cheap warm-up — or pick something else from the queue.

**Release heuristic (learned this session):** `package.json.files` = `["bin/", "src/", "dotmd.config.example.mjs"]`. Only bump versions when one of those changed — doc-only commits (audit, plans, prompts, CLAUDE.md) ship in git but produce identical npm payloads if released.

**Memory reminders:** SIMPLE concrete proposals (no multi-option design). "ready to X?" is a question, not a directive. Agent-first lens on every UX call.

