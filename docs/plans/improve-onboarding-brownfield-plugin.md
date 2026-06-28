---
type: plan
status: active
created: 2026-06-13T04:01:14Z
updated: 2026-06-13T04:01:14Z
surfaces:
modules:
domain:
audience: internal
parent_plan:
related_plans:
related_docs:
current_state: Audit of dotmd onboarding (greenfield/brownfield init, plugin discovery, version skew) on 0.61.0 produced five ranked findings. Finding #1 (brownfield staleDays warning) shipped; #2–#5 remain.
next_step: Finding #2 — surface `dotmd update` (add to `help all` Setup section + a README subsection under Install; change the postinstall nudge to suggest `dotmd update --plugin-only`).
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

### 2. `dotmd update` is undiscoverable [cheap win]

Polished command (`--check`, `--cli-only`, `--plugin-only`, good `--help`) solving
real CLI/plugin skew — but absent from both `dotmd help all` and the README. Only
pointer is the postinstall nudge, which tells a user who *just* installed the CLI
to run bare `dotmd update` (redundantly re-runs `npm i -g dotmd-cli@latest`).

Fix:
- Add `update` to the Setup section of `help all` in `bin/dotmd.mjs`.
- Add a short README subsection under Install.
- Change the postinstall nudge to suggest `dotmd update --plugin-only`.

### 3. Plugin hint gated on project-local `.claude/` [cheap win]

Greenfield `dotmd init` in a repo without `.claude/` says nothing about the
plugin — but most *new* repos have no `.claude/` yet, so the users most likely to
want the plugin never see the hint. `detectSessionStartHook` already inspects
`~/.claude/settings.json`, so the signal exists.

Fix: gate the plugin hint on "user has Claude Code at all" (`~/.claude` exists)
rather than "this project has `.claude/`".

### 4. devDep path quietly breaks the plugin

README offers `npm install -D dotmd-cli`, but the plugin hooks only look for
`dotmd` on PATH — a devDep-only user with the plugin installed gets the "CLI isn't
installed" hint despite having installed it.

Fix (pick one): README note that the plugin requires the global install; or let
`dotmd-hook` fall back to `node_modules/.bin/dotmd` in the cwd.

### 5. Small ones

- `npx dotmd-cli init` works (single-bin package) but isn't documented as a
  try-before-install path.
- init scan collects `modules` but `generateDetectedConfig` never emits a
  taxonomy for them (surfaces get one).
- postinstall nudge prints for all global installs even when `claude` isn't on
  PATH (phrased conditionally, so low severity).

## Suggested order

1, then 2 + 3 (both cheap), then 4, then 5. #1 is the only one that actively
degrades every session in affected repos.

## Version History

- **2026-06-28** Finding #1 shipped — brownfield `init`/resolver no longer warn about inherited default `staleDays` keys; `generateDetectedConfig` emits a scoped `staleDays` block. Tests added. next_step advanced to #2.
- 2026-06-12 Created from onboarding audit on 0.61.0.
