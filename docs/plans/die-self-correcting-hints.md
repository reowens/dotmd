---
type: plan
status: active
created: 2026-05-27T02:39:39Z
updated: 2026-05-27T02:39:39Z
surfaces:
modules:
domain:
audience: internal
parent_plan: clear-the-deck
related_plans:
related_docs:
current_state:
next_step:
---

# Die Self Correcting Hints

**F17c — `die()` self-correcting hints.** Audit ref: `docs/audit-beyond-platform.md:291`. Downstream of F17a (journal, shipped 0.38.0). Independent of F17b — can ship in either order. Bump target: **0.40.x or 0.41.0** (additive — error messages get more verbose on repeat failures only; first-failure output unchanged).

## Goal

When an agent retries the same broken invocation twice (e.g. `dotmd status foo bar baz` with wrong arity), the second `die()` should give a verbose, journal-informed hint paragraph instead of the terse one-liner. First failures stay terse — don't punish humans typing for the first time. Repeat failures get the diagnostic detail upfront.

## Design (decisions locked)

1. **Trigger condition:** Current failing argv has the same `command` (argv[0]) AND ≥75% positional-arg overlap with a prior journal entry where `exit != 0` from `currentSessionId()` in the last 10 minutes. "Positional overlap" = (set intersection of non-flag args) / (set union of non-flag args).
2. **Hint shape:** Append a `Tip: …` paragraph to the existing die message. Examples:
   - Repeat `dotmd status foo bar baz`: `Tip: 2nd failure on \`dotmd status …\` in 8 min. Last error: "Too many arguments." \`dotmd status\` takes <file> <new-status> (two args, not three). Try: dotmd status foo bar.`
   - Repeat `dotmd pickup <stale-lease-plan>`: `Tip: You tried this 4 min ago and hit a lease conflict. Run \`dotmd release --stale\` first, or pass \`--takeover\`.`
3. **First failure stays clean:** No journal consult on first failure of a given shape. Common case is fast and unsurprising.
4. **Opt-out:** `DOTMD_NO_HINTS=1` env var disables. Useful for tests, scripts, and users who find it noisy.
5. **Hint generation is dumb — not LLM-based.** Pattern-match die-message prefixes to canned hint templates. ~5-8 templates covering the highest-frequency failures: lease conflict, wrong arity, unknown command, missing config, ref not resolved. Falls back to a generic "Tip: You hit this same error <X> min ago — check the args" when no template matches.

## Open questions to settle DURING implementation, not now

- **Where to wire it.** `die()` lives in `src/util.mjs` and throws `DotmdError`. Two options: (a) wrap individual callers with a hint-prefixer (explicit, ~5-8 sites), or (b) move the lookup into `die()` itself. Lean (b) for blast radius; verify with a quick scan that all current `die()` callers tolerate journal-IO on the error path. Skipping IO when journal is disabled keeps the cost zero for non-opt-in users.
- **Hint template format.** Inline strings in `src/hints.mjs` (new) keyed by regex on the die-message — simple and explicit. Don't build a generic "hint engine."
- **Argv "shape" comparison.** Lock to: `command verb + non-flag-arg set intersection`. Don't try to match flag values — too brittle.

## Scope (estimated ~50-80 lines + tests)

**Core:**
- `src/hints.mjs` — new module. Exports `findRepeatFailureHint(failingArgv, errorMsg, config)` returning a string or null. Reads recent journal entries (last 10 min, same sid via `currentSessionId()`), filters to exit != 0, compares argv shape, matches the die-message against the template table.
- `src/util.mjs` — `die()` consults `findRepeatFailureHint` and appends the hint paragraph if found. Skipped cleanly when `DOTMD_NO_HINTS=1` or `!config.journal`.

**Tests:**
- `test/hints.test.mjs` — first-failure-no-hint, second-failure-hint-fires, different-session-no-hint, stale-failure-no-hint (>10 min), template-match (status arity, pickup lease conflict, ref not resolved), `DOTMD_NO_HINTS` env disables, journal-disabled disables.

**Docs:**
- `CLAUDE.md` — one-line note under journal section that repeat failures get verbose hints.

## Key files to read before starting

- `src/util.mjs:85` — current `die()`.
- `src/journal.mjs` — `readJournalEntries` (filter by sid + timestamp + exit).
- `src/lease.mjs:17` — `currentSessionId()` for journal filtering.
- `bin/dotmd.mjs` near the top of `main()` — where `DotmdError` is caught so the user sees the message; that's where the hint must be appended in time.

## Verification plan

- `npm test` clean (including new hints tests).
- Smoke: with `DOTMD_JOURNAL=1`, run `dotmd status foo bar baz` twice; second emits the verbose tip.
- Negative smoke: `DOTMD_NO_HINTS=1 dotmd status foo bar baz` twice — second is still terse.

## Gotchas

- Journal-disabled path must skip everything cleanly (no warnings, no IO).
- Don't break `DotmdError` shape — hint goes into `message`, not a new field.
- `die()` is hot in test code (lots of negative-path tests `match()` exact messages). Append "Tip: …" as a separate paragraph (newline-separated) so `match(/Cannot pick up/, ...)` assertions still pass; only `strictEqual(msg, …)` assertions would break. Grep for those before flipping.

## Closeout

(Add when shipped: what landed, any decisions revised mid-impl, bump used.)
