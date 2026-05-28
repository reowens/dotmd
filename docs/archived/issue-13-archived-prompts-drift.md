---
type: plan
status: archived
created: 2026-05-28T03:58:19Z
updated: 2026-05-28T04:02:59Z
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

# Issue 13 Archived Prompts Drift

**Issue #13 hotfix** — `dotmd use` / `dotmd next` (no-arg) surfaces files physically located in `docs/prompts/archived/` (or any archived dir) that have `status: pending` frontmatter. This drift was filed extreme severity because the agent then prints body of an old/stale prompt and the CLI itself prints `Already archived: <path>` at the end of the same invocation. Bump: **0.45.2** (hotfix).

## Surgical fix

1. `src/util.mjs` — add `isArchivedPath(repoPath, config)`. True if any path segment equals `config.archiveDir`, i.e. `repoPath.split('/').includes(config.archiveDir)`. Don't anchor at start — `docs/plans/archived/foo.md` and `docs/prompts/archived/foo.md` both qualify.
2. `src/prompts.mjs` `pendingPromptsOldestFirst` — filter out docs where `isArchivedPath(d.path, config)`.
3. `src/query.mjs` `--exclude-archived` — currently filters by status only. Also exclude by path.
4. `src/lifecycle.mjs:555` heal path — when `dotmd prompts archive <file>` (or `dotmd set archived <file>`) targets a file already under `archiveDir/` but with `status != archived`, flip the frontmatter to `archived` (and `updated:` to nowIso) instead of dying with "Already archived". This is the unstuck-action — drift heals on demand.
5. `src/validate.mjs` — add inverse-drift check next to the existing L208 forward-drift block: a doc whose `dirname` includes `archiveDir` but whose `status` is not in `archiveStatuses` → error with the heal command (`dotmd prompts archive <file>` or `dotmd set archived <file>`).

## Tests (test/prompts.test.mjs or new test/archived-drift.test.mjs)

- `pending-in-archived skipped from use no-arg` — fixture with one pending-in-archived prompt + one pending-in-live prompt; `runPromptsNext` picks the live one.
- `query --exclude-archived skips archived path` — fixture with `status: pending` doc under archived dir; query excludes it.
- `prompts archive heals stuck drift` — fixture with file under archived/ + status pending; running archive flips status to archived rather than dying.
- `validator flags inverse drift` — `dotmd check` errors on `status: pending` under archived/.

## Verify

- `npm test` clean (1012+ tests, new ones included).
- Smoke on dotmd's own repo: drop a `status: pending` test file under `docs/prompts/archived/`, run `dotmd next` → should see "No pending prompts" (not the bogus prompt). `dotmd check` errors with heal hint.

## Closeout

(Add when shipped: version cut, behavior change summary.)
