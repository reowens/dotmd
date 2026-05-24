---
type: doc
status: active
created: 2026-05-24
updated: 2026-05-24
dotmd_version: 0.32.0
---

# dotmd audit against Beyond platform — 2026-05-24

> Third real-codebase audit (after self-dogfood and gmax-brownfield). Target: `/Users/reoiv/Development/beyond/platform` — 1,182 scanned docs across 8 roots, heavily customized config (custom statuses, per-status flags, surface taxonomy, excludeDirs). Read-only inspection only; one inadvertent doctor mutation reverted (finding 6 below explains the slip). Findings sorted P1 → P3 by impact, in suggested fix order.
>
> **Status (post-2026-05-24 same-session fixes):** F1, F2, F3 shipped in this session — see `## Verified impact` below. F4–F13 remain open and tracked in the `audit-beyond-fixes` prompt for the next session.

## Verified impact (F1–F3, applied in this session)

Measured against beyond/platform after the production fixes were applied (running the local checked-out dotmd, not the installed 0.32.0):

| Metric | Before (0.32.0) | After | Delta |
|---|---|---|---|
| `dotmd check` warnings | 196 | 75 | **−62%** |
| `dotmd check` errors | 3 | 0 | −3 |
| `dotmd graph` broken edges | 62 | 4 | **−58 false positives** |
| `Both module/modules` warnings | 91 | 3 | F3 |
| `Both surface/surfaces` warnings | 14 | 4 | F3 |
| Archived-plan validator warnings | ~46 | 0 | F2 |
| Test suite | 798 pass | 808 pass | +10 new tests |

The 4 remaining "broken edges" and the 3 + 4 remaining "Both…divergent" warnings are **genuine** data issues in beyond (refs to truly-archived plans; surface/module values that genuinely differ between singular and plural) — not false positives.

## Scale snapshot

- **1,182 docs** (1,271 .md files on disk minus excluded `evidence/`); 8 roots: `docs/plans`, `docs/modules`, `docs/core`, `docs/hardware`, `docs/app`, `docs/dev`, `docs/business`, `docs/prompts`.
- **Performance: solid.** Every command sub-second on this corpus — `list 0.79s`, `briefing 0.79s`, `hud 0.81s`, `check 0.79s`, `plans 0.76s`, `json 0.73s`, `graph --json 0.78s`. No quadratic patterns surfaced. **Performance is not a finding.**
- `dotmd check`: errors 0, warnings 279. Top warning categories by count: `Both module/modules set` 91, `Unknown surface` 38, `frontmatter updated behind git history` 43, `body link does not resolve` 38, `Both surface/surfaces set` 14, heading drift 10.

## Findings

### 1. Three call sites resolve refs with `path.resolve(docDir, relPath)` only — bypassing `resolveRefPath`'s repo-root fallback. — P1

Same logical bug at three sites; `dotmd graph` is the visible symptom but `src/lifecycle.mjs`'s archive/rename rewrite path silently misfires the same way.

**Site A — `src/graph.mjs:63`. Visible: 62 false-broken edges in beyond.** `docs/plans/atlas-trip-planning.md` has `related_plans: docs/journeys/discovery-to-booking.md`. The target file exists at `<repo>/docs/journeys/discovery-to-booking.md`. `dotmd check` resolves it (warnings: 0 for this doc). `dotmd graph --json` emits:

```json
{ "source": "docs/plans/atlas-trip-planning.md",
  "target": "docs/plans/docs/journeys/discovery-to-booking.md",
  "broken": true }
```

