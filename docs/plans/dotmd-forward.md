---
type: plan
status: active
created: 2026-06-29T05:44:40Z
updated: 2026-06-29T09:58:03Z
surfaces:
modules:
domain:
audience: internal
parent_plan:
related_plans:
  - "> ../archived/dotmd-durability-debt.md"
  - "> dotmd-runlist-mutation.md"
  - "> dotmd-plugin-skill-drift.md"
  - "> dotmd-roadmap-layer.md"
  - "> dotmd-baton-exit-nudge.md"
related_docs:
current_state: Coordination hub for dotmd's forward roadmap, derived from a 3-researcher forward audit on 2026-06-29 (trajectory/parked-ideas, feature-surface maturity, rough-edges/tensions). The core is mature and the deck is otherwise drained; the path forward is to harden where it silently breaks, finish the one half-built feature (runlists), and dogfood drift-detection on dotmd's own plugin — not to add speculative features.
next_step: Tracks 1–3 done (1 archived; 2 & 3 shipped+partial — each deferred a premature tail Phase). Next and last pickup is Track 4 (dotmd-roadmap-layer), now unparked to active since its Track 2 gate shipped — START with its Phase 0 earn-its-keep ruling (preset vs. primitive) before building anything.
execution_mode: roadmap
---

# Dotmd Forward

> The roadmap map for dotmd post-0.64.2. dotmd's identity is a **drift- and
> staleness-catching, agent-native markdown lifecycle tool** that stays
> minimalist and ask-driven. The three tracks below reinforce that identity
> rather than dilute it. Order is a *recommended* sequence, not a hard gate —
> Track 3 can interleave.

## Scope

A forward-planning audit (three parallel researchers, 2026-06-29) established
that dotmd's core — lifecycle, querying, triage-at-scale — is mature and heavily
tested, and that the project deliberately declines speculative features. So this
hub is small and opinionated: three tracks that each pass the "reinforces the
north star" test. Everything else (AI depth, Notion alternatives, surfaces CRUD,
docs analytics, a pre-1.0 deprecation-shedding milestone) is **deliberately
dormant** — real gaps, but pull-when-asked, consistent with the project's grain.

## Ranked queue

<!-- One row per coordinated plan, in pickup order; the gating column explains
dependencies. Wire each plan into related_plans: so the "N related" count and
graph pick it up. -->

| # | Plan | Why / gating | Status |
|---|------|--------------|--------|
| 1 | [Durability & correctness debt](../archived/dotmd-durability-debt.md) | Silent-failure classes (CRLF/Windows blindness, untested frontmatter-mutating modules). The one track that jumps the "wait for an ask" queue — it's risk, not enhancement. No gating. | archived |
| 2 | [Runlist mutation](dotmd-runlist-mutation.md) | The live feature frontier: runlists are read-only, so adding/reordering children means hand-editing the array — contradicts dotmd's own ethos. Where the energy already is. | partial |
| 3 | [Plugin / skill drift guards](dotmd-plugin-skill-drift.md) | Cheap, maximally on-identity: make dotmd catch drift in its own SKILL.md ⇄ CLAUDE.md. **Shipped Phase 1** (the drift guard); Phase 2 (sweep `.claude/skills/`) deferred as premature — dotmd never scaffolds skill files, so the sweep would be dead code. | partial |
| 4 | [Roadmap layer](dotmd-roadmap-layer.md) | A tier *above* runlists, organized by time/priority horizon — what this hub had to improvise. Gate satisfied (#2 shipped → runlists are mutable), now unparked. Start with the earn-its-keep ruling (preset vs. primitive). | active |
| 5 | [Baton exit nudge](dotmd-baton-exit-nudge.md) | Dogfood-proven "harden where it silently breaks": baton-on-exit is the only core-loop step with no mechanical backstop (no Stop hook; the lone reminder is SessionStart + in-session-gated). **Candidate** — Phase 0 earn-its-keep ruling gates it against #4. | planned |

## Deliberately dormant (saw them, parked them)

Pull any of these only on a real ask — listing so they're not silently lost:

- **AI is the one thin leg** — a 56-LOC local-MLX wrapper feeding 3 commands; no
  API path, embeddings, or semantic search.
- **Taxonomy & analytics asymmetries** — `surfaces` has no CRUD while `statuses`
  has full CRUD; `health`/`actionable`/`unblocks` are plans-only (docs/prompts
  get no pipeline/aging analytics); module dashboard is plan-only.
- **Pre-1.0 deprecation shedding** — retire `module:`/`surface:` singular,
  `shelved`/`unshelve` aliases, the `claimed` placeholder status, the `status`
  verb. Worth doing as a deliberate 0.7/1.0 milestone, not slipped in.
- **`bin/dotmd.mjs` monolith split** (~95 KB single dispatcher) — refactor
  pressure, not urgent.
- **Notion is the only integration** — no Obsidian/Confluence/etc.

## Version History

- **2026-06-29** Migrated `execution_mode: coordination` → `roadmap` — dogfooding Track 4's shipped tier-3 primitive. This hub IS dotmd's forward roadmap; it now renders in the `Roadmaps` tier (`dotmd roadmap`) with a rolled-up `done/total` over its tracks (1/5: durability-debt archived; the rest live), instead of as a flat coordination hub. (Its children are plans, not runlists — a valid roadmap-over-plans; the recursive rollup shines when children are themselves runlists, as on beyond/platform's master-runlist.)
- **2026-06-29** Added candidate #5 (dotmd-baton-exit-nudge) under the "harden where it silently breaks" theme — surfaced by dogfooding: a session shipped Track 3 and released, then narrated the next pickup into chat instead of `dotmd baton`, exposing that baton-on-exit has no mechanical backstop. Planned/gated behind its own Phase 0 earn-its-keep ruling vs. Track 4.
- **2026-06-29** Track 3 (plugin/skill drift guards) shipped Phase 1 (the SKILL.md ⇄ CLAUDE.md marked-block drift guard via `src/skill-drift.mjs`, surfaced in `dotmd check`/`doctor`) and left partial — Phase 2 (sweep `.claude/skills/`) deferred as premature since dotmd never scaffolds skill files. Track 4 (roadmap-layer) unparked queued-after → active now that its Track 2 gate (mutable runlists) shipped; it's the last pickup. Refreshed ranked-queue statuses + next_step.
- **2026-06-29T09:58:03Z** Track 1 archived, Track 2 shipped (0.65.0) + left partial; refreshed ranked-queue statuses + next_step so the hub points at Track 3. (0.65.1 shipped the parked-status next-pickup fix that makes the `→` advance past Track 2's partial on its own.)
- **2026-06-29T05:44:40Z** Created (coordination hub) from the forward audit.
