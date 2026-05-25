---
type: plan
status: awaiting
created: 2026-05-25T21:54:38Z
updated: 2026-05-25T22:09:23Z
surfaces: [cli, slash-commands]
modules: [hud, slash-commands]
domain: agent-ux
audience: internal
parent_plan:
related_plans: baton-slash-command.md
related_docs:
current_state: Phases 1+2 shipped. `refreshStaleSlashCommands` helper added, wired into `runHud`, dogfooded against this repo (v0.31.4 → v0.32.1 refresh fired). Tests green (813/813, +4 new).
next_step: Execute Phase 3 — bundle with `/baton` as 0.33.0 via `npm version minor`.
---

# Slash commands self-heal

> When a user upgrades the `dotmd-cli` binary, the slash-command files under `.claude/commands/*.md` stay frozen at the old version's wording until the user happens to run `dotmd doctor`. Close that gap by piggybacking on the existing `SessionStart` hook (`dotmd hud`).

## Problem

`scaffoldClaudeCommands` already does the right thing: writes only when a file's `<!-- dotmd-generated: X -->` banner is older than `pkg.version`; skips files without a banner (user-managed); no-ops when `.claude/` is absent. But the only triggers today are `dotmd init` (one-time) and `dotmd doctor` (manual). There is no automatic path from "user upgraded dotmd" → "slash commands now reflect the new version." `/baton` makes this gap visible: any future tweak to baton's wording strands every existing user on the version they installed with until they manually `doctor`.

## Goals

- Slash-command files refresh themselves the next session after a dotmd upgrade — no user action required.
- One surfaced line when a refresh happens, silent otherwise (matches hud's existing "silent when clean" contract).
- Zero changes to the user's `.claude/settings.json` hook config — the static hook line keeps working across all future dotmd versions.

## Non-Goals

- Auto-mutating `.claude/settings.json` or any hook entry. Hooks are user-owned. The static hook line `"command": "dotmd hud"` never changes shape; the binary upgrade carries all behavior.
- Touching user-managed slash-command files (those without a banner). The existing `skipped` branch already handles this; we keep that rule.
- Postinstall scripts. `npm install -g` runs from a global cwd with no project context, and many users disable scripts with `--ignore-scripts`. Wrong layer.
- `dotmd doctor` parity changes. Doctor's step 5 stays as-is for the no-hook case.

## What Exists Today

- `scaffoldClaudeCommands(cwd, config, opts)` in `src/claude-commands.mjs:126` — banner-versioned write logic. Returns `{name, action}` per file where action is `created | updated | current | skipped`.
- `runHud(argv, config)` in `src/hud.mjs:88` — fires every SessionStart, wraps work in try/catch, has the "silent when clean" contract.
- `checkClaudeCommands(cwd)` in `src/claude-commands.mjs:169` — warning surfaced via `dotmd check` when banners are stale. Stays as belt-and-suspenders.
- `test/hud.test.mjs` — existing home for new tests.
- `[[baton-slash-command]]` — first slash command whose wording is likely to evolve and benefit from this.

## Constraints

- Must not break the SessionStart hook on any failure (disk full, permissions, race with another session). Wrap in try/catch; failures are silent.
- Must respect the existing `skipped` rule — files without a banner are user-managed.
- Must stay fast. Hud runs every session start; the scaffolder's stat-and-compare pass is already trivial, but adding it should not regress the silent-clean path.

## Decisions

- **D1. Visibility = dim line.** When at least one file is `updated`, emit one dim line: `↻ slash commands refreshed (vX → vY): foo.md, bar.md`. Otherwise no new output. Reason: mutating user-tracked files invisibly is surprising; one line per upgrade is honest.
- **D2. Scope = `.claude/commands/*.md` only.** No hook-snippet nudges, no settings.json edits. The hook line is static by design.
- **D3. Trigger = `runHud`, not a new verb.** Reuses the cadence the user already opted into (SessionStart). No new CLI surface; no new install step.
- **D4. Failure = silent.** Wrap the refresh call in try/catch. A broken scaffolder must never kill the hook (would block every session).
- **D5. Bundle with `/baton` as 0.33.0.** Self-heal is the mechanism that makes baton's update path work; shipping them together gives one coherent release story.

## Open Questions

- None blocking. Naming for the helper (`refreshStaleSlashCommands` vs `autoUpdateSlashCommands`) is a bikeshed — settle at implementation time.

## Phases

### Phase 1 — Helper + wiring ✅

- Add `refreshStaleSlashCommands(config)` in `src/claude-commands.mjs`. Thin wrapper around `scaffoldClaudeCommands(config.repoRoot, config)` that returns only the `updated` entries (with `from`/`to` versions).
- In `src/hud.mjs` `runHud`, call the helper right after `buildHud`. On non-empty result, append a dim line: `↻ slash commands refreshed (vFROM → vTO): name1, name2`. Wrap in try/catch.
- ~30 lines net.

Shipped: helper exported from `src/claude-commands.mjs`; `runHud` calls it (skipped in `--json` mode to keep JSON shape stable) wrapped in try/catch so scaffolder failures never break the SessionStart hook.

### Phase 2 — Tests ✅

In `test/hud.test.mjs`, add four cases:

1. Stale banner → file refreshed, dim line in stdout.
2. Current banner → no refresh, no extra output, silent-clean preserved.
3. No banner (user-managed) → file untouched, no output.
4. No `.claude/` directory → no error, silent.

Shipped: all four tests added. Full suite 813/813 green (+4 new). Dogfooded — running `node bin/dotmd.mjs hud` against this repo refreshed `plans.md` and `docs.md` v0.31.4 → v0.32.1 and created the missing `baton.md`.

### Phase 3 — Release ⬜

Bundle into 0.33.0 with `[[baton-slash-command]]`. CHANGELOG entry: "`/baton` slash command + `.claude/commands/*.md` self-heal on upgrade." Run `npm version minor`.

## Deferred

- Extending the same mechanism to `.claude/skills/` if dotmd ever ships skills. Out of scope; dotmd has no skill surface today.
- A `dotmd hud --no-refresh` opt-out flag. Reach for it only if a user complains. The `skipped` rule (rm the banner to opt a file out) is the documented escape hatch.

## Version History

- **2026-05-25T22:09:23Z** Status: in-session → awaiting.
- **2026-05-25T22:10:00Z** Phases 1+2 shipped. Helper + hud wiring + 4 tests; suite 813/813 green; dogfood refresh succeeded on this repo (v0.31.4 → v0.32.1). Phase 3 (release) ready to execute as 0.33.0 bundled with `[[baton-slash-command]]`.
- **2026-05-25T22:06:05Z** Picked up (active → in-session).
- **2026-05-25T21:54:38Z** Created.

## Closeout

<!-- Filled on archive: what shipped, key commits, deferrals dispositioned. -->
