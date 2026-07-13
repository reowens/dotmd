---
type: prompt
status: archived
created: 2026-06-29T09:15:00Z
updated: 2026-06-29T09:16:08Z
dotmd_version: 0.65.0
context: "Resume Partial Status Roadmap"
related_plans:
---

# Resume: `partial` status classification + continue the dotmd roadmap

Continuing in the **dotmd** repo (`tools/dotmd`) on the roadmap thread. Start with
`dotmd briefing`, then `dotmd runlists` (the coordination hub `dotmd-forward.md`
points at the next track).

## Just shipped (context)

`dotmd-cli@0.65.0` shipped **Track 2 — runlist mutation**: `runlist add|remove|reorder`
(CLI mutation of runlists, body `## Order of operations` sync, existing-plan
hub-relative refs, `parent_plan` back-refs), `dotmd plans` folds children in
runlist order, runlists held out of headline plan counts across plans/briefing/health,
and a `N runlists hidden by filter` pointer under `--status`. The Track 2 plan
(`docs/plans/dotmd-runlist-mutation.md`) is now **`partial`** (Phase 5 hub
auto-rollup deferred as premature automation). main is in sync with origin.

## First task: investigate whether `partial` should be a default-ish "closed/quiet" status

The user flagged this while reviewing the 0.65.0 closeout: the roadmap hub still
shows `→ runlist-mutation (partial)` as its **next pickup**, which seems wrong —
a `partial` plan is "mostly shipped, tail deferred", not the thing to pick up next.

**Concrete inconsistency found** (worth confirming/deciding, not yet fixed):

- `partial` is treated as **quiet** in `src/config.mjs`: it's in `skipStaleFor`
  (line 59) and `skipWarningsFor` (line 60), and `moduleRequiredFor` (line 81).
  But it is **NOT** in any archive/terminal set.
- Hub **next-pickup resolution** gates on `archiveStatuses` (just `['archived']`),
  NOT on pickup-ability — see `src/runlist.mjs`: `buildRunlistIndex` (line ~56),
  `resolveHubNextPickup` (line ~272), `renderRunlist` (line ~333), and
  `buildCoordinationIndex`. So a `partial` child counts as "not done" → it's
  surfaced as `→ next`.
- But `runlist next` ITSELF gates on `PICKUPABLE_STATUSES = ['active','planned','in-session']`
  (`src/runlist.mjs:21`), which **excludes** `partial`. So the hub *points at* a
  partial plan as next, yet `runlist next <hub>` would stop with the
  "not in a pickup-able status" error on it. That mismatch is the friction.

**The question to rule on (`"check those" = the status-classification defaults):**
should `partial` (and probably also the other quiet/parked statuses — `paused`,
`awaiting`, `blocked`, `queued-after`) be excluded from hub **next-pickup**
resolution by default, so a hub advances past a partial child to the first truly
pickup-able one? Options to weigh:
  - Make next-pickup resolution gate on `PICKUPABLE_STATUSES` (or a new
    "done-or-parked" set) instead of just `archiveStatuses`, so partial/parked
    children are skipped as next-pickup but NOT counted as archived/done in
    `done/total` progress. (Note the nuance: "skip as next-pickup" ≠ "count as
    done" — a partial child isn't archived, so `done/total` shouldn't tick up.)
  - Or leave partial actionable and instead just archive the Track 2 plan now
    (`dotmd archive docs/plans/dotmd-runlist-mutation.md`) to advance the hub — but
    that treats the symptom, not the classification question the user raised.
Audit ALL the status default sets in `config.mjs` (statuses, expanded line 28,
skipStaleFor, skipWarningsFor, moduleRequiredFor, archiveStatuses/terminalStatuses)
and decide where `partial` (and the parked statuses) belong. Write tests for the
chosen behavior; `test/runlist.test.mjs` + the lifecycle/config tests are the homes.

## Then: continue the roadmap

The hub `docs/plans/dotmd-forward.md` (`execution_mode: coordination`) tracks 4 tracks.
Track 1 (durability) shipped+archived; Track 2 (runlist mutation) shipped, partial.

- **Track 3 — `docs/plans/dotmd-plugin-skill-drift.md`** (planned): SKILL.md⇄CLAUDE.md
  drift guard + extend self-heal to `.claude/skills/`. Small, on-identity. The
  partial-status work above may naturally precede or interleave with this.
- **Track 4 — `docs/plans/dotmd-roadmap-layer.md`** (queued-after Track 2): a roadmap
  tier above runlists. Start with its Phase 0 earn-its-keep ruling before building.

Decide with the user whether to fully archive Track 2 (advancing the hub to Track 3)
once the partial-status question is settled — the answer may depend on that ruling.

## Shared-tree + release caveats

- Working tree shared with concurrent sessions. **Commit only your own files**
  (explicit `git add <paths>`), never `git add -A`. Untracked strays under
  `docs/archived/` and `docs/prompts/archived/` belong to other sessions — leave them.
- `git stash` is blocked by a hook. `docs/docs.md` is the generated index — don't
  commit it standalone (the version script regenerates + stages it).
- Release: `npm version patch|minor` (use `--force` if the tree is dirty — it
  usually is, from `docs/docs.md`). Commit your code/tests FIRST; the version
  script does not stage `src/`/`test/`. 0.65.0 published cleanly on the first try,
  but watch for the occasional `TLOG_CREATE_ENTRY_ERROR` Sigstore flake on publish
  — recovery is `gh run rerun <run-id> --failed`.

