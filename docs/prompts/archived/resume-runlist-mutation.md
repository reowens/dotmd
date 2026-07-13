---
type: prompt
status: archived
created: 2026-06-29T07:12:18Z
updated: 2026-06-29T07:13:23Z
dotmd_version: 0.64.3
context: "Resume Runlist Mutation"
related_plans:
---

# Resume: kick off Track 2 — runlist mutation

Continuing in the **dotmd** repo (`tools/dotmd`). Start with `dotmd briefing`, then
`dotmd runlists` — the coordination hub will point you at the next pickup.

## Where the roadmap stands

The forward roadmap (coordination hub `docs/plans/dotmd-forward.md`,
`execution_mode: coordination`) has four tracks. **Track 1 (durability debt) is
DONE and shipped — released as `dotmd-cli@0.64.3`** (CRLF/Windows frontmatter
support via `normalizeEol()` at all 7 fence detectors, separator-agnostic guard,
characterization tests for the frontmatter-fix helpers + `dotmd use`). Suite is at
1231 pass / 0 fail. That plan is archived at
`docs/archived/dotmd-durability-debt.md` (read its `## Closeout` for specifics).

The hub now advances to **Track 2 → `dotmd-runlist-mutation.md`** (the
`next →` in `dotmd runlists`).

## First: decide the deferred doc reconciliation

Last session released the *code* but **deliberately left the roadmap planning docs
uncommitted** (the user chose "release code, reconcile docs later"). Before/after
starting Track 2, decide with the user whether to commit these now-**untracked**
files (they validate clean — `dotmd check` = 0/0):

- `docs/plans/dotmd-forward.md` (the hub), `docs/plans/dotmd-runlist-mutation.md`
  (Track 2), `docs/plans/dotmd-plugin-skill-drift.md` (Track 3).
- `docs/archived/dotmd-durability-debt.md` (Track 1, shipped + archived but its
  file move was never committed).

These are git-only planning docs — NOT part of the npm package — so they didn't
need to ship with 0.64.3. The Track 1 code/tests + version bump ARE committed and
pushed (`main` is in sync with `origin/main`). Note `docs/archived/dotmd-durability-debt.md`
references the still-untracked hub, so committing them together keeps refs intact.

## Track 2: runlist mutation (`docs/plans/dotmd-runlist-mutation.md`)

**The contradiction it closes:** runlists can be read, folded, walked
(`runlist next`), and dashboarded — but never **mutated** through the CLI. Adding
or reordering a child means hand-editing the `runlist:` YAML array — the exact move
dotmd tells agents never to make. Both the feature-surface and trajectory audits
flagged this as the #1 asymmetry, and three archived closeouts parked the
"point a hub at an existing plan" sub-item as the most-wanted carryover.

Five phases (in the plan body):

1. **`runlist add <hub> <child...>`** ← start here. Append to the hub's `runlist:`
   array (sprint hub) or `## Ranked queue` (coordination hub), set each child's
   `parent_plan:` back-ref, scaffold a `planned` stub if the child file doesn't
   exist. Mirror the `dotmd new plan --runlist` scaffolding logic; add `--dry-run`.
2. **`runlist remove` / `runlist reorder`** — keep the `runlist:` array and any
   `## Order of operations` link list in sync.
3. **Point a hub at an *existing* plan (hub-relative refs)** — the thrice-parked
   carryover; needs hub-relative ref resolution. Fold into Phase 1's add path once
   resolution exists.
4. **Item D: pin Runlists under `--status` filter** — `dotmd plans --status X`
   currently filters out the pinned Runlists section. "A one-line change in
   `renderPlansOutput` once decided." Decide, then wire.
5. **Hub status auto-rollup (stretch)** — all-archived children → hub archived.
   Optional; only build if Phases 1–4 make manual hub-status upkeep visibly annoying.

To start: `dotmd use docs/plans/dotmd-runlist-mutation.md` (marks in-session +
prints the card), or `dotmd runlist next docs/plans/dotmd-forward.md` to pick up the
first non-archived child. Then read the phases and begin Phase 1. Write tests
alongside (`test/runlist.test.mjs` exists — extend it).

## Tracks 3 & 4 (context, not this session)

- **`dotmd-plugin-skill-drift.md`** (Track 3, planned) — SKILL.md⇄CLAUDE.md drift
  guard + extend self-heal to `.claude/skills/`. Small, on-identity, can interleave.
- **`dotmd-roadmap-layer.md`** (Track 4, queued-after Track 2) — **don't build
  yet.** A roadmap tier above runlists; gated behind runlist-mutation. Start with
  its Phase 0 earn-its-keep ruling when picked up.

## Shared-tree caveats

- Working tree is shared with concurrent sessions. **Commit only your own files**
  (explicit `git add <paths>`), never `git add -A`. Untracked strays under
  `docs/archived/` and `docs/prompts/archived/` belong to other sessions — leave them.
- `git stash` is blocked by a hook.
- `docs/docs.md` is the generated index; **don't commit it standalone**.
- Release path: `npm version patch` (use `--force` if the tree is dirty). The
  version script regenerates the index + plugin version files and `git add`s only
  specific paths (NOT `-A`), so strays stay safe. Commit your code/tests FIRST —
  the version script does not stage `src/`/`test/`. Verify the staging area is
  empty before `npm version`.
- **Release gotcha seen on 0.64.3:** the GitHub Actions `npm publish` can fail once
  with `TLOG_CREATE_ENTRY_ERROR — (409) ... transparency log` (a transient
  npm/Sigstore provenance flake). Recovery: `gh run rerun <run-id> --failed`, then
  watch — it cleared on the second attempt.

