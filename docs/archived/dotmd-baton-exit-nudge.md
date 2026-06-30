---
type: plan
status: archived
created: 2026-06-29T11:06:40Z
updated: 2026-06-30T01:44:45Z
surfaces:
modules:
domain:
audience: internal
parent_plan: ../plans/dotmd-forward.md
related_plans:
related_docs:
current_state: Baton-on-exit is the only step of dotmd's core loop with no mechanical backstop — it rides entirely on agent memory, which is exactly the failure class dotmd exists to eliminate. Found by dogfooding: an author-session shipped+released Track 3, then narrated the next pickup into chat instead of running `dotmd baton` (the anti-pattern SKILL.md explicitly forbids). The plugin's hooks are all start-side (SessionStart/SubagentStart/CwdChanged → hud) or guard-side (PreToolUse → guard); there is no Stop/SessionEnd hook, and the lone baton reminder is SessionStart-only and gated on an in-session plan owned at session start.
next_step: Phase 0 — earn-its-keep ruling: is this worth building (CLI closure-nudge) vs. a pure guidance tightening, and how does it prioritize against Track 4? Default to deferring premature automation, but this is a real, dogfood-proven gap.
---

# Dotmd Baton Exit Nudge

> dotmd's thesis is "catch drift mechanically, don't trust memory." Every
> core-loop invariant is backed by a hook or a primer — except the close-out
> baton, which is protected only by agent discretion. Close that one hole.

## Problem

Saving a resume prompt on the way out (`dotmd baton`) is the step that keeps the
handoff loop alive: the next session's `dotmd hud` surfaces it and `dotmd use`
consumes it. It is **the only step of the core loop with no mechanical
enforcement.**

Evidence (audited 2026-06-29):

- **All plugin hooks are start-side or guard-side.** `plugins/dotmd/hooks.json`
  registers `SessionStart`, `SubagentStart`, `CwdChanged` (all → `dotmd hud`,
  priming) and `PreToolUse` (→ `dotmd guard`, blocking bad tool calls). There is
  **no `Stop`, `SessionEnd`, or `SubagentStop` hook** — nothing fires at the
  moment a session stops.
- **The lone baton reminder misses the common case.** `src/hud.mjs:342` prints
  "hand off with `dotmd baton` before stopping" only at *SessionStart* and only
  when the journal already attributes an in-session plan to this session at that
  moment (`hud.owned.via === 'journal'`). A session that starts from a pending
  prompt with nothing in-session, or that closes its plan (`set partial`/
  `archive`) before stopping, never sees it.
- **The guard can't catch the real failure.** `src/guard.mjs` blocks status-line
  hand-edits and prompt reads/commits. The actual failure — narrating a "here's
  how to resume / next pickup" block into chat — is text output, not a tool
  call, so a `PreToolUse` guard is structurally incapable of intercepting it.
- **Dogfood incident.** A dotmd author-session shipped Track 3 + released 0.66.0,
  then wrote "Next pickup: `dotmd runlist next …`" into chat instead of
  batoning — the exact anti-pattern SKILL.md line 50 forbids — with zero
  mechanical catch. The tool failed to defend its own loop.

## Phases

<!-- Status markers in heading text: ⬜ not started · 🟡 in progress (pickup
targets this) · ✅ shipped · ⏭ skipped · 🚧 blocked. -->

### Phase 0 — Earn-its-keep ruling ✅

**Ruling (2026-06-30): build Phase 1 + Phase 2, keep Phase 3 deferred.** This
clears the bar — unlike Track 3 Phase 2 (dead-code teardown) and Track 2 Phase 5
(speculative rollup), it's a *dogfood-proven* gap in the **only** core-loop step
with no mechanical backstop. Phase 1 (CLI closure-nudge) fires at exactly the
moment a CLI call is already being made, needs no new Claude Code hook event, and
mirrors the existing `set partial` reminder. Phase 2 is nearly free and the
`skill-drift` guard keeps both surfaces in lockstep. Track-4 prioritization is
**moot** — `dotmd-roadmap-layer` shipped in 0.67.0 and is archived; it's no
longer competing.

**Trigger precision (manages the named nag-fatigue risk):** fire only on the
*baton-less in-session release* — `set <non-terminal-stop> <plan>` where the
plan's **old** status is `in-session` (you were actively working it) AND a live
`next_step` remains (a known next pickup) AND no baton was saved this session
(journal check) AND it isn't baton's own internal release. Gating on
`old == in-session` keeps the nudge off pure triage of never-started plans, where
no session work is owed a handoff. `archived` never reaches the nudge (routed to
`runArchive` first), so the "suppress on fully-done" requirement is automatic.

