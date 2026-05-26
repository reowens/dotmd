---
type: plan
status: in-session
created: 2026-05-26T04:25:38Z
updated: 2026-05-26T04:25:41Z
surfaces:
modules:
domain:
audience: internal
parent_plan:
related_plans:
related_docs:
current_state:
next_step:
---

# F4 F13 Doctor Safety Check Collapse

F4 + F13 — 0.37.0: doctor dry-run-default + collapse high-frequency `check` warnings into bulk-fix hints.

## Problem

Two findings from the beyond-platform audit (`docs/audit-beyond-platform.md`) that fix highest-friction UX:

**F4 (P2 safety).** `dotmd doctor` mutates by default — runs `fix-refs`, `lint --fix`, `touch --git`, regenerates the index. On a 1k+ doc repo this can rewrite dozens of files in one invocation. The audit slipped: the audit prompt described doctor as "safe (read-only)" — there is no read-only mode for plain `dotmd doctor`. Three files were mutated before the prompt author noticed and reverted via `git checkout`. `--help` text says "writes by default" but the friction surface for a multi-step auto-fix on a large repo is too low. Mirrors `dotmd archive`'s safe pattern: dry-run preview by default, `--apply` to mutate.

**F13 (P3 noise).** `dotmd check` prints one line per warning. Bulk-fixable categories (43 `updated behind git history`, ≥1 `module:`/`surface:` deprecation) overwhelm structural findings in the per-doc list. Until the user runs the corresponding fixer, every `check` repeats the noise. Better shape: per-category remediation hint — `43 docs have updated-behind-git dates (run \`dotmd touch --git\` to bulk-fix)`. Surfaces the fix command instead of leaving the agent to scan 43 identical lines.

## Goals

- `dotmd doctor` defaults to dry-run preview; `--apply` (or `--yes`) writes. Behavior break, minor bump.
- `dotmd check` collapses high-frequency auto-fixable warning categories into one-line remediation hints, showing the per-category total + the fix command. Per-doc lines preserved under a threshold and via `--no-collapse`.
- `--json` shape is unchanged — collapse is text-render only.
- Both fixes ship together as 0.37.0 with one CHANGELOG entry.

## Non-Goals

- Investigating doctor's apparent early-exit after step 1 (F4 tail observation). Hard to repro; defer to a follow-up plan if it recurs.
- Per-category collapse for non-auto-fixable warnings (e.g. `Missing \`title\``). These are structural and the per-doc location matters — collapsing would hide signal.
- Confirmation prompt on `dotmd doctor` (interactive). Scripts/agents don't have a TTY; `--apply` flag is the contract.
- Deprecation period: `dotmd doctor` is for humans/CLAUDE — no scripted callers expected to break. Hard flip in 0.37.0.

## Phases

### Phase 1 — F4: flip doctor default to dry-run

`src/doctor.mjs:55`: `const { dryRun } = opts;` — today, dryRun is false unless `--dry-run` passed. Change to: default true unless `--apply` (or `--yes`) passed.

Implementation:
- `bin/dotmd.mjs` dispatcher: detect `--apply` / `--yes` in argv for the `doctor` command path, override the inherited `dryRun` (set to false). Strip the flag from restArgs.
- `src/doctor.mjs`: print a startup banner naming the mode:
  ```
  dotmd doctor [preview — run with --apply to write]
  ```
  vs.
  ```
  dotmd doctor [applying changes]
  ```
- `bin/dotmd.mjs` HELP text for `doctor`: rewrite "writes by default; honors --dry-run" → "previews by default; use --apply to write."
- Top-level `HELP` short line at line 44: `doctor [--apply]` (not `[--dry-run]`).

### Phase 2 — F13: warning categorizer + collapsed render

New `src/check-collapse.mjs` (~80 lines):
- `categorizeWarnings(warnings)` returns `{ collapsed: [{ category, count, hint, fixCommand }], passthrough: [...] }`.
- Categories matched by regex against message prefix:
  - `/^frontmatter updated: .* is behind git history/` → fix: `dotmd touch --git`
  - /^`module:` \(singular\) is deprecated/ → fix: `dotmd lint --fix`
  - /^`surface:` \(singular\) is deprecated/ → fix: `dotmd lint --fix`
- Threshold: collapse only when category count ≥3. Below threshold, passthrough as individual lines (small counts don't benefit).
- Returns deterministic ordering: passthrough first (alphabetical by path), then collapsed summaries sorted by count desc.

`src/render.mjs` `_renderCheck` (line 378): consume categorizer. Render:
```
Warnings
- docs/foo.md: structural finding A
- docs/bar.md: structural finding B
- 43 docs have updated-behind-git dates — run `dotmd touch --git` to bulk-fix
- 7 docs use deprecated singular `module:` — run `dotmd lint --fix` to bulk-fix
```

`bin/dotmd.mjs`: add `--no-collapse` flag to `check`; thread through to renderCheck. Help text updated.

### Phase 3 — Tests: F4

`test/doctor.test.mjs` (or new `test/doctor-safety.test.mjs`):
- `dotmd doctor` (no flags) prints preview banner + does NOT write files (assert tmp/ doc unchanged after run).
- `dotmd doctor --apply` writes (assert tmp/ doc IS modified).
- `dotmd doctor --yes` same as `--apply` (alias).
- `dotmd doctor --dry-run` still works (no-op equivalent to default; kept for explicitness).

### Phase 4 — Tests: F13

`test/check-collapse.test.mjs`:
- 3+ docs with `updated-behind-git` warnings → one collapsed line + fix command.
- 1-2 docs with same category → individual passthrough lines (below threshold).
- Mixed: structural warnings stay per-doc; auto-fixable cluster collapses.
- `--no-collapse` flag → all per-doc lines (regression).
- `--json` output unchanged (collapse is text-only).
- `dotmd check --errors-only` interacts cleanly (warnings hidden, collapse skipped).

### Phase 5 — Docs

- `bin/dotmd.mjs` HELP for `doctor` and `check`: updated.
- `CHANGELOG.md`: 0.37.0 entry under `### Changed` (doctor default) and `### Added` (check collapse).
- `docs/audit-beyond-platform.md`: mark F4 + F13 shipped in the release-table row for 0.37.0; bump `updated:`.
- `README.md`: no change expected (doctor + check not in the highlighted command list).

### Phase 6 — Release

`npm version minor` → 0.37.0. Smoke test against installed binary:
- `dotmd doctor` on /tmp/ repo with broken refs: banner + no mutation.
- `dotmd doctor --apply`: banner + mutations happen.
- `dotmd check` on a /tmp/ repo with 3 `module: foo` docs: collapsed line + fix hint.
- `dotmd check --no-collapse`: per-doc lines.

## Verification

1. `npm test` — all pass; total ~875-880.
2. `dotmd doctor` on this repo: preview banner, no writes (verify with `git status` after).
3. `dotmd doctor --apply` on this repo: same behavior as current `dotmd doctor`.
4. `dotmd check` on /tmp/ repo seeded with 3 singular-module docs: collapsed `3 docs use deprecated singular \`module:\`` line.
5. Post-release: `dotmd --version` = 0.37.0.

## Refs

- audit: docs/audit-beyond-platform.md (F4, F13)
- prior plan: docs/archived/f18-deprecate-singular-keys.md (shipped 0.36.3 — defined the singular-deprecation warning category F13 now collapses)
- pattern source for confirmation/apply: `dotmd archive` (already uses `--yes` for terminal confirmation)
