---
type: plan
status: archived
created: 2026-07-09T09:26:21Z
updated: 2026-07-09T11:14:06Z
surfaces:
modules:
domain:
audience: internal
parent_plan:
related_plans:
related_docs:
  - src/baton.mjs
current_state: >
  `dotmd baton @/tmp/draft.md` (no explicit plan arg) can hand off a plan the
  current session never touched. `findOwnedPlan` (src/baton.mjs) falls back to
  "the only globally in-session plan" whenever the journal can't confirm
  ownership — but that fallback fires even when another session legitimately
  owns that single in-session plan, so baton flips its status, mints a
  misnamed `resume-<other-plan>.md`, and never touches the plan the current
  session was actually working on.
next_step: >
  Not started. Phase 1: confirm the root cause with a repro test, then decide
  the fix (Phase 2) — most likely gate the `single-in-session` fallback on a
  positive this-session journal signal, and/or have `use <prompt>` that targets
  a plan record ownership of that plan.
---

# Dotmd Baton Single-In-Session Misfire

> `dotmd baton` with no explicit plan can baton **another session's** plan. When the current session has no journal-confirmed in-session plan of its own, `findOwnedPlan`'s `single-in-session` fallback grabs whatever single plan is globally in-session and hands *it* off — flipping a stranger's status and misnaming the resume prompt. Reproduced live 2026-07-09.

## Problem

`findOwnedPlan(config)` (src/baton.mjs:37–59) resolves which in-session plan belongs to THIS session in three steps:

1. Filter all docs to `type === 'plan' && status === 'in-session'`.
2. **Journal match** — walk this sid's journal for the last `use <plan>` / `set in-session <plan>` whose target is still in-session (`via: 'journal'`).
3. **Fallback** — if the journal can't answer and `inSession.length === 1`, return that one plan (`via: 'single-in-session'`, line 58).

Step 3 is the bug: it returns a plan even when **no journal entry ties this session to it**. `runBaton` then treats it as owned (line 144–145, "Handing off the only in-session plan: …"), flips its status `in-session → active`, and derives the resume-prompt name from *that* plan — none of which is the current session's work.

### Live repro (2026-07-09, from a `beyond/platform` session)

