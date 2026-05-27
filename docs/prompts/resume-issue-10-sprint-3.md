---
type: prompt
status: pending
created: 2026-05-27T00:56:37Z
updated: 2026-05-27T00:56:37Z
dotmd_version: 0.39.4
context: "Resume Issue 10 Sprint 3"
related_plans:
---

Continue issue #10 (`gh issue view 10`) — sprint 3. Sprints 1 + 2 shipped in **0.39.3** and **0.39.4**.

Sprint 3 carries the three findings deferred at the sprint-2 scoping pass. **Re-verify each before coding** — sprint 1's #11 reframe showed not every claim in #10 stays accurate after a closer look.

1. **#7 `dotmd doctor --frontmatter-fix`.** The cheapest of the three and the most clearly framed in the issue. Long `current_state` (>500) / `next_step` (>300) warnings are reported but not auto-fixable. Add a flag that truncates the offending field to ~300/200 chars and appends the remainder to the body (either prepend a `## Current state` / `## Next step` section, or append to an existing one). Audit `src/doctor.mjs` and the warning emitter in `src/validate.mjs` first to confirm the trigger threshold + which fields qualify.

2. **#6 deterministic prompt-archive paths.** Currently `dotmd prompts use foo` lands at `archived/foo.md`, but a second consume of the same slug lands at `archived/foo-20260526T224855Z.md` (timestamp on collision). Pick ONE consistent rule. Two cheap options: (a) always-timestamp (deterministic but verbose), or (b) numeric suffix (`foo.md`, `foo-2.md`, …). Look at `runArchive`'s `uniqueArchiveTarget` for current behavior — find call site in `src/lifecycle.mjs`.

3. **#5 `dotmd archive --closeout-template`.** Highest scope of the three; consider deferring. Per CLAUDE.md the closeout workflow is "write a `## Closeout` section, then archive" — but the CLI offers no scaffold. Options: a `--closeout-template` flag that injects a skeleton at archive time, OR a `dotmd new closeout <plan>` subcommand. Decide which before designing — they have different ergonomics.

Recommended order: #7 → #6 → #5 (cheapest first). All merge-independent → 3 commits. When done: `npm version patch` → 0.39.5.

Sprint 2 leftover none — clean tree, all committed.

