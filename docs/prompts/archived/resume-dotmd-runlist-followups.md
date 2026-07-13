---
type: prompt
status: archived
created: 2026-06-28T21:54:14Z
updated: 2026-06-28T21:55:27Z
dotmd_version: 0.62.0
context: "Resume Dotmd Runlist Followups"
related_plans:
---

# Resume: dotmd runlist-aware views — shipped 0.62.0, follow-ups parked

## Status: DONE + RELEASED
`dotmd-cli@0.62.0` is published to npm and installed globally. The whole
`runlist-coordination-hubs` line is merged to `main` (commit `6986c86` = the
`0.62.0` bump; `main` in sync with `origin/main`; tag `v0.62.0` pushed). The
branch `runlist-coordination-hubs` is fully merged — safe to delete.

`npm test` green (1138) as of the release. Repo: `/Users/reoiv/Development/beyond/tools/dotmd`.

## What shipped in 0.62.0
Three commits on top of the branch base:
1. `be4156a` — runlist-aware `dotmd plans`: fold sprint `runlist:` hubs under a
   `[RUNLIST]` row; lift coordination hubs (`execution_mode: coordination` /
   `*-runlist`) into a pinned `Runlists` section + out of the active count.
2. `2479d94` — briefing + health coordination awareness: hubs pulled out of the
   live/active counts into a `runlists` bucket (briefing) and a held-out
   `Runlists:` tally+section (health); `--json` gains additive `runlists`.
3. `4df5f65` — `dotmd runlists --sort age|recent|related|title|status` (default
   `age` = most stale first); promoted `hubLabel()` to a shared export in
   `src/runlist.mjs` (used by plans/runlists/health); health Pipeline now
   derives from the status vocab (surfaces in-session/partial/awaiting, drops
   dead ready/scoping).

Key code: `src/runlist.mjs` (buildRunlistIndex / buildCoordinationIndex /
isCoordinationHub / hubLabel), `src/query.mjs` (renderPlansOutput,
renderCoordinationSection, runRunlists + runlistSorter), `src/render.mjs`
(renderBriefing), `src/health.mjs` (runHealth). Tests: `test/runlist.test.mjs`.

Invariant held throughout: `plans`/`briefing` byte-identical on no-hub repos;
`health` changes only by the intended pipeline fix.

## Loose ends (none blocking)
1. **Platform repo founder-runlist fix is UNCOMMITTED.** In
   `/Users/reoiv/Development/beyond/platform`, `docs/plans/founder-runlist.md`
   was changed `execution_mode: implementation` → `coordination` (clears the
   `dotmd check` nudge). It's uncommitted there among ~63 other pre-existing
   dirty files — fold it into a normal platform commit whenever.
2. **F follow-up parked as a planned plan.**
   `docs/plans/surface-coordination-hub-next-pickup.md` (status `planned`,
   untracked dir — the repo keeps docs/plans/ as local notes). It scopes parsing
   coordination hubs' `## Ranked queue` tables to surface a `next → <child>`
   pickup in the runlist views (13/27 platform hubs encode order in prose that
   the views ignore). Pick it up with `dotmd use docs/plans/surface-coordination-hub-next-pickup.md`.

## Deferred / optional (decide if/when)
- **Item D — pin behavior under status filters (NOT done, needs a ruling).**
  `dotmd plans --status blocked` currently filters the pinned Runlists section
  down to blocked hubs (rides the `_matched` filter). Open question: should the
  runlist map always pin in full (nav aid), or keep respecting the leaf
  `--status` filter? One-line change in `renderPlansOutput` once decided.
- **"N related" precision — recommended SKIP.** 26/27 platform hubs already
  populate it from `related_plans:`; only founder-runlist is blank (authoring
  choice). Not worth a fallback heuristic.

## How to re-validate
`cd /Users/reoiv/Development/beyond/platform && COLUMNS=120 NO_COLOR=1 dotmd plans`
(and `dotmd runlists`, `dotmd briefing`, `dotmd health`) — 27 coordination hubs,
0 sprint hubs. Now that 0.62.0 is the released global, `dotmd` and
`node /Users/reoiv/Development/beyond/tools/dotmd/bin/dotmd.mjs` should match.

