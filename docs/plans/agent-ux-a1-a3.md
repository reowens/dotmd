---
type: plan
status: active
created: 2026-05-25T22:19:27Z
updated: 2026-05-25T22:19:27Z
surfaces: [cli]
modules: [index, lifecycle, validate]
domain: agent-ux
audience: internal
parent_plan:
related_plans:
related_docs: docs/agent-ux-audit.md
current_state: Plan drafted. Spec lives in the audit doc; this plan sequences and bounds the work.
next_step: Pick up Phase 1 (A1) — flip `dotmd index` default to write.
---

# Agent UX fixes — A1, A2, A3

> Three friction points an agent hits during routine dotmd use, all rooted in defaults and error messages designed for a human reader rather than a tool-using consumer. Spec is `[[agent-ux-audit]]` findings A1–A3; this plan sequences and bounds them into one 0.34.0 minor release.

## Problem

Every recovery for an agent is a tool round-trip, not a keystroke — the cost multiplier on bad defaults and unhelpful error messages is much higher than on a human at a terminal. The audit doc identified five findings from a single plan-creation flow; A1 alone burned tool calls in *this* session (the index-stale → `dotmd index` → still-stale loop). A4 needs a config schema discussion and A5 is subsumed by A2, so this plan scopes to A1+A2+A3.

## Goals

- `dotmd check`'s stale-index error prescribes a command that actually fixes the error.
- `dotmd new plan <name> "<body>"` lands the body in a sensible section, matching the `dotmd new doc` pattern that already exists.
- When a frontmatter ref, glossary term, or module filter doesn't resolve, the error names plausible candidates from the index — eliminating a `find`/`grep` round-trip.

## Non-Goals

- A4 (per-field unidirectional refs). Needs a config schema decision; defer.
- A5 (subsumed by A2; will disappear automatically).
- Broader audit sweep against the five meta-pattern anti-patterns in `agent-ux-audit.md` § "Meta-pattern". Out of scope here; tracked as a follow-up sweep.
- Migration shims beyond what's required for A1's breaking change.

## What Exists Today

- **A1.** `dotmd index` (no flag) prints the regenerated block to stdout. `dotmd index --write` updates `docs/docs.md` in place. `dotmd check`'s stale-index error message says `Run \`dotmd index\`` (without `--write`) — which doesn't fix the error. Help text: `dotmd index [--write] — generate/update docs.md index`.
- **A2.** `dotmd new doc <name> "<body>"` lands the body under `## Overview` (0.31.4). `dotmd new prompt <name> "<body>"` accepts body as full prompt content. `dotmd new plan <name> "<body>"` errors out with a config-edit prescription (`set acceptsBody: true on your custom plan template`). The built-in plan template is the one rejecting body.
- **A3.** `src/validate.mjs` ref-resolution errors emit `does not resolve to an existing file` with no candidates. The doc index already has every basename indexed; cheap to query. Glossary and module-filter lookups have the same gap. `modules-dashboard.md` (F16) already specifies a "did you mean" shape for its new verb — generalize.

## Constraints

- A1's default flip is breaking for anyone scripting `dotmd index` expecting stdout. Mitigate with `--print` (new flag, preserves old behavior) and a CHANGELOG migration note. Document, don't shim.
- A2 must respect the existing plan-template conventions — frontmatter intact, scaffolded outline preserved. Body lands in a designated section, not on top of the scaffold.
- A3's suggestion logic stays cheap (no LLM, no fuzzy lib): basename-substring match + Levenshtein distance, top 3 results. Quality of ranking matters less than just surfacing candidates.

## Decisions

- **D1. A1 = write by default.** `dotmd index` writes. Add `--print` for stdout-only. Update the `runCheck` error message to match. Update help text. The two known callers (the check error + manual invocation) both want the write; print-only is a debug mode, not a default.
- **D2. A2 = body lands under `## Problem`.** Plans don't have an `## Overview` section in the built-in template, and inserting one would conflict with the established plan shape (tagline → `## Problem`). Body content from `dotmd new plan <name> "<body>"` lands under `## Problem`. Doc and prompt's `## Overview` stays as-is.
- **D3. A3 = top-3 candidates from the index.** Substring match first, Levenshtein second. Output shape: `Did you mean: <candidate1>, <candidate2>, <candidate3>?` appended to the existing error. Empty results print no suggestion line (no `Did you mean: (none)`).
- **D4. Bundle = 0.34.0.** Single minor release. The A1 default flip is the breaking-ish change; A2+A3 are pure additive. One CHANGELOG entry covers all three.

