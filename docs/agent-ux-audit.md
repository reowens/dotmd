---
type: doc
status: active
created: 2026-05-24T22:33:02Z
updated: 2026-05-24T22:33:02Z
modules: [cli, validate, index, lifecycle]
surfaces: [cli]
domain: agent-ux
audience: internal
related_plans:
related_docs: docs/audit-beyond-platform.md
dotmd_version: 0.32.1
---

# Agent UX Audit — 2026-05-24

> Friction points an agent (Claude) hits using dotmd in normal operation. Distinct from `audit-beyond-platform.md` (data-corpus audit against a heavily-customized config); this one is methodology audit — what costs an agent a round-trip during the *process* of using dotmd, regardless of corpus shape.

## Why this audit exists separately

dotmd's primary user is Claude, not a human at a terminal (user positioning, 2026-05-24 session). The cost-of-friction multiplier on an agent is much higher than on a human: every recovery is a tool round-trip, not a keystroke. So findings that read as minor polish under a human-eyeball lens (`dotmd index` printing instead of writing, error messages that don't suggest candidates) are actually high-priority bugs under the agent-as-user lens.

All five findings below were hit in a *single* plan-creation flow during routine work (drafting `docs/plans/modules-dashboard.md`). They aren't edge cases.

## Findings

### A1. `dotmd check` prescribes a fix that doesn't fix. — P1 (footgun)

`dotmd check` reports `Generated index block is stale. Run \`dotmd index\`.` Running `dotmd index` (without flags) prints the new block to stdout and **does not update `docs/docs.md`**. The check continues to fail. The actual fix is `dotmd index --write`.

**Why this is severe.** Self-fixing error messages are the contract an agent relies on. When the message lies, the agent doesn't get a second tool call to recover gracefully — it runs the prescribed command, re-checks, sees the same error, and is now in a confused state. The current behavior costs every agent that hits this at least two unnecessary commands plus a help-text read.

**Proposed fix.** Default `dotmd index` to write. Add `--print` for the print-only behavior (which is rarely the actual intent). Alternative: keep print-default but make the check error say `Run \`dotmd index --write\``.

**Recommendation: change the default.** `dotmd index --write` is what an agent almost always wants. The two callers I checked (`runCheck` error message + manual invocation) both want the write. Print-only is a debug/diagnostic mode, not the default action.

### A2. `dotmd new plan` rejects body input, forcing whole-file rewrites. — P1 (common operation)

`dotmd new doc <name> "body"` accepts body and lands it under `## Overview` (0.31.4 fix). `dotmd new plan <name>` doesn't. The error is prescriptive (`set acceptsBody: true on your custom plan template in dotmd.config.mjs`) but the resolution requires a config edit, not an inline body argument.

**Why this is severe for agents.** An agent drafting a plan with content is the canonical operation — it's how every plan I've created in any session begins. The workaround is to scaffold an empty file, then `Write` over it with full content. But `Write` requires the agent to re-author the entire frontmatter from scratch, which means:
- The template's frontmatter design (fields like `audience: internal`, `surfaces: [cli]`) is discarded and re-invented in chat.
- Drift across dotmd versions silently breaks plans (the agent has no signal that a v0.32 plan template added a field the agent's hard-coded write didn't include).
- It's a two-step operation where the second step destroys the value of the first.

**Proposed fix.** Make `plan` accept body input. Append it under a designated section (`## Overview` or `## Problem`, mirror what `doc` does). Keep the scaffolded outline below it. The 0.31.4 changelog already established this pattern for `doc` — apply it to `plan`.

**Note: `prompt` already accepts body** (`dotmd new prompt foo "..."` works). The asymmetry isn't justified.

### A3. Ref-resolution errors don't suggest candidates. — P2 (cheap quality-of-life)

Wrote `related_docs: audit-beyond-platform.md` in a plan's frontmatter. `dotmd check` reported `does not resolve to an existing file` with no hint. The correct value (`docs/audit-beyond-platform.md`) was one index lookup away — every doc is in the index, and basename matching is cheap.

**Why agents pay extra.** A human reads the error, opens the file tree, sees `docs/audit-beyond-platform.md`, edits the ref. An agent runs `dotmd check`, parses the error, runs a `find` or `grep` to locate the file, edits the ref, re-runs check. The find/grep is a round-trip that dotmd's index already has the data to avoid.

**Proposed fix.** In `src/validate.mjs` ref-resolution errors (and lifecycle/graph by extension), when a ref doesn't resolve, append: `Did you mean: <top-3 basename or substring matches from the index>?` Use simple Levenshtein or basename-substring; ranking quality matters less than just surfacing candidates. The same fix applies to glossary lookups, `--module` filters on unknown modules, and `dotmd module <name>` (the F16 plan already specifies this hint shape for the new `module` verb — generalize).

### A4. Bidirectional-reciprocity warning fires for upstream-parent refs. — P2 (noise that an agent can't cleanly fix)

When a plan adds `related_docs: docs/audit-beyond-platform.md` pointing at a parent audit doc, `dotmd check` warns: `references X in related_plans/related_docs, but that doc does not reference back`. To resolve, the agent must edit the parent doc to add a back-ref enumerating every spawned plan.

**Why this is wrong for agents.** Parent → child references make sense to enumerate sometimes (when the parent is a hub doc). But for audit findings → spawned plans, the parent is a stable historical snapshot — the user does NOT want every spawned plan to mutate the audit. The agent has no way to express "this is a one-way upstream reference" without either:
- Editing the parent (which the user implicitly forbids by treating audits as snapshots), or
- Leaving a warning in `dotmd check` forever, polluting the signal-to-noise.

**Proposed fix.** Generalize the unidirectional concept that already exists for `parent_plan` (config: `referenceFields.unidirectional`). Either:
- Per-field config: let users mark `related_docs` as unidirectional globally if their pattern is leaf-references-upstream, OR
- Per-ref opt-out: a `>` prefix convention (e.g. `related_docs: > docs/audit-beyond-platform.md`) declares one-way for that specific ref.

The per-ref convention is more flexible and matches existing markdown-link semantics. Per-field is simpler and probably more useful in practice. Either fixes the noise.

### A5. Two-step scaffold + `Write` loses template design (subsumed by A2). — P3

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

## Version History

- **2026-05-24T22:33:02Z** Created. Five findings from a single plan-creation flow during routine work; user reframed dotmd's primary audience as Claude (agents), making this audit class first-priority over data-corpus audits.

## Related Documentation

- [`audit-beyond-platform.md`](audit-beyond-platform.md) — sibling audit, data-corpus shape (Beyond's 1,182-doc repo with custom config). F1–F3 shipped as 0.32.1; F4–F16 pending.
- [`plans/modules-dashboard.md`](plans/modules-dashboard.md) — F16 plan from sibling audit; the flow that surfaced these agent-UX findings.
