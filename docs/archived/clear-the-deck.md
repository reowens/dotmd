---
type: plan
status: archived
created: 2026-05-28T03:58:54Z
updated: 2026-05-28T04:24:52Z
surfaces:
modules:
  - none
domain:
audience: internal
parent_plan:
related_plans:
related_docs:
current_state: "Sequences all remaining work as a single runlist hub. Five phased releases drain 2 open issues (#13 P0, #12) and 3 active plans (F15/F17b/F17c)."
next_step: "Mark in-session, ship phase 1 (issue #13 hotfix → 0.45.2)."
runlist:
  - issue-13-archived-prompts-drift.md
  - issue-12-validator-ux.md
  - die-self-correcting-hints.md
  - hud-reads-journal.md
  - ../plans/filed-primitive.md
---

# Clear The Deck

**Runlist hub — clear the deck.** Single in-session plan that sequences all five remaining work items into phased releases. Goal: drain plate to zero pending plans + zero open issues, no checkpoint between phases.

## Phases

Each child plan ships its own release; no pause between them.

| Phase | Child | Bump | Why this slot |
|-------|-------|------|---------------|
| 1 | issue-13-archived-prompts-drift | 0.45.2 | P0 hotfix — agents are hitting the drift now |
| 2 | issue-12-validator-ux | 0.46.0 | Cheap UX trio that unblocks plan-scaffold flow |
| 3 | die-self-correcting-hints | 0.47.0 | F17c — repeat-failure hints. Folds in "error-UX-audit" thread |
| 4 | hud-reads-journal | 0.48.0 | F17b — additive hud sections |
| 5 | filed-primitive | 0.49.0 | F15 — biggest blast radius, has /tmp spike. Saved for last |

## Working rules

- `npm version <bump>` per phase. No manual push/tag/publish.
- One commit per phase (code + tests + doc updates + slash-command regens). Don't split.
- Children listed in `runlist:` are authoritative for order; use `dotmd runlist next clear-the-deck` to pick up.
- After each phase: `dotmd set archived <child>` (or `dotmd archive`), then immediately start the next.
- No interim prompts; no resume drops. Hub plan stays `in-session` until the whole runlist is archived.

## Stale-language note

Children F15/F17b/F17c reference the pre-0.45 command surface (`dotmd status`, `dotmd pickup`, `dotmd release`). Internal modules and tests still use those names — only the agent-facing strings were scrubbed. Implementations should target `dotmd set <status>` / `dotmd use` for new agent-visible output; back-compat dispatch in `bin/dotmd.mjs` for the old verbs stays untouched.

## Verify (whole runlist)

- All 5 GitHub releases published (0.45.2 through 0.49.0).
- `gh issue list --state open` returns empty.
- `dotmd plans --status active` returns empty.
- `npm test` clean on tip of main.

## Closeout

**Drained the deck in one session.** Five releases shipped:

| Phase | Child | Version | Notes |
|-------|-------|---------|-------|
| 1 | issue-13-archived-prompts-drift | **0.45.2** | `isArchivedPath` segment-check gates `next`/`use`/`--exclude-archived`; `runArchive` heals stuck frontmatter in place; validator emits inverse-drift error |
| 2 | issue-12-validator-ux | **0.45.3** (patch — most of the trio had already shipped between 0.39.9 and 0.45.x) | Did-you-mean on unknown surface; `next_step` cap raised 300 → 800 |
| 3 | die-self-correcting-hints | **0.46.0** | F17c — `findRepeatFailureHint` at CLI catch path, journal-driven template table with generic fallback |
| 4 | hud-reads-journal | **0.47.0** | F17b — previous-self / fleet / recent-rejections sections, silent-when-clean |
| 5 | filed-primitive | **0.48.0** (partial) | F15 — `filed: true` per-status filing primitive shipped; archive-sugar derivation deferred to a successor plan (would force every existing archive test to re-prove byte-identical behavior) |

Versions came in lower than the hub originally guessed (0.45.2 → 0.49.0) because Phase 2 collapsed to a patch. `gh issue list --state open` is empty; `npm test` is 1040/1040 on tip of main.

**Working rule that proved itself:** "one commit per phase, no checkpoint between phases" let the runlist drive itself end-to-end. The dotmd runlist primitive carried the order; closing each child with `dotmd set archived` (or `partial` for F15) auto-advanced the pickup.

**Carryover:** filed-archive-sugar plan to be filed if/when the dual-primitive seam shows pain.

(Add when complete: final version, total commit count, anything left over.)
