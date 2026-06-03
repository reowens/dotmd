---
type: plan
status: archived
created: 2026-06-03T07:02:04Z
updated: 2026-06-03T07:28:47Z
surfaces:
modules:
domain:
audience: internal
parent_plan:
related_plans:
related_docs:
current_state:
next_step:
---

# Plugin-Primary Ergonomics

## Goal

Close two confirmed UX gaps that matter now that the dotmd plugin is the primary
distribution path (post-0.58.0, after the `.claude/commands` retirement). Both
were verified by hand this session. Small, additive, low-risk — likely one
patch/minor release.

## Item 1 — Missing-binary hint when `dotmd` isn't on PATH

**Problem (confirmed):** the plugin's hooks call the PATH binary (`dotmd hud`,
`dotmd guard`). If a user enables the plugin but hasn't run `npm i -g dotmd-cli`,
the shell errors `command not found`, the hook produces no output, and the
session is primed with *nothing* — silently. No signal to the user that they're
one install away from the whole workflow. This was an explicit open risk in
`package-dotmd-as-plugin.md` and is still unaddressed (grep of src/hud.mjs,
src/guard.mjs, plugins/dotmd/hooks.json finds no install hint).

**The wrinkle:** dotmd can't print its own "I'm missing" hint — it's the thing
that's missing. So the check has to live *outside* the binary.

**Open design question (settle first, ~30 min):**
- (a) Inline shell guard in `hooks.json`: `command -v dotmd >/dev/null || echo
  'dotmd plugin: run `npm i -g dotmd-cli` to enable'; dotmd hud` — zero new
  files, but duplicated across the 4 hook entries and shell-portability risk.
- (b) Ship a tiny wrapper under `${CLAUDE_PLUGIN_ROOT}/bin/` that does the
  check then execs the real command; hooks.json calls the wrapper. One place,
  testable, but adds a script + an exec hop.
- Decide (a) vs (b). Lean (b) for single-source + testability; confirm
  `${CLAUDE_PLUGIN_ROOT}` is available in the hook env (the plugin already
  relies on PATH `dotmd`, so verify the wrapper approach against current
  Claude Code hook docs / the grepmax plugin reference).

**Done when:** enabling the plugin without the CLI installed surfaces a single
clear install line at SessionStart instead of silent nothing. Don't spam it —
once per session is enough; never block.

## Item 2 — `dotmd archive <slug>` should resolve bare slugs

**Problem (confirmed):** `dotmd archive r.md` → `File not found: r.md (Searched:
., docs)`, while `dotmd prompts archive r` and `dotmd use r` resolve bare
slugs/basenames fine. Inconsistent: the closure verb is the *least* forgiving
about how you name the target.

**Fix:** `runArchive` (src/lifecycle.mjs) calls `resolveDocPath(input, config)`.
Extend the resolution so a bare slug / basename falls back to a recursive
basename match under the doc roots (the same affordance `resolvePromptInput` /
`dotmd use` already provide). Keep the existing exact-path fast path. Ambiguity
(same basename in two places) should error with the candidate list, mirroring
`prompts use`'s multi-match message.

**Done when:** `dotmd archive <slug>` resolves like `dotmd use <slug>`, with a
clear multi-match error when ambiguous. Add a lifecycle test.

## Out of scope (deferred — separate items from the "what's next" review)

- One-time non-silent notice when hud auto-removes retired `.claude/commands`
  files (trade-off vs the silent-clean contract).
- `dotmd doctor` helper to migrate existing archived prompts into the nested
  `<typeDir>/archived/` layout (the manual `git mv` done by hand this session).
- CLAUDE.md ⇄ SKILL.md drift guard.

## Closeout

Both items shipped this session; full suite green (1042 tests).

- **Item 1 — missing-binary hint.** Settled the (a)/(b) design question via the
  `claude-code-guide` agent: confirmed `${CLAUDE_PLUGIN_ROOT}` is exported into
  the env for all hook types, SessionStart stdout becomes session context, and a
  PreToolUse hook that exits 0 with no output is a clean no-op (never blocks).
  Went with (b): `plugins/dotmd/bin/dotmd-hook` (POSIX sh) — `--hint` (passed
  only by SessionStart) prints one install line when `dotmd` is off PATH so the
  hint surfaces exactly once per session; SubagentStart/CwdChanged/guard stay
  silent. `hooks.json` invokes it as `sh "${CLAUDE_PLUGIN_ROOT}/bin/dotmd-hook"
  …` (the `sh` prefix avoids depending on the exec bit surviving distribution).
  Covered by `test/plugin-hook.test.mjs`.
- **Item 2 — `dotmd archive <slug>`.** Added `resolveArchiveTarget` in
  `src/lifecycle.mjs` (exact path → `+.md` → recursive basename match under doc
  roots; ambiguous basename dies with the candidate list), wired into
  `runArchive`. Help text updated. Covered in `test/lifecycle.test.mjs`
  ("archive resolves bare slugs").
- **Release:** one `npm version minor` covers both (Item 1 bumps the plugin tree
  → needs `claude plugin update` to take effect downstream; Item 2 is pure CLI).

## Notes / gotchas

- Release heuristic: `package.json.files` = `["bin/", "src/", ...]` plus the
  plugin tree. Item 1 touches `plugins/dotmd/` (+ maybe a wrapper script) → the
  plugin needs a version bump + `claude plugin update` to take effect; Item 2 is
  pure CLI. A single `npm version minor` covers both (sync-plugin-version keeps
  the plugin in lockstep).
- Verify Item 1 against current Claude Code hook docs before committing to (a)
  vs (b) — the `claude-code-guide` agent validated the plugin mechanics last
  time; do the same here for the hook-env / wrapper question.
