---
type: plan
status: active
created: 2026-05-28T03:58:35Z
updated: 2026-05-28T03:58:35Z
surfaces:
# modules — real module name(s), or `none` for tooling/infra plans
modules:
  - none
domain:
audience: internal
parent_plan: clear-the-deck
related_plans:
related_docs:
current_state:
next_step:
---

# Issue 12 Validator Ux

**Issue #12** — Plan validator: `db` surface rejected, `modules` required-but-no-clear-fallback, `current_state` cap too tight. User hit 5 rounds of validator retries on a single plan. Bump: **0.46.0** (validator UX, additive — no schema breakage).

## Three fixes

### 1. Surface taxonomy: warn-don't-die + did-you-mean

Today `surfaces: db` fails validation with `Unknown surface \`db\`` and no hint. Two changes:
- `src/validate.mjs` surface check: downgrade `error` → `warning` (don't block scaffolding/checking). Forward-drift on misnamed surface is recoverable; hard-fail forces churn.
- Append `suggestCandidates(input, known, 3)` from `src/util.mjs`. Output: `Unknown surface \`db\`; did you mean: data | api-db | <empty> ? Run \`dotmd surfaces\` to list all.`
- Add `dotmd surfaces` (and `dotmd taxonomy` alias) — prints known surfaces from `config.taxonomy.surfaces`. No flags needed for v1.

### 2. modules: scaffold default + fallback

- `src/new.mjs` plan-scaffold output: instead of leaving `modules:` with a single empty list item (which trips validation), emit `modules: none` by default. Author overrides when they have a real module.
- Validator: when `modules:` is missing AND the type's `moduleRequiredFor` includes the doc's status, accept `none` as a sentinel literal (no warning), continue to require either `none` or a real module for active/planned plans.

### 3. current_state / next_step caps

- `current_state` cap raised 500 → 1500 chars.
- `next_step` cap raised 300 → 800 chars.
- Justification: these are the primary resume-context fields for future agents. User reported 740 chars summarizing 3 prior incidents felt natural. New caps still keep prose from migrating in but allow handoff context to live there.
- Implementation: look in `src/validate.mjs` for the existing cap check; raise the literals and the error message.

## Tests (test/validate.test.mjs)

- `surface warns with did-you-mean` — fixture with unknown surface; check that warning fires and message names ≥1 known surface.
- `modules: none accepted` — fixture with `modules: none` on active plan; no module-required error.
- `current_state up to 1500 ok` — fixture at 1499 chars passes; 1501 chars fails.
- `next_step up to 800 ok` — same shape.

## Verify

- `npm test` clean.
- Smoke: scaffold a plan with `surfaces: db`, `modules: none`, 1200-char `current_state` — `dotmd check` reports zero errors (1 warning on the db surface, naming alternatives).
- `dotmd surfaces` lists known surfaces from config.

## Closeout

(Add when shipped: cap values, new command surface.)
