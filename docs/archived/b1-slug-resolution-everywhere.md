---
type: plan
status: archived
created: 2026-06-10T07:45:28Z
updated: 2026-06-10T08:02:49Z
surfaces: [cli]
modules: [cli, index]
domain: agent-ux
audience: internal
parent_plan: docs/plans/agent-ux-round-b.md
related_plans:
related_docs:
current_state: Shipped. resolveDocArg() in src/index.mjs, wired into use/set/status/archive/touch/rename/unblocks/deps/diff/summary/runlist; did-you-mean on miss; 5 new CLI tests.
next_step:
---

# B1 Slug Resolution Everywhere

> Make bare-slug resolution work in every file-taking verb (not just archive/prompt-use) via one shared resolver, with did-you-mean candidates on failure.

## Problem

Bare-slug resolution is inconsistent across file-taking verbs, and failed resolution never suggests candidates. Verified 2026-06-10 with `docs/plans/test-revamp.md` existing:

- `dotmd archive test-revamp` → works (0.59.0 shipped slug resolution for archive)
- `dotmd use test-revamp` → `File not found: test-revamp` (only *prompt* slugs resolve in `use`)
- `dotmd set active test-revamp` → `File not found: test-revamp / Searched: ., docs`
- `dotmd use docs/plans/test-revam.md` (typo) → bare `File not found`, no "did you mean"

Agents reference plans by slug from conversation memory far more often than by path. Partial support is worse than none: the slug habit learned from `archive` (and prompt-`use`) fails silently on the next verb. This is the prior audit's anti-pattern #3 (errors that don't suggest candidates) applied to file arguments instead of refs.

## Goals

- One shared resolver (e.g. `resolveDocArg()` in `src/util.mjs` or `src/index.mjs`): exact path → bare slug via index lookup (unique basename match wins; ambiguous match lists the candidates and exits 1).
- Wire it into every file-taking verb: `use`, `set`, `status`, `archive`, `touch`, `rename`, `unblocks`, `diff`, `summary`, `bulk archive`.
- On resolution failure, emit `Did you mean: <top-3 index matches>?` — reuse the A3 candidate-hint machinery from `src/validate.mjs` (basename/substring/Levenshtein).

## Non-Goals

- Fuzzy matching that silently picks a best guess. Ambiguity must be an error with candidates, never an auto-pick — a wrong auto-resolved `set archived` is worse than a retry.

## Phases

### Phase 1 — extract the resolver ✅
Lift archive's 0.59.0 slug logic into a shared helper; add ambiguity handling + did-you-mean. Unit tests: exact path, unique slug, ambiguous slug, near-miss typo, slug-in-archive.

### Phase 2 — wire the verbs ✅
Sweep `bin/dotmd.mjs` dispatch + each `runX()` for file args; replace ad-hoc existence checks. Per-verb tests for `use` (plan slug) and `set` at minimum.

## Closeout

- `resolveDocArg(input, config, { dieOnMiss })` + `docArgMissMessage()` live in `src/index.mjs` (next to `collectDocFiles`, which they need — `util.mjs` would have been a circular import). Ambiguous basenames die with the candidate list; misses die with up-to-3 did-you-mean candidates matched on basename via `suggestCandidates`.
- Wired: `use`, `set`, `status` (deprecated), `archive` (its private `resolveArchiveTarget` deleted), `touch` (both modes), `rename` (old path), `unblocks`/`deps`, `diff`, `summary`, and `runlist` (its private `resolveHubInput` now delegates, keeping its own miss message).
- In `use`, prompt slugs keep precedence on a slug collision (consuming a prompt is the more common intent); the shared resolver runs last and owns the miss error.
- `bulk archive` left as-is: its substring fallback already matches bare slugs and is intentionally multi-match.
- `export`/`migrate`/`bulk-tag` left as-is: they have their own graceful skip/continue semantics for missing files.
- Tests: 5 new CLI-level cases in `test/lifecycle.test.mjs` ("shared slug resolution across verbs"); suite at 1047 passing. Help text updated (`use [<file-or-slug>]`, `set` slug paragraph).
