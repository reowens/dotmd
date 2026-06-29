---
type: plan
status: planned
created: 2026-06-29T05:42:30Z
updated: 2026-06-29T05:44:34Z
surfaces:
modules:
domain:
audience: internal
parent_plan: dotmd-forward.md
related_plans:
related_docs:
current_state: Roadmap Track 3 — a small, very on-identity win. dotmd is a drift- and staleness-catcher that doesn't yet catch drift in its own plugin surface. The SKILL.md and CLAUDE.md workflow guidance are two canonical surfaces kept in sync by hand (CLAUDE.md literally says "keep it in sync"), and the self-heal mechanism skips `.claude/skills/` — a decision made back when dotmd had no skill surface, which has since flipped.
next_step: Phase 1 — a SKILL.md ⇄ CLAUDE.md drift guard surfaced through `dotmd check`/`doctor`. Decide the comparison unit (shared canonical block vs. semantic) before building.
---

# Dotmd Plugin / Skill Drift Guards

> dotmd catches drift everywhere except in itself. Two canonical workflow-doc
> surfaces (the plugin's SKILL.md and the repo's CLAUDE.md) are kept in lockstep
> by hand, and self-heal ignores the now-real skills surface. Make dotmd dogfood
> its own drift-detection.

## Problem

CLAUDE.md states the plugin's `SKILL.md` "is the source of truth for how other
repos learn the workflow — keep it in sync with the guidance below." That sync is
purely manual today, so the two drift silently. Separately, the self-heal
mechanism was scoped to `.claude/commands/` and explicitly **declined** for skills
because "dotmd has no skill surface" — but dotmd now ships four skills
(baton/docs/plans/prompts), so the premise no longer holds. Both are cheap and
maximally on-brand for a drift-catching tool.

## Phases

<!-- Status markers in heading text: ⬜ not started · 🟡 in progress (pickup
targets this) · ✅ shipped · ⏭ skipped · 🚧 blocked. -->

### Phase 1 — SKILL.md ⇄ CLAUDE.md drift guard ⬜

Add a check (surfaced via `dotmd check`/`doctor`, or a dedicated `self-check`
extension) that flags when the canonical workflow guidance in CLAUDE.md and
`plugins/dotmd/skills/dotmd/SKILL.md` diverge. Decide the comparison unit first:
a shared marked block that must match byte-for-byte (simplest, robust) vs. a
looser "these key phrases must appear in both" heuristic. Prefer the marked-block
approach — deterministic, no false positives.

### Phase 2 — Extend self-heal to `.claude/skills/` ⬜

The slash-command self-heal already sweeps retired/stale generated command files
(banner-gated). Extend the same banner-gated sweep/refresh to `.claude/skills/`
now that dotmd ships skills. Reuse `claude-commands.mjs`'s banner-detection so
hand-authored skills are never touched.

## Version History

- **2026-06-29T05:44:34Z** Status: active → planned.
- **2026-06-29T05:42:30Z** Created as roadmap Track 3.
