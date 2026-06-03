---
type: prompt
status: archived
created: 2026-05-24T21:03:03Z
updated: 2026-05-24T21:03:43Z
dotmd_version: 0.32.0
context: "Audit Beyond Platform"
related_plans:
---

Run a real-world audit of `dotmd-cli` against the **Beyond platform** repo. The audit cycle that drove the 0.31.x and 0.32.0 releases has been the most productive engine for the project — every prior audit (self-dogfood, then gmax-brownfield) surfaced ~10 actionable findings. This is the third audit, against a third real codebase. The current dotmd version is 0.32.0 (just released on npm; see CHANGELOG.md for what shipped).

## Target

`/Users/reoiv/Development/beyond/platform` — a production monorepo, already an active dotmd user. Different shape than prior audit targets:

- **1,279 docs** across **8 docs roots** (dotmd itself has ~5; gmax had ~6). This is a scale test, not a brownfield-init test.
- **Heavily customized `dotmd.config.mjs`** — custom statuses (`awaiting-testing`, `backlog`, `research`), per-status flags (`requiresModule: true`, `quiet`, `skipStale`, `skipWarnings`), `excludeDirs: ['evidence']`. Plenty of corners dotmd's default code paths probably haven't hit.
- **Long-time user** — so the audit shape is "what breaks in production use," not "what's missing for first-time install."

## Read-only rule — IMPORTANT

Beyond is in active production use. **Do NOT** run any mutating dotmd commands against it: no `migrate`, `bulk-tag`, `archive`, `status`, `rename`, `pickup`, `release`, `touch`, `fix-refs`, `init`, `new`. Even with `--dry-run`, prefer not to — focus on read-only inspection. If a finding genuinely needs a mutation to verify, replicate the scenario in a `/tmp/` fixture first.

Safe commands to run against beyond freely: `list`, `json`, `check`, `briefing`, `hud`, `stats`, `coverage`, `graph`, `deps`, `unblocks`, `query`, `plans`, `focus`, `stale`, `actionable`, `glossary`, `health`, `context`, `doctor` (read-only mode), `lint --dry-run`.

## What to look for (severity-ranked, but not exhaustive)

1. **Performance.** Time every command (`time dotmd <cmd>`). 1,279 docs across 8 roots is well beyond the test fixtures. Anything > 1s on `list` / `briefing` / `hud` is a finding. Anything > 5s on `check` / `index` is a finding. Look for obvious quadratic patterns (N×N loops in `src/index.mjs`, `src/render.mjs`, `src/validate.mjs`).

2. **Multi-root correctness.** 8 docs roots stresses `collectDocFiles` (`src/index.mjs:86`), dedup, the `--root` filter, the index file path resolution, and any code that assumed `config.docsRoot` (string) instead of `config.docsRoots` (array). Look for paths reported wrong, docs counted twice, the wrong root tagged on docs that live in multiple roots.

3. **Custom-status handling.** Beyond uses `awaiting-testing`, `backlog`, `research` — not in dotmd's defaults. Does `dotmd stale`, `dotmd briefing`, `dotmd hud`, status validation, `dotmd statuses` all honor them? Custom contexts (`expanded`/`listed`/`counted`)? `quiet: true` actually quiet?

4. **Heavy customization edge cases.** Per-status `requiresModule: true` — does dotmd enforce or silently skip? Per-status `skipStale` + `terminal` + `archive` combos — interactions correct? Are there warnings printing that shouldn't, or missing that should?

5. **Validation errors / warnings.** Run `dotmd check` and scan the output. Are the errors actually errors? Any noise that should be quieter? Any silent failures (validation that should fire but doesn't)?

6. **Unusual frontmatter.** Beyond has 1,279 docs written by real humans. Some will have YAML shapes dotmd's `parseSimpleFrontmatter` (`src/frontmatter.mjs`) doesn't handle well — multiline strings, weird arrays, escaped chars, dates in unexpected formats. Sample a few via `dotmd json | jq` and look for parse warnings or dropped fields.

7. **Hooks.** Beyond's `dotmd.config.mjs` may define `formatSnapshot`, `renderCompactList`, or other hooks (per `dotmd.config.example.mjs`). If hooks fire, are they working correctly? Any uncaught throws? (Check the warn output.)

8. **Index file.** Beyond presumably has a `docs/docs.md` (or whatever `config.index.path` resolves to). With 1k+ docs, does it regenerate cleanly? Is the file readable? Does the auto-generated block stay within reasonable size?

## How to capture findings

Create one new doc in **dotmd's own** docs/ (not beyond's) at `docs/audit-beyond-platform.md` with `type: doc`, `status: active`. Number each finding, give it a severity tag (P1/P2/P3), short repro, root cause hypothesis, and proposed fix. Match the format of `docs/archived/audit-followup.md` (the prior gmax audit prompt — `dotmd archive list` to find it).

Bias toward writing down everything, even if it turns out to be cosmetic. The prior audits' best findings were the ones I almost dismissed.

## After the audit

Bundle the findings into a follow-up prompt (`dotmd prompts new audit-beyond-fixes`) for the NEXT session to execute, same way the 0.31.4 and 0.32.0 work was queued. Don't try to fix anything in this session — surfacing is the deliverable, fixing is the next one.

## Useful pointers from prior sessions

- Release flow: `npm version patch|minor|major` from `dotmd-cli` does test → bump → tag → push → GH Release → npm publish → local install in one shot. CHANGELOG entry committed first as a separate commit (see commits `7cee0fd`, `42b4022`, `ca498fd` for the pattern).
- Don't push or release without explicit ask — user has been gating both. The audit doesn't release anything anyway; fixes do.
- For UX bugs: 4-test minimum is the working pattern (affected case + inverse + dry-run + JSON where applicable).
- `src/commands.mjs` is the canonical CLI verb list.
- `regenIndex(config)` in `src/lifecycle.mjs` is exported — use from any new mutation path.
- The dogfood repo IS the test target — when reproducing a bug, exercise against fixtures in `/tmp/` rather than beyond's real files.
- Memory: user prefers concrete proposals over multi-option discussions, runs multiple concurrent Claude sessions on dotmd work.

## Expected output

A `docs/audit-beyond-platform.md` finding list (5-15 items), plus a saved `audit-beyond-fixes` prompt that the next session consumes. No code changes in the audit session itself.

