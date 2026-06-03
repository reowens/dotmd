---
type: prompt
status: archived
created: 2026-06-03T07:02:27Z
updated: 2026-06-03T07:18:55Z
dotmd_version: 0.58.0
context: "Resume Plugin Primary Ergonomics"
related_plans:
---

Pick up `docs/plans/plugin-primary-ergonomics.md` (status: active). dotmd is at
0.58.0; pipeline is otherwise clear. Two small, confirmed UX gaps to close now
that the plugin is the primary distribution path:

1. **Missing-binary hint.** Plugin hooks call PATH `dotmd`; if the CLI isn't
   installed the hooks no-op silently (verified: no install hint in src/hud.mjs,
   src/guard.mjs, plugins/dotmd/hooks.json). dotmd can't warn about its own
   absence, so the check lives outside the binary. FIRST DECISION: inline
   shell guard in hooks.json vs a small `${CLAUDE_PLUGIN_ROOT}/bin/` wrapper —
   plan leans wrapper. Verify the hook-env / wrapper approach against current
   Claude Code hook docs (use the claude-code-guide agent, like the original
   plugin plan did) BEFORE coding.

2. **`dotmd archive <slug>`** only takes full paths (verified: `dotmd archive
   r.md` → File not found), while `dotmd use`/`prompts archive` resolve bare
   slugs. Extend `resolveDocPath` (src/lifecycle.mjs runArchive) with a
   recursive basename fallback + multi-match error, mirroring resolvePromptInput.
   Add a lifecycle test.

Out of scope (deferred, listed in the plan): hud deletion notice, doctor
migrate-archived-prompts, CLAUDE.md⇄SKILL.md drift guard.

Workflow: `dotmd use docs/plans/plugin-primary-ergonomics.md` to start. Both
items can ship in one `npm version minor` (Item 1 bumps the plugin tree → needs
`claude plugin update` to take effect; Item 2 is pure CLI). Tests: `npm test`
(node:test). Release is fully automated via `npm version minor` — do NOT hand-
push/tag/publish. Working tree is clean; on main.

