---
type: plan
status: archived
created: 2026-06-10T07:45:49Z
updated: 2026-06-10T09:47:58Z
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

### Phase 1 — false-positive check + matcher fix ✅
Reproduce the `health` repo hits; tighten `edit-status` detection to actual frontmatter `status:` mutations if needed.

Verified: NOT a filename false positive — `health/STATUS.md` is a real managed doc with `status:` frontmatter (health's `root = '.'`). The real bug: `evalEdit` fired when `new_string` merely *contained* a `status:` line. The 08:26 session's logged task was "add a `summary:` to every doc's frontmatter" — those edits anchored on surrounding frontmatter lines, so the unchanged `status:` rode along and tripped the warn. Fix: compare `status:` lines extracted from old vs new (Edit pairs, MultiEdit `edits[]` — previously not inspected at all, Write content vs disk); fire only on actual change. Write to a nonexistent file (doc creation) no longer fires.

### Phase 2 — sed/perl/awk coverage ✅
Pattern detection in `src/guard.mjs` + tests mirroring the existing guard test matrix.

Shipped: `sed -i` / `perl -pi` / `awk -i inplace` commands that mention `status` and target a managed doc emit the same `edit-status` result. Only the command text before any heredoc marker is scanned, so saved-prompt bodies *describing* the rule don't trip it.

### Phase 3 — deny escalation + hud recap ✅
`permissionDecision: deny` for edit-status (config-gated), misuse-recap line in `src/hud.mjs` reading via `src/misuse-read.mjs`.

Shipped: `edit-status` now denies by default (`guard: { deny: false }` in config drops it to warn) — safe to escalate now that Phase 1 killed the false positives. `dotmd hud` appends one teaching line when a rule trips ≥3× in 7 days in this repo (`sessions here tripped edit-status 5× this week — never hand-edit status:; use dotmd set`); carried in `--json` as `misuseRecap`.

## Version History

- **2026-06-10T09:47:58Z** Archived — Shipped all 3 phases: change-detection fix for the edit-status false positive (health-repo repeat offenses were unchanged-context anchors), sed/perl/awk in-place coverage, deny escalation (guard.deny config gate), and the hud misuse recap line. Suite at 1084.
