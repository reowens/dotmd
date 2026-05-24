---
type: plan
status: active
created: 2026-05-24T03:16:46Z
updated: 2026-05-24T03:20:15Z
surfaces:
  - cli
modules:
  - init
  - doctor
domain:
audience: internal
parent_plan:
related_plans:
  - fix-stale-next-command-in-generated-slash-cmds.md
related_docs:
current_state: Discovered during dogfood audit on 2026-05-23 — `dotmd init` silently regenerates `.claude/commands/{plans,docs}.md` from older versions but reports nothing in its create/update/exists output, and dry-run omits them entirely.
next_step: Decide whether the regenerate behavior is intentional or a leak from `doctor`; if intentional, surface it in init output and dry-run.
---

# Fix Init Silent Claude Commands Rewrite

> `dotmd init` regenerates stale `.claude/commands/` slash-command files but does not report doing so, contradicting its dry-run preview.

## Problem

Running `dotmd init` in a repo where `.claude/commands/{plans,docs}.md` already exist (carrying older `<!-- dotmd-generated: 0.X.Y -->` markers) silently overwrites them with the current-version content. Both the `-n` dry-run and the actual run print only the `dotmd.config.mjs` / `docs/` / `.gitignore` lines — nothing about the slash command files.

Observed during dogfood:

- `init -n` output: `create dotmd.config.mjs`, `create docs/`, …, `update .gitignore (+.dotmd/)`. No mention of `.claude/commands/`.
- Real `init` ran. The shell hook flagged `.claude/commands/{plans,docs}.md` as modified (banner went from `dotmd-generated: 0.11.0` to `0.31.0`).

This violates the contract that dry-run preview matches the real run. A user reviewing `init -n` would assume their slash command files are untouched.

## Goals

- Dry-run output for `dotmd init` lists every file the real run will write.
- Real `init` output names the slash-command files when they change.

## Non-Goals

- Changing whether init regenerates slash commands. (That's a separate question — defer to a follow-up if the regenerate behavior itself is wrong.)

## What Exists Today

- `src/init.mjs` (or wherever init lives) writes `.claude/commands/*` without going through the same `report()` helper that emits the create/update/exists lines.
- `dotmd doctor` also installs slash commands; it may share the helper that init is bypassing.

## Constraints

- Don't break the "exists" silent-noop path for unchanged files — only report when content actually differs.
- Output format should match existing `create`/`update`/`exists` verbs.

## Decisions

## Open Questions

- Should init *ever* overwrite `.claude/commands/` files that the user has hand-edited? Today it does. A `<!-- dotmd-generated: -->` marker check could gate this.

## Phases

### Phase 1 — Reproduce and locate ⬜

- Confirm the write path in `src/init.mjs` (or `doctor.mjs`).
- Confirm dry-run takes the same path without going through the report helper.

### Phase 2 — Route writes through report() ⬜

- Emit `create`/`update`/`exists` lines for `.claude/commands/*.md`.
- Verify the dry-run output matches the real run.

### Phase 3 — Test coverage ⬜

- Add a test that asserts init's stdout mentions `.claude/commands/plans.md` when it regenerates from an older version banner.

## Deferred

- Whether init should respect hand-edits (drop the regenerate when banner is missing) — file a follow-up plan if pursued.

## Version History

- **2026-05-24T03:19:41Z** Status: awaiting → active.
- **2026-05-24T03:19:41Z** Status: active → awaiting.
- **2026-05-24T03:19:37Z** Released (in-session → active).
- **2026-05-24T03:19:22Z** Picked up (active → in-session).
- **2026-05-24T03:16:46Z** Created during dogfood audit.

## Closeout

<!-- Filled on archive: what shipped, key commits, deferrals dispositioned. -->
