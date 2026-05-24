---
type: prompt
status: pending
created: 2026-05-24T03:19:45Z
updated: 2026-05-24T03:25:00Z
dotmd_version: 0.31.0
context: "Audit Followup"
related_plans:
  - ../archived/fix-init-silent-claude-commands-rewrite.md
  - ../archived/fix-stale-next-command-in-generated-slash-cmds.md
---

# Dotmd self-dogfood audit — 2026-05-23

> Triage the 10 findings below into per-fix plans before tackling the rest. Listed in suggested fix order (most-leveraged first). Two are already scaffolded under `docs/plans/`; one is already fixed.

The dotmd repo was init'd against its own CLI for the first time on 2026-05-23. Running every read command + lifecycle command on the fresh tree surfaced these issues. Each is either a UX bug, a self-inconsistency, or a default-config gap that makes the tool fail its own validators out of the box.

## Findings

1. ~~**Plan template writes `surfaces:`/`modules:` (plural) but `stats`/`coverage` read `surface`/`module` (singular).**~~ **fixed.** `src/index.mjs:162-164` already merges singular into the plural array — that's the canonical form. Updated the four readers that still consulted the singular field: `stats.mjs` (hasSurface/hasModule), `validate.mjs` (module-required check), `render.mjs` (coverage), `export.mjs` (md + html). `graph.mjs` JSON now emits both. Regression tests in `test/stats.test.mjs` and `test/render.test.mjs` cover plural-only docs.

2. ~~**Default `init` config has no `referenceFields`**~~ **fixed.** Added `referenceFields: { bidirectional: ['related_plans', 'related_docs'], unidirectional: ['parent_plan'] }` to both `DEFAULTS` in `src/config.mjs` (so any existing config without an explicit `referenceFields` block inherits the new defaults) and to `STARTER_CONFIG` in `src/init.mjs` (for discoverability — users see the wiring in their own config file). `graph` and `deps` now work out-of-box. Regression test in `test/init.test.mjs` asserts a fresh init produces a config where two cross-referencing plans produce a `related_plans` edge in `graph --json`. Note: `pickup`'s `Related:` resolver still says `(missing)` for same-dir siblings — that's finding 9, a separate same-dir resolution bug; refs across directories require relative paths (e.g. `../plans/foo.md`).

3. ~~**`dotmd prompts new` creates a file that immediately fails `check`**~~ **fixed.** Did both: prompt template in `src/new.mjs` now writes `updated: ${d}` (matches plan/doc templates; `archive` already bumps `updated` on consume), and the validator in `src/validate.mjs` exempts `type: prompt` from the `title` and `summary` warnings — the prompt format is intentionally body-only, the slug names it, the body IS the payload. Regression test in `test/new.test.mjs` asserts a freshly-created prompt passes `dotmd check` with no errors/warnings.

4. ~~**`init` + first `new plan` immediately fails `check`**~~ **fixed.** Mirrored what `archive` and `status` (on archive crossings) already do: `runNew` in `src/new.mjs` now regenerates the index block after writing the new doc. Best-effort wrapped in try/catch — index failures don't undo a successful create, only warn with the `dotmd index --write` recovery command. Regression test in `test/init.test.mjs`: `init` → `new plan` → `check` no longer reports a stale index.

