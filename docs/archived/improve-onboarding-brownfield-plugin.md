---
type: plan
status: archived
created: 2026-06-13T04:01:14Z
updated: 2026-06-29T02:46:14Z
surfaces:
modules:
domain:
audience: internal
parent_plan:
related_plans:
related_docs:
current_state: All five onboarding-audit findings shipped. #1/#3/#4 + #2's postinstall nudge landed earlier (37f0008); this session finished #2 (update in `help all` Setup + README `### Updating` subsection) and #5 (npx try-before-install documented, `taxonomy.modules` emitted by generateDetectedConfig). Closing.
next_step: None — archived. Optional future work: a `dotmd-hook` node_modules/.bin fallback (the declined alternative to #4's README note).
---

# Improve dotmd Onboarding (Brownfield + Plugin Discovery)

## Problem

A walk-through of both onboarding tracks (greenfield init, brownfield init with
mixed docs, uninitialized repo, plugin-without-CLI, version-skew tooling) on
0.61.0 surfaced five friction points. The machinery is well-built — the headline
issue is that **brownfield repos get permanently noisy sessions from a config the
tool itself generated**, and a polished maintenance command (`dotmd update`) is
effectively invisible.

Audit method: ran each track in throwaway git repos against
`bin/dotmd.mjs`, inspected `src/init.mjs`, `src/config.mjs`, `src/update.mjs`,
`scripts/postinstall.mjs`, and `plugins/dotmd/bin/dotmd-hook`.

## What already works (do not regress)

- `dotmd-hook` missing-binary hint: fires exactly once per session (SessionStart
  `--hint`), never blocks the PreToolUse guard.
- init idempotency + real `--dry-run`; sibling `./plans/` detection with concrete
  `mv` vs flat-root remediation; gitignored-`docs/` warning; `bulk-tag` hint.
- baton happy path messaging; CLI↔plugin version lockstep
  (`sync-plugin-version.mjs` + `self-check` + `update --check`).

## Findings (ranked)

### 1. Brownfield init generates a config that warns on every command [highest priority] — ✅ SHIPPED 2026-06-28

> **Shipped.** Both parts landed: the resolver (`validateConfig` in src/config.mjs)
> now only validates `statuses.staleDays` keys when the user actually authored
> that map — inherited-default keys no longer warn — and `generateDetectedConfig`
> (src/init.mjs) emits a `staleDays` block scoped to the detected statuses
> (`KNOWN_STALE_DAYS`), so the generated config is internally consistent. Real
> typos in a user-provided map are still caught. Covered by tests in
> config.test.mjs + init.test.mjs.

`generateDetectedConfig` (src/init.mjs) emits `statuses.order` from the detected
statuses (e.g. `['active', 'wip']`) but the default global `staleDays` map
(src/config.mjs ~line 48) keeps its `ready`/`scoping` keys. Result — every
invocation, including the `dotmd hud` SessionStart hook, prints:

```
Config: statuses.staleDays contains unknown status 'ready'.
Config: statuses.staleDays contains unknown status 'scoping'.
```

Repro: `dotmd init` in a repo whose docs use statuses other than the defaults,
then run any command. The warning blames the user for defaults they never wrote,
and it pollutes agent context in *every* session in that repo until the config is
hand-edited.

Fix (two parts):
- Resolver: only warn for `staleDays` keys the user's config actually provides —
  not keys inherited from defaults.
- `generateDetectedConfig`: emit a `staleDays` block scoped to the detected
  statuses so the generated config is internally consistent.

### 2. `dotmd update` is undiscoverable [cheap win] — ✅ SHIPPED

> **Shipped.** `update` now appears in the `help all` Setup section (bin/dotmd.mjs)
> and an `### Updating` subsection under Install in the README. The postinstall
> nudge already pointed at `dotmd update --plugin-only` (landed earlier in 37f0008).

Polished command (`--check`, `--cli-only`, `--plugin-only`, good `--help`) solving
real CLI/plugin skew — but absent from both `dotmd help all` and the README. Only
pointer is the postinstall nudge, which tells a user who *just* installed the CLI
to run bare `dotmd update` (redundantly re-runs `npm i -g dotmd-cli@latest`).

Fix:
- Add `update` to the Setup section of `help all` in `bin/dotmd.mjs`.
- Add a short README subsection under Install.
- Change the postinstall nudge to suggest `dotmd update --plugin-only`.

### 3. Plugin hint gated on project-local `.claude/` [cheap win] — ✅ SHIPPED (37f0008)

> **Shipped earlier (37f0008).** `runInit` now gates the plugin hint on
> `likelyClaudeUser` (project `.claude/` **or** `~/.claude/` exists), so greenfield
> repos with no local `.claude/` still see it.

Greenfield `dotmd init` in a repo without `.claude/` says nothing about the
plugin — but most *new* repos have no `.claude/` yet, so the users most likely to
want the plugin never see the hint. `detectSessionStartHook` already inspects
`~/.claude/settings.json`, so the signal exists.

Fix: gate the plugin hint on "user has Claude Code at all" (`~/.claude` exists)
rather than "this project has `.claude/`".

### 4. devDep path quietly breaks the plugin — ✅ SHIPPED (37f0008)

> **Shipped earlier (37f0008), README option.** The Install section now carries a
> blockquote spelling out that the plugin requires the global install (a devDep
> lives off `PATH`, so the hooks silently no-op). The alternative `dotmd-hook`
> `node_modules/.bin` fallback was deliberately *not* taken — the finding framed
> these as "pick one", and the doc note is the lower-risk fix.

README offers `npm install -D dotmd-cli`, but the plugin hooks only look for
`dotmd` on PATH — a devDep-only user with the plugin installed gets the "CLI isn't
installed" hint despite having installed it.

Fix (pick one): README note that the plugin requires the global install; or let
`dotmd-hook` fall back to `node_modules/.bin/dotmd` in the cwd.

### 5. Small ones — ✅ SHIPPED

- `npx dotmd-cli init` works (single-bin package) but isn't documented as a
  try-before-install path. → **Done:** README Install block now lists
  `npx dotmd-cli init` as the try-before-install path.
- init scan collects `modules` but `generateDetectedConfig` never emits a
  taxonomy for them (surfaces get one). → **Done:** `generateDetectedConfig`
  now emits `taxonomy.modules` symmetrically with `surfaces` (full detected set,
  so no false warnings); test added in init.test.mjs.
- postinstall nudge prints for all global installs even when `claude` isn't on
  PATH (phrased conditionally, so low severity). → **Already conditional** —
  prints a bare `dotmd CLI installed.` when `claude` isn't on PATH (37f0008).
  No further change.

## Suggested order

1, then 2 + 3 (both cheap), then 4, then 5. #1 is the only one that actively
degrades every session in affected repos.

## Closeout

All five onboarding-audit findings shipped; plan archived at CLI v0.64.2.

- **#1** brownfield `staleDays` warning — fixed (37f0008 / 04ec581): resolver only
  validates user-authored `staleDays` keys; `generateDetectedConfig` emits a scoped
  block.
- **#2** `dotmd update` discoverability — `update` added to `help all` Setup
  (bin/dotmd.mjs) + an `### Updating` subsection under Install (README); postinstall
  nudge already pointed at `--plugin-only` (37f0008).
- **#3** plugin hint gating — `runInit` gates on `likelyClaudeUser`
  (project `.claude/` **or** `~/.claude/`), so greenfield repos see it (37f0008).
- **#4** devDep breaks the plugin — README Install blockquote spells out the
  global-install requirement (37f0008). The `dotmd-hook` `node_modules/.bin`
  fallback was the "pick one" alternative and was **deliberately declined** (doc
  note is the lower-risk fix). Left as an optional future follow-up.
- **#5** small ones — README documents `npx dotmd-cli init`;
  `generateDetectedConfig` now emits `taxonomy.modules` symmetrically with
  `surfaces` (+ init.test.mjs case); postinstall already conditional on `claude`
  being on PATH.

**Follow-up (optional, not queued):** `dotmd-hook` fallback to
`./node_modules/.bin/dotmd` so a devDep-only + plugin user gets working
priming/guarding instead of the "CLI isn't installed" hint.

## Version History

- **2026-06-29T02:46:14Z** Archived — All 5 findings shipped. This session: #2 (update in help-all Setup + README ### Updating subsection) and #5 (npx try-before-install in README, taxonomy.modules emitted by generateDetectedConfig + test). #1/#3/#4 + #2 postinstall landed earlier in 37f0008. Declined: dotmd-hook node_modules/.bin fallback (README note is the chosen fix per finding's 'pick one').
- **2026-06-29T02:42:13Z** Started (active → in-session).
- **2026-06-28** Finding #1 shipped — brownfield `init`/resolver no longer warn about inherited default `staleDays` keys; `generateDetectedConfig` emits a scoped `staleDays` block. Tests added. next_step advanced to #2.
- 2026-06-12 Created from onboarding audit on 0.61.0.
