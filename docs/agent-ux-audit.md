---
type: doc
status: reference
created: 2026-05-24T22:33:02Z
updated: 2026-05-29
modules: [cli, validate, index, lifecycle]
surfaces: [cli]
domain: agent-ux
audience: internal
related_plans:
related_docs: "> docs/audit-beyond-platform.md"
dotmd_version: 0.50.0
---

# Agent UX Audit — 2026-05-24

> Friction points an agent (Claude) hits using dotmd in normal operation. Distinct from `audit-beyond-platform.md` (data-corpus audit against a heavily-customized config); this one is methodology audit — what costs an agent a round-trip during the *process* of using dotmd, regardless of corpus shape.

## Why this audit exists separately

dotmd's primary user is Claude, not a human at a terminal (user positioning, 2026-05-24 session). The cost-of-friction multiplier on an agent is much higher than on a human: every recovery is a tool round-trip, not a keystroke. So findings that read as minor polish under a human-eyeball lens (`dotmd index` printing instead of writing, error messages that don't suggest candidates) are actually high-priority bugs under the agent-as-user lens.

All five findings below were hit in a *single* plan-creation flow during routine work (drafting `docs/plans/modules-dashboard.md`). They aren't edge cases.

## Findings

### A1. `dotmd check` prescribes a fix that doesn't fix. — P1 (footgun) — ✅ shipped 0.34.0

`dotmd check` reports `Generated index block is stale. Run \`dotmd index\`.` Running `dotmd index` (without flags) prints the new block to stdout and **does not update `docs/docs.md`**. The check continues to fail. The actual fix is `dotmd index --write`.

**Why this is severe.** Self-fixing error messages are the contract an agent relies on. When the message lies, the agent doesn't get a second tool call to recover gracefully — it runs the prescribed command, re-checks, sees the same error, and is now in a confused state. The current behavior costs every agent that hits this at least two unnecessary commands plus a help-text read.

**Proposed fix.** Default `dotmd index` to write. Add `--print` for the print-only behavior (which is rarely the actual intent). Alternative: keep print-default but make the check error say `Run \`dotmd index --write\``.

**Recommendation: change the default.** `dotmd index --write` is what an agent almost always wants. The two callers I checked (`runCheck` error message + manual invocation) both want the write. Print-only is a debug/diagnostic mode, not the default action.

### A2. `dotmd new plan` rejects body input, forcing whole-file rewrites. — P1 (common operation) — ✅ shipped 0.34.0

`dotmd new doc <name> "body"` accepts body and lands it under `## Overview` (0.31.4 fix). `dotmd new plan <name>` doesn't. The error is prescriptive (`set acceptsBody: true on your custom plan template in dotmd.config.mjs`) but the resolution requires a config edit, not an inline body argument.

**Why this is severe for agents.** An agent drafting a plan with content is the canonical operation — it's how every plan I've created in any session begins. The workaround is to scaffold an empty file, then `Write` over it with full content. But `Write` requires the agent to re-author the entire frontmatter from scratch, which means:
- The template's frontmatter design (fields like `audience: internal`, `surfaces: [cli]`) is discarded and re-invented in chat.
- Drift across dotmd versions silently breaks plans (the agent has no signal that a v0.32 plan template added a field the agent's hard-coded write didn't include).
- It's a two-step operation where the second step destroys the value of the first.

**Proposed fix.** Make `plan` accept body input. Append it under a designated section (`## Overview` or `## Problem`, mirror what `doc` does). Keep the scaffolded outline below it. The 0.31.4 changelog already established this pattern for `doc` — apply it to `plan`.

**Note: `prompt` already accepts body** (`dotmd new prompt foo "..."` works). The asymmetry isn't justified.

### A3. Ref-resolution errors don't suggest candidates. — P2 (cheap quality-of-life) — ✅ shipped 0.34.0

Wrote `related_docs: audit-beyond-platform.md` in a plan's frontmatter. `dotmd check` reported `does not resolve to an existing file` with no hint. The correct value (`docs/audit-beyond-platform.md`) was one index lookup away — every doc is in the index, and basename matching is cheap.

**Why agents pay extra.** A human reads the error, opens the file tree, sees `docs/audit-beyond-platform.md`, edits the ref. An agent runs `dotmd check`, parses the error, runs a `find` or `grep` to locate the file, edits the ref, re-runs check. The find/grep is a round-trip that dotmd's index already has the data to avoid.