5. ~~**`dotmd archive` fails on uncommitted files**~~ — **fixed in 54f8ba9.** `gitMv` in `src/git.mjs` now checks `git ls-files --error-unmatch` and falls back to `fs.renameSync` when the source is untracked (or repoRoot isn't a git repo). Same fallback applies to `runStatus`'s archive/unarchive paths and to `dotmd rename`. Tests added in `test/git.test.mjs`. The empty `docs/archived/` dir left behind on other failure modes is unaddressed and not worth a follow-up unless it bites.

6. ~~**Generated `.claude/commands/plans.md` references `dotmd next`**~~ **fixed.** Replaced `dotmd next` with `dotmd actionable` in `src/claude-commands.mjs` (the closest real preset — filters to `status: active,ready` AND `has-next-step`, exactly the original "ready plans with next steps (what to promote)" intent). Extracted `KNOWN_COMMANDS` from `bin/dotmd.mjs` into `src/commands.mjs` so the bin's unknown-command suggester and the new regression test share one source of truth. Regression test in `test/claude-commands.test.mjs` parses every backtick `dotmd <verb>` from both generated templates and asserts each verb is in `KNOWN_COMMANDS` — prevents future template drift. Scaffolded plan `fix-stale-next-command-in-generated-slash-cmds.md` archived.

7. ~~**`dotmd init` silently regenerates `.claude/commands/{plans,docs}.md`**~~ **fixed.** Investigation surfaced a worse companion bug: `runInit` took no `dryRun` param at all — `dotmd init -n` ignored the flag and actually wrote everything. Fixed both: `runInit` now accepts and threads `{ dryRun }`, every `writeFileSync` / `mkdirSync` is gated, every output line is prefixed `[dry-run]` when previewing. `scaffoldClaudeCommands` accepts `{ dryRun }` too. The init report loop now handles all four slash-command outcomes (`created`/`updated`/`current`/`skipped`) instead of just two — refreshing from an older banner now prints `update .claude/commands/X (vA → vB)` and user-managed (no-marker) files now print `skip .claude/commands/X (no version marker — user-managed)`. Three regression tests in `test/init.test.mjs`. Scaffolded plan `fix-init-silent-claude-commands-rewrite.md` archived.

8. ~~**`dotmd briefing` reports `Errors: 1` with no detail**~~ **fixed.** Briefing's stats line now renders `Errors: 1 (run \`dotmd check\` to see)` whenever the count is non-zero — dimmed so the clean-state line (`Errors: 0`) stays untouched. Regression tests in `test/doctor.test.mjs` cover both branches (hint when errors exist, no hint when zero).

9. ~~**`pickup`'s `Related:` resolver shows sibling plan as `(missing)`**~~ **fixed.** Pickup-card was using `resolveDocPath`, which only tries repo-root and docsRoots-relative — never doc-relative. So a bare basename like `sibling.md` in `docs/plans/foo.md`'s `related_plans:` always rendered `(missing)`, even though graph and validate resolved the same ref fine via `resolveRefPath` (doc-relative → repo-relative). Switched `readRelatedSummary` to `resolveRefPath(refStr, docDir, repoRoot) ?? resolveDocPath(refStr, config)` so doc-relative wins, with docsRoots kept as a final fallback for legacy/typed refs. Regression test in `test/pickup-card.test.mjs` ('resolves same-dir related_plans basename refs'). End-to-end verified on a fresh repo: bare-basename ref now renders `↔ docs/plans/sibling.md (active)` instead of `(missing)`.

10. ~~**`dotmd doctor` numbered steps are `1, 2, 3, 4, 6`**~~ **fixed.** Step 5's heading was conditional on having `.claude/commands/*` changes to report. Step 4's heading was also conditional on `config.indexPath` (would skip silently on configs without an index) — the audit only saw the step-5 variant. Both headings now always print, with a status body line ("Nothing to refresh." / "No index path configured (skip).") so the numbering is contiguous regardless of what's actually wired up. Regression test in `test/doctor.test.mjs` walks the stdout and asserts steps 1–6 appear in order on a config with no `.claude/` dir and no index path — the worst-case repo for the pre-fix bug.

11. ~~**Fresh `dotmd init` skips slash-command scaffolding when there's no pre-existing config.**~~ **fixed.** `runInit` is now async and re-resolves the config from disk after the file-write phase — so it picks up STARTER_CONFIG (just written this run) or any pre-existing config uniformly. The dispatcher's `config.configFound ? config : null` ternary was the symptom carrier and is gone; runInit ignores its `config` arg in the slash-command block now. Dry-run path still works: a fresh-repo dry-run resolves to merged DEFAULTS, which is enough for the preview line — and `dotmd init -n` now correctly previews the `.claude/commands/*` lines that were silently missing before. Regression test in `test/init.test.mjs` ('scaffolds .claude/commands on fresh init with no pre-existing config') deliberately omits the pre-seeded config the older test had to plant as a workaround.
