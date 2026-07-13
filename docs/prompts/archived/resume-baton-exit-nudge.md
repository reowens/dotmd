---
type: prompt
status: archived
created: 2026-06-29T23:08:36Z
updated: 2026-06-30T01:32:54Z
dotmd_version: 0.67.0
context: "Resume Baton Exit Nudge"
related_plans:
---

# Resume: dotmd — baton-exit-nudge (last forward track)

Continuing in **dotmd** (`tools/dotmd`) on `docs/plans/dotmd-baton-exit-nudge.md`
(status `planned`) — the only remaining live track of `dotmd-forward` now that
Track 4 (roadmap-layer) shipped in **0.67.0** and archived.

Start: `dotmd briefing`, then `dotmd use dotmd-baton-exit-nudge` (marks it
in-session + prints the card). The full analysis is already in the plan body —
do NOT re-derive it; read it.

## The task: Phase 0 earn-its-keep ruling FIRST

Phase 0 asks two things; one is now resolved:

- **"How does it prioritize against Track 4?"** — MOOT. Track 4 is shipped +
  archived. It's no longer competing for priority.
- **"Is it worth building, and at what scope?"** — the real, open question.
  Options (laid out in the plan):
  - **Phase 1 — CLI closure-nudge (primary, my lean):** when a plan with a live
    `next_step` is transitioned to a non-terminal stop status (`set
    partial/active/awaiting/blocked`, or a baton-less in-session release), the CLI
    prints a one-line "wrapping up? leave a baton: `dotmd baton <slug> @draft`."
    Fires at the right moment (a CLI call already made), no Stop hook needed,
    mirrors the existing `set partial` reminder. Keep it QUIET: suppress on
    fully-done archive, and don't repeat if a baton was already saved this session
    (check the journal). Risk = nag fatigue; tune the trigger.
  - **Phase 2 — canonical-block guidance (secondary, cheap):** add the positive
    close-out rule to the `dotmd:canonical-workflow` marked block.
  - **Phase 3 — Stop/SessionEnd hook:** deferred/⏭ (wrong tool — fires every turn
    or too late). Don't build unless 1–2 prove insufficient.

This is a **dogfood-proven** gap (an author session narrated next-pickup into chat
instead of batoning), so unlike the deferred speculative tails (Track 2 Phase 5
rollup, Track 3 Phase 2 sweep) it likely CLEARS the earn-its-keep bar. But rule on
it explicitly before building — the project defers premature automation by default.

## Gotcha — the canonical-block drift guard

If Phase 2 ships, it edits the `dotmd:canonical-workflow` block, which is
byte-identical-guarded across **CLAUDE.md ⇄ plugins/dotmd/skills/dotmd/SKILL.md**
by `src/skill-drift.mjs`. Edit BOTH surfaces' marked block identically or `dotmd
check` fails. (Only the marked block is compared; surrounding prose can differ.)

## State / context

- dotmd is at **0.67.0** (just released: the tier-3 roadmap primitive). Tree clean.
- `dotmd-forward` is itself now a roadmap (`execution_mode: roadmap`, 2/5); after
  baton-exit ships, the forward roadmap is drained — wind it down or archive it.
- `beyond/platform/docs/plans/master-runlist.md` was migrated to
  `execution_mode: roadmap` but left UNCOMMITTED in that repo (user's choice) — not
  this track's concern, just don't be surprised by it.

## Shared-tree + release caveats

- Shared tree. **Commit only your own files** (explicit `git add <paths>`), never
  `-A`. Leave strays under `docs/archived/` and `docs/prompts/archived/`.
- `docs/docs.md` is generated — don't commit it standalone except to unblock a
  release; `npm version` regenerates + stages it. If `npm version` complains the
  tree is dirty, commit the regenerated `docs/docs.md` PROPERLY first — do NOT
  reach for `--force` (the maintainer dislikes it).
- Release (only if Phase 1/2 ships code): commit `src/`/`test/`/`CLAUDE.md`/
  `SKILL.md` FIRST, then `npm version patch|minor` (no `--force`).
- Close out by leaving a baton — never paste a resume block into chat (the very
  anti-pattern this track exists to catch).

