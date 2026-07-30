---
type: plan
status: active
created: 2026-07-28T15:25:48Z
updated: 2026-07-29
surfaces:
modules:
domain: dev
audience: internal
parent_plan:
related_plans:
related_docs:
current_state: "dotmd is being renamed to runlist. Owner-ratified 2026-07-28. The npm name and runlist.dev are both claimed and verified; nothing in this repo is renamed yet. This file is a pointer only — the full plan, clearance evidence, migration strategy and the state-directory scope pass all live in the beyond/platform repo and are deliberately not restated here."
next_step: >
  Read `docs/plans/dotmd-rename-runlist.md` in the **beyond/platform** repo before
  touching anything here. Next work is the rename inside this repo, gated on two
  owner answers recorded in that plan's § Open questions.
---

# dotmd → runlist

> This tool is being renamed. Everything about that decision lives in one place, and it is not this file.

## Where the plan is

**`docs/plans/dotmd-rename-runlist.md` in the `beyond/platform` repo.**

That document owns: the decision and who made it, the trademark and registry clearance with methods, the rejected candidates and why each failed, the measured blast radius, the user-migration strategy, and the read-only scope pass on the state-directory migration.

**None of it is repeated here on purpose.** A second copy is how a correction reaches one document and never the other — the failure this project's own tooling exists to catch. If you need a fact about the rename, open that file.

## The only things this repo needs to know

- **Ratified 2026-07-28.** The name is `runlist`.
- **`runlist` on npm and `runlist.dev` are claimed** — both verified at the registry. Nothing here is renamed yet.
- **Nothing in this repo changes until two owner questions are answered** (recorded in the platform plan): whether the `.dotmd-*` artifact prefix follows the product name, and whether an old build must keep working against a migrated repo.

## Why the name is changing

`dotmd` is generic and keeps being independently reinvented — 60 GitHub repos carry it, three pushed within a week of the decision, and the most visible one has more stars than this repo while doing an adjacent thing. The suffix on the published package was a symptom, not the problem.

It also undersells the tool: this is plan lifecycle, ranked queues, index generation, reference integrity and session handoff. Markdown is the storage format, which is the least interesting thing about it.

## What will hurt, in this repo specifically

Not the string replacement. **The `.dotmd-*` prefix on artifacts written beside the files they guard** — temp files, recovery artifacts, transaction markers, prepared git-index files. Three validators string-match that prefix and throw on mismatch, so the writer, the validator and the recovery reader have to move together, and a new build must still recognise artifacts an old build wrote.

The state directory itself is the easy half: it is gitignored, so no user's repository needs migrating, and ownership records are keyed by the plan's own path rather than by anything under `.dotmd/`, so a directory move invalidates none of them.

## Open

> Filed as `runlist-rename.md`, not `rename-to-runlist.md`: a `*-runlist` slug is dotmd's fallback signal for a coordination hub, so the old name made this leaf pointer read as a navigation map and dropped it out of the live-plan count. Don't rename it back.

- [ ] Owner answers the two questions above.
- [ ] Rename inside this repo — package, bin, config filenames, env vars, completions, plugin surface.
- [ ] State migration, per the scope pass in the platform plan.
