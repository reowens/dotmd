---
type: plan
status: archived
created: 2026-05-27T02:39:39Z
updated: 2026-05-27T03:52:55Z
surfaces:
modules:
domain:
audience: internal
parent_plan:
related_plans:
related_docs:
current_state:
next_step:
---

# Command Aliases

**F20 — easier command names: singular/plural + verb aliases.** Audit ref: `docs/audit-beyond-platform.md:331-348`. P3 UX. Bump target: **0.39.x patch** or bundled with another minor — it's tiny.

## Goal

Reduce friction from dotmd's pluralization quirks. Two concrete asks:

- `dotmd prompt` should work identically to `dotmd prompts`. Today singular fails ("unknown command"); plural works. Pure friction with no semantic payoff.
- `dotmd prompts resume <file>` should alias `dotmd prompts use <file>`. `resume` is what an agent or human actually types when continuing a session; `use` leaks "what it does internally" instead of "what you mean."

Plus a small audit pass on whether other singular/plural splits in the dispatcher are worth defending (user pushback on the reflex defense — they may not be).

## Design (decisions locked)

1. **`prompt` ↔ `prompts` alias.** Implement at the dispatcher layer in `bin/dotmd.mjs`: one line near the top of `main()`, after help shortcut but before `command` is consumed, that rewrites `command` from `'prompt'` to `'prompts'`. Every subcommand works under either spelling automatically. No duplicated help/handlers.
2. **`resume` ↔ `use` subcommand alias.** Add `'resume'` to the `SUBCOMMANDS` set in `src/prompts.mjs:11` and a `case 'resume':` branch in the switch (around line 24) that delegates to `runPromptsUse(rest, config, opts)`. Both names stay valid; the canonical output format ("Consumed: …") doesn't change.
3. **Help text update.** Mention `resume` as an alias for `use` in `HELP.prompts` (and wherever the prompts subcommand-list is rendered). Agent-first lens: making the easier name discoverable matters more than canonical-form purity.
4. **Singular/plural audit (sub-item).** Survey every command pair where singular and plural disagree in `bin/dotmd.mjs`'s dispatch chain. For each, classify:
   - **collapse** (full alias both ways) — e.g. prompt/prompts
   - **keep-split-deliberately** (semantic mismatch is real) — e.g. `bulk archive` vs. single-target verbs, `module <name>` (deep view) vs. `modules` (dashboard)
   - **keep-split-with-better-help** (current behavior, just surfaced clearer)
   Output: a follow-up section under `## Sub-Audit` in this plan, OR spawn F22 if findings are substantial.

## Open questions to settle DURING implementation, not now

- **Should `dotmd plan <slug>` also become an alias** (for what — pickup? pickup-card? query for the slug)? Audit doc flagged this as possibly worth doing, but no obvious canonical mapping. Defer to sub-audit.
- **Should `dotmd module <name>` answer to `dotmd modules <name>`?** Today `modules` (plural) = dashboard, `module <name>` = deep view. The split has weak semantic justification. Sub-audit territory.
- **Should the `prompt`→`prompts` rewrite happen at a layer that affects HELP routing too?** Yes — `dotmd prompt --help` must print the same thing as `dotmd prompts --help`. Verify the help dispatch (around `bin/dotmd.mjs:948`) sees the rewritten command.

## Scope (estimated ~20-40 lines + tests)

**Core:**
- `bin/dotmd.mjs` — single command-rewrite line near the top of `main()`: `if (command === 'prompt') command = 'prompts';`. Placement: AFTER the early `--version`/`--help` shortcut handling so `dotmd prompt --help` routes to `HELP.prompts`.
- `src/prompts.mjs:11` — add `'resume'` to `SUBCOMMANDS`. Add a `case 'resume':` line that delegates to `runPromptsUse(rest, config, opts)`.
- Help text — note the aliases in `HELP.prompts` (or wherever prompts help lives — verify location).

**Tests:**
- `test/aliases.test.mjs` (new) — `dotmd prompt list` produces same output as `dotmd prompts list`; `dotmd prompts resume <file>` produces same output as `dotmd prompts use <file>` on the same fixture; `--help` works under either spelling.

