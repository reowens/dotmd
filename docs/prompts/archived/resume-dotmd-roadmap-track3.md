---
type: prompt
status: archived
created: 2026-06-29T09:57:44Z
updated: 2026-06-29T10:05:57Z
dotmd_version: 0.65.1
context: "Resume Dotmd Roadmap Track3"
related_plans:
---

# Resume: continue the dotmd forward roadmap (Track 3 next)

Continuing in the **dotmd** repo (`tools/dotmd`) on the forward-roadmap thread.
Start with `dotmd briefing`, then `dotmd runlists` — the coordination hub
`docs/plans/dotmd-forward.md` (`execution_mode: coordination`) tracks the 4
tracks and its live `→` points at the next pickup.

## Just shipped (context)

`dotmd-cli@0.65.1` shipped the **parked-status next-pickup fix**: runlist
next-pickup resolution now gates on *pickup-ability* (`active`/`planned`/
`in-session`) instead of just "not archived". A hub's `→` advances PAST parked
children (`blocked`/`partial`/`paused`/`awaiting`/`queued-after`) to the first
child a session can actually start — but parked children are NOT counted as
done (`done/total` tracks archived only; `buildRunlistIndex` exposes
`parkedCount`, and `dotmd plans` shows "N parked" instead of mislabelling a
stuck hub "all archived"). `runlist next` errors only when *every* remaining
child is parked, listing them + the unstick verbs. Applied at all four
resolution sites in `src/runlist.mjs` (`buildRunlistIndex`, `renderRunlist`,
`runlist next`, `resolveHubNextPickup`). Docs synced (CLAUDE.md, plugin
SKILL.md, runlist help). 6 new tests in `test/runlist.test.mjs`. main in sync.

**Ruling that produced it:** the config default sets in `src/config.mjs`
(statuses, context.expanded, skipStaleFor, skipWarningsFor, moduleRequiredFor,
archive/terminalStatuses) were audited and confirmed *correctly* classified for
`partial` and the parked statuses — the defect was isolated to the next-pickup
gate, not the config taxonomy. (One observation left un-acted: `blocked` is
absent from `taxonomy.moduleRequiredFor` while the other parked statuses are
present — surface it only if it proves to matter; not obviously wrong.)

**Track 2** (`docs/plans/dotmd-runlist-mutation.md`) was deliberately **left
`partial`** — Phase 5 (hub status auto-rollup) is genuinely deferred as
premature automation, not done, and the hub no longer hangs on it. Don't
archive it without a reason.

## First task: pick up Track 3

**`docs/plans/dotmd-plugin-skill-drift.md`** (planned) — the hub's current `→`.
Small, on-identity: a SKILL.md ⇄ CLAUDE.md drift guard + extend self-heal to
`.claude/skills/`. Start with `dotmd use docs/plans/dotmd-plugin-skill-drift.md`
(marks in-session + prints the card), read the plan, scope its phases, then
build. It can interleave with the rest of the roadmap.

## Then: Track 4

**`docs/plans/dotmd-roadmap-layer.md`** (queued-after Track 2): a roadmap tier
*above* runlists, organized by time/priority horizon. **Start with its Phase 0
earn-its-keep ruling** (preset vs. primitive) before building anything.

## Shared-tree + release caveats

- Working tree shared with concurrent sessions. **Commit only your own files**
  (explicit `git add <paths>`), never `git add -A`. Untracked strays under
  `docs/archived/` and `docs/prompts/archived/` belong to other sessions — leave
  them.
- `git stash` is blocked by a hook. `docs/docs.md` is the generated index —
  don't commit it standalone (the `version` script regenerates + stages it,
  along with `plugins/`, `.claude-plugin/`, `.claude/commands`).
- Release: commit your `src/`/`test/`/`bin/`/`CLAUDE.md` changes FIRST (the
  version script doesn't stage those), then `npm version patch|minor --force`
  (`--force` because the tree is usually dirty from `docs/docs.md`). 0.65.1
  published cleanly first try; if you hit a `TLOG_CREATE_ENTRY_ERROR` Sigstore
  flake on publish, recover with `gh run rerun <run-id> --failed`.

