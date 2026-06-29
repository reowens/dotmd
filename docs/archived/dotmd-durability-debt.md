---
type: plan
status: archived
created: 2026-06-29T05:42:30Z
updated: 2026-06-29T07:02:02Z
surfaces:
modules:
domain:
audience: internal
parent_plan: ../plans/dotmd-forward.md
related_plans:
related_docs:
current_state: Roadmap Track 1. A forward-planning audit (3 parallel researchers, 2026-06-29) found correctness/durability debt that bites silently — no user files a ticket, they just get wrong behavior. Two classes — CRLF/Windows blindness and untested mutation modules. This is the one track that should jump dotmd's usual "wait for a real ask" queue because it's risk, not enhancement.
next_step: Start with Finding #3 (lock current behavior with tests for the two uncovered mutation modules) before touching the CRLF fix, so the fix has a safety net.
---

# Dotmd Durability Debt

> Audit of dotmd's core for silent-failure classes — places the tool produces
> wrong behavior without surfacing an error. Headline: a CRLF-only (Windows)
> markdown file is seen as having **no frontmatter at all**, and the two
> frontmatter-*mutating* code paths have effectively no test coverage.

## Problem

dotmd's value is "never silently corrupt or mis-handle frontmatter." Three spots
violate that quietly: a Windows line-ending file slips past frontmatter
detection, the status-edit guard no-ops on Windows paths, and the modules that
*rewrite* frontmatter aren't tested. None of these announce themselves — the
affected user just gets a doc treated as untyped, an unguarded edit, or (worst
case) a botched rewrite. The "wait for a real ask" philosophy doesn't apply:
nobody asks, because nobody sees the failure.

## Findings (ranked)

### 1. CRLF / Windows frontmatter blindness [highest — silent data loss]

`src/frontmatter.mjs` detects the `---` fence as LF-only (`extractFrontmatter`
checks `'---\n'` / `'\n---\n'`). A CRLF-authored doc (the Windows default) is
treated as having **no frontmatter** → no `type`, no `status`, dropped from the
managed set entirely. Claude Code runs on Windows, so this is a live class.
Fix: normalize line endings (or match `\r?\n`) in the boundary scan; the
per-line parser already strips `\r`, so only the fence detection is wrong.

### 2. Guard is POSIX-only [Windows: protection silently absent]

`src/guard.mjs:45` `isManagedDoc()` matches with hardcoded `/` separators and
loose `includes()`; `shellTokens()` (`:54`) splits on whitespace. On Windows
backslash paths the PreToolUse status-edit guard simply no-ops — the agent can
hand-edit `status:` with no guard firing. Fix: normalize separators before
matching; consider quoted-path handling in `shellTokens`.

### 3. Untested frontmatter-mutating modules [latent corruption risk]

- `src/frontmatter-fix.mjs` (193 LOC) **rewrites frontmatter** and has **zero
  test coverage** and no indirect references — the single highest-risk gap.
- `src/use.mjs` (the core `dotmd use` consume/pickup verb) has **no direct
  test**; it's only exercised incidentally via lifecycle/prompts tests.
A rewriter with no tests in a tool whose job is not corrupting frontmatter is a
standing liability. **Do this first** — characterization tests lock current
behavior so #1/#2 can be fixed without regression fear.

### 4. Lower-severity parser sharp edges [batch if cheap]

`parseScalar` (`frontmatter.mjs:216`) coerces only `true`/`false` — numbers,
null, dates stay strings (downstream re-coerces). Duplicate keys silently keep
the first; the warning is opt-in. No nested maps/objects supported. Document the
supported-subset boundary explicitly; coerce numbers/null if low-risk.

## Suggested order

1. **#3 tests first** — characterize `frontmatter-fix.mjs` + `use.mjs`.
2. **#1 CRLF fix** — now safe under the new tests; add a CRLF fixture.
3. **#2 guard normalization** — separator-agnostic path matching + test.
4. **#4** — only the cheap, low-risk parser polish; skip the rest.

## Open Questions

- **Does Windows matter to the user base?** If dotmd is macOS/Linux-only in
  practice, #1 and #2 drop in priority (still real, just dormant) — but #3
  (tests) stands regardless of platform. Confirm before sinking time into CRLF.

## Closeout

All three substantive findings shipped, tests-first per the suggested order, on a
green suite (1231 pass / 0 fail, +40 over baseline).

- **#3 (tests first)** — `test/frontmatter-fix.test.mjs` directly characterizes
  the three exported pure helpers (`splitAtBoundary`, `replaceFrontmatterField`,
  `insertOrAppendSection`) plus the orchestrator's skip branches and a
  no-data-loss invariant; `test/use.test.mjs` covers the `dotmd use` dispatch
  verb (prompt→consume, plan→in-session, doc→read, no-arg oldest-pending, empty
  queue).
- **#1 (CRLF)** — `normalizeEol()` added to `src/frontmatter.mjs` and applied at
  all 7 independent fence-detection sites (extract/replace, lifecycle
  update/write/appendVersionHistory, doctor `findWorkflowDrift`, new
  `splitBodyFrontmatter`). CRLF docs now index and mutate; a managed doc settles
  to LF on its first rewrite (content-preserving). Covered by `test/crlf.test.mjs`
  (end-to-end) and a CRLF block in `test/frontmatter.test.mjs`.
- **#2 (guard)** — `toSlash()` makes `isPromptPath`/`isManagedDoc`
  separator-agnostic, so the status-edit and commit-prompt guards fire on Windows
  backslash paths (5 new guard tests). POSIX behavior is byte-identical.
- **#4** — documented the parser's supported-subset boundary in
  `parseSimpleFrontmatter`. **Deliberately skipped** number/null coercion: it is
  *not* low-risk — frontmatter values are string-typed throughout (dates,
  version strings, numeric ids), so coercing would risk silent type changes.

**Open question resolved:** Windows IS in scope (user confirmed), so #1/#2 were
both implemented rather than parked.

**Not done (out of scope by design):** the rest of #4 (number/null coercion,
nested-map support). No successor plan — these are non-goals, not deferred tail
work. Changes were left uncommitted per the session's "reconcile the tree later"
decision.

## Version History

- **2026-06-29T07:02:02Z** Archived — Shipped Track 1. #3: characterization tests for the two uncovered mutation modules (test/frontmatter-fix.test.mjs unit-tests splitAtBoundary/replaceFrontmatterField/insertOrAppendSection + orchestration skip branches; test/use.test.mjs covers the use dispatch verb). #1 CRLF: added normalizeEol() and applied it at all 7 fence-detection sites (frontmatter extract/replace, lifecycle update/write/appendVersionHistory, doctor findWorkflowDrift, new splitBodyFrontmatter) — CRLF docs now index + mutate, settling to LF on first rewrite (test/crlf.test.mjs end-to-end + frontmatter.test.mjs unit). #2 guard: toSlash() separator-agnostic isPromptPath/isManagedDoc so the status-edit/commit-prompt guards fire on Windows backslash paths (5 new guard tests). #4: documented the parser supported-subset boundary; deliberately skipped number/null coercion (frontmatter values are string-typed throughout — coercion is not low-risk). Open question resolved: Windows IS in scope (user confirmed). Full suite 1231 pass / 0 fail (+40).
- **2026-06-29T06:49:01Z** Status: active → in-session.
- **2026-06-29T05:42:30Z** Created (audit) as roadmap Track 1.
