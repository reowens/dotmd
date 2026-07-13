---
type: prompt
status: archived
created: 2026-06-29T12:42:13Z
updated: 2026-06-29T20:49:19Z
dotmd_version: 0.66.0
context: "Resume Dotmd Roadmap Layer"
related_plans:
---

# Resume: dotmd Track 4 — awaiting the build-scope call

Continuing in **dotmd** (`tools/dotmd`) on Track 4, `docs/plans/dotmd-roadmap-layer.md`
(status `awaiting`). Start: `dotmd briefing`, then read that plan's **Phase 0**
section — the analysis is already written there; do NOT re-derive it.

## The one decision to land

Phase 0's ruling is **settled on technical merits: PRESET, not primitive** (the
only true tier justification — runlist children + rollup — is premature at the
repo's 1 runlist; everything else is framing a coordination hub already carries).

What's open is the **user's build-scope call — A / B / C**, fully laid out in the
plan's Phase 0 (user-view, agent-view, utility, scope for each):

- **A — Defer (my recommendation):** record ruling, mark the plan `partial`,
  build nothing. Concludes the forward roadmap.
- **B — Minimal preset:** `dotmd new plan <hub> --roadmap` scaffold (~half-day).
- **C — Full primitive:** new third tier + rollup (multi-day; I'd push back).

Next action: present A/B/C to the user, get their pick, then act on it. I'd
floated A/B/C via AskUserQuestion and the user wanted to clarify first; the last
thing I gave them was the full user-vs-agent / utility / scope breakdown (now
captured in the plan). So: re-pose the decision, or answer any remaining angle.

## State / gotchas

- This session also **shipped Track 3 / 0.66.0** (SKILL.md ⇄ CLAUDE.md drift
  guard) and **filed candidate #5** `dotmd-baton-exit-nudge.md` (planned) — a
  dogfood-found gap: baton-on-exit has no mechanical backstop. It's gated behind
  its OWN Phase 0 ruling vs. Track 4; don't jump into it.
- Session doc work was **committed** (Track 4 Phase 0 ruling, the baton-exit
  plan, the forward-hub ranked-queue #5). main should be clean.
- If A is chosen: the forward roadmap is effectively done (1 archived, 2 & 3
  partial, 4 partial-by-ruling, 5 candidate). Honors the roadmap's own
  "no speculative features" thesis by declining its last speculative track.

## Shared-tree + release caveats

- Shared tree. **Commit only your own files** (explicit `git add <paths>`), never
  `-A`. Leave strays under `docs/archived/` and `docs/prompts/archived/`.
- `docs/docs.md` is generated — don't commit standalone (the `version` script
  stages it). `git stash` is hook-blocked.
- Release (only if B/C ships code): commit `src/`/`test/`/`CLAUDE.md` FIRST, then
  `npm version patch|minor --force`.
- Close out by leaving a baton — never paste a resume block into chat.