## Open Questions

- A3 ranking edge: should suggestions be filtered by ref-field type (e.g. a `related_plans` ref only suggests plans, not docs)? Probably yes — saves the agent another wrong-guess round-trip. Settle at implementation time; defaults to "suggest from same type if known, else any."

## Phases

### Phase 1 — A1: `dotmd index` writes by default ⬜

- In `bin/dotmd.mjs` index dispatch (or `src/index.mjs` runner — wherever the `--write` branch lives), flip the default. Move stdout-print behind a new `--print` flag.
- Update `runCheck`'s stale-index error message (find `Run \`dotmd index\`` in `src/check.mjs` or wherever it's emitted) to drop the no-op suggestion — the new default is correct.
- Update help text in `bin/dotmd.mjs` HELP object.
- Existing tests that ran `dotmd index` and asserted stdout content need to use `--print` now. Sweep `test/index.test.mjs` (or wherever).
- Add one test: `dotmd index` (no flag) updates the index file and emits a confirmation line (mirror the existing `Updated /path/docs.md` line).
- ~15 LOC + test sweep. Touches CHANGELOG with a migration note.

### Phase 2 — A2: `dotmd new plan` accepts body ⬜

- In the built-in plan template (probably `src/templates.mjs` or wherever `acceptsBody` is set per-template), set `acceptsBody: true`.
- In the scaffolder that lands the body, insert it under the `## Problem` heading (D2). Mirror the `## Overview` insertion logic that `doc` uses; section name is the only difference.
- Drop the prescriptive `set acceptsBody: true on your custom plan template` error path — it's no longer reachable for the built-in template. Keep it for users with custom templates that opt out.
- Add two tests in `test/new.test.mjs`:
  1. `dotmd new plan foo "body content"` creates `docs/plans/foo.md` with `body content` under `## Problem`.
  2. The scaffolded frontmatter and outline below `## Problem` are preserved verbatim.
- ~30 LOC + 2 tests.

### Phase 3 — A3: ref/glossary/module suggestion hints ⬜

- Add a `suggestCandidates(query, candidates, max=3)` helper in `src/util.mjs` or `src/validate.mjs`. Substring match first, Levenshtein distance ≤ 3 second, dedup, top-N.
- Wire into `src/validate.mjs` ref-resolution errors: when a ref doesn't resolve, pass the index's basename list as candidates and append `Did you mean: ...?` to the error.
- Wire into glossary lookups in `src/glossary.mjs` and any `--module <name>` filter handlers (grep for "Unknown module" / "Module not found" / unmatched filter paths).
- Per the Open Question above: filter candidates by ref-field type when known (e.g. `related_plans` ref → only plan candidates). Fall back to all-types when ambiguous.
- Add tests in `test/validate.test.mjs` (or wherever): unresolved ref gets a suggestion; unrelated typo (no close match) gets no suggestion line; same-type filtering works.
- ~40 LOC + 3 tests.

### Phase 4 — Release ⬜

- CHANGELOG entry covering all three findings. Call out the A1 breaking change explicitly: `dotmd index` now writes by default; use `--print` to preserve the old stdout-only behavior.
- `npm version minor` → 0.34.0. The standard automated chain handles tagging, push, publish, local reinstall.

## Deferred

- A4 (per-field unidirectional refs). Needs a config-schema decision (per-field config vs. per-ref `>` prefix). Spin into its own plan when revisited.
- A5 (subsumed by A2 — disappears when A2 ships).
- The broader "Meta-pattern" sweep from the audit § "Meta-pattern" (5 anti-pattern classes to scan for codebase-wide). Worthwhile but separate scope; capture as a follow-up plan after this lands.
- Whether to extend A3-style suggestions to `dotmd status <file> <unknown-status>` (suggest valid statuses for the file's type). Out of this plan; trivial follow-up.

## Version History

- **2026-05-25T22:19:27Z** Created. Spec lives in `[[agent-ux-audit]]`; this plan sequences A1+A2+A3 into one 0.34.0 minor release per the audit's own recommendation.

## Closeout

<!-- Filled on archive: what shipped, key commits, deferrals dispositioned. -->
