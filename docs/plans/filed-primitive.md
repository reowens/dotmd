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

# Filed Primitive

**F15 — `filed: true` filing primitive.** Audit ref: `docs/audit-beyond-platform.md:212-232`. Bump target: **0.40.0 or 0.41.0** (additive — `archive: true` continues to work; new `filed: true` flag is opt-in per-status). Needs a `/tmp/` spike before committing because filesystem layout is at stake.

## Goal

Untangle dotmd's `archive: true` per-status flag, which today conflates "this status is terminal" with "this status's docs live in a named subdirectory." The conflation works fine for `archived` (where both hold), but blocks a real organization win for *parked* statuses (`backlog`, `queued-after`, `partial`) that don't cycle and would benefit from filing without churn.

**The win:** A user with 222 flat plans can opt-in `backlog: { filed: true }` — new backlog plans get filed into `docs/plans/backlog/` on status-transition. Active plans stay un-filed (no cycling churn). Visual sorting without behavior changes for non-parked statuses.

## Design (decisions locked)

1. **New flag:** `filed: true` on a status definition in `types.<type>.statuses.<status>`. Pure filing primitive — "on transition INTO this status, move the doc into `<root>/<status-name>/`." Nothing else.
2. **`archive: true` becomes sugar.** Derived as `filed: true + terminal: true` (and continues to imply `quiet: true` via existing rich-status normalization). Zero breakage for existing configs.
3. **Directory name** for non-archive filed statuses = status name verbatim. No separate config knob. `archiveDir` config keeps its meaning ONLY for the `archive` sugar (lets users rename to `trash`/`done`/etc.).
4. **Lazy filing:** Files move on TRANSITION INTO the filed status (via `dotmd status <file> <s>` / `dotmd archive` / `dotmd pickup`'s reverse path). No bulk-migration on config change — existing files drift until naturally transitioned. Reserves bulk migration for an explicit one-shot command (deferred — out of scope for v1).
5. **Symmetric un-filing:** When a doc transitions OUT of a filed status into a non-filed status, move back to the type's flat dir. This is the surprising case — test explicitly.
6. **Validator:** `liveTypeDirsForRoots` in `src/validate.mjs` learns that any `filed: true` directory is a bucket dir (not a "drift" location). The archive-drift check generalizes: a doc with status X where status X has `filed: true` and X's dir-name ≠ doc's parent dir → drift error suggesting the move.
7. **Ref updates:** Reuse the existing `updateRefsFromMovedFile` (F1 fix landed) — already handles cross-dir moves correctly. Call from the generalized filing path instead of the archive-only path.

## /tmp/ spike (REQUIRED before committing)

Build a fixture under `/tmp/dotmd-filed-spike/`:

- Config defining `backlog: { filed: true, staleDays: 60 }` on the `plan` type.
- 3 existing plans: two flat in `docs/plans/`, one already in `docs/plans/backlog/` (simulating a prior session).
- A 4th plan with `related_plans: [backlog-plan.md]` (ref-update target).

Exercise:
- `dotmd status plan-a backlog` → moves to `docs/plans/backlog/plan-a.md`, refs in plan-d rewrite.
- `dotmd status backlog-plan active` → moves back to `docs/plans/backlog-plan.md`.
- `dotmd archive plan-c` → moves to `docs/plans/archived/` as before (sugar contract).

Goals: verify lazy-move semantics feel right; verify ref updates work bidirectionally; verify the validator doesn't false-positive on the new bucket dir; verify back-compat for plain `archive: true` configs.

## Open questions to settle DURING implementation, not now

- **Multiple filed statuses landing in the same dir name.** Shouldn't happen (dir = status name = unique), but verify the validator doesn't choke if a user does something weird (e.g. aliasing).
- **What happens when a file is in `docs/plans/backlog/foo.md` and the user transitions it to a DIFFERENT filed status?** Move bucket → bucket (e.g. backlog → queued-after). Test explicitly.
- **Should `dotmd init`'s starter config opt any status into `filed: true`?** Lean NO — keep starter conservative. Document the option in `dotmd.config.example.mjs`.
- **Touch-on-transition.** Filing implies a file move + ref rewrites — does `updated:` get bumped? Match what `archive` does today (probably yes); verify.

## Scope (estimated ~80 lines core + tests)

**Core:**
- `src/config.mjs` (`normalizeRichStatuses`, ~lines 122-195) — add `filed` to derived bucket. New `filedStatuses: Map<statusName, dirName>` on the merged config. `archive: true` → also sets `filed: true + terminal: true` (sugar).
- `src/lifecycle.mjs` — `runArchive` generalizes into a `fileTransition(filePath, oldStatus, newStatus, config)` helper that consults `filedStatuses`. When `newStatus` is filed and target dir differs from current parent → move + rewrite refs. When `oldStatus` was filed and `newStatus` is not → move back to type's flat dir. `runArchive` becomes a thin wrapper around `runStatus(<file>, 'archived')`.
- `src/validate.mjs:9-46` (`liveTypeDirsForRoots`) — knows about `filedStatuses` so bucket dirs don't count as "live drift" locations. Archive-drift error generalizes to "filing-drift."

**Tests:**
- `test/filed.test.mjs` — status-transition-files-the-doc, transition-out-moves-back, transition-bucket-to-bucket, archive-still-works-via-sugar, filed-dir-doesnt-trigger-drift-error, mismatched-dir-triggers-drift-error, ref-updates-cross-dir.

**Docs:**
- `dotmd.config.example.mjs` — example status using `filed: true` (the `backlog` case).
- `CLAUDE.md` — note under "Document Types" that statuses can be `filed: true` to file docs by directory.

**Out of scope for v1:**
- Bulk-migrate command (`dotmd migrate --by-status`). Defer until pain shows up.
- Configurable dir name per filed status — just use status name verbatim.

## Key files to read before starting

- `src/config.mjs:122-195` — `normalizeRichStatuses`. The existing `archive` derivation is the model.
- `src/lifecycle.mjs` — current `runArchive` (path move + ref rewrite). This body generalizes.
- `src/validate.mjs:9-46` — `liveTypeDirsForRoots` + the archive-drift check.

## Verification plan

- `/tmp/` spike (above) green before any production edit.
- `npm test` clean — especially existing archive tests must pass unchanged (sugar contract).
- Run on Beyond's plan tree: add `backlog: { filed: true }`, transition a couple of plans, verify no surprise behavior changes.

## Gotchas

- Back-compat is load-bearing: every existing config using `archive: true` must produce identical behavior after this change. Add a regression test that imports a config with raw `archive: true` and asserts the derived `filedStatuses` map.
- The bidirectional move (filed-out: bucket → flat) is the surprising case. Test it explicitly.
- Transitions invoked from multiple commands (`status`, `archive`, `pickup`'s release path, `release --to`) all need to go through the new helper — don't leave a path that bypasses filing.

## Closeout

(Add when shipped: what landed, any decisions revised mid-impl, bump used.)
