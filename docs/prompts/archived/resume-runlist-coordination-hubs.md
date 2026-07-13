---
type: prompt
status: archived
created: 2026-06-28T20:54:16Z
updated: 2026-06-28T20:55:56Z
dotmd_version: 0.61.0
context: "Resume Runlist Coordination Hubs"
related_plans:
---

# Resume: runlist-aware `dotmd plans` + coordination hubs

## Where we are
Branch **`runlist-coordination-hubs`** (commit `be4156a`), NOT merged to main. All work committed; `npm test` green (1129). Verified against `/Users/reoiv/Development/beyond/platform` (302 plans, 27 coordination hubs) with the local bin: `node bin/dotmd.mjs plans`.

Note: the repo also has pre-existing uncommitted `docs/docs.md` (modified) and `docs/plans/` (untracked) — NOT ours, leave them alone.

## What shipped on this branch
Two distinct runlist shapes in `dotmd plans`:
1. **Sprint runlists** (frontmatter `runlist:`) — fold under a `[RUNLIST]` hub row, done/total + next-pickup `→`; filtered-out children render standalone; archived children resolve by basename.
2. **Coordination runlists** (`execution_mode: coordination`, or `*-runlist` slug fallback) — prose-first domain maps, lifted into a pinned, per-kind-capped `Runlists` section + out of the active count (NOT folded). The user chose "capped like leaves": top `--limit` of each kind, each with its own "N more" footer; `--all` lifts both.

Plus: new `dotmd runlists` command (dashboard, `--json`/`--limit`); `dotmd check`/`doctor` nudge for `*-runlist` hubs missing `execution_mode: coordination`; subdir hub labels (`pos/runlist`); per-hub count from `related_plans:` labelled "N related".

## Key code
- `src/runlist.mjs` — `buildRunlistIndex` (sprint), `buildCoordinationIndex` + `isCoordinationHub` (coordination).
- `src/query.mjs` — `renderPlansOutput` (header reclassification + flat-view partition/capping), `renderTriageWithRunlists`, `renderHubBlock`, `renderCoordinationSection`, `hubLabel`, `runRunlists`.
- `src/validate.mjs` — `checkCoordinationHubExecutionMode` (wired in `src/index.mjs`).
- `bin/dotmd.mjs` — `runlists` dispatch + FLAG_SPECS + help. `src/commands.mjs` + `src/completions.mjs` registries.
- `test/runlist.test.mjs` — 11 cases.

## Open / next steps (decide with user)
1. **Merge to main + release?** `git checkout main && git merge runlist-coordination-hubs --ff-only`, then `npm version minor` (does test→tag→push→publish→install). Not done yet — user wanted to keep iterating.
2. **Extend coordination/`[RUNLIST]` treatment to `briefing` and `health`?** Earlier finding: hubs still render flat there (only `dotmd plans` got the treatment). User said "we'll decide to extend or not."
3. **Platform hygiene:** `founder-runlist` is the one active `*-runlist` hub missing `execution_mode: coordination` (the nudge fires on it). pos/runlist is `partial` → quietly skipped. Optionally add the field to founder-runlist.
4. Smaller polish ideas if wanted: pin behavior tuning, `dotmd runlists` sort options, whether "N related" should resolve more precisely than the `related_plans` cluster.

## How to re-validate
`cd /Users/reoiv/Development/beyond/platform && COLUMNS=120 NO_COLOR=1 node /Users/reoiv/Development/beyond/tools/dotmd/bin/dotmd.mjs plans` (and `... runlists`). Diff against released 0.61.0 (`dotmd plans`) on a no-hub repo should be byte-identical.