**Sub-audit (do this DURING impl):**
- Grep `bin/dotmd.mjs` for `if (command === '` — list every command verb.
- Identify every singular/plural pair.
- Classify each per the design rule above.
- Land collapses that fall out trivially (e.g. another no-collision singular like prompts) in the same patch; defer ambiguous ones (plan/module) to F22.

## Key files to read before starting

- `bin/dotmd.mjs:924-1000` — `main()` dispatcher head, where help routing + `command` extraction live.
- `bin/dotmd.mjs:1084` — `prompts` dispatch (target of the rewrite).
- `src/prompts.mjs:11-30` — `SUBCOMMANDS` set + switch.

## Verification plan

- `npm test` clean.
- Smoke:
  - `dotmd prompt list` → same as `dotmd prompts list`
  - `dotmd prompt --help` → same as `dotmd prompts --help`
  - `dotmd prompts resume <some-pending-prompt>` → same as `dotmd prompts use <same>`

## Gotchas

- Don't add `prompt` as a *type* — it's already a doc type (`type: prompt`). The alias is at the command-name level only. Verify `dotmd new prompt <name>` still scaffolds correctly (the `new` command parses its own args).
- Don't accidentally re-introduce `done` as an alias for `archived` while in the neighborhood — the legacy `done` status was deliberately dropped (per CLAUDE.md).
- Rewrite line MUST come BEFORE the `--help` shortcut handling, so `dotmd prompt --help` routes to `HELP.prompts`. Re-read the dispatcher head order carefully when wiring.

## Closeout

**Landed (pending release):**
- `bin/dotmd.mjs:main()` — one-line `if (command === 'prompt') command = 'prompts'` rewrite, positioned AFTER the `help` command handler but BEFORE the per-command `--help` dispatch so `dotmd prompt --help` correctly routes to `HELP.prompts`. `command` was changed from `const` to `let` to allow reassignment.
- `src/prompts.mjs` — added `'resume'` to `SUBCOMMANDS` and a `case 'resume':` branch that delegates to `runPromptsUse`. Both names valid; canonical "Consumed: …" output unchanged.
- `bin/dotmd.mjs:HELP.prompts` — documents the singular alias up top, lists `resume` alongside `use` in the subcommands table, and adds two new example lines showing both alias forms in action.
- `test/aliases.test.mjs` (new, 4 tests): singular `prompt list` byte-identical to `prompts list --json`; `prompt --help` routes to `HELP.prompts`; `prompts resume` produces same output shape as `prompts use` (with filename normalization); chained `prompt resume` proves the singular rewrite + verb alias compose correctly.

**Sub-audit findings (every singular/plural pair in the dispatcher):**
- **COLLAPSED:** `prompt` → `prompts`. No collision, pure friction. Shipped.
- **KEEP-SPLIT-DELIBERATELY:** `status` ↔ `statuses`. These mean different things — `status <file>` sets a doc's status; `statuses` lists status definitions. Aliasing either way would create real ambiguity (`dotmd status` already has subject-noun semantics that block treating it as a list-form). No change.
- **DEFER (no obvious canonical mapping):** `plan` ↔ `plans`, `module` ↔ `modules`. `plans`/`modules` are list-form views; `module <name>` is a deep view, and there's no current `plan <slug>` command at all. Adding singular forms requires picking a canonical action (pickup? pickup-card? query?), which the F20 author flagged as undecided. Left for a future plan when the canonical mapping is clear.

**Smoke verified locally:** `prompt list` == `prompts list`, `prompt --help` == `prompts --help`, `prompts resume <file>` body matches `prompts use <file>` body. Existing 962 tests pass; 4 new tests pass. Total 966.

**Gotcha note for future:** the `prompt` rewrite is a `let` reassignment, so any code that previously assumed `command` was the literal first argv token now sees the normalized form. Nothing in `main()` re-derives `command` from `args[0]`, so this is safe — but if anyone adds such code, the rewrite would need to be reconsidered.

**Bump:** held with F22 for one combined patch release (0.39.x).
