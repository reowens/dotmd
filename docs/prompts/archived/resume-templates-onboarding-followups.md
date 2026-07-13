---
type: prompt
status: archived
created: 2026-06-28T23:14:18Z
updated: 2026-06-28T23:38:31Z
dotmd_version: 0.63.0
context: "Resume Templates Onboarding Followups"
related_plans:
---

# Resume: dotmd templates + onboarding follow-ups

Continuing work in the **dotmd** repo (`tools/dotmd`). Start with `dotmd briefing`.

## Where things stand

Four commits are on `main` **unpushed**, deliberately held to batch into one
`npm version minor` later (user's call). Plus released `0.63.0` (archival
inbound-link fix) is already out.

Unpushed, in order:
- `6487279` land onboarding-audit plan
- `04ec581` fix onboarding finding #1 (brownfield staleDays noise)
- `f3d3bf3` scope templates plan
- `c8a2a6a` feat: runlist/coordination scaffolding in `dotmd new`

## Two live plans (both `active`)

1. **`docs/plans/template-scaffolding-improvements.md`** — next_step is **#2**.
   - #1 (runlist/coordination scaffolding) ✅ shipped: `dotmd new plan <hub>
     --runlist a,b,c` and `--coordination`.
   - #2 **sample content** — author a worked runlist example in SKILL.md/README;
     decide whether to add an opt-in `dotmd init --with-examples`. Do NOT commit a
     live sample plan into this repo's `docs/plans/` (pollutes real `dotmd plans`).
   - #3 **template polish** — `--lite` plan variant + an audit/findings variant.
   - Deferred follow-up from #1: pointing a runlist hub at an *existing* plan
     (needs hub-relative ref resolution) is currently a hand-edit, not scaffolded.

2. **`docs/plans/improve-onboarding-brownfield-plugin.md`** — next_step is **#2**.
   - #1 (brownfield staleDays warning) ✅ shipped. #2–#5 remain: surface `dotmd
     update` (#2), gate the plugin hint on `~/.claude` (#3), devDep plugin path
     (#4), small ones (#5).

## Shared-tree caveats (important)

- This working tree is shared with concurrent sessions. **Commit only your own
  files** (explicit `git add <paths>`), never `git add -A`. Untracked files like
  `docs/plans/dotmd-review-findings-followups.md` and the `docs/archived/`,
  `docs/prompts/archived/` strays belong to other sessions — leave them.
- `git stash` is blocked by a hook (shared tree). 
- `docs/docs.md` is the generated index; it's often dirty from another session.
  A release needs `npm version minor --force` to get past npm's clean-tree check
  (the version script regenerates + `git add`s docs.md by design). Verify the
  staging area is empty first so the version commit doesn't sweep in stray work.

## Suggested next

Pick #2 or #3 of the templates plan (user was deciding), or cut the batched
minor release if they want #1 + onboarding-#1 out now.

