---
type: prompt
status: archived
created: 2026-05-28T03:39:10Z
updated: 2026-05-28T03:45:40Z
dotmd_version: 0.45.0
context: "Resume Post 045 Command Scrub"
related_plans:
---

Just shipped 0.45.0: `dotmd use [file]` is the single top-level type-aware verb (prompt → consume, plan → start work, doc → read, no-arg → oldest pending prompt). `pickup`, `release`, `check` are off the agent-visible surface. Lease/release language scrubbed from every agent-facing string (validator, slash commands, pickup-card banner, CLAUDE.md). 1012/1012 tests pass.

Three live threads, pick one:

1. **Issue #13 (P0, agents are hitting it now)** — `dotmd use` with no arg surfaces files physically located in `docs/prompts/archived/` that have `status: pending` frontmatter (drift). The bug is in `src/prompts.mjs` `pendingPromptsOldestFirst` (filters by `d.type === 'prompt' && d.status === 'pending'`, no directory check). Surgical fix:
   - Add `isArchivedPath(repoPath, config)` to `src/util.mjs` — check `path.includes('/' + config.archiveDir + '/')` or `startsWith(config.archiveDir + '/')`.
   - Filter in `pendingPromptsOldestFirst` and apply the same rule in `src/query.mjs` `--exclude-archived` (currently filters by status only).
   - Heal path: `dotmd prompts archive <file>` (or, since we have `set` now, `dotmd set archived <file>` on a file already in archived/) should flip stuck frontmatter to `archived` instead of refusing. Look at `src/lifecycle.mjs:555` — the "Already archived" die.
   - Validator: add a check in `src/validate.mjs` for the inverse drift (file under archived/ but status != archived). Existing forward-drift check is at L208.
   Tests: 4 cases — pending-in-archived skipped from `use`, query --exclude-archived, archive-heal, validator error.

2. **Issue #12** — `db` surface rejected, modules required-but-no-clear-fallback, current_state cap too tight. Untouched this session.

3. **Error UX audit** — user named this as the deeper problem ("agents don't know what to do when I paste commands wrong"). Every `die()` should be one line that names the fix. Not done. Probably its own plan.

Recommended order: ship #13 as 0.45.1 hotfix (~30 min), then start #3 as a real plan. #12 can slot in after.

Gotchas:
- HUD output is now intentionally always-on with the command primer line — don't reintroduce plan/prompt/error counts (user explicitly rejected those).
- `pickup`/`release`/`check` dispatch is still wired in `bin/dotmd.mjs` for back-compat with existing SessionEnd hooks — don't surface them in help, don't delete the dispatch.
- Internal `lease.mjs` module is fine to keep (concurrency-safety mechanic). Only the WORDS "lease"/"release" got scrubbed from agent-facing strings. Don't rename the module.
- User strongly dislikes (a) asking for command output I can produce myself, (b) multi-option design discussions, (c) extra layers/nesting. Reach for `Bash` to verify behavior, give concrete single proposals.

