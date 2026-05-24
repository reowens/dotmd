---
type: prompt
status: archived
created: 2026-05-24T21:17:33Z
updated: 2026-05-24T22:08:42Z
dotmd_version: 0.32.0
context: "Audit Beyond Fixes"
related_plans:
---

Continue the Beyond-platform audit cycle. The audit doc `docs/audit-beyond-platform.md` carries 16 findings. F1–F3 (P1 correctness bugs) already shipped in the audit session itself — see § Verified impact for measured deltas (62% warning reduction, 58 false-broken edges fixed). F4–F16 remain. This prompt is the handoff for that work.

## State at handoff

**Shipped (commits e6e6456, 42f7aa5, a1391d9, 642b42a):**
- F1 — repo-relative ref resolution in `graph.mjs` + `lifecycle.mjs` (3 call sites)
- F2 — `validate.mjs` honors `skipWarningsFor` / `terminalStatuses` on Unknown surface / body link / ref-field error
- F3 — `Both module/modules` warning only fires on divergent values

**Not yet shipped:** F14, F15, F16 were written into the audit doc but no commit/code yet. Working tree clean as of the audit-doc commit. 808 tests passing.

**Not yet released:** Commits sit on `main`, 4 commits ahead of origin. CHANGELOG entry not written. Patch bump (0.32.1) is the right semver — three pure bug fixes, no API change.

## Priority order (revised after F14–F16 discussion)

The audit doc's original § Suggested fix order says "F4 next" — that's now stale. Revised order based on user pain framing in the audit session:

**Top of the queue — workflow-blocker for Beyond at scale:**
- **F16 — `dotmd modules` per-module digest + `dotmd module <name>` deep view + `dotmd stale --by module`.** User's direct framing: drowning in 222 non-archived plans, no triage ladder. Pure additive, view-only, no schema or migration risk. ~150 lines + tests. Probably highest-ROI item in the whole audit for day-to-day use. *Ship this first.*

**Cheap and scoped — pair with F16 if bandwidth allows:**
- **F14 — `shelved` prompt status.** One new status in prompt vocab, hidden from `hud`/`briefing`, excluded from `prompts next`. ~50 lines + 4 tests. Solves a real "next vs. parked" ambiguity for any user with >1 pending prompt.

**Load-bearing — needs a spike before committing:**
- **F15 — `filed: true` filing primitive** (with `archive: true` becoming sugar for `filed + terminal`). Untangles the conflation in the existing archive flag. Conceptually clean; backward-compatible. **But** before scoping the plan, do a /tmp/ spike: flip `backlog: { filed: true }` on a fixture mirroring Beyond's config shape (8 roots, custom statuses) and see what assumptions break. The audit doc identifies `liveTypeDirsForRoots` as the validator that needs to learn the abstraction; verify nothing else hardcodes "archived" specifically. ~80 lines core + ~50 for the optional `dotmd migrate --by-status` one-shot.

**Then the original polish ladder (F4–F13):**
- F4 — `dotmd doctor` mutation safety (dry-run preview default + confirm prompt). Behavior change — ask user about (a) hard breaking with major bump, (b) banner + soft confirmation with minor bump, (c) `--auto` opt-out + confirmation prompt with minor bump. Audit doc § F4 has the options.
- F5 — Glossary error message disambiguation. Smallest fix in the whole list. Pair with anything.
- F6 — `partial` status conflates plan-type + doc-type in stats. JSON shape change.
- F7, F9 — query / plans truncation indication ("results: 20 of 125").
- F8 — config-load warning for contradictory flags (`skipStale: true` + `staleDays: 60`).
- F10 — Briefing stale-tail cap.
- F11 — Lease-presence vs `in-session` status drift detection.
- F12 — `glossary --list` empty-state UX.
- F13 — Warning grouping/collapsing in `dotmd check` output.

## Suggested execution shape

Same pattern that drove 0.31.x and 0.32.0 patch releases:

1. **One plan per fix** under `docs/plans/` (`dotmd new plan fix-<short-slug>`). Don't bundle multiple findings into one plan — they fail and ship independently.
2. **4-test minimum** per fix (affected case + inverse + dry-run if applicable + JSON if applicable). The audit doc names specific regression test shapes for F14, F15, F16 — pre-written.
3. **Release cadence**: 2-4 fixes per release. Past pattern: `npm version patch` for bug-only releases; `minor` for features.
4. **F16 alone could be a minor bump** (three new commands). F14 alone is also minor (new status in default vocab). Group judgment call: F14+F16+F15 as 0.33.0, or split into two minor releases.

## Before releasing F1–F3

The four uncommitted commits on `main` need:
- A CHANGELOG entry (see CHANGELOG.md for the 0.31.x / 0.32.0 pattern — single bullet per fix, link to audit doc as the umbrella source). Commit the CHANGELOG before bumping.
- `npm version patch` → 0.32.1. No API change in F1–F3, patch is right.
- **Don't release without explicit user ask.** The user has been gating both pushes and npm publishes. Surface a "ready to ship 0.32.1, want me to bump?" before running `npm version`.

## F15 spike checklist (do before scoping the plan)

In a `/tmp/` fixture mirroring Beyond's config shape:
1. Set `backlog: { filed: true }`.
2. Create a backlog plan via `dotmd new plan foo` + flip status — does it land at `docs/plans/backlog/foo.md`?
3. Flip the plan to `active` — does it move to `docs/plans/active.md`? (It shouldn't — only filed statuses move. Active stays at root.)
4. Run `dotmd check` — does the archive-drift validator misfire? (`liveTypeDirsForRoots` in `src/validate.mjs` needs to learn `filed` dirs are buckets.)
5. Run `dotmd graph --json` — do refs to the backlog plan resolve correctly via F1's repo-root fallback? (Should — that's why F1 mattered.)

If any of those break in ways not covered by the audit doc § F15 "moving parts" list, expand the plan before implementing.

## Useful pointers

- Audit doc (`docs/audit-beyond-platform.md`) has location:line and proposed-fix specifics for every finding. Read § Verified impact + the F14/F15/F16 entries before scoping anything.
- Beyond's `dotmd.config.mjs` is the test artifact for custom-status edge cases (F4, F5, F6, F8, F15). When fixing, build fixtures in `/tmp/` mirroring its shape rather than mutating Beyond directly.
- `regenIndex(config)` exported from `src/lifecycle.mjs` — use from any new mutation path.
- `src/commands.mjs` is canonical CLI verb list — new verbs (F16's `modules`, `module`) go there + `bin/dotmd.mjs` HELP object + `src/completions.mjs`.
- Release flow: `npm version patch|minor|major` is one-shot. CHANGELOG entry as a separate commit *before* bumping. See commits `7cee0fd`, `42b4022`, `ca498fd` for the pattern.

## Expected deliverable for the next session

Minimum: F1–F3 released as 0.32.1 (CHANGELOG + version bump + push — gated on user ask).

Stretch: F16 implemented + plan archived. F16 alone could ship as 0.33.0 — it's the biggest day-to-day win.

Don't try to land F4–F15 in one session. Audit-cycle pattern is "one productive engine per session," not "audit-to-zero in one push." Pick the highest-leverage item, ship it, queue the rest forward.