— target path is `docs/plans/` (the source's dir) joined with the repo-relative ref string, doubling `docs/`.

**Site B — `src/lifecycle.mjs:724` (ref-field rewrite in `updateRefsFromMovedFile`).** When archive/rename moves a doc, this function rewrites ref fields in the moved file's frontmatter. For a YAML list item like `- docs/journeys/foo.md`, it computes `path.resolve(oldDir, refPath)`, checks `existsSync`, and rewrites if found. Repo-relative refs make the absolute wrong (doubled `docs/`), `existsSync` fails, **rewrite silently skips**. No user-visible signal until the ref renders broken later.

**Site C — `src/lifecycle.mjs:735` (body-link rewrite, same function).** Same bug for `[text](path.md)` body links. Same silent-skip outcome.

**Root cause.** The canonical resolver `resolveRefPath` in `src/util.mjs:113` tries doc-relative first then **falls back to repo-root-relative**. `src/validate.mjs:172,180,201` and `src/pickup-card.mjs:48` all use it. Graph and lifecycle are the only holdouts.

**Proposed fix.** All three sites: `resolveRefPath(relPath, docDir, repoRoot) ?? path.resolve(docDir, relPath)`. The fallback in graph preserves the wrong-looking target so users still see broken-shaped edges; in lifecycle, the canonical-resolver branch finds the existing file via repo-root, the rewrite proceeds correctly, and the fallback is moot (still gated by `existsSync`).

**Regression tests.**
- `test/graph.test.mjs`: a doc in `docs/plans/` with `related_plans: docs/journeys/foo.md` produces an edge with `target: docs/journeys/foo.md` and `broken: false`.
- `test/lifecycle.test.mjs` (or `test/archive.test.mjs` if more fitting): a doc with a repo-relative ref gets archived; the rewritten ref points at the same target via the new relative path.

### 2. Validators ignore `skipWarningsFor` for archived plans. — P1

Beyond's `archived` plan status has `quiet: true` (sugar for `skipStale + skipWarnings`), yet 46 of the 279 warnings come from `docs/plans/archived/*.md`. The validators that fire ignore the skip list:

- `src/validate.mjs:112` — `Unknown surface` (10 of the 38 unknown-surface warnings are archived).
- `src/validate.mjs:181` — `body link does not resolve` (most of the 38 body-link warnings are archived — `dev-seed-atlas-coverage.md` alone fires 8).
- `src/validate.mjs:172` — reference-field "does not resolve" **errors** (none fired in beyond, but the gate is missing; a single archived plan with a stale `related_plans` ref would flip `errors: 0`).

By contrast, `validate.mjs:81` (missing `updated`), `:126` (missing summary), `:132` (current_state/next_step), `validatePlanShape :252`, and `validateDocShape :336` all DO check `skipWarningsFor`. The three above are the omissions.

**Proposed fix.** Add `if (config.lifecycle.skipWarningsFor.has(doc.status)) continue;` (or its in-function equivalent) ahead of each of the three offending checks. For the `:172` ref-field error block, the right gate is probably `terminalStatuses` (an archived plan referencing a deleted plan is normal historical state, not an error to fix).

Regression test: a plan with `status: archived`, an unknown `surface`, an unresolved body link, and an unresolved `related_plans` entry produces zero warnings and zero errors.

### 3. `Both module/modules` warning fires on consistent values; it's 33% of all warnings. — P1 (noise)

91 plans (55% of non-archived plans) trigger `Both \`module\` (singular) and \`modules\` (array) are set. Pick one — prefer \`modules\` array form.` In every sample I checked, the singular value is already a member of the plural array (e.g. `module: foyer` + `modules: [foyer, suite, situ, iris]`). `src/index.mjs:162-164` silently merges the singular into the array — they're not conflicting, they're consistent.

The warning is also worsened by Beyond's custom plan template (`dotmd.config.mjs` → `templates.plan.frontmatter`), which emits both `module:` and `modules:` headers. Users fill in both because the template asks for them.

**Proposed fix.** `src/validate.mjs:285-289` (and the parallel `surface/surfaces` block at `:278-283`): only warn when `frontmatter.module && !frontmatter.modules.includes(frontmatter.module)` — i.e., the values genuinely diverge. The "prefer plural" stylistic preference becomes a `lint --fix` migration (drop the singular when it's already in the plural), not a `check` warning.

Cuts 105 warnings (91 module + 14 surface) from beyond's check output — bringing it from 279 → 174 (38% reduction in noise).

### 4. `dotmd doctor` is a mutating command labeled as safe in the audit prompt's "safe commands" list — and has no preview by default. — P2

The audit prompt described `doctor (read-only mode)` as safe. There is no read-only mode for plain `dotmd doctor`; only `--statuses` is read-only. Running `dotmd doctor` against beyond mutated 3 files (broken-ref rewrites in `docs/modules/atlas/atlas-integrations.md`, `docs/modules/foyer/foyer.md`, `docs/plans/archived/comms-address-preferences.md`) before I noticed and reverted via `git checkout`. The `--help` text *does* state "writes by default" — but the friction surface is too low for a multi-step auto-fix command on a 1k+ doc repo.

Also noticed: doctor's run stopped after step 1 in my invocation (only "Fixing broken references…" output, no step 2-5). Couldn't reproduce a hang; output was 9 lines and exit code looked clean. Worth a follow-up `time -p dotmd doctor --dry-run` on beyond to see if doctor short-circuits when later steps have nothing to do, or if there's a step-2-onward bug.

**Proposed fix.**
- Default `dotmd doctor` to **dry-run preview** + a confirmation prompt; require `--apply` (or `--yes`) to actually mutate. Mirrors `dotmd archive`'s safe pattern.
- Print a clear startup banner: `dotmd doctor will: fix-refs (3 files), lint --fix (12 files), touch dates (43 files), regenerate index. Proceed? [y/N]`
- Investigate the apparent early-exit after step 1 (run `dotmd doctor --dry-run` on a fresh beyond worktree and see if steps 2-5 emit their headings).

### 5. Glossary error "section found but no entries parsed" lies when section is missing. — P2

Beyond's `dotmd.config.mjs` configures `glossary: { path: 'CLAUDE.md', section: 'Terminology' }`. CLAUDE.md has no `## Terminology` heading (only body-text mentions). Running `dotmd glossary foo` or `dotmd glossary --list` dies with:

```
Glossary section found but no entries parsed.
```

— but the section was **not** found. `parseGlossaryTable` (`src/glossary.mjs:7-52`) returns `[]` for both "no `^## Heading` match" and "match but no table rows extracted", and the caller at `:182` can't distinguish.

**Proposed fix.** Make `parseGlossaryTable` return `{ found: bool, entries: [] }` (or throw a sentinel). Differentiate the two error messages at the call site:
- not found → `Glossary section '## Terminology' not found in CLAUDE.md. Add the section, or update glossary.section in dotmd.config.mjs.`
- found but empty → `Glossary section '## Terminology' found but contains no recognizable entries (expected markdown table or schema→UI bullets). See docs for format.`

### 6. `partial` status conflates plan-type and doc-type in `stats` / briefing totals. — P2

`dotmd stats` reports:

```
in-session: 8  active: 34  planned: 63  blocked: 30  partial: 84  awaiting: 6  …
```

`partial: 84` is the sum of `plan/partial` (22) and `doc/partial` (62) — but Beyond uses `partial` for two semantically distinct things: "plan shipped most of its scope, tail deferred" vs. "doc is incomplete reference material". Lumping them obscures plan-pipeline health. Same in `dotmd briefing`'s plans line vs. docs line (which split correctly), but `stats` doesn't.

This is endemic to the per-type status taxonomy: same status name can appear under multiple types with different meanings. The status-counts dict in `stats.mjs --json` is also a flat `{ [status]: count }` shape (`countsByStatus`), forfeiting the type info.

**Proposed fix.** In `src/stats.mjs`, key counts by `${type}/${status}` internally; the human render groups by type:
```
Plans
  in-session: 8  active: 34  planned: 63  partial: 22  …
Docs
  current: 125  partial: 62  draft: 74  …
```
JSON: `countsByStatus: { plan: {…}, doc: {…}, … }` (plus a flattened legacy field for back-compat).

### 7. `dotmd query` "results: N" doesn't signal truncation. — P3

`dotmd query --type doc --status current` prints `results: 20`. Beyond actually has 125 docs matching. Default limit is 20 (`runQuery` in `src/query.mjs`), but the user has no indication more exist — they must read `--help` to discover `--all`.

JSON output exposes `_totalBeforeLimit: 125, limit: 20, all: false` — the text rendering just drops these. Same issue in `dotmd plans --status active` (`34 plans · 34 active` printed, but the listing only shows 10 — silently).

**Proposed fix.** When `_totalBeforeLimit > count`, render `results: 20 of 125 (use --all to see all)` in text mode. Two-line change in `src/query.mjs`'s renderer.

### 8. Contradictory `staleDays:60` + `skipStale:true` on the same status — silent precedence. — P3

Beyond's config has `backlog: { staleDays: 60, skipStale: true, … }`. `skipStale` wins (correct), but `staleDays: 60` is silently ignored. No warning at config-load time; the user has no signal their `staleDays` is dead config.

**Proposed fix.** In `src/statuses.mjs` (`normalizeRichStatus` or wherever per-status flags merge), emit a `warn()` at load when a status has both `skipStale: true` and `staleDays` set (or both `skipWarnings: true` and `requiresModule: true` — the latter pair is also implicitly never-enforced since skipWarnings would suppress the violation). Surface via `dotmd doctor --statuses` for richer diagnostics.

### 9. `dotmd query` truncated rendering also affects `--limit` flag interaction. — P3

`dotmd plans --status in-session` shows 8 of 8 plans (no truncation, fine). But `dotmd plans --status active` shows 10 of 34 plans with default `--limit 10` — and the header line `34 plans · 34 active` already showed `34`, so the user thinks all 34 are listed. Same root cause as F7 but different default (`plans` uses limit 10 instead of `query`'s 20).

**Proposed fix.** Same as F7 — add "showing X of Y" annotation when truncated. Also worth aligning `plans` and `query` default limits or documenting the divergence.

### 10. `dotmd briefing`'s tail "Stale" line is unbounded. — P3

In beyond, the briefing's tail "Stale" line is 27 slugs (≈400 chars, ~3 visual lines wrapped). With a more permissive `stale` preset or a larger backlog, this would wall-of-text the briefing. Briefing is meant to be skim-glanceable; the in-session/active/etc. sections truncate cleanly, but this tail doesn't.

**Proposed fix.** Cap the stale tail at e.g. 8 slugs with "… and N more (run `dotmd stale` for the full list)" suffix. Search `src/briefing.mjs` for the "Stale:" prefix.

### 11. Stale-status detection of `in-session` plans without active leases. — P3

Beyond has 8 plans with `status: in-session`, but `.dotmd/leases/` doesn't exist (only `.dotmd/handoffs/`). Either the user is running 8 concurrent sessions (plausible — they're a confirmed multi-instance user) or some of those statuses are stale from sessions that ended without `release` (likely, given `~/.claude/settings.json` may not have the SessionEnd hook on every machine).

dotmd already has the lease infrastructure (`src/lease.mjs`); it could surface "this plan is `in-session` but no live lease exists for it" as a warning, suggesting `dotmd release <plan>` or `dotmd status <plan> active`.

**Proposed fix.** Add a check in `src/validate.mjs` (gated by status being `in-session` and the lease file's absence/age) producing a warning like `\`status: in-session\` but no active lease found (last session may have crashed). Run \`dotmd release\` or \`dotmd status <plan> active\` to clean up.` Could be `--check-leases` opt-in if it's noisy for legit concurrent users.

### 12. `dotmd glossary --list` shows nothing when the glossary is misconfigured. — P3

When the glossary fails to parse (see F5), `--list` produces identical output to a bad term lookup — just the die message. `--list` should be specifically helpful: "No glossary entries available. Configured to read from CLAUDE.md § Terminology. Section missing — see `dotmd init --glossary` to scaffold one." (or similar.)

**Proposed fix.** Branch `runGlossary`'s `--list` path to give a config-diagnostic error when entries are empty, separate from the term-lookup path's `No glossary match for "X".`

### 13. (Observation, not a defect) `frontmatter updated: X is behind git history Y` may be too noisy for the doctor auto-fix loop. — P3

43 plans warn `frontmatter updated: 2026-05-09 is behind git history (last committed 2026-05-14)`. This warning category is what `dotmd doctor`'s "sync dates from git" step (`runTouch ['--git']`) fixes — but until the user runs doctor, every `check` repeats the same 43 noise lines. Either:
- Quiet this category in `check` by default (it's a `touch --git` finding, not a structural defect), or
- Promote a one-line "43 docs have updated-behind-git dates (run `dotmd touch --git` to bulk-fix)" summary in `dotmd check`'s tail instead of one warning per doc.

**Proposed fix.** In `src/render.mjs` (check renderer), group warnings by category and collapse high-frequency auto-fixable ones into a count + remediation hint. Same treatment could help the `Both module/modules` category (F3) — even after the false-positive fix, a "9 plans have conflicting module/modules values (run `dotmd lint --fix`)" summary is friendlier than per-doc lines.

## Out-of-scope observations

- **Beyond's own data hygiene** is not dotmd's bug, but worth noting: 32 docs have `surface:` values that are file paths or globs (e.g. `scripts/dev.sh`, `docs/plans/**`) — these are stretching the taxonomy into a notes field. Would be useful for dotmd to detect "looks like a path, not a taxonomy token" and suggest `notes:` instead. (Not pursuing — too project-specific to merit a default rule.)
- **88 of 89 archived prompts** consumed correctly via `prompts use`; the original audit prompt itself archived cleanly. Prompt lifecycle infra looks healthy under load.
- **`dotmd doctor` runs gmax/touch/lint/index in sequence**; the partial output I saw (only step 1) is worth a deeper repro, but couldn't justify mutating beyond a second time to investigate. Tracked under F6.

## Suggested fix order

F1, F2, F3 first — they're correctness bugs, not just polish. F1 makes `graph` lie; F2 makes `check` count noise from quiet statuses; F3 alone removes 105 false-positive warnings.

F4 next — doctor's mutation safety is a footgun every audit so far has documented in a different shape (the gmax brownfield audit's recommendations also leaned this direction).

F5–F13 are polish; F5 + F6 have the highest "first encounter" cost for new users with custom configs; F11 helps every multi-instance user (which is *all* of them eventually).
