---
type: plan
status: archived
created: 2026-05-26T03:24:29Z
updated: 2026-05-26T03:47:10Z
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

# F18 Deprecate Singular Keys

F18 — Deprecate singular `module:` / `surface:` frontmatter keys in favor of plural array forms.

## Problem

The frontmatter schema has duplicated semantics: a doc can declare its modules via `module:` (singular string) OR `modules:` (array). Same for `surface:` / `surfaces:`. The reader (`src/index.mjs:218-220`) merges both into one plural array, so they're functionally interchangeable — but two ways to express the same fact creates user confusion, template ambiguity, validation contortions, and was responsible for 33% of beyond/platform's check warnings before the F3 mitigation in 0.32.1.

F3 covered the noise symptom (warn only on divergence). The underlying duality stayed. New docs sometimes get `module:`, sometimes `modules:`, sometimes both. Two-way schemas are not API design — they're accumulated debt.

## Goals

- ONE canonical schema: `modules: [...]` and `surfaces: [...]`, always.
- Reader stays back-compat in step 1 — nothing breaks on existing corpora.
- `dotmd lint --fix` migrates the legacy form in-place across any corpus.
- F3-era divergence-only warning is subsumed and removed (one warning, not two).

## Non-Goals

- Removing the reader's singular merge — that's step 2 (future major bump). This plan ships step 1 only.
- Hard-failing `dotmd check` on singular use — warning level only in this release.
- A `dotmd migrate` one-shot. `dotmd lint --fix` is the migration path.

## Phases

### Phase 1 — Validator: universal deprecation warning

`src/validate.mjs:360-378` currently holds the F3 divergence-only warning. Replace with a universal deprecation warning that fires on every singular use, with the exact migration target inlined in the message:

```
`module:` (singular) is deprecated — use `modules: ["foyer"]`. Run `dotmd lint --fix` to migrate.
```

When singular and plural are both present and divergent, the message shows the merged target (`modules: ["foyer", "other"]`). When they agree, just the singular value.

Also at `src/validate.mjs:106`: drop the "Accepts singular `module:` or plural `modules:` list" hint from the required-module error — don't advertise the deprecated form.

### Phase 2 — Lint: extend migration to cover module + non-comma cases

`src/lint.mjs:70-75` already migrates `surface: a, b` (comma-containing values) → `surfaces: [a, b]`. Generalize: any singular `module:` / `surface:` value, comma or not, migrates to plural. Merges with existing plural array if present, dedupes.

Rename the internal fix type from `split-to-array` → `singular-to-plural`. Generalize the apply block at lines 186-206 to handle either key (`module`/`modules` or `surface`/`surfaces`).

### Phase 3 — Templates: verify plural-only

`src/new.mjs` already emits plural-only (lines 25, 26, 62, 63 per grep). Verify by running `dotmd new plan smoke-test` and inspecting the scaffold output.

### Phase 4 — Tests

`test/validate.test.mjs` — three cases:
- `module: foyer` alone → 1 deprecation warning with `modules: ["foyer"]` target
- `module: foyer` + `modules: [foyer]` (same) → 1 warning, target same value (no dup)
- `module: foyer` + `modules: [other]` (divergent) → 1 warning, target merged

Assert the old "both module/modules set with different values" message is no longer emitted.

`test/lint.test.mjs` — four cases:
- `module: foyer` (no plural) → `modules:\n  - foyer`
- `module: foyer` + existing `modules:\n  - bar` → merged with foyer added
- `surface: web, ios` (comma — existing path) → `surfaces:\n  - web\n  - ios` (regression)
- `module: foyer` + `modules:\n  - foyer` (dup) → single entry

Expect total test count: 863 → ~870.

### Phase 5 — Docs

- `README.md:100` (doc-format example): swap `module:` / `surface:` → plural array forms. Add one-line callout: "`module:` and `surface:` (singular) are deprecated as of 0.36.3 — use the plural arrays. `dotmd lint --fix` migrates."
- `CHANGELOG.md`: 0.36.3 entry under `### Deprecated` + `### Changed` (the F3 divergence warning is gone — subsumed).
- `docs/audit-beyond-platform.md`: insert F18 as a P1 (correctness) finding after F17. Update the suggested-fix-order release table to slot F18 into 0.36.3 (ahead of 0.37.0). Bump `updated:`.
- `CLAUDE.md` + `dotmd.config.example.mjs`: grep shows no singular references — no change.

### Phase 6 — Release

`npm version patch` → 0.36.3. Smoke test against installed binary: write a `module: foo` doc to a `/tmp/` repo, confirm warning + `lint --fix` migrates correctly.

## Verification

1. `npm test` — all pass, ~870 total.
2. `dotmd check` on this repo — unchanged warning count (no singular use in own corpus).
3. Throwaway `/tmp/` repo with `module: foyer` doc: `dotmd check` emits the deprecation warning naming `modules: ["foyer"]`. `dotmd lint --fix` rewrites the frontmatter.
4. Same repo with `module: foyer` + `modules: [other]`: warning names `modules: ["foyer", "other"]`. `lint --fix` produces a merged deduped array.
5. Post-release: `dotmd --version` = 0.36.3.

## Refs

- audit: docs/audit-beyond-platform.md (F18)
- prior mitigation: F3 (shipped 0.32.1) — divergence-only warning, now subsumed

## Closeout

Shipped in 0.36.3 (commit `2192c04`). Step 1: validator now emits a deprecation warning on any `module:`/`surface:` use, citing the exact `modules: [...]`/`surfaces: [...]` migration target. Step 2: `dotmd lint --fix` learned `singular-to-plural` — removes the singular key, merges its value(s) into the plural array (or creates the array if absent), de-duplicates. The divergence-only F3 warning is subsumed: any singular usage now warns regardless of agreement with the plural form. 870/870 tests pass; ~120 lines net across `src/validate.mjs` + `src/lint.mjs`.
