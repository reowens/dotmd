---
type: prompt
status: archived
created: 2026-06-29T10:44:09Z
updated: 2026-06-29T12:42:59Z
dotmd_version: 0.66.0
context: "Resume Dotmd Roadmap Track4"
related_plans:
---

# Resume: dotmd forward roadmap — Track 4 (last track)

Continuing in the **dotmd** repo (`tools/dotmd`) on the forward-roadmap thread.
Start with `dotmd briefing`, then `dotmd runlists` — the coordination hub
`docs/plans/dotmd-forward.md` (`execution_mode: coordination`) tracks the 4
tracks and its live `→` now points at Track 4, the last pickup.

## Just shipped (context)

`dotmd-cli@0.66.0` shipped **Track 3 Phase 1**: a SKILL.md ⇄ CLAUDE.md drift
guard. An irreducible workflow-verb contract lives in a marked
`<!-- dotmd:canonical-workflow:start/end -->` block duplicated byte-identically
in `CLAUDE.md` and `plugins/dotmd/skills/dotmd/SKILL.md`. `src/skill-drift.mjs`
compares them (whitespace-tolerant) and warns via `dotmd check` / `doctor
--project` only when BOTH files exist AND BOTH carry the block — zero false
positives in user repos. 12 tests. main in sync.

**Track 3 left `partial`, not archived.** Phase 2 (extend self-heal to
`.claude/skills/`) was deferred as premature: dotmd has zero skill-scaffolding
code (it ships skills via the plugin package) and never banner-stamps skill
files, so the banner-gated sweep would be dead code. If the user wants it built
anyway, the plan (`docs/plans/dotmd-plugin-skill-drift.md`) is still open with
the full ruling in its Phase 2 body — reopen with `dotmd use` and build.

## First task: pick up Track 4

**`docs/plans/dotmd-roadmap-layer.md`** (now `active` — I unparked it from
`queued-after` because its gate, Track 2 runlist-mutation, shipped → runlists
are mutable). It's a roadmap tier ABOVE runlists, organized by time/priority
horizon (now/next/later). Start with `dotmd use docs/plans/dotmd-roadmap-layer.md`
(marks in-session + prints the card), then read the plan.

**Do NOT build yet — START with its Phase 0 earn-its-keep ruling**: thin preset
on the coordination hub vs. a new third-tier primitive. Everything downstream
depends on that ruling, and it may well land "defer/decline" like Track 3 Phase 2
and Track 2 Phase 5 did — this project defers premature automation by default.

## Shared-tree + release caveats

- Working tree shared with concurrent sessions. **Commit only your own files**
  (explicit `git add <paths>`), never `git add -A`. Untracked strays under
  `docs/archived/` and `docs/prompts/archived/` belong to other sessions — leave
  them.
- `git stash` is blocked by a hook. `docs/docs.md` is the generated index —
  don't commit it standalone (the `version` script regenerates + stages it,
  along with `plugins/`, `.claude-plugin/`, `.claude/commands`).
- Release: commit your `src/`/`test/`/`bin/`/`CLAUDE.md` changes FIRST, then
  `npm version patch|minor --force` (`--force` because the tree is usually dirty
  from `docs/docs.md`). 0.66.0 published cleanly first try; if you hit a
  `TLOG_CREATE_ENTRY_ERROR` Sigstore flake, recover with
  `gh run rerun <run-id> --failed`.
- **Always close out by leaving a baton** (`dotmd baton <slug> @draft` with no
  plan in-session, or `dotmd baton @draft` to also release an in-session plan) —
  never paste a "here's how to resume" block into chat.

