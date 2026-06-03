---
type: prompt
status: archived
created: 2026-06-03T00:58:56Z
updated: 2026-06-03T06:00:58Z
dotmd_version: 0.52.0
context: "Resume Package Dotmd As Plugin"
related_plans:
---

Resume: package dotmd as a Claude Code plugin.

## State
The full scope lives in `docs/plans/package-dotmd-as-plugin.md` (status: planned) — read it first; it has the validated mechanics, locked decisions, concrete file tree, and the 5-phase sequence. All plugin/hook assumptions were already confirmed against current Claude Code docs via claude-code-guide.

## Decisions (locked)
- Monorepo layout (gmax pattern): `.claude-plugin/marketplace.json` at repo root + `plugins/dotmd/`.
- Hooks call the `dotmd` binary on PATH (npm i -g dotmd-cli), NOT bundled — same as gmax calling `gmax`.
- Distribution via GitHub marketplace; local-dir marketplace via `extraKnownMarketplaces` for dev.

## What to build (in order)
1. Scaffold: `.claude-plugin/marketplace.json` (name "dotmd", owner Robert Owens, plugins:[{name:"dotmd", source:"./plugins/dotmd"}]) + `plugins/dotmd/.claude-plugin/plugin.json` ({name, version, description, author, repository, "hooks":"./hooks.json"}) + `plugins/dotmd/hooks.json`.
   hooks.json events → commands (all PATH binary):
   - SessionStart → `dotmd hud`
   - SubagentStart → `dotmd hud --subagent`
   - PreToolUse matcher "Bash|Read|Edit|Write|MultiEdit" → `dotmd guard`
   - (optional) CwdChanged → `dotmd hud --subagent`
2. Author `plugins/dotmd/skills/dotmd/SKILL.md` — frontmatter: name: dotmd; description covering "use when… order of ops briefing→use→set→archive"; allowed-tools "Bash(dotmd:*), Read". Body = order of operations + closure-status decision tree + don't-cat/commit/hand-edit guardrails. Port from CLAUDE.md + the generated `.claude/commands/{plans,docs}.md` bodies. This is the canonical agent-facing source.
3. (optional) `plugins/dotmd/commands/{plans,docs}.md` for user-typed /plans /docs.
4. Cut over ATOMICALLY: enable plugin hooks AND remove the dotmd SessionStart/SubagentStart/PreToolUse entries from ~/.claude/settings.json in the same step (else double-priming). Verify a subagent + a fresh repo both get primed.
5. Retire per-repo scaffolding: deprecate src/claude-commands.mjs (scaffoldClaudeCommands / refreshStaleSlashCommands) with a one-release no-op shim; stop `dotmd init` and `dotmd hud` from writing .claude/commands; have init print plugin-install guidance.
6. Docs: README + CLAUDE.md document plugin install as recommended path. Publish GitHub marketplace. Release `npm version minor` (one command does test→tag→push→GH release→publish→install).

## Reference implementation
gmax plugin at `/Users/reoiv/Development/beyond/tools/gmax/plugins/grepmax/` — copy structure: plugin.json, hooks.json (uses ${CLAUDE_PLUGIN_ROOT}; we use PATH `dotmd` instead), skills/grepmax/SKILL.md, commands/*.md, agents/semantic-explore.md. Its marketplace is at gmax repo root `.claude-plugin/marketplace.json`.

## Gotchas
- hooks.json is NOT auto-discovered — plugin.json must declare "hooks":"./hooks.json". skills/commands/agents DO auto-discover.
- PreToolUse output contract (already implemented in src/guard.mjs, don't change): exit 0 + stdout {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny|allow|ask|defer","permissionDecisionReason":"…","additionalContext":"…"}}. warn rules omit permissionDecision + set additionalContext.
- Already shipped in v0.52.0 and wired into global settings by hand: dotmd guard, hud --subagent, dotmd misuse, new-prompt guidance. The plugin RELOCATES that global-settings wiring into hooks.json — leave the CLI entrypoints (hud, guard) unchanged.
- Watch `dotmd misuse --by-rule` for guard false positives before promoting any warn→deny.
- Run `npm test` (node:test, 1026+ tests) before any release. Releasing is `npm version minor` only — do NOT manually push/tag/publish.

## Next action
Start Phase 1: create the three manifest/hook files, wire a local marketplace (extraKnownMarketplaces → this repo) and `/plugin install dotmd@…`, verify SessionStart + guard fire from the plugin.

