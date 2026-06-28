---
type: plan
status: active
created: 2026-06-28T22:53:06Z
updated: 2026-06-28T22:53:06Z
surfaces:
modules:
domain:
audience: internal
parent_plan:
related_plans:
related_docs:
current_state: Scoped, not started. Eval of dotmd's templates surfaced three workstreams: (1) no runlist/coordination-hub scaffolding, (2) no worked sample plan/runlist anywhere, (3) the plan template is strong but heavy. This plan ranks them so we can pick what to take.
next_step: Decide which item(s) to take. Recommended order: #1 runlist scaffolding (biggest gap) → #2 sample content → #3 template polish. Each item is independently shippable.
---

# Template & Scaffolding Improvements (Runlists, Samples, Polish)

> One-paragraph problem statement: dotmd heavily promotes runlists and
> coordination hubs in the README/CLAUDE.md/SKILL.md, but `dotmd new` can't
> scaffold them, there's no worked example of either anywhere, and the plan
> template — while solid — is heavy for small plans. This plan scopes the three
> workstreams so we can decide what to take.

## Problem

A walk-through of the template surface (`src/new.mjs` `BUILTIN_TEMPLATES`,
`dotmd new --list-templates`, the example config's `templates` section, and the
plugin SKILL.md) found the scaffolding lags the feature set: the shapes the docs
push hardest (runlists, coordination hubs) are exactly the ones the tool won't
generate, and a newcomer has no end-to-end example to copy.

## What already works (do not regress)

- The `plan` template is genuinely good: Problem → Goals → Non-Goals → What
  Exists Today → Constraints → Decisions → Open Questions → Phases (with a
  ⬜🟡✅⏭🚧 status-marker legend) → Deferred → Version History → Closeout.
- `doc` and `prompt` templates; `--list-templates`; custom templates via config
  `templates`; body-input merge (`@path`/stdin/`--message`/inline) with the
  full-body shortcut that honors a user-authored `## Section` body.

## Items (ranked)

### 1. No runlist / coordination-hub scaffolding [highest value — biggest gap]

`dotmd new` only knows `plan`/`doc`/`prompt`. Runlist hubs (`runlist: [...]`) and
coordination hubs (`execution_mode: coordination` + a `## Ranked queue` table)
are hand-authored every time, despite being first-class in `dotmd runlist` /
`dotmd runlists` / plans-folding / health.

Proposed:
- Sprint hub: scaffold a plan carrying a `runlist:` array. Shape TBD —
  `dotmd new plan X --runlist a,b,c` (flag on `new plan`) vs a `dotmd new
  runlist X` pseudo-type. Flag is lighter; pseudo-type reads better in
  `--list-templates`.
- Optionally also scaffold the child plan stubs (`NN-slug.md`) with
  `parent_plan:` back-refs to the hub — `dotmd doctor` already warns when a
  child omits the back-ref, so generating them correct-by-construction is a win.
- Coordination hub: a `--coordination` variant emitting `execution_mode:
  coordination`, a `## Ranked queue` table skeleton, and `related_plans:`.

Open questions:
- Flag vs pseudo-type (affects `--list-templates`, help, and config `templates`).
- Auto-generate children, or hub only? (Auto-gen is powerful but opinionated.)
- Child naming convention (`NN-slug`) — enforce or suggest?

Effort: medium. Touches `src/new.mjs` (template + arg parsing), help text in
`bin/dotmd.mjs`, the plugin SKILL.md, and tests.

### 2. No worked sample plan / sample runlist anywhere [onboarding win]

Nothing in the repo, plugin, or `init` shows a filled-in plan or a runlist hub +
children end-to-end. SKILL.md names the runlist commands but shows no example.

Options (pick one or more — they're not exclusive):
- (a) Docs example [lowest risk]: a worked runlist hub + children in SKILL.md
  and/or README. Pure prose, no live docs to clean up.
- (b) `dotmd init --with-examples` [opt-in]: scaffold a sample plan + a 3-child
  sample runlist under `docs/plans/`. Must be opt-in and trivially removable —
  otherwise it pollutes a real repo's `dotmd plans` output.
- (c) Golden test fixture: a sample plan/runlist used by tests and linkable from
  docs, so the example can't rot.

Recommendation: ship (a) regardless; consider (b) gated behind the flag. Do NOT
commit a live sample plan into this repo's `docs/plans/` — it would show up in
real `dotmd plans` / briefing output (dogfooding pollution).

Open question: where do samples live, and do we want `init` scaffolding at all?

### 3. Plan template is strong but heavy [polish, low priority]

The default plan scaffold emits ~9 empty sections. Great for a real execution
plan; overkill for a quick one, and it doesn't match the "Findings (ranked)"
shape that audit-style plans (e.g. the onboarding plan) actually use.

Candidate tweaks:
- A `--lite`/`--minimal` plan variant (Problem → Phases → Version History).
- An audit/findings template variant (Problem → Findings (ranked) → Suggested
  order → Open Questions), since that shape recurs.
- Leave the doc/prompt templates as-is (they're fine).

Effort: low–medium — mostly template text plus a flag. Independent of #1/#2.

## Suggested order

1 (runlist scaffolding — the gap the docs feel hardest), then 2 (sample content,
which is easier to author once #1 exists to generate from), then 3 (polish,
independent and lowest priority). Each is independently shippable; take any
subset.

## Open Questions

- Is the goal CLI scaffolding (`dotmd new …`), docs/examples, or both?
- Should runlist scaffolding auto-generate child stubs or just the hub?
- Where should sample content live so it helps newcomers without polluting this
  repo's own dogfooded plan list?

## Version History

- **2026-06-28** Created from a templates/scaffolding eval. Three ranked items;
  awaiting a decision on which to take.

## Closeout

<!-- Filled on archive: what shipped, key commits, deferrals dispositioned. -->
