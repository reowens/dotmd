---
type: plan
status: active
created: 2026-06-03T07:02:04Z
updated: 2026-06-03T07:02:04Z
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

## Notes / gotchas

- Release heuristic: `package.json.files` = `["bin/", "src/", ...]` plus the
  plugin tree. Item 1 touches `plugins/dotmd/` (+ maybe a wrapper script) → the
  plugin needs a version bump + `claude plugin update` to take effect; Item 2 is
  pure CLI. A single `npm version minor` covers both (sync-plugin-version keeps
  the plugin in lockstep).
- Verify Item 1 against current Claude Code hook docs before committing to (a)
  vs (b) — the `claude-code-guide` agent validated the plugin mechanics last
  time; do the same here for the hook-env / wrapper question.
