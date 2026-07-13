---
type: prompt
status: archived
created: 2026-06-29T06:07:43Z
updated: 2026-06-29T06:36:35Z
dotmd_version: 0.64.2
context: "Resume Dotmd Roadmap"
related_plans:
---

# Resume: kick off the dotmd forward roadmap

Continuing in the **dotmd** repo (`tools/dotmd`). Start with `dotmd briefing`, then
`dotmd runlists` — there's a coordination hub waiting.

## What this is

A 3-researcher forward audit (2026-06-29) charted dotmd's path post-0.64.2 and the
roadmap is already scaffolded as plans. The read: the core is **mature** and the
project deliberately declines speculative features, so the path forward is narrow
and opinionated — harden where it silently breaks, finish the one half-built
feature (runlists), and dogfood drift-detection on dotmd's own plugin.

**Coordination hub: `docs/plans/dotmd-forward.md`** (`execution_mode: coordination`,
pinned in `dotmd runlists`, held out of the active count). Its `## Ranked queue`
points at three pickup-able child tracks in recommended (not gated) order:

1. **`dotmd-durability-debt.md`** (active) ← **start here.** Silent-correctness debt:
   CRLF/Windows frontmatter blindness (`src/frontmatter.mjs` fence detection is
   LF-only → a CRLF doc reads as having *no* frontmatter), POSIX-only guard
   (`src/guard.mjs`), and **untested frontmatter-mutating modules**
   (`src/frontmatter-fix.mjs` 193 LOC with zero coverage; `src/use.mjs` no direct
   test). This is the one track that jumps dotmd's usual "wait for a real ask" queue
   — it's risk, not enhancement. **Order: tests first (Finding #3) to lock current
   behavior, then the CRLF fix, then the guard.** Open question in the plan: *does
   Windows actually matter to the user base?* — if not, #1/#2 drop but the tests
   stand. Resolve that before sinking time into CRLF.
2. **`dotmd-runlist-mutation.md`** (planned) — runlists are read-only; add/reorder
   children = hand-editing the `runlist:` array (contradicts dotmd's own ethos).
   5 phases: `runlist add` → remove/reorder → hub→existing-plan refs → Item D pin →
   status rollup.
3. **`dotmd-plugin-skill-drift.md`** (planned) — SKILL.md⇄CLAUDE.md drift guard +
   extend self-heal to `.claude/skills/` (now that dotmd ships skills). Small,
   on-identity, can interleave.
4. **`dotmd-roadmap-layer.md`** (queued-after #2) — **don't build yet.** A *roadmap*
   tier above runlists, organized by time/priority horizon (now/next/later) — the
   shape this very hub had to improvise. Gated behind the runlist-mutation work
   (composing runlists needs them first-class + mutable first). When picked up,
   start with Phase 0: the earn-its-keep ruling (thin preset on the coordination
   hub vs. a real third-tier primitive).

To start Track 1: `dotmd use docs/plans/dotmd-durability-debt.md` (marks in-session
+ prints the card), then read the ranked findings. Or `dotmd runlist next
docs/plans/dotmd-forward.md` to pick up the first non-archived child.

The hub's **"Deliberately dormant"** section lists the parked-but-real ideas (thin
AI leg, surfaces-has-no-CRUD vs statuses, plans-only analytics, a pre-1.0
deprecation-shedding milestone, the `bin/dotmd.mjs` monolith split) — pull any only
on a real ask.

## First: reconcile the working tree (this is unfinished)

The roadmap was created but **not committed**, and there's a prior commit that was
never pushed. Before starting Track 1, decide with the user whether to land this:

- 4 **untracked** roadmap plans: `docs/plans/dotmd-{forward,durability-debt,
  runlist-mutation,plugin-skill-drift}.md` (validate clean — `dotmd check` = 0/0).
- One **unpushed local commit**: `47a5593` (docs: Closeout section on the archived
  onboarding plan) — `main` is 1 ahead of `origin`.
- `docs/docs.md` is dirty from the index regen.

## Shared-tree caveats (still apply)

- Working tree is shared with concurrent sessions. **Commit only your own files**
  (explicit `git add <paths>`), never `git add -A`. Untracked strays under
  `docs/archived/` and `docs/prompts/archived/` belong to other sessions — leave them.
- `git stash` is blocked by a hook.
- `docs/docs.md` is the generated index; **don't commit it standalone**. The release
  path is `npm version patch --force` (the dirty tree needs `--force`; the version
  script regenerates the index + plugin version files and `git add`s only specific
  paths — NOT `-A`, so strays stay safe). Verify the staging area is empty first.