### Phase 1 — CLI closure-nudge (primary) ✅

Shipped in `src/lifecycle.mjs` (`runSet`): one pre-transition frontmatter read now
powers both the existing `partial` reminder and the new baton nudge. The nudge
fires only on the baton-less in-session release (old status `in-session` →
non-terminal stop, live `next_step`, no `baton` journal entry this session, not
baton's own `viaBaton` release) and prints `dotmd baton <slug> @draft`. Covered by
7 cases in `test/lifecycle.test.mjs` (`set — baton-on-exit nudge`).

When a plan that still has a `next_step` is closed/transitioned to a non-terminal
stop status (`set partial`/`set active`/`set awaiting`/`set blocked`, or a
baton-less in-session release) — i.e. there is a *known next pickup* — have the
CLI print a one-line nudge: "wrapping up? leave a baton: `dotmd baton <slug>
@draft`." Why this over a hook: it fires at exactly the right moment (a CLI call
the agent already makes), needs no Claude Code hook event, and mirrors the
existing `set partial` reminder. Keep it **quiet**: suppress when archiving as
fully-done (no follow-on), and don't repeat if a baton was already saved this
session (check the journal). Risk to manage: nag fatigue — tune the trigger so
it only fires when a handoff is genuinely owed.

### Phase 2 — Canonical-block guidance (secondary) ✅

Shipped: the "Close to match reality" bullet of the `dotmd:canonical-workflow`
block now ends with "Parking a plan with a known next step? Leave a baton in the
same breath — never narrate the next pickup into chat." — edited byte-identically
in CLAUDE.md ⇄ SKILL.md, verified by `dotmd check` (skill-drift guard).

Add the *positive* rule to the `dotmd:canonical-workflow` block (now guarded
across CLAUDE.md ⇄ SKILL.md by `src/skill-drift.mjs`): "Closing a plan with a
known next step? Leave a baton in the same breath — never narrate the next
pickup into chat." Today the baton guidance is framed reactively ("mid-work" /
"when asked"); state it as an unconditional close-out step. Cheap, and the new
drift guard keeps both surfaces in lockstep automatically.

### Phase 3 — Stop/SessionEnd hook (deferred — likely wrong tool) ⏭

A `Stop` hook fires on *every* turn end → constant nagging; `SessionEnd` fires
too late to prompt the agent to act. Detecting "the session is winding down"
from a turn-level hook is the hard, error-prone part, and the agent is the best
detector of its own wrap-up. Revisit only if Phases 1–2 prove insufficient in
practice. Documented here so the option isn't silently re-litigated.

## Closeout

- Shipped as dotmd-cli **0.68.0** (commit `115c416`). Closes the last
  unguarded core-loop step — baton-on-exit now has a mechanical backstop.
- **Phase 1 (CLI nudge):** `runSet` fires a one-line "leave a baton" on the
  baton-less in-session release (old status `in-session` → non-terminal stop,
  live `next_step`, no `baton` journal entry this session, not baton's own
  `viaBaton` release). One pre-transition frontmatter read now powers both this
  and the existing `partial` reminder. Quiet by design (archive routed away,
  triage of never-started plans skipped, prior-baton suppression).
- **Phase 2 (guidance):** positive close-out rule added to the
  `dotmd:canonical-workflow` block, byte-identical across CLAUDE.md ⇄ SKILL.md
  (skill-drift guarded).
- **Phase 3 (Stop/SessionEnd hook):** deferred by design — wrong tool (fires
  every turn / too late). Re-litigation pre-empted in the Phases section.
- Tests: 7 new cases in `test/lifecycle.test.mjs` (`set — baton-on-exit nudge`);
  suite 1290 → 1297, all green. No tail work.

## Version History

- **2026-06-30T01:44:45Z** Archived — shipped 0.68.0 (Phases 0–2; Phase 3 deferred by design)
- **2026-06-30** Phase 0 ruled (build 1+2, defer 3), Phases 1 & 2 shipped: CLI
  baton-on-exit nudge in `runSet` + canonical-block positive close-out rule.
  Phase 3 (Stop/SessionEnd hook) stays deferred by design.
- **2026-06-30T01:33:05Z** Started (planned → in-session).
- **2026-06-29T11:08:05Z** Status: active → planned — Filed from the Track 3 dogfood incident — baton-on-exit has no mechanical backstop. Candidate under the forward hub's harden-where-it-silently-breaks theme; earn-its-keep ruling (Phase 0) gates it against Track 4.
- **2026-06-29T11:06:40Z** Created.