- Session A had `docs/plans/platform-providers-substrate.md` **in-session**.
- Session B started by consuming a resume **prompt**: `dotmd use docs/prompts/resume-kinetic-v2g-dev-fixture.md`. This journals a `use <prompt-path>`, and the prompt *points at* `docs/plans/kinetic-v2g-dev-fixture.md`, but that plan is never set in-session (it stays `active`).
- Session B did all its work against `kinetic-v2g-dev-fixture` (status `active` throughout), then ran `dotmd baton @/tmp/baton.md`.
- `findOwnedPlan` journal step: session B's only plan-shaped journal ref is the *prompt* path → `matchesDocRef` against the in-session **plans** list misses (a prompt isn't a plan) → no journal match.
- Fallback: exactly one plan (`platform-providers-substrate`, session A's) is in-session → returned as `single-in-session`.
- Result: baton flipped **session A's** plan `in-session → active`, created `resume-platform-providers-substrate.md` containing session B's kinetic-v2g handoff text, and left session B's actual plan untouched. Manual recovery: `dotmd set in-session` on A's plan, `rm` the misnamed prompt, re-run in slug mode.

## Goals

1. **`baton` never hands off a plan the current session didn't demonstrably work on.** No status flip / prompt-naming based on a plan this sid has no ownership signal for.
2. **Preserve the legitimate ergonomics** of the single-in-session fast path when it *is* this session's plan (journal disabled but this session clearly owns the one in-session plan).
3. **A resume prompt that targets a plan should let baton find that plan** — consuming `resume-<plan>` via `use` arguably establishes this session's association with `<plan>` even though the prompt didn't flip the plan to in-session.

## Non-Goals

- Introducing real locks/leases on plans (baton's model is deliberately lock-free — ownership is journal-reconstructed).
- Changing what `dotmd use <prompt>` does to the *prompt* (consume/archive) — only whether it records the *target plan* for ownership purposes.

## What Exists Today

| Piece | Location | Behavior |
|-------|----------|----------|
| `findOwnedPlan` | `src/baton.mjs:37` | journal match → else `single-in-session` if exactly one → else null |
| `single-in-session` fallback | `src/baton.mjs:58` | **root cause** — returns the lone in-session plan with no this-session ownership check |
| baton handoff dispatch | `src/baton.mjs:141–150` | acts on `owned.plan`; multi-in-session already dies asking for an explicit arg (147–148) |
| journal ref extraction | `src/baton.mjs:50–52` | matches `use <x>` / `set in-session <x>` / `status … in-session` — only against plans, so a `use <prompt>` ref is dropped |

Note the **multi**-in-session case (line 147) already refuses and asks for an explicit plan — it's only the **single**-in-session case that over-eagerly auto-selects.

## Open Questions

1. **Fallback gate:** should `single-in-session` require *any* this-session journal signal (e.g. this sid has at least one `use`/`set in-session` for that exact plan), or is "journal has no contrary owner + this sid ran *some* plan command" enough? Leaning toward: only auto-select if the journal positively ties this sid to that plan; otherwise `die` with the slug-mode hint (same message shape as the no-in-session branch, line 150).
2. **`use <prompt>` ownership:** when `use` consumes a `resume-<plan>` prompt, should it record a synthetic ownership marker for `<plan>` (so a later baton resolves via journal)? This directly fixes the repro. Needs the prompt→plan link (frontmatter? filename convention `resume-<plan-slug>`?).
3. **Cross-session safety:** is there any signal (pid/sid stamped when a plan goes in-session) that would let baton *know* another session owns the single in-session plan and refuse? Cheaper than #2 if a sid is already recorded on the in-session flip.

## Phases

### Phase 1 — Reproduce + confirm root cause ✅

- Added an end-to-end repro test (`test/baton.test.mjs`): plan X in-session under sid A, sid B runs `use <prompt>`, then `baton` — asserts baton refuses and leaves X untouched. Confirmed live via a scratch repo too.
- Confirmed the journal-ref extraction drops `use <prompt>` refs (a prompt isn't an in-session plan), and the misfire needs exactly one in-session plan.

### Phase 2 — Fix `findOwnedPlan` fallback ✅

- Chose the rule (Open Q1): the `single-in-session` fast path now fires **only when the journal is silent about this session's ownership intent**. `findOwnedPlan` tracks `sawOwnershipRef` — whether this sid issued *any* `use` / `set in-session` / `status … in-session`. If it did and none matched an in-session plan, the session's work lives elsewhere, so baton returns `{plan:null}` and `runBaton` hits the no-in-session branch (demands a slug) — the safe default.
- Verified the legit fast path (journal silent — disabled or another tool flipped the status) and the journal-match path both still work.

### Phase 3 — (optional) `use <prompt>` → plan ownership ⏭ deferred (optional)

- Per Open Q2: making baton *actively resolve* a consumed `resume-<plan>` prompt's target plan (so it hands that off instead of refusing) is an ergonomic enhancement, not part of the safety fix. The Goal — never flip a non-owned plan — is met without it. Reopen if the "baton finds the prompt's plan automatically" convenience is wanted; it needs a reliable prompt→plan link.

### Phase 4 — Regression coverage ✅

- `test/baton.test.mjs`: the misfire repro, the since-released-plan variant, and the still-legit journal-tied fast path. Existing "journal-silent single-in-session" and "multiple in-session" cases keep passing. Full suite 1300 → 1303.

## Deferred

- Phase 3 (`use <prompt>` → plan ownership resolution) — optional ergonomic, see above.

## Version History

- **2026-07-09T11:14:06Z** Archived — Fixed: findOwnedPlan gates single-in-session on sawOwnershipRef; +3 tests. Phase 3 deferred as optional.
- **2026-07-09T09:26:21Z** Created — root-caused from a live `beyond/platform` repro (baton handed off `platform-providers-substrate` when the session's real work was `kinetic-v2g-dev-fixture`).

## Closeout

**Shipped.** `findOwnedPlan` (`src/baton.mjs`) now gates its `single-in-session`
fast path on `sawOwnershipRef`: it auto-selects the lone in-session plan only
when this session's journal shows no ownership command pointing elsewhere.
Session B consuming a `use <prompt>` (or working a since-released plan) no longer
causes baton to flip Session A's in-session plan or mint a misnamed resume
prompt — baton refuses and asks for an explicit slug. +3 regression tests
(`test/baton.test.mjs`); full suite green at 1303. Phase 3 (actively resolving a
consumed prompt's target plan) deferred as an optional ergonomic — the safety
goal is met without it.
