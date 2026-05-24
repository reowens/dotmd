---
type: prompt
status: pending
created: 2026-05-24T03:19:45Z
updated: 2026-05-24T03:25:00Z
dotmd_version: 0.31.0
context: "Audit Followup"
related_plans:
  - fix-init-silent-claude-commands-rewrite.md
  - fix-stale-next-command-in-generated-slash-cmds.md
---

# Dotmd self-dogfood audit — 2026-05-23

> Triage the 10 findings below into per-fix plans before tackling the rest. Listed in suggested fix order (most-leveraged first). Two are already scaffolded under `docs/plans/`; one is already fixed.

The dotmd repo was init'd against its own CLI for the first time on 2026-05-23. Running every read command + lifecycle command on the fresh tree surfaced these issues. Each is either a UX bug, a self-inconsistency, or a default-config gap that makes the tool fail its own validators out of the box.

## Findings

1. **Plan template writes `surfaces:`/`modules:` (plural) but `stats`/`coverage` read `surface`/`module` (singular).** `dotmd list --json` shows both fields side by side: `"surface": null` AND `"surfaces": ["cli"]`. The tool writes data its own readers ignore. Pick one name and fix the other side. **Highest leverage** — affects findings 2, 9 transitively.

2. **Default `init` config has no `referenceFields`** but the default plan template scaffolds `related_plans:`, `related_docs:`, `parent_plan:` frontmatter. Result: `graph`, `deps`, `unblocks`, and `pickup`'s `Related:` resolver are all dead on arrival until the user manually configures `referenceFields`. Fix: ship sensible defaults in `init` config.

3. **`dotmd prompts new` creates a file that immediately fails `check`** — missing `updated:`, missing `title`, missing `summary`. Three check failures the moment you save your first prompt. Either prompt template should populate those, or `check` should exempt `type: prompt`. Out-of-the-box, the tool's own outputs fail its own validators.

4. **`init` + first `new plan` immediately fails `check`** — `docs/docs.md` index block is stale right after the first plan is created. Either `new` should auto-rebuild the index, or `check` should treat a stale index as auto-fixable rather than an error.

5. ~~**`dotmd archive` fails on uncommitted files**~~ — **fixed in 54f8ba9.** `gitMv` in `src/git.mjs` now checks `git ls-files --error-unmatch` and falls back to `fs.renameSync` when the source is untracked (or repoRoot isn't a git repo). Same fallback applies to `runStatus`'s archive/unarchive paths and to `dotmd rename`. Tests added in `test/git.test.mjs`. The empty `docs/archived/` dir left behind on other failure modes is unaddressed and not worth a follow-up unless it bites.

6. **Generated `.claude/commands/plans.md` references `dotmd next`** which doesn't exist (`Unknown command: next. Did you mean dotmd new?`). The slash command doc actively misleads agents. Scaffolded as `docs/plans/fix-stale-next-command-in-generated-slash-cmds.md`.

7. **`dotmd init` silently regenerates `.claude/commands/{plans,docs}.md`** — both dry-run and real-run output omit them entirely; the user sees nothing about the slash-command files even when they change. Scaffolded as `docs/plans/fix-init-silent-claude-commands-rewrite.md`.

8. **`dotmd briefing` reports `Errors: 1` with no detail** — user must know to run `dotmd check` separately to see what the error is. Suggest: `Errors: 1 (run \`dotmd check\` to see)`.

9. **`pickup`'s `Related:` resolver shows sibling plan as `(missing)`** even though `related_plans: - fix-stale-next-command-in-generated-slash-cmds.md` references a file in the same directory. Likely needs same-dir filename resolution (or full paths). Related to finding 2.

10. **`dotmd doctor` numbered steps are `1, 2, 3, 4, 6`** — `5.` is skipped. Cosmetic but visible.
