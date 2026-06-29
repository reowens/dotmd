---
type: plan
status: archived
created: 2026-06-28T22:49:37Z
updated: 2026-06-29T00:48:27Z
surfaces:
modules:
domain:
audience: internal
parent_plan:
related_plans:
related_docs:
current_state: All 5 phases shipped. P1 dispatcher/filter correctness. P2 plugin files in both release paths. P3 custom archive-status preservation + moved-file ref rewriting. P4 onboarding (global-only hook decision, sharper README/init/postinstall guidance). P5 completion/help drift (completions now derive from KNOWN_COMMANDS + drift test; surfaces added; stale frontmatter-fix caps and prompt-status help fixed; example config gained held/shelved). All 3 open questions resolved. Full suite 1182/1182 green; dotmd check clean (1 pre-existing unrelated timestamp warning). Nothing committed yet.
next_step: Review the diff and decide whether to commit/release; then archive this plan.
summary: Track and fix the review findings from the dotmd tool audit: dispatcher flag handling, filtered JSON consistency, plugin release packaging, lifecycle edge cases, onboarding, completions, and help drift.
---

# Dotmd Review Findings Followups

> Follow-up plan for the dotmd tool review findings captured on 2026-06-28.

## Problem

The dotmd CLI is broadly healthy, but the review found several issues that make it less reliable and less useful in agent workflows:

- Global flags are documented as global, but `dotmd --config dotmd.config.mjs list` dispatches `--config` as the command.
- Global `--type` and `--root` filtering is applied inconsistently across early-dispatched commands, and JSON metadata can report unfiltered counts.
- Release tooling still references retired `.claude/commands/` artifacts and can skip first-class plugin files.
- Custom archive statuses are normalized by config but archived via code that hard-codes `archived`.
- Archive/filing moves do not rewrite every outbound reference shape from the moved file.
- Plugin onboarding can silently no-op when users only install the CLI as a project devDependency.
- Shell completions and help text drifted from the live command surface.

## Goals

- Make documented global flags work before or after the command.
- Make `--root` and `--type` filters behave consistently across text and JSON outputs.
- Ensure plugin files are included in release workflows and stale retired scaffolding references are removed.
- Preserve custom archive status semantics when `archive: true` statuses are configured.
- Rewrite moved-file outbound refs for common frontmatter and body-link forms.
- Improve plugin install guidance for devDependency/global install mismatches.
- Bring completions, help, README, and example config back in sync.

## Non-Goals

- Redesigning the status model.
- Replacing the plugin packaging model.
- Adding new dependencies for CLI parsing or YAML handling unless a fix is not practical without them.
- Changing persisted document layouts beyond the specific ref-rewrite fixes.

## What Exists Today

- `npm test` passes with 1150 tests.
- `dotmd check --verbose` passes with one warning in `docs/plans/improve-onboarding-brownfield-plugin.md` for a missing summary/blockquote fallback.
- Local CLI is `0.63.0`; installed Claude Code plugin reported as `0.61.0` via `dotmd update --check`.
- The workspace already has untracked docs/prompts unrelated to this plan.

## Constraints

- Keep fixes small and covered by focused regression tests.
- Preserve existing command behavior unless it conflicts with documented behavior.
- Do not stage unrelated untracked docs or prompt archives when testing release tooling.
- Maintain the plugin-first agent workflow documented in `plugins/dotmd/skills/dotmd/SKILL.md`.

## Decisions

