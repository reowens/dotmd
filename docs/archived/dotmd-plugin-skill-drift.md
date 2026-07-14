---
type: plan
status: archived
created: 2026-06-29T05:42:30Z
updated: 2026-07-14T00:10:11Z
surfaces:
modules:
domain:
audience: internal
parent_plan: dotmd-forward.md
related_plans:
related_docs:
current_state: Phase 1 shipped the canonical workflow drift guard. Phase 2 was explicitly rejected as dead code because dotmd never scaffolds or banner-stamps repository skill files; the plan is complete to its decided scope.
next_step: Add a final Closeout naming the shipped guard and rejected skill-sweep tail, then archive this plan during Documentation and Deck Hygiene. Do not add speculative self-heal behavior.
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

### Phase 1 — SKILL.md ⇄ CLAUDE.md drift guard ✅

Shipped. Comparison unit: **marked block, whitespace-tolerant equality** (the
deterministic, zero-false-positive option). An irreducible workflow-verb
contract lives between `<!-- dotmd:canonical-workflow:start -->` / `:end`
markers, duplicated byte-identically in `CLAUDE.md` and the plugin
`plugins/dotmd/skills/dotmd/SKILL.md`. `src/skill-drift.mjs` extracts both and
compares; it warns only when **both** files exist **and both** carry the block
(so a user repo with its own CLAUDE.md but no plugin source never trips it). The
per-file framing line sits *above* the start marker, so only the shared bullets
are compared. Surfaced via `dotmd check` (`src/index.mjs` warning-only block) and
`dotmd doctor --project` ("canonical workflow block: in sync / drifted"). 12
tests in `test/skill-drift.test.mjs`, incl. a regression guard on the real
committed pair.

### Phase 2 — Extend self-heal to `.claude/skills/` ⏭ (deferred — premature)

**Earn-its-keep ruling: deferred as premature automation.** The `.claude/commands/`
sweep exists because dotmd *used to* generate per-repo command files and must
clean up that legacy. Skills have no such legacy: dotmd ships skills via the
**plugin package** (`plugins/dotmd/skills/`), has **zero** code that scaffolds a
repo's `.claude/skills/`, and never stamps the `<!-- dotmd-generated: -->` banner
on a skill file. A banner-gated sweep of `.claude/skills/` would therefore match
nothing — teardown for a generation path that doesn't and never did exist (YAGNI;
same call the project made on Track 2 Phase 5). The premise "now that dotmd ships
skills" conflates *plugin-bundled* skills with *scaffolded* skills. Revisit only
if dotmd ever starts scaffolding+banner-stamping skill files into repos — at
which point the teardown ships *with* that generation, not ahead of it. (A
separate, genuinely-useful idea — warn when a hand-copied `.claude/skills/dotmd/`
shadows the plugin skill — is a different feature, risks false positives on
intentional overrides, and isn't clearly needed; not built.)

## Closeout

- Outcomes: `dotmd check` and `dotmd doctor --project` enforce whitespace-tolerant equality of the marked canonical workflow block in `CLAUDE.md` and the plugin skill.
- Scope safety: the check runs only when both source files and both markers exist, so consumer repositories do not receive false drift warnings.
- Verification: 12 focused tests cover extraction, drift, missing surfaces, and the committed canonical pair.
- Final decision: a `.claude/skills/` cleanup sweep is rejected because dotmd has never scaffolded or banner-stamped repository skill files. It is not deferred implementation work.

## Version History

- **2026-07-14T00:10:11Z** Archived — Shipped canonical workflow drift detection and finalized repository skill sweeping as rejected dead code.
- **2026-06-29T10:14:58Z** Status: in-session → partial — Phase 1 (SKILL.md ⇄ CLAUDE.md drift guard via marked block) shipped. Phase 2 (sweep .claude/skills/) deferred as premature — dotmd never scaffolds or banner-stamps skill files, so the sweep would be dead code; revisit only if skill-scaffolding ever lands.
- **2026-06-29T10:06:09Z** Started (planned → in-session).
- **2026-06-29T05:44:34Z** Status: active → planned.
- **2026-06-29T05:42:30Z** Created as roadmap Track 3.
