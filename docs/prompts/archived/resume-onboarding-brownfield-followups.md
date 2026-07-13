---
type: prompt
status: archived
created: 2026-06-29T02:35:04Z
updated: 2026-06-29T02:42:02Z
dotmd_version: 0.64.1
context: "Resume Onboarding Brownfield Followups"
related_plans:
---

# Resume: dotmd onboarding follow-ups

Continuing in the **dotmd** repo (`tools/dotmd`). Start with `dotmd briefing`.

## Just shipped (v0.64.1 — released, pushed, npm-published)

The **template-scaffolding-improvements** plan is FULLY DONE + archived:
- #1 runlist/coordination scaffolding (`dotmd new plan <hub> --runlist a,b,c` / `--coordination`)
- #2a worked runlist example in README + plugin SKILL.md; #2b `dotmd init --with-examples` deliberately declined (docs example covers onboarding without a live sample plan)
- #3 `--lite`/`--minimal` and `--audit`/`--findings` plan body variants on `dotmd new plan`

Tree is clean and `origin/main` is in sync — nothing unpushed. (Note: 0.64.1 was
cut as a *patch* even though it added a feature — user's explicit call.)

Deferred follow-up captured in that plan's closeout (only spin a fresh plan if
wanted): pointing a runlist hub at an *existing* plan needs hub-relative ref
resolution — currently a hand-edit.

## The one live plan — pick this up

**`docs/plans/improve-onboarding-brownfield-plugin.md`** (status: active). Start with
`dotmd use docs/plans/improve-onboarding-brownfield-plugin.md` (marks in-session + prints the card).

next_step is **Finding #2**:
- #1 (brownfield staleDays warning) — already shipped.
- **#2** — surface `dotmd update`: add it to the `help all` Setup section + a README
  subsection under Install; change the postinstall nudge to suggest `dotmd update --plugin-only`.
- #3 — gate the plugin hint on `~/.claude` existing.
- #4 — devDep plugin path.
- #5 — small ones.

Read the plan body for the full ranked findings before starting.

## Shared-tree caveats (still apply)

- Working tree is shared with concurrent sessions. **Commit only your own files**
  (explicit `git add <paths>`), never `git add -A`. Untracked strays under
  `docs/archived/` and `docs/prompts/archived/` belong to other sessions — leave them.
- `git stash` is blocked by a hook (shared tree).
- `docs/docs.md` is the generated index; often dirty from another session — **don't
  commit it** standalone. The release path is `npm version patch --force` (the dirty
  tree needs `--force`; the `version` script regenerates the index + plugin version
  files and `git add`s only specific paths — `docs/docs.md plugins .claude-plugin
  .claude/commands` — NOT `-A`, so strays stay safe). Verify the staging area is empty
  first so the version commit doesn't sweep stray work.

## Suggested next

Take onboarding #2 (surface `dotmd update`), or batch #2–#5 into one pass. Each
finding is independently shippable.