**Proposed fix.** In `src/validate.mjs` ref-resolution errors (and lifecycle/graph by extension), when a ref doesn't resolve, append: `Did you mean: <top-3 basename or substring matches from the index>?` Use simple Levenshtein or basename-substring; ranking quality matters less than just surfacing candidates. The same fix applies to glossary lookups, `--module` filters on unknown modules, and `dotmd module <name>` (the F16 plan already specifies this hint shape for the new `module` verb — generalize).

### A4. Bidirectional-reciprocity warning fires for upstream-parent refs. — P2 (noise that an agent can't cleanly fix) — ✅ shipped 0.35.0

When a plan adds `related_docs: docs/audit-beyond-platform.md` pointing at a parent audit doc, `dotmd check` warns: `references X in related_plans/related_docs, but that doc does not reference back`. To resolve, the agent must edit the parent doc to add a back-ref enumerating every spawned plan.

**Why this is wrong for agents.** Parent → child references make sense to enumerate sometimes (when the parent is a hub doc). But for audit findings → spawned plans, the parent is a stable historical snapshot — the user does NOT want every spawned plan to mutate the audit. The agent has no way to express "this is a one-way upstream reference" without either:
- Editing the parent (which the user implicitly forbids by treating audits as snapshots), or
- Leaving a warning in `dotmd check` forever, polluting the signal-to-noise.

**Proposed fix.** Generalize the unidirectional concept that already exists for `parent_plan` (config: `referenceFields.unidirectional`). Either:
- Per-field config: let users mark `related_docs` as unidirectional globally if their pattern is leaf-references-upstream, OR
- Per-ref opt-out: a `>` prefix convention (e.g. `related_docs: > docs/audit-beyond-platform.md`) declares one-way for that specific ref.

The per-ref convention is more flexible and matches existing markdown-link semantics. Per-field is simpler and probably more useful in practice. Either fixes the noise.

### A5. Two-step scaffold + `Write` loses template design (subsumed by A2). — P3 — ✅ disappeared with A2 in 0.34.0

The workaround for A2 (scaffold empty plan, then `Write` full file) discards the templated frontmatter. The agent must re-author every field, which:
- Is brittle across dotmd versions (template adds a field, agent's hard-coded write doesn't include it, plan validates with missing fields).
- Loses the per-template defaults (`audience: internal`, etc.).
- Doubles the LOC the agent has to author for any non-trivial plan.

**Proposed fix.** Subsumed by A2. If `plan` accepts body, this disappears.

## Meta-pattern

All five findings share one shape: **error messages and command defaults assume a human will read the output, eyeball-validate, and iterate.** None assume the consumer is a tool-using agent paying a round-trip per recovery.

Specific anti-patterns to systematically audit:

1. **"Run X" where running X doesn't fix the problem.** A1 is the example. Other suspects in the codebase to grep for: any `Run \`dotmd ...\`` string in `src/validate.mjs`, `src/check.mjs`, `src/render.mjs`. Each one needs verification that the prescribed command actually resolves what triggered the message.

2. **Mutation defaults that print instead.** A1 is the example. Other suspects: `dotmd doctor` already has the inverse problem (mutates without preview — see audit-beyond-platform F4). Sweep all commands to classify each as "should write by default" or "should preview by default" based on the agent's likely intent.

3. **Errors that mention X but don't suggest candidates for X.** A3 is the example. Other suspects: `Unknown surface 'foo'` (could suggest from taxonomy), `Module 'foo' not found` (already planned for `dotmd module` in F16), `Status 'foo' not in vocab` (could suggest valid statuses).

4. **Templates / scaffolds that resist programmatic body authoring.** A2 is the example. Audit every `acceptsBody: false` (or implicit-false) template.

5. **Validators that warn about state the agent can't cleanly resolve.** A4 is the example. Sweep validators for warnings that require modifying a different doc to fix — those should be opt-in or per-ref-controllable.

## Fix priority

Single-axis ordering, since this audit's whole framing is "agent friction cost":

1. **A1 — `dotmd index` default + check-error truth.** Footgun. ~10 LOC + flip a flag.
2. **A2 — `plan` accepts body.** Common-operation enabler. ~30 LOC + 2 tests.
3. **A3 — ref/glossary/module suggestion hints.** Cheap, broad impact. ~40 LOC across `validate.mjs` + lifecycle + glossary.
4. **A4 — per-field unidirectional refs.** Lower priority, but reasonable. ~50 LOC + config.
5. **A5 — subsumed by A2.**

