---
type: prompt
status: pending
created: 2026-05-24T20:08:24Z
updated: 2026-05-24T20:08:24Z
dotmd_version: 0.31.4
context: "Resume Gmax Enhancements"
related_plans:
---

Pick up the gmax-audit enhancement loop. All bug findings (11 dotmd self-audit + 7 gmax bug findings) are closed and shipped through **0.31.4** (on npm). What's left is the four **enhancement** items from the gmax audit — each is a design choice, not a 1-line fix.

## State at handoff

- **Local branch is ahead of origin/main** by a few commits — README polish + this doc-hygiene commit. 0.31.4 is the most recent release on npm. Push when you're ready; nothing here gates the release.
- `dotmd check` is clean modulo two pre-existing back-reference warnings on archived-↔-archived plan refs (cosmetic).
- The original 11-finding audit prompt was archived this session as `docs/archived/audit-followup.md` — every finding is struck-through with notes on what shipped.
- `.claude/commands/*` refreshed to 0.31.4. The `docs/docs.md` index is current.
- 773/773 tests passing as of the last commit.

## Remaining items (gmax audit, by leverage)

### A — Init bulk-tag prompt for existing markdown
The biggest one. On a brownfield repo with N pre-existing `.md` files, `dotmd init` already scans + counts them (see `scanExistingDocs` + `subdirCounts` in `src/init.mjs`). It just doesn't offer to do anything with them — the user has to hand-write N frontmatter blocks. Audit's words: "that's where users will bounce."

Design questions to resolve before coding:
- Interactive prompt during init ("Tag N untagged files as type: doc, status: draft? [Y/n]")? Or a separate `dotmd bulk-tag` command that init merely mentions?
- Per-subdir defaults? Files under `docs/plans/` should probably get `type: plan` not `type: doc`.
- Default status: `draft` (doc) / `planned` (plan) feels right; configurable?
- How to handle files that already have frontmatter but no `status:` (caught by #1's new "Untagged" surfacing)? Same command should cover them.

Probably warrants its own plan. Likely 2-3 commits.

### B — Init auto-adds `!docs/` exception when docs/ is gitignored
Companion to #2. #2 only emits a *warning* with the suggestion; the stretch ask was "or at minimum prompt." Concrete shape:

- After detecting `git check-ignore -q docs/` returns 0, EITHER:
  - (a) Append `!docs/` to .gitignore directly (destructive — touches user's file). Probably gated behind `--auto-fix-gitignore` or interactive Y/N.
  - (b) Print a copy-pasteable single-line command alongside the current warning.

I'd lean (b) — same warning, plus `echo '!docs/' >> .gitignore` hint underneath. Low-risk, no surprise mutations. Small commit.

### D — Label body-scraped `currentState` as `(auto)`
Half-shipped by #3 already: terminal docs no longer body-scrape at all. For **non-terminal** docs, body-scrape still happens silently — the audit's idea was a `(auto)` prefix so the user knows where the string came from and that frontmatter can override.

Two-spot fix:
1. `src/index.mjs` — track origin: pass a `currentStateFromBody: true` flag (or prefix the string at index time).
2. `src/render.mjs` `_formatSnapshot` — render `Active: (auto) Phase 2 underway` when origin is body.

Probably one commit. Worth checking whether the `(auto)` is visual noise on heavily-tagged repos before committing to it — could be a config knob.

### E — Init wires SessionStart hook for `dotmd hud`
Init's closing message already calls hud "the ideal SessionStart hook" but doesn't wire it. Shape:

- If `.claude/` exists, detect `.claude/settings.json` (or `.claude/settings.local.json`).
- If absent OR missing the `hooks.SessionStart` block, propose adding:
  ```json
  { "hooks": { "SessionStart": [{ "hooks": [{ "type": "command", "command": "dotmd hud" }] }] } }
  ```
- Either prompt interactively or print a single ready-to-paste snippet next to the existing "ideal SessionStart hook" line in the init output.

Settings-merge logic is the gotcha — clobbering an existing SessionStart array would be hostile. Easier first cut: just print the snippet, let the user paste. Add the merge later if there's demand.

## Recommended order

1. **B** first — smallest, low-risk, lands quickly.
2. **D** — tighter scope than A/E, mostly mechanical.
3. **E** — print-snippet version is small; full settings-merge is its own thing.
4. **A** — scaffold a plan first; this is the meatiest and benefits from a phased approach.

## Useful pointers (carry-over from prior sessions)

- Release flow: `npm version patch` does test → bump → tag → push → GH Release → npm publish → local install in one shot. CHANGELOG-first per the 0.31.3/0.31.4 pattern.
- Don't push or release without explicit ask — user has been gating both.
- `src/commands.mjs` is the canonical CLI verb list.
- `regenIndex(config)` in `src/lifecycle.mjs` is exported — use from any new mutation path.
- The dogfood repo IS the test target — exercise changes here before relying only on test fixtures.
- For UX bugs: a 4-test minimum is the working pattern (the affected case + the inverse + dry-run path + JSON path where applicable).

