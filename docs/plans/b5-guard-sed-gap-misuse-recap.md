---
type: plan
status: planned
created: 2026-06-10T07:45:49Z
updated: 2026-06-10T07:47:01Z
surfaces: [cli, hooks]
modules: [guard, hud]
domain: agent-ux
audience: internal
parent_plan: docs/plans/agent-ux-round-b.md
related_plans:
related_docs:
current_state: Drafted from the 2026-06-10 review; sed bypass verified, misuse repeat-offense pattern observed in the health repo.
next_step: Check whether health/STATUS.md edit-status hits are false positives before escalating.
---

# B5 Guard Sed Gap Misuse Recap

> Close the sed/perl in-place status-edit bypass, escalate edit-status to deny (config-gated), and surface repeat misuse offenses as a hud priming line.

## Problem

Two related guard findings from the 2026-06-10 review:

1. **Coverage gap.** `sed -i s/active/archived/ docs/plans/x.md` passes the PreToolUse guard (returns `{}`) while the equivalent Edit-tool change is caught as `edit-status`. Same for `perl -pi` / `awk -i inplace`. An agent that gets warned on Edit can (and eventually will) reach for sed.
2. **Warn-only isn't sticking.** `dotmd misuse` shows the `health` repo logged five `edit-status` warnings in one day, same files recurring — the advisory context is being read and then overridden. Caveat to verify first: `health/STATUS.md` may be a false positive (a file *named* STATUS.md vs. a frontmatter `status:` edit).

## Goals

- Guard detects in-place stream-editor mutations of `status:` in managed docs (`sed -i`, `perl -pi`, `awk -i`) and emits the same corrective `dotmd set` hint.
- Investigate misuse-log false positives first: confirm whether `edit-status` fires on filename matches rather than actual frontmatter `status:` edits; fix matching if so.
- Escalate `edit-status` from advisory context to PreToolUse **deny** with the corrective command. Unlike the prompt-read rule (where reading is sometimes legitimate), there is no legitimate hand-edit of `status:` — `dotmd set` is a complete substitute. Config escape hatch (`guard.deny: false`) for users who want warn-only.
- Feed misuse back into priming: when the repo's misuse log shows ≥N hits on one rule in the last 7 days, `dotmd hud` appends one line — e.g. `sessions here tripped edit-status 5x this week; use dotmd set`. This is the shipped self-correcting-hints pattern pointed at repeat offenses.

## Non-Goals

- Catching every conceivable mutation vector (echo >, python -c, …). Cover the common stream editors; the deny escalation + hud recap handle the long tail behaviorally.

## Phases

### Phase 1 — false-positive check + matcher fix ⬜
Reproduce the `health` repo hits; tighten `edit-status` detection to actual frontmatter `status:` mutations if needed.

### Phase 2 — sed/perl/awk coverage ⬜
Pattern detection in `src/guard.mjs` + tests mirroring the existing guard test matrix.

### Phase 3 — deny escalation + hud recap ⬜
`permissionDecision: deny` for edit-status (config-gated), misuse-recap line in `src/hud.mjs` reading via `src/misuse-read.mjs`.