All five fit in a single 0.33.0 minor bump (additive feature surface + behavior change in `dotmd index` default). The behavior change on `index` is breaking for anyone scripting `dotmd index` expecting stdout — minor bump's `--print` flag preserves the old behavior under a new name. **Document the migration in the CHANGELOG.**

## Suggested next session

Bundle A1 + A2 + A3 as the headline of 0.33.0 (with or without the audit-doc-driven F16 modules dashboard). A1 alone has the highest ROI per LOC of anything in either audit doc. A2 unblocks every future plan-with-body workflow. A3 makes every error message smarter.

A4 + A5 can defer; A4 needs a config schema decision and A5 disappears when A2 ships.

## Post-ship update — 2026-05-25

A1+A2+A3 shipped as 0.34.0 (not 0.33.0 — 0.33.0 was claimed by the `/baton` + slash-command self-heal pair). A5 disappeared with A2 as predicted. A4 graduated from "deferred" to its own active plan (`docs/plans/a4-unidirectional-refs.md`) with the config-schema design call settled in D1: per-ref `>` prefix wins over per-field config — keeps sibling cross-refs reciprocal while letting upstream-parent refs opt out per-ref. Targets 0.35.0.

The Meta-pattern sweep below remains open as a separate follow-up.

## Post-ship update — 2026-05-29

A4 shipped as **0.35.0** (per-ref `>` prefix marks a single ref one-way; reciprocity check skipped for that entry while the field stays bidirectional everywhere else). This doc's own `related_docs: "> docs/audit-beyond-platform.md"` is now using that convention. With A4 landed, **every concrete finding (A1–A5) in this audit has shipped** — the doc moves to `status: reference` as a historical record.

The Meta-pattern sweep was executed 2026-05-29 (results below) — it's now complete and surfaced 6 new findings (M1–M6).

## Meta-pattern sweep results — 2026-05-29 (v0.50.0)

Ran all five anti-pattern dimensions across `src/` + `bin/` (one investigator per dimension, findings verified against source). Dimension D4 (templates resist body) came back **clean** — all built-in types accept body across all input modes and the 0.49.3 non-body guard is complete and fails safe. The other four surfaced six findings:

### M1. `dotmd check` footer prescribes bare `dotmd doctor`, which writes nothing. — P1 (A1 recurrence) — ✅ shipped 0.50.1

`src/render.mjs:496` — the check summary footer (the line every agent reads after a validation run) says *"`dotmd doctor` auto-fixes supported issues."* But since F4/0.37.0, bare `dotmd doctor` runs in **preview/dry-run mode** (`doctorDryRun = explicitDryRun || !explicitApply`, `bin/dotmd.mjs:1327`) and mutates nothing. An agent runs `dotmd doctor`, re-runs `check`, sees identical issues → loops. **This is exactly the A1 anti-pattern** ("Run X where X doesn't fix") in a new spot. **Fix:** the prescription must read `dotmd doctor --apply`.

### M2. Generated agent briefing calls bare `dotmd doctor` the "auto-fix everything" verb. — P1 (A1 recurrence, fleet-wide) — ✅ shipped 0.50.1

`src/claude-commands.mjs:136` injects `- \`dotmd doctor\` — auto-fix everything in one pass (refs, lint, dates, index)` into every repo's generated `.claude/commands/*.md`. Same root cause as M1, but worse blast radius: it ships into every agent's command briefing. **Fix:** `dotmd doctor --apply` (or note "preview by default; `--apply` writes"). The standalone `--help` and command catalog already disclose `--apply` correctly — only these two agent-facing remediation strings drop the flag.

### M3. `dotmd statuses add/set/remove/migrate` silently aborts (exit 0) for non-interactive agents. — P2 (mutation-default footgun)

`src/statuses.mjs` `confirm()` returns `false` whenever stdin isn't a TTY (`:616`), and each gate (`:202,290,359,503`) prints `Aborted.` and returns **exit 0** without `--yes`. An agent running a `statuses` config edit sees a success-looking diff, no write, and a clean exit — it must rediscover that `--yes` is mandatory non-interactively. Lowest-severity of the mutation commands (infrequent, non-destructive, diff shown first; all 21 other mutation commands have sensible defaults). **Fix:** when non-interactive without `--yes`, `die()` with a non-zero exit and a clear message, rather than a silent zero-exit abort.