- Fix dispatcher/global flag correctness before UX polish, because the filter-passthrough half is inherited by multiple commands. (The pre-command `--config` parse is an isolated, smaller fix — it errors loudly rather than misbehaving silently, so it doesn't drive priority on its own.)
- Prioritize the two *silent* defects highest within their phases: custom archive-status → `archived` rewrite (Phase 3) and dropped `--root`/`--type` on early-dispatched commands like `plans` (Phase 1). Silent wrong behavior beats loud errors for user impact.
- `dotmd set <archive-status>` preserves the exact target status for configured `archive: true` statuses (resolves the first Open Question — see Phase 3). Configs are NOT required to name their archive status `archived`.
- Treat plugin files as release artifacts now that plugin-based workflow is canonical.
- Keep `dotmd new plan` output shape as the standard for this plan rather than hand-authoring the final file.

## Open Questions

- ~~Should `dotmd set <archive-status>` preserve the exact target status for every archive status, or should configs be required to name the archive status `archived`?~~ **Resolved:** preserve the exact target status (see Decisions / Phase 3).
- ~~Should `dotmd-hook` fall back to `./node_modules/.bin/dotmd`, or should plugin docs require global install only?~~ **Resolved (user decision):** global install only — no node_modules fallback (avoids fragile cwd-relative resolution; matches the consistent global-install messaging). Docs/guidance sharpened instead.
- ~~Should `countsByType` remain in compact agent JSON after filters, or should output carry both filtered and corpus-wide counts explicitly?~~ **Resolved (Phase 1):** keep `countsByType`, but recompute it to reflect the active filter — consistent with `countsByStatus`. No separate corpus-wide tally.

## Phases

### Phase 1 - Dispatcher And Filter Correctness ✅

- Support global flags before the command, including `--config`, `--root`, `--type`, `--dry-run`, `--verbose`, and `--help` where appropriate.
- Apply root/type filtering before early-dispatched commands or pass filters through consistently.
- Recompute `countsByType` whenever filtered index docs are mutated (`applyIndexFilters` in `bin/dotmd.mjs` recomputes `countsByStatus` only; `buildCompactAgentContext` then returns the stale corpus-wide `countsByType`).
- Ensure JSON filter metadata reflects global filters when results are narrowed.
- Drop the dead empty `if (rootFilter || typeFilter) {}` block adjacent to `applyIndexFilters` while in there.
- Add tests for:
  - `dotmd --config dotmd.config.mjs list`
  - `dotmd query --type doc --json`
  - `dotmd agent-context --type prompt`
  - early-dispatched commands such as `plans`, `runlists`, and presets with root/type filters.

### Phase 2 - Release And Plugin Packaging ✅

Two release paths exist and must both cover plugin files:

- **`npm version` (the documented path, per CLAUDE.md)** — `package.json`'s `version` script already does `git add … plugins/dotmd/.claude-plugin/plugin.json .claude-plugin/marketplace.json docs/docs.md .claude/commands`. That stages the two version-stamped manifests but **not** the substantive plugin content. Add the files that actually change between releases: `plugins/dotmd/skills/dotmd/SKILL.md`, `plugins/dotmd/commands/*.md`, and `plugins/dotmd/hooks/*`. This is the real gap — editing SKILL.md and releasing currently leaves it unstaged.
- **`dotmd ship` (secondary path)** — update `ALLOWLIST_PATTERNS` in `src/ship.mjs` to include `plugins/dotmd/**` and `.claude-plugin/**`.
- Remove retired `.claude/commands/` regeneration claims from `ship` help (steps 1–2 still narrate the dropped scaffolding). Decide whether `.claude/commands/` stays in the allowlist at all (harmless if hand-authored files exist, but contradicts the retirement comment in `src/ship.mjs`).
- Add or update dry-run tests showing plugin changes are staged and unrelated files remain skipped — for both paths.

### Phase 3 - Lifecycle Edge Cases ✅

- **Archive-status semantics (recommended default below).** Preserve the *exact target status* when it's a configured `archive: true` status — write `newStatus`, not a hard-coded `'archived'`. Today `runSet` routes archive-statuses into `runArchive` (`src/lifecycle.mjs:613-617`), which hard-codes `status: 'archived'` (`533`). The **heal branch** (`475`, for files already under `archived/` with status drift) hard-codes it too — fix both, or a custom-status config silently loses the status on both paths.
- Add regression coverage for `dotmd set done <plan>` in a config where `done` is the archive status (assert frontmatter stays `done`, not `archived`).
- Expand moved-file outbound ref rewriting (`updateRefsFromMovedFile`, `src/lifecycle.mjs:837`) for inline scalar frontmatter refs (`parent_plan: hub.md` — current regex only matches block-sequence list items), quoted refs, flow-array-like refs where supported, and body links with anchors (`hub.md#section` — current regex requires the href to end in `.md`).
- Add tests that archive/file a plan with `parent_plan: hub.md` and `[hub](hub.md#section)` and verify `dotmd check` stays clean.

### Phase 4 - Onboarding And Agent UX ✅

- Decide whether plugin hooks should fall back to local `node_modules/.bin/dotmd`.
- If not, make the global-install requirement more prominent in README/plugin install guidance.
- Surface `dotmd update --plugin-only` where appropriate after global CLI installs.
- Ensure `dotmd init` plugin guidance appears for likely Claude Code users even when no project `.claude/` directory exists.

### Phase 5 - Completion And Help Drift ✅

- **Make `KNOWN_COMMANDS` authoritative first.** It is itself incomplete: missing `surfaces` (a real command dispatched in `bin/dotmd.mjs`) and the legacy aliases (`pickup`/`unpickup`/`release`/`finish`/`handoff`, `prompt`). A drift test wired to today's list would pass while completions still omit `surfaces`. Add the missing verbs (decide whether legacy aliases belong in completions).
- Reuse `KNOWN_COMMANDS` for generated completions or add a drift test (`src/completions.mjs` `COMMANDS` is missing ~14 live verbs: `use`, `baton`, `prompts`, `ship`, `modules`, `module`, `statuses`, `agent-context`, `hud`, `guard`, `update`, `misuse`, `next`, `bulk-tag`).
- Refresh command flags in `src/completions.mjs` for current commands and remove obsolete flags.
- Update stale help for `doctor --frontmatter-fix` caps, prompt statuses, and `ship` release flow.
- Update `dotmd.config.example.mjs` prompt rich-form statuses to include `held` and `shelved`.

## Deferred

- Larger CLI parser refactor if a minimal dispatcher normalization solves the global flag bug.
- Any broader schema migration for old docs beyond targeted warning cleanup.

## Version History

- **2026-06-29T00:48:27Z** Archived — All 5 phases shipped in v0.64.0.
- **2026-06-28T23:07:47Z** Status: active → in-session.
- **2026-06-28** Created from dotmd review findings.
- **2026-06-28** Review pass: verified all findings against the code (two empirically). Sharpened Phase 2 (npm version is the real release path; names SKILL.md/commands/hooks gaps), Phase 3 (heal branch also hard-codes `archived`; cited regex limits + line refs), Phase 5 (KNOWN_COMMANDS itself missing `surfaces`/aliases). Resolved the archive-status Open Question (preserve target status). Added severity framing + dead-code cleanup.
- **2026-06-28** Phase 1 shipped. Normalized global-flag parsing in `bin/dotmd.mjs` (command is now the first non-global token, so `--config`/`--type`/`--root`/`--dry-run`/`--verbose` work before or after the command); hoisted `applyIndexFilters` and applied it in the preset/`plans`/`runlists` early branches; recompute `countsByType` (not just `countsByStatus`) on filter; thread `--type`/`--root` into `runQuery`'s JSON filter echo; removed the dead empty `if` block; `watch` re-injects globals to its child. Added `test/dispatch-global-flags.test.mjs` (11 tests). `npm test` 1171/1171, `dotmd check` clean (1 pre-existing unrelated warning).
- **2026-06-28** Phase 5 shipped. Added `surfaces` to `KNOWN_COMMANDS` (was missing — fixes the unknown-command suggester + self-check). `src/completions.mjs` now derives its command list from `KNOWN_COMMANDS` (minus an internal denylist) so it can't drift, and refreshed per-command flags (added `use`/`baton`/`prompts`/`ship`/`modules`/`module`/`surfaces`/`statuses`/`agent-context`/`update`/`misuse` etc.). Added a completions drift test asserting every `KNOWN_COMMANDS` verb appears in both bash + zsh output. Fixed stale help: `doctor --frontmatter-fix` caps (500/300→1500/800, targets 300/200→1200/600) and `dotmd new` prompt-status list (added held/shelved). `dotmd.config.example.mjs` prompt rich-form gained `held` + `shelved`. `npm test` 1182/1182.
- **2026-06-28** Phase 4 shipped. Resolved the `dotmd-hook` fallback open question — global-install only (user decision); left the hook PATH-only. `README.md` gained an explicit "the plugin requires a global CLI install; a devDependency silently no-ops the hooks" callout. `src/init.mjs` now shows the plugin nudge for likely Claude Code users (project `.claude/` OR user-global `~/.claude/`) instead of only when a project `.claude/` exists, and the nudge calls out the global-install requirement. `scripts/postinstall.mjs` points at `dotmd update --plugin-only` (gated on `claude` being present). Added 2 init tests. Separately fixed a pre-existing date-drift flake: `test/runlist.test.mjs` `setupSprint` used hard-coded dates whose rendered `Nd` ages only matched on 2026-06-28 — now derived relative to today via `daysAgoDate`. `npm test` 1180/1180.
- **2026-06-28** Phase 3 shipped. `runArchive` now computes `targetStatus` (`opts.archiveStatus` → canonical `archived` → config's first archive status) and uses it in both the move path and the in-place heal branch instead of hard-coding `'archived'`; `runSet` threads the requested archive status through so `dotmd set done <plan>` lands `status: done`. Rewrote `updateRefsFromMovedFile` to a token-based frontmatter rewrite (inline scalars, quoted scalars, flow arrays) + anchor-preserving body-link regex; fixed the same flow-array bracket-swallowing bug in the inbound `rewriteFrontmatterRefs`. Added `test/archive-custom-status-refs.test.mjs` (5 tests). `npm test` 1177/1177.
- **2026-06-28** Phase 2 shipped. `package.json` `version` script now `git add`s the whole `plugins` + `.claude-plugin` trees (was just the two version-stamped manifests), so edited SKILL.md / commands / hooks reach the release. `src/ship.mjs` `ALLOWLIST_PATTERNS` gained `^plugins/` + `^.claude-plugin/` (kept `.claude/commands/` for back-compat). `ship` help dropped the retired regeneration step (renumbered 4→3 steps, lists plugins/ + .claude-plugin/). Tests: plugin-path `isAllowed` assertions, an end-to-end dry-run staging a dirty plugin file while skipping `secret.env`, and a drift guard asserting the `version` script stages `plugins`/`.claude-plugin`. `npm test` 1173/1173.

## Closeout

**Shipped (all 5 phases).**

- **P1 — dispatcher/filters** (`bin/dotmd.mjs`, `src/query.mjs`): global flags parse before or after the command; `--root`/`--type` reach early-dispatched commands via a shared `applyIndexFilters`; `countsByType` recomputed on filter; `query` JSON echoes active filters; dead code removed; `watch` re-injects globals.
- **P2 — release packaging** (`package.json`, `src/ship.mjs`, ship help): both release paths (`npm version`, `dotmd ship`) now stage the whole `plugins/` + `.claude-plugin/` trees; retired `.claude/commands` regeneration claims dropped from help.
- **P3 — lifecycle** (`src/lifecycle.mjs`): `set <archive-status>` preserves a custom archive status (config-aware default); moved-file ref rewriting covers inline scalars, quoted scalars, flow arrays, and anchored body links (same flow-array bug fixed inbound too).
- **P4 — onboarding** (`src/init.mjs`, `README.md`, `scripts/postinstall.mjs`): hook stays global-only (user decision); README spells out the global-install requirement; `init` nudges likely Claude Code users even without a project `.claude/`; postinstall points at `dotmd update --plugin-only`.
- **P5 — completion/help drift** (`src/commands.mjs`, `src/completions.mjs`, `bin/dotmd.mjs` help, `dotmd.config.example.mjs`): `surfaces` added to `KNOWN_COMMANDS`; completions derive from it (+ drift test); stale `--frontmatter-fix` caps and prompt-status help fixed; example config gained `held`/`shelved`.

**Tests:** added `test/dispatch-global-flags.test.mjs` (11), `test/archive-custom-status-refs.test.mjs` (5), ship/init/completions cases; plus fixed a pre-existing date-drift flake in `test/runlist.test.mjs`. Full suite **1182/1182**; `dotmd check` clean (1 pre-existing unrelated timestamp warning on `improve-onboarding-brownfield-plugin.md`).

**Deferred:** none from the original scope. The broader date-fragility pattern in other test fixtures (absolute dates that could drift) was left as-is — only the assertions that actually broke were made relative.
