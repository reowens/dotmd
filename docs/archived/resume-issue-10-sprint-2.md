---
type: prompt
status: archived
created: 2026-05-27T00:09:41Z
updated: 2026-05-27T00:25:33Z
dotmd_version: 0.39.3
context: "Resume Issue 10 Sprint 2"
related_plans:
---

Continue issue #10 (`gh issue view 10`) — sprint 2. Sprint 1 shipped in **0.39.3** (commits `9c3cfb3`, `39679b2`, `d0bb3e1`):
- #3 `--no-index` flag on lifecycle verbs
- #9 `--show-files` footer on mutation commands
- #2 `blocked_by` accepted as alias for `blockers`
- #4 prompt body-input modes documented in CLAUDE.md

Sprint 2 items (from the earlier scoping pass — also closed out: #2 + #4 docs, deferred: #5 #6 #7 = sprint 3):

1. **P2 = #1 + #11 combined.** Lowest-risk #1 fix: improve the error at `src/lifecycle.mjs:231` so `dotmd pickup` on a `partial`/`paused`/`awaiting` plan prints the exact two-step recovery (`Cannot pick up status 'X'. Run: dotmd status <file> active && dotmd pickup <file>`). Defer the `--from <status>` flag pending real-world demand. For #11: audit `runArchive`'s dry-run block (around `src/lifecycle.mjs:538`) — it doesn't preview the lease release or hook fire. `consumePrompt` dry-run also silently skips body emission preview.

2. **P4 = #8 `dotmd prompts list --verbose`.** Append target-plan ref inline. In `src/prompts.mjs:32` `runPromptsList`, when `--verbose` is set, read each prompt body and append `→ docs/plans/<target>.md` from the first markdown link or `related_plans` frontmatter entry.

3. **P5 = #10 `dotmd help statuses` aggregator.** Single-source-of-truth for status vocab. New help topic that prints per-type (plan/doc/prompt) status definitions + unstuck-actions + canonical transitions. Pure docs surface, no behavior change. Aggregate from `BUILTIN_TYPES` and the existing per-status one-liners in `bin/dotmd.mjs`.

Recommended order: P5 → P4 → P2 (cheapest first; all merge-independent → 3 commits). **Re-verify each finding before coding** — sprint 1's #11 reframe showed not all of issue #10's claims are fully accurate.

When done: `npm version patch` → 0.39.4. None of these break anything.

