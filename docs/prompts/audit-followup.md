---
type: prompt
status: pending
created: 2026-05-24T03:19:45Z
updated: 2026-05-24T03:20:30Z
dotmd_version: 0.31.0
context: "Audit Followup"
related_plans:
  - fix-init-silent-claude-commands-rewrite.md
  - fix-stale-next-command-in-generated-slash-cmds.md
---

# Dotmd self-dogfood audit — 2026-05-23

> Triage the 10 findings below into per-fix plans before tackling any of them. Two are already scaffolded under `docs/plans/`.

The dotmd repo was init'd against its own CLI for the first time on 2026-05-23. Running every read command + lifecycle command on the fresh tree surfaced these issues. Each is either a UX bug, a self-inconsistency, or a default-config gap that makes the tool fail its own validators out of the box.

## Findings

1. **`dotmd init` silently regenerates `.claude/commands/{plans,docs}.md`** — both dry-run and real-run output omit them entirely; the user sees nothing about the slash-command files even when they change. → scaffolded as `docs/plans/fix-init-silent-claude-commands-rewrite.md`.

2. **Generated `.claude/commands/plans.md` references `dotmd next`** which doesn't exist (`Unknown command: next. Did you mean dotmd new?`). The slash command doc actively misleads agents. → scaffolded as `docs/plans/fix-stale-next-command-in-generated-slash-cmds.md`.

3. **`dotmd briefing` reports `Errors: 1` with no detail** — user must know to run `dotmd check` separately to see what the error is. Suggest: `Errors: 1 (run \`dotmd check\` to see)`.

4. **`init` + `new plan` immediately fails `check`** — `docs/docs.md` index block is stale right after the first plan is created. Either `new` should auto-rebuild the index, or `check` should treat a stale index as auto-fixable rather than an error.

5. **Default plan template writes `surfaces:`/`modules:` (plural) but `stats`/`coverage` read `surface`/`module` (singular).** `dotmd list --json` shows both fields side by side: `"surface": null` AND `"surfaces": ["cli"]`. The tool writes data its own readers ignore. Pick one name and fix the other side.

6. **Default `init` config has no `referenceFields`** but the default plan template scaffolds `related_plans:`, `related_docs:`, `parent_plan:` frontmatter. Result: `graph`, `deps`, `unblocks` are all dead on arrival until the user manually configures `referenceFields`. Fix: ship sensible defaults in `init` config.

7. **`dotmd doctor` numbered steps are `1, 2, 3, 4, 6`** — `5.` is skipped. Cosmetic but visible.

8. **`pickup` `Related:` resolver shows sibling plan as `(missing)`** even though `related_plans: - fix-stale-next-command-in-generated-slash-cmds.md` references a file in the same directory. Likely needs same-dir filename resolution (or full paths). Same root cause as #6.

9. **`dotmd archive` fails on uncommitted files** — `fatal: not under version control, source=docs/plans/throwaway-lifecycle-test.md`. Uses `git mv` without fallback. Common workflow (scaffold → archive on second thought) is broken. Also leaves an empty `docs/archived/` dir behind after failure.

10. **`dotmd prompts new` creates a file that immediately fails `check`** — missing `updated:`, missing `title`, missing `summary`. Either prompt template should populate those, or `check` should exempt `type: prompt` from those rules. Out-of-the-box, the tool's own outputs fail its own validators.

## Recommended order

- Fix #5 first (template/reader name mismatch — affects all the others)
- Then #6 (default `referenceFields`) — unblocks graph/deps/unblocks/related
- Then #10 + #4 (the "tool's own outputs fail validators" pair)
- Then #9 (archive bug — workflow breaker)
- Then #2 (lie in generated slash command)
- Then #1, #3, #7, #8 (UX papercuts)