### M4. `File not found: <input>` errors don't suggest the near-miss doc. — P2 (A3 gap cluster)

A3 added did-you-mean suggestions to surface/module/status/glossary/command errors — all verified still present. But the `File not found: <input>` family (~16 emit sites: `use.mjs:26`, `lifecycle.mjs:337/607/789/…`, `summary.mjs`, `deps.mjs`, `diff.mjs`, `rename.mjs`, `export.mjs`, etc.) states the failure with no candidate hint, even though the index + `suggestCandidates` (already used everywhere else) are cheaply available. **Fix:** one shared `util.mjs` helper (`dieFileNotFound(input, config)`) that appends `Did you mean: <basename matches>?`, applied across the cluster.

### M5. Runlist back-pointer warning ignores the `>` one-way prefix. — P2 (A4 twin, cheap) — ✅ shipped 0.50.1

`checkRunlistBackPointers` (`src/validate.mjs:420-450`) warns a child "appears in runlist of `<hub>` but `parent_plan:` does not point back." This is the structural twin of the A4 bidirectional case — one doc declares the edge, the other gets nagged to reciprocate. The `>` one-way prefix IS parsed for `runlist` entries (it's a reference field, so `refFieldDirections` is populated), but **only `checkBidirectionalReferences` consults it** (`validate.mjs:379-390`); the runlist check reads `hub.refFields?.runlist` directly and never checks direction. **Fix (cheapest):** skip the back-pointer warning when `hub.refFieldDirections.runlist[i] === 'one-way'` — reuses the existing A4 mechanism, no new config.

### M6. Git-staleness warning has no per-doc pin/opt-out. — P3

`checkGitStaleness` (`src/validate.mjs:469`) warns when frontmatter `updated:` is behind git history — git-driven state, and it re-fires whenever any tool touches the file. It's same-doc fixable (`dotmd touch --git` / `doctor` auto-syncs) and gated by `skipStaleFor`, so lower severity, but there's no way to mark a doc's `updated:` as intentionally pinned. **Fix (optional):** a per-doc `updated_pinned: true` (or reuse `skipStale`) that suppresses git-staleness for that doc.

### Sweep verdict

The meta-pattern is mostly closed — D4 clean, and A1/A3/A4 fixes verified holding. The standout is **M1+M2: the A1 "Run X that doesn't fix" footgun recurred for `dotmd doctor`** after F4 made it preview-by-default but the remediation strings weren't updated.

**Shipped 0.50.1:** M1 (`render.mjs` check footer → `dotmd doctor --apply`), M2 (`claude-commands.mjs` generated briefing → `--apply`), and M5 (`checkRunlistBackPointers` now honors the `>` one-way prefix, reusing the A4 mechanism). Regression tests added in `test/render.test.mjs`, `test/claude-commands.test.mjs`, `test/runlist.test.mjs`.

**Still open:** M4 (`File not found:` did-you-mean helper, P2), M3 (`dotmd statuses` non-interactive abort, P2), M6 (git-staleness per-doc pin, P3). Each is a candidate for a fresh `plan` when prioritized.

## Version History

- **2026-05-29** Meta-pattern sweep executed — 6 new findings (M1–M6); D4 clean. M1+M2 are the A1 "Run X that doesn't fix" footgun recurring for `dotmd doctor` (preview-by-default since F4, but remediation strings still say bare `dotmd doctor`).
- **2026-05-29** Post-ship update: A4 shipped as 0.35.0; A1–A5 all shipped; doc moved to `status: reference`.
- **2026-05-25** Post-ship update: A1+A2+A3 shipped as 0.34.0; A4 spawned as its own plan; A5 closed out by A2.
- **2026-05-24T22:33:02Z** Created. Five findings from a single plan-creation flow during routine work; user reframed dotmd's primary audience as Claude (agents), making this audit class first-priority over data-corpus audits.

## Related Documentation

- [`audit-beyond-platform.md`](audit-beyond-platform.md) — sibling audit, data-corpus shape (Beyond's 1,182-doc repo with custom config). All findings (F1–F22) have shipped as of 0.50.0; that doc is now `status: reference`.
- [`plans/modules-dashboard.md`](plans/modules-dashboard.md) — F16 plan from sibling audit; the flow that surfaced these agent-UX findings.
