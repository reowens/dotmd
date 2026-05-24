---
type: prompt
status: pending
created: 2026-05-24T21:17:33Z
updated: 2026-05-24T21:17:33Z
dotmd_version: 0.32.0
context: "Audit Beyond Fixes"
related_plans:
---

Triage the remaining findings in `docs/audit-beyond-platform.md` from the Beyond-platform real-world audit (the third in a series — self-dogfood landed in 0.31.x, gmax-brownfield in 0.32.0). Beyond is a 1,182-doc, 8-root, heavily-customized production user, so this audit hit corners the other two missed.

## Status: F1–F3 already shipped in the audit session

The P1 fixes were implemented + tested in the same session as the audit (see `docs/audit-beyond-platform.md` § Verified impact). Working-tree changes are uncommitted as of this prompt:

- **F1** (3 call sites: `src/graph.mjs:63`, `src/lifecycle.mjs:724`, `:735`) — all swapped to `resolveRefPath(...) ?? path.resolve(docDir, relPath)`. Beyond: graph broken edges 62 → 4 (the 4 remaining are genuine).
- **F2** (3 sites in `src/validate.mjs`: Unknown surface, body link, ref-field error) — gated on `skipWarningsFor` (and `terminalStatuses` for the ref-field error level). Beyond: ~46 archived-noise warnings eliminated.
- **F3** (`validate.mjs:278-289`) — divergence-only logic. Beyond: 91 → 3 `module` warnings; 14 → 4 `surface` warnings.

Tests added: `test/graph.test.mjs` (1), `test/lifecycle.test.mjs` (2), `test/validate.test.mjs` (5), `test/plan-shape-lint.test.mjs` (4 replacing 2). Full suite: 808 pass / 0 fail.

**Next session: commit, CHANGELOG, then release.** Suggested commit sequencing (each isolated for easier revert):
1. F1 production + tests
2. F2 production + tests
3. F3 production + tests
4. CHANGELOG entry covering all three under one bullet group
5. `npm version patch` (correctness bugs only, no API change → patch is right) — releases as 0.32.1

If user prefers, F1+F2+F3 + CHANGELOG could be a single commit before bumping. The 4-commit shape is easier to bisect if a release ever surprises; the 1-commit shape is faster.

## Remaining findings (F4–F13) — scope of this prompt

## Suggested execution shape

Same pattern that drove 0.31.x and 0.32.0:
1. Spawn one plan per fix under `docs/plans/` (`dotmd new plan fix-<short-slug>`). Don't bundle multiple findings into one plan — they fail and ship independently.
2. 4-test minimum per fix (affected case + inverse + dry-run if applicable + JSON if applicable).
3. Release cadence: bundle 2-4 fixes per release.

## Polish release candidates — group however
- F5 — Glossary error message disambiguation. Smallest fix; pair with anything.
- F6 — `dotmd doctor` dry-run default + confirmation prompt. **Behavior change** — needs care. See note below.
- F7 — Truncation indication on `query`/`plans` count. F9 is the same bug.
- F8 — `partial` status type-confusion in stats. Schema change to JSON shape — version bump signal.
- F10 — Briefing stale-tail cap.
- F11 — Lease-presence vs `in-session` status drift detection. New validator.
- F12 — `glossary --list` empty-state UX.
- F13 — Warning grouping/collapsing in `dotmd check` output. Pair with F3 — they overlap.

**Config diagnostic — separate plan:**
- F8 — contradictory flag detection (`staleDays + skipStale`). Lives in `src/statuses.mjs`; add a `dotmd doctor --statuses` enhancement.

## F4 (doctor mutation safety) — handle with care

The audit caught doctor mutating beyond's repo unexpectedly. The fix proposed is to default doctor to dry-run + require `--apply`. **This is a breaking change** for anyone relying on `dotmd doctor` in scripts/CI. Options:

(a) Hard breaking: `dotmd doctor` → dry-run preview by default; `--apply` mutates. Bump major.
(b) Soft transition: keep current behavior, add giant startup banner + 3-second confirmation timeout. Bump minor.
(c) Add `--auto` for the current behavior, keep default mutating but introduce confirmation prompt that scripts can `yes |` past. Bump minor.

User preference unknown. Ask before implementing — same pattern as the 0.31.x audit where I gated destructive defaults on user judgment.

The "doctor stopped after step 1" sub-finding is unverified. Worth one isolated reproduction (`time -p dotmd doctor --dry-run` against a beyond worktree) before assuming there's a bug there vs. just nothing to do for steps 2-5.

## Useful pointers

- The audit doc has location:line and proposed-fix specifics for every finding — read it before scoping individual plans, it'll save discovery time.
- Beyond's `dotmd.config.mjs` is the test artifact for the custom-status edge cases (F2, F3, F5, F8). When fixing, build a fixture in `/tmp/` mirroring beyond's config shape (8 roots, custom statuses with `quiet`/`skipStale`/`skipWarnings`/`requiresModule` flags, custom plan template that emits both singular+plural fields, `glossary.path` pointing to a file with no matching section heading).
- `regenIndex(config)` exported from `src/lifecycle.mjs` — use from any new mutation path.
- Release flow: `npm version patch|minor|major` is the one-shot. Don't manually push/tag/publish. CHANGELOG entry as a separate commit before bumping, see `7cee0fd` for the pattern.
- Don't release without explicit user ask. The user has been gating both pushes and npm publishes. Surfacing PRs/branches for review is the better default — let them decide cadence.
- 4-test minimum per fix (affected case + inverse + dry-run + JSON). See `test/init.test.mjs` ('scaffolds .claude/commands on fresh init with no pre-existing config') for the style.

## Expected deliverable

Patch release containing F1, F2, F3 fixes (call it 0.32.1 or 0.33.0 depending on whether F3's warning-count change feels semver-minor). Each fix is one plan, ~30-50 lines of diff, with regression tests. Bundle into one CHANGELOG entry under the release.

Don't tackle F4-F13 in the same session — surface the patch fixes first, then ask user which polish items to prioritize next. The audit-cycle pattern is "one productive engine per session," not "audit-to-zero in one push."

