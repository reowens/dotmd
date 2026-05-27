---
type: doc
status: active
created: 2026-05-24
updated: 2026-05-26
dotmd_version: 0.38.0
---

# dotmd audit against Beyond platform — 2026-05-24

> Third real-codebase audit (after self-dogfood and gmax-brownfield). Target: `/Users/reoiv/Development/beyond/platform` — 1,182 scanned docs across 8 roots, heavily customized config (custom statuses, per-status flags, surface taxonomy, excludeDirs). Read-only inspection only; one inadvertent doctor mutation reverted (finding 6 below explains the slip). Findings sorted P1 → P3 by impact, in suggested fix order.
>
> **Status (post-2026-05-26):** F1, F2, F3 shipped in 0.32.1. F16 shipped in 0.36.0. F5, F7, F8, F9, F10, F12 shipped in 0.36.2. F18 shipped in 0.36.3 (subsumes F3's mitigation with a universal singular-key deprecation). F4 + F13 shipped in 0.37.0 (doctor dry-run-default + bulk-fix-hint collapse on `check`). F11 + F14 + F17a shipped in 0.38.0 (stale-lease warning in `check`, `shelved` prompt status, opt-in JSONL journal + `dotmd journal` reader). F6 shipped in 0.39.6 (per-type counts; `dotmd stats` groups Status by type — closes the last polish item). **Open:** none. F19 shipped in 0.39.7 (runlist primitive — `dotmd runlist <hub>` and `dotmd runlist next <hub>`; `runlist:` field on plans; back-pointer validator). F21 shipped in 0.39.8 (reorder `dotmd new <type>` help so `@path`/`-` come before inline, plus agent-tip about PreToolUse hook scanning — sourced from issue #11). **Scoped (active plans) 2026-05-26:** F15 (`docs/plans/filed-primitive.md`), F17b (`docs/plans/hud-reads-journal.md`), F17c (`docs/plans/die-self-correcting-hints.md`). Suggested pickup order: F17b (1-week-data window has elapsed) → F17c (downstream of F17b) → F15 (biggest, needs `/tmp/` spike). (F20 shipped 0.39.9.) F20 + F22 shipped in 0.39.9. F22: hud uses new `buildIndex({ errorsOnly: true })` mode — skips warning-only cross-doc passes while keeping per-file `validateDoc` + `checkIndex`; ~6× SessionStart speedup on platform-scale corpora, error-count invariant preserved. F20: `dotmd prompt`↔`prompts` and `prompts resume`↔`use` command aliases (sub-audit deferred `plan`/`plans` and `module`/`modules` — no obvious canonical mapping yet).

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

## 0.36.2 — verified impact (F5, F7, F8, F9, F10, F12)

Polish bundle: six P2/P3 findings shipped as a single no-breakage patch release. All additive or pure-render — no JSON shape changes, no schema changes, no behavior breaks.

| Finding | Surface | Fix |
|---|---|---|
| F5 | `dotmd glossary` "section found but no entries" lied when heading was missing | Split into "not found" vs "found but no recognizable entries"; messages name the section + file path |
| F7 | `dotmd query` printed `results: 20` with no truncation marker | Now prints `results: 20 of 125 (use --all to see all)` when limited |
| F8 | `staleDays: 60 + skipStale: true` silently dropped the number | Config-load `warn()` names the type, status, and conflicting fields. Same for `skipWarnings + requiresModule` |
| F9 | `dotmd plans --sort status` / `--group module` hid the "N more" footer | Footer lifted out of the triage-only branch; emits for every view shape |
| F10 | `dotmd context` / `dotmd hud` stale tail was unbounded (27 slugs ≈ 3 wrapped lines on beyond) | Caps at 8 slugs + `…and N more (run \`dotmd stale\` for the full list)`. Override via `config.context.staleTailLimit` |
| F12 | `dotmd glossary --list` couldn't differentiate missing-section vs empty-section | Inherits F5's split — both messages now route through `--list` too |

Test suite: 847 → 863 (+16 regression tests across `test/glossary.test.mjs`, `test/query.test.mjs`, `test/render.test.mjs`, `test/config.test.mjs`).

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

### 14. Prompt lifecycle has no "shelved" state — pending conflates "next up" with "saved but parked". — P2

Beyond has 2 pending prompts (`resume-dev-cockpit-open-items`, `resume-pitch-deck`) and 89 archived. The 2 pending are surfaced equally by `dotmd hud` and `dotmd briefing` — but the user described one as "what I want to use next" and the other as "saved but not reaching for it." Today the only way to express that distinction is to delete-and-rewrite or to live with both showing up at session start.

Plans already have nine stop-statuses tied to distinct unstuck-actions (per CLAUDE.md's "status earns its keep" principle). Prompts have one (`pending`), which means the "next up" and "shelved" semantics collapse together.

**Proposed fix.** Add `shelved` to the prompt type's default status vocab:
- Visible to `dotmd prompts list` (so the user can see what's parked)
- **Hidden** from `dotmd hud` and `dotmd briefing` pending-prompt surfaces
- Excluded from `dotmd prompts next` (only consumes `pending`)
- Activated via `dotmd status <prompt> pending` (or add `dotmd prompts shelve <file>` / `unshelve <file>` as sugar)

Scope: status vocab update in `src/config.mjs` defaults; filter check in `src/doctor.mjs` (hud surface) and `src/briefing.mjs`; optional sugar commands. ~50 lines + 4 tests. No filing-by-directory required — `shelved` is just a frontmatter status flip.

### 15. Generalize `archive: true` into a `filed: true` filing primitive. — P2

dotmd's `archive: true` per-status flag conflates two orthogonal concepts: "this status is terminal" and "this status's docs live in a named subdirectory." The conflation works for `archived` (where both hold) but blocks a real organization win at scale.

**Context.** Beyond has 222 non-archived plans flat in `docs/plans/`. The user originally chose against status-as-directory because cycling statuses (`active ↔ blocked ↔ awaiting ↔ in-session`) would generate constant renames + git noise. That reasoning still holds for cycling statuses. But *parked* statuses (`backlog`, `queued-after`, `partial`) don't cycle — filing them produces no churn and a real visual win.

**Proposed fix.** Untangle the flags:
- `filed: true` — new primitive. "On transition, move the doc into `<root>/<status-name>/`." Pure filing, nothing else.
- `archive: true` — becomes sugar for `filed: true + terminal: true` (and continues to imply `quiet: true` via its existing behavior). Zero breakage for existing configs — derives `filed: true` automatically.
- `archiveDir` config option — now only an override for the `archive` sugar (lets users rename the dir to `trash`/`done`/etc.). Other filed statuses use the status name verbatim — no separate config to keep in sync.

A user opts in per-status: setting `backlog: { filed: true }` files new backlog plans into `docs/plans/backlog/` on transition. `active`, `blocked`, `awaiting`, `in-session` stay un-filed (no cycling churn).

**Moving parts.** Most already exist for `archived/`:
- `mkdir` on first transition — same path as the archive case, just keyed off `filed` instead of hardcoded.
- `liveTypeDirsForRoots` in `src/validate.mjs` — needs to learn that any `filed: true` dir is a bucket dir (not a "drift" location). ~10 lines.
- `updateRefsFromMovedFile` (F1 fix landed) — already handles cross-dir moves correctly.
- `dotmd init` — no change; dirs created lazily on first use.
- `dotmd migrate --by-status` (new, optional) — one-shot for existing files when the user flips `filed: true` on a populated repo. Without it, existing files drift until naturally transitioned.

Scope: ~80 lines + tests for the core; ~50 for the migration command. The hardest decision isn't code — it's deciding which statuses opt in and living with that choice.

### 16. No per-module digest view — at scale, users drown in flat plan lists with no triage ladder. — P1 (feature, not a defect)

Beyond has 222 non-archived plans across ~54 modules. The user's direct framing: *"The number of plans is drowning me … to be able to go through them systematically and clean up AND to see what is most-likely stale and needs review without having to go into the file tree would be nice."*

dotmd already has every primitive needed — `--module` filter, staleness, status breakdown, has-next-step, ages — but no command *composes* them into a module dashboard. `dotmd stats` is global. `dotmd query --module foo` is one-module flat. `dotmd health` is global by status. None answer "which modules are drowning, which are stale, which need triage today."

**Proposed fix.** Three additive commands, view-only (no schema change, no churn):

1. **`dotmd modules`** — top-level dashboard table. One row per module:

   ```
   Module           Total  Active  Planned  Blocked  Partial  Research  Stale  AvgAge  Oldest         NextStep%
   foyer               18       4        8        3        2         1      3     23d  callbox 33d         72%
   identity            14       5        4        1        2         2      2     12d  id-verify 60d       64%
   atlas                9       1        5        1        0         2      1     31d  trip-plan 60d       55%
   …
   [no module]         47       9       18        4        5         3     12     28d  …                   42%
   ```

   Sort flags: `--sort total|stale|age|count` (default: `total` desc). `--json` for tooling. Empty/no-module bucket always surfaced so unowned plans don't hide.

2. **`dotmd module <name>`** — single-module deep view, grouped by status, stale plans flagged, next-step inline. Essentially `dotmd plans --module foo` but richer + grouped + stale-aware. Mirror of how `dotmd focus <status>` deepens `dotmd plans --status foo`.

3. **`dotmd stale --by module`** — group the existing stale list by module instead of flat-by-date. Same dataset, different bucketing.

**The cleanup-ladder angle.** Add `--cleanup-rank` to `dotmd modules` that sorts by `(stale_count × avg_age_days) / total_plans` — surfaces the modules most overdue for a triage pass. The workflow becomes: `dotmd modules --cleanup-rank` → walk down the table → `dotmd module <name>` on the top hit → triage/archive → next. Systematic cleanup flow without ever opening the file tree.

**Tradeoff.** Pure additive — no behavior change to any existing command, no schema, no migration. Risk is render shape (default to wide table at `display.lineWidth: 120`; provide stacked fallback for narrower terminals). Fully independent of F14 (shelved) and F15 (filed) — ships without either.

**Scope.** ~150 lines + tests across `src/modules.mjs` (new), small additions in `src/stale.mjs` for `--by module`, `bin/dotmd.mjs` for the new verbs. ~6 tests (modules table, modules --sort, modules --cleanup-rank, module deep view, stale --by module, JSON shape).

**Why P1 despite being a feature.** The user's pain is acute — 222 plans flat with no triage path is a workflow blocker, not a polish item. Likely the highest-ROI item in the audit for day-to-day use at Beyond's scale, and probably for any dotmd user who crosses ~50 active plans.

### 17. No observability surface for agent dotmd usage — fleet-of-Claude-sessions runs blind. — P2 (feature)

**Context (added 2026-05-26, after F1-F16).** dotmd's primary user is Claude — the multi-instance reality is that 2-8 Claude sessions touch the same repo per day (8 `in-session` plans seen in beyond at audit time). Today there is essentially no visibility into what those sessions are doing:

- **What exists:** `.dotmd/in-session.json` (lease state — who holds which plan), frontmatter `updated` + `dotmd_version` (light fingerprint), git history of `docs/` (what *changed*), `warn()` stderr output (~23 sites, ephemeral). No `DOTMD_DEBUG`, no command journal, no failed-call trail. `--verbose` exists on three commands and is not a global switch.
- **Failure modes invisible today:**
  - A session retries `dotmd status foo bar baz` (wrong arity) three times before giving up — no trace persists past the session.
  - A fresh session after `/clear` or auto-compaction has no signal of what its previous self was doing beyond the lease (which only names the plan, not the recent argv trajectory).
  - Cross-session divergence: Session A is mid-edit on a plan; Session B sees the in-session lease but no signal of recent activity beyond it.
  - Stale-lease detection (F11) catches the *symptom*; the *behavior pattern* that produced it (session crashed mid-`pickup`-without-`release`, vs. session never archived after shipping) is lost.
  - No corpus of "agents got this wrong" exists to inform CLAUDE.md improvements, slash-command shape, or die-message rewrites.

**Reframe.** The valuable feature is not "a log file for the human to read" — it's *making the agents better at using dotmd*. The journal is plumbing; **`dotmd hud` is the product surface** (it's what every session sees on boot via the SessionStart hook).

**Proposed fix.** Three landings, smallest first:

1. **F17a — Opt-in JSONL journal + reader.** `.dotmd/journal.jsonl` (gitignored, per-machine). One `appendFileSync` at the tail of `bin/dotmd.mjs` per invocation: `{ts, sid, pid, argv, exit, ms, v, err?}`. `O_APPEND` is atomic for sub-PIPE_BUF writes — no locking needed across concurrent sessions. Rotation cap at 30 days / 5 MB. Opt-in via `DOTMD_JOURNAL=1` or `config.journal: true`. Reader: `dotmd journal --tail N | --errors | --session <id> | --by-command | --since <iso>`. ~90 lines + 5 tests.

2. **F17b — `dotmd hud` reads the journal.** Two new sections, gated on `journal.exists`:
   - *Your previous self:* `Last 3 cmds (this session): pickup foo.md, edit, status foo paused` — reorients a post-`/clear` session without a resume prompt.
   - *Fleet:* `Session abc (alive 4m ago, 8 cmds on atlas-trip); session xyz stale on bar (28h, 0 cmds since pickup — run \`release --stale\`)` — different from F11 (which only catches dead leases): this catches *live divergence* across concurrent sessions.
   - *Recent rejections:* `4× "Both module/modules" warnings on foyer plans (last 1h)` — surfaces patterns across sessions that suggest template/default issues.
   ~60 lines + 4 tests.

3. **F17c — `die()` consults the journal (self-correcting hints).** When the current failing argv is near-identical to a recent failed argv from the same session, append a verbose-hint paragraph instead of the terse one-liner. Subtle — only triggers on the *second* failure of the same shape. Optional polish, not blocking the other two. ~30 lines + 2 tests.

**Sequencing.** Ship F17a as a contained release (small, well-bounded, no behavior change for users who don't opt in). Watch real journals for ~1 week before designing F17b's render — what's actually noisy vs. signal will surface from the data. F17c is a future polish ticket informed by F17b learnings.

**Decisions that need a human call (not Claude's to make):**
- Default-on or default-off? Default-off keeps surface clean for non-agent users; default-on means agents always benefit. Lean default-on when `.dotmd/` already exists (user has opted in to the dir).
- argv-PII concern: future users could have `dotmd new plan acquire-acme-corp` in `.dotmd/journal.jsonl`. `.gitignore`'d means it stays local, but disclosure should be explicit in docs.
- Ship F17a alone, or bundle with F11 + F14 (agent-ergonomics minor)?

**Why P2, not P3.** Every prior audit (self-dogfood, gmax-brownfield, beyond-platform) has been a *one-shot reading repo state* — never a trajectory of how agents got there. Without journal data, every dotmd UX decision is informed by guesswork or a single audit's snapshot. F17a costs ~90 lines and immediately starts paying back into every subsequent design call.

### 18. Singular `module:` / `surface:` keys are a duplicate schema — deprecate in favor of the plural arrays. — P1 (correctness)

**Context.** dotmd's frontmatter has two ways to express the same fact: a doc can declare its modules via `module:` (singular string) OR `modules:` (array). Same for `surface:` / `surfaces:`. The reader (`src/index.mjs:218-220`) merges both into one plural array, so they're functionally interchangeable — but two ways to express the same fact creates user confusion, template ambiguity, validation contortions, and was responsible for 33% (105 of 318) of beyond/platform's check warnings before the F3 mitigation in 0.32.1.

F3 covered the noise symptom (warn only on divergence). The underlying duality stayed. New docs sometimes get `module:`, sometimes `modules:`, sometimes both. Two-way schemas are not API design — they're accumulated debt.

**Proposed fix (shipped 0.36.3).** Three landings, all in one patch release because the reader stays back-compat:

1. **Validator.** Replace the F3 divergence-only warning with a universal deprecation warning that fires on every singular use, with the migration target inlined: `` `module:` (singular) is deprecated — use `modules: ["foyer"]`. Run `dotmd lint --fix` to migrate. `` When singular and plural diverge, the target shows the merged list (`modules: ["foyer", "other"]`). Suppressed for archived/terminal docs (same rule as F2).
2. **Lint.** Generalize the existing `surface: a, b` migration (0.34.0) to cover ALL singular use, comma or not. Internal fix type renamed `split-to-array` → `singular-to-plural`. Handles both `module/modules` and `surface/surfaces`. Merges with existing plural array if present; dedupes.
3. **Reader stays back-compat.** The `src/index.mjs:218-220` singular-into-plural merge is untouched. Existing corpora keep working; new docs go through the plural path. Removing the reader merge is reserved for a future major bump.

**Why P1, not P2.** F3 was P1 (noise), and F18 is the proper schema fix that F3 was a holding pattern for. Singular keys leaking into new docs (because the schema accepts both) means the agent-facing schema is ambiguous — and ambiguous schemas are how every audit so far accumulated its noisy-validator complaints. Patching the noise without fixing the duality means F3-class findings recur every time a new template lands.

### 19. No "runlist" primitive — agents have no way to group plans into an ordered execution set. — P2 (feature)

**Context.** Captured from a user follow-up after the issue #10 sprints landed (2026-05-26). Beyond's platform tooling has a "runlist" concept that groups multiple work items into a single named sequence. dotmd today has `queued-after` (bilateral per-plan sequencing) but no first-class group: agents wanting to run a 5-plan sprint as one unit have to either (a) chain `queued-after` per pair, (b) maintain the order in human prose inside a hub plan, or (c) eyeball `dotmd plans --status active` and pick the right one each session.

**Sketch (not yet scoped).** Likely shape — TBD on design call:

- A `runlist:` field on a hub plan (or a new `type: runlist` doc) that lists ordered plan slugs.
- `dotmd runlist <name>` shows the list with each plan's status; `dotmd runlist next <name>` picks up the next non-shipped plan.
- Integrates with existing `queued-after` (the runlist auto-wires per-pair predecessors so the existing query/pickup logic still applies).

**Why P2, not P1.** Multi-plan grouping is currently survivable with `queued-after` + prose — slow but possible. Promotes if multiple users hit the same workflow gap.

**Open questions.** Doc type (`plan` with a `runlist:` field vs. dedicated `type: runlist`)? Behavior when a runlist plan ships partial / awaits — does the list pause? Relationship to `parent_plan` (already exists, but unordered)?

### 20. Easier command names — singular/plural aliases and friendlier verbs. — P3 (UX) — SHIPPED 0.39.9

**Context.** Captured 2026-05-26 mid-session. Two friction points an agent hits constantly:

- `dotmd prompt` vs. `dotmd prompts` — singular fails ("unknown command"), plural works. Forcing the typist to remember which one is plural is pure friction with no semantic payoff.
- `dotmd prompts use <file>` is the consume-and-archive verb. `resume` is what a human would actually type when continuing a session. The current name leaks "what it does internally" instead of "what you mean".

**Sketch.** Two cheap aliases:

- `dotmd prompt` → `dotmd prompts` (full alias — every subcommand works under either spelling). Implement at the dispatcher layer in `bin/dotmd.mjs`, not by duplicating help/handlers.
- `dotmd prompts resume <file>` → alias of `dotmd prompts use <file>`. Both names stay valid; `resume` is the natural-language entry point, `use` keeps the existing precise meaning.

**Generalize?** Worth a quick audit while making the change: are there other obvious singular/plural pairs that would benefit (`plan` vs. `plans`, `module` vs. `modules`)? Today they split intentionally — `dotmd plans` is the list view, `dotmd module <name>` is the deep view; `dotmd plan <slug>` doesn't exist at all. **That split itself may not be worth defending** — the rule "singular = one item, plural = many" sounds principled but in practice means an agent has to remember which spelling each command happens to use. Worth revisiting whether `dotmd plan <slug>` should just work (as an alias for `pickup-card` or `query --slug`?), and whether `dotmd module <name>` should also answer to `dotmd modules <name>`. The agent-first lens: cheap aliases on the typist's side beat semantic purity on the implementer's side. Prompts is the obvious starting point because singular has no current meaning at all → free win, no aliasing collision.

**Sub-item to audit alongside.** Survey every command pair where singular and plural disagree (look at `bin/dotmd.mjs` dispatcher). For each, decide: collapse (full alias both ways), keep-split-with-doc (current behavior, just better surfaced in `--help`), or keep-split-deliberately (semantic mismatch is real, e.g. `bulk` vs. single-target verbs). Output of the audit can land as a follow-up bullet or its own F-item depending on how many real splits exist.

**Why P3.** Pure ergonomics — every workflow has a working spelling today. Cheap fix, high frequency of friction.

**Scope estimate.** ~20-40 lines in `bin/dotmd.mjs` + 2 tests (singular dispatches identically; `resume` and `use` produce identical output on the same fixture).

### 22. `dotmd hud` runs full-validation `buildIndex` just to get an error count — ~6× slower than needed on the SessionStart path. — P3 (perf) — SHIPPED 0.39.9

**Context.** Captured 2026-05-26 while auditing the SessionStart surface for the Beyond platform repo (1,364 indexed docs). `dotmd hud` is wired as the global SessionStart hook, so it fires on every Claude session boot. `src/hud.mjs:82` calls `buildIndex(config)` (full mode) solely to surface `errors > 0 → "✗ N validation errors (run: dotmd check)"`. The full pass runs `enrichRefErrorSuggestions`, `checkIndex`, `checkBidirectionalReferences`, `checkRunlistBackPointers`, `checkGitStaleness`, and `checkClaudeCommands` — but only the ERROR count drives hud's render, and of those passes only `checkIndex` produces errors. The rest produce only warnings, which hud ignores.

**Measured on platform:**

| Mode | Time | Errors | Warnings |
|---|---|---|---|
| `buildIndex(config)` (current) | 1013 ms | 0 | 37 |
| `buildIndex(config, { fast: true })` | 164 ms | 0 | 0 |

That's **~849 ms / 6.2× faster** on the SessionStart hot path. Linear with doc count, so the win grows with the corpus.

**Proposed fix (~10 lines).**

1. Change `src/hud.mjs:82` to `buildIndex(config, { fast: true })`.
2. After the fast pass, if `config.indexPath` is set, call `checkIndex(transformedDocs, config)` directly and add its errors to the count. This is the ONLY error-producing pass `fast: true` skips — adding it back preserves the invariant that hud's "✗ N validation errors" line matches what `dotmd check` would emit.
3. Add one regression test asserting hud's error count equals `dotmd check`'s error count across: clean repo, repo with frontmatter errors, repo with index drift.

**Why P3, not P2.** SessionStart is not user-blocking even at 1s; the 5s hook timeout has comfortable headroom. But every dotmd command pays a cost-of-friction multiplier for agents (cumulative across the fleet of Claude sessions), and a 6× speedup on the most-frequent invocation is cheap to ship.

**Scope estimate.** ~10 lines in `src/hud.mjs` + 1 test (~30 lines). Bump 0.39.x patch (perf optimization, zero behavior change for users).

**Implementation note (shipped 0.39.9).** The shipped fix diverged slightly from the prescription above: `fast: true` skips per-file `validateDoc/validatePlanShape/validateDocShape` in addition to the listed cross-doc passes — and `validateDoc` IS error-producing (missing status, unknown status, archive drift, unresolved refs, etc.). Switching hud to literal `fast: true` would have silently dropped those errors from the count. Instead added a new `buildIndex(config, { errorsOnly: true })` mode that runs every error-producing pass (per-file validators + `checkIndex` + validate hook) and skips only the warning-only cross-doc passes (`checkBidirectionalReferences`, `checkRunlistBackPointers`, `checkGitStaleness`, `checkClaudeCommands`). Regression test asserts hud-vs-check error-count parity across clean + per-file-error scenarios.

### 21. Help for `dotmd new <type>` orders inline-body first — agents pattern-match it and trip PreToolUse hooks. — P3 (UX) — SHIPPED 0.39.8

**Context.** Filed as GitHub issue #11 (2026-05-26). Author hit it writing a resume prompt whose body described a destructive-git incident — the PreToolUse hook scanning bash commands for that literal fired on the inline-body form `dotmd new prompt foo "...g-i-t s-t-a-s-h..."` because the literal lives in the bash command string. The CLI already supports `@/tmp/draft.md` and stdin `-` — both keep body content out of the shell — but the help text put inline first, and agents pattern-match on the first example.

**Fix.** Pure docs:

- Reordered the body-input list and prompt examples in `bin/dotmd.mjs` HELP.new so `@path` / `-` come first; inline last.
- Added an explicit "Tip for agents" paragraph naming the PreToolUse-hook scenario.
- Mirrored the reorder + tip in `CLAUDE.md`'s "Queuing prompts for future sessions" block.

**Out of scope.** The stretch lint-warning idea (warn on long inline bodies) — issue author called it overkill given how cheap the doc fix is. Not pursuing.

## Out-of-scope observations

- **Beyond's own data hygiene** is not dotmd's bug, but worth noting: 32 docs have `surface:` values that are file paths or globs (e.g. `scripts/dev.sh`, `docs/plans/**`) — these are stretching the taxonomy into a notes field. Would be useful for dotmd to detect "looks like a path, not a taxonomy token" and suggest `notes:` instead. (Not pursuing — too project-specific to merit a default rule.)
- **88 of 89 archived prompts** consumed correctly via `prompts use`; the original audit prompt itself archived cleanly. Prompt lifecycle infra looks healthy under load.
- **`dotmd doctor` runs gmax/touch/lint/index in sequence**; the partial output I saw (only step 1) is worth a deeper repro, but couldn't justify mutating beyond a second time to investigate. Tracked under F6.

## Suggested fix order

F1, F2, F3 first — they're correctness bugs, not just polish. F1 makes `graph` lie; F2 makes `check` count noise from quiet statuses; F3 alone removes 105 false-positive warnings. **Shipped 0.32.1.**

F4 next — doctor's mutation safety is a footgun every audit so far has documented in a different shape (the gmax brownfield audit's recommendations also leaned this direction).

F5–F13 are polish; F5 + F6 have the highest "first encounter" cost for new users with custom configs; F11 helps every multi-instance user (which is *all* of them eventually). **F5, F7, F8, F9, F10, F12 shipped 0.36.2.**

F14, F15, F16 emerged from post-audit discussion of how to handle prompt + plan organization at Beyond's scale (222 non-archived plans, 91 archived prompts, ~54 modules). They're feature additions, not bug fixes:
- **F16** is highest-ROI for day-to-day — pure additive, no churn risk, immediately solves a workflow blocker. Do this first. **Shipped 0.36.0.**
- **F14** is cheap and scoped — bundle with F16 or land standalone.
- **F15** is load-bearing — worth scoping a plan + `/tmp/` spike before committing because it touches filesystem layout. Hold for last in the F14-F16 cluster.

F17 (added 2026-05-26) is observability for the agent fleet — not a bug fix, but pays back into every subsequent dotmd design call by replacing guesswork with data. Ship F17a (journal + reader) standalone before bundling F17b (hud integration) so real journal data can shape what the hud should surface.

### Post-0.36.2 release plan

| Release | Findings | Theme | Scope |
|---|---|---|---|
| **0.36.3** | F18 | Schema correctness | Deprecate singular `module:` / `surface:` keys; `dotmd lint --fix` migrates. Reader stays back-compat (no breakage). Patch bump. ~80 lines + 8 tests. **Shipped 2026-05-26.** |
| **0.37.0** | F4 + F13 | Safety + check-noise reduction | doctor dry-run-default + collapse high-frequency `check` warnings into bulk-fix hints. Behavior change justifies minor bump. ~200 lines + 15 tests. **Shipped 2026-05-26.** |
| **0.37.x or 0.38.0** | F11 + F14 + F17a | Agent ergonomics | Lease-stale signal in validate, `shelved` prompt status, opt-in journal + reader. All additive. ~170 lines + tests. |
| **0.38.x or 0.39.0** | F17b | Hud reads journal | Two new hud sections (previous-self, fleet) + recent-rejections summary. Ship after ~1 week of real journal data informs the render. ~60 lines + tests. |
| **0.39.0** | F6 | Stats reshape | Type-keyed `countsByStatus` JSON shape. ~70 lines + tests. |
| **0.40.0** | F15 | Filed primitive | Untangle `archive: true` into `filed: true + terminal: true`. Needs `/tmp/` spike first. ~130 lines + tests. |
| later | F17c | `die()` self-correcting hints | Polish informed by F17b. Not blocking. |

Sequencing rationale: ship correctness/safety before features (F4+F13 first), then agent-ergonomics including the journal foundation, then let the journal inform the next layer of design (F17b → F17c), then close out the larger feature work (F6, F15). F4 + F13 going first means the highest-friction parts of the current UX (silent mutation, 43-line warning walls) are gone before agents start writing journal entries — otherwise you'd see those issues dominate the journal data and obscure other signals.
