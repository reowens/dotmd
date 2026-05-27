---
type: plan
status: archived
created: 2026-05-27T06:48:23Z
updated: 2026-05-27T09:07:35Z
surfaces:
  - platform
modules:
  - none
domain:
audience: internal
parent_plan:
related_plans:
  - ../plans/die-self-correcting-hints.md
related_docs:
current_state: Issue #12 reports 3 first-failure validator traps (unknown surface, missing modules, over-cap current_state) that burn agent retries. This session hit a 4th while scaffolding this plan — `dotmd new @body.md` embeds the body file's frontmatter as literal body. None covered by `lint --fix`. Sibling to die-self-correcting-hints (repeat-failure); attacks first-failure scaffold ergonomics.
next_step: Confirm scope (all 3 asks vs. subset) and pick bump target.
---
# Scaffold Validates Clean

**Sibling to `die-self-correcting-hints`.** Where that plan makes the *second* failure verbose, this one makes the *first* failure rarer — by shipping a scaffold + `lint --fix` that produces a plan which already passes `dotmd check`.

Issue: https://github.com/<repo>/issues/12

## The four first-failure traps

Traps 1-3 are from issue #12. Trap 4 was hit by *this* session while scaffolding *this* plan — proving the family is real and recurring.

1. **Surface taxonomy undiscoverable.** Valid surfaces live in `dotmd.config.mjs` (`taxonomy.surfaces`). Scaffold doesn't list them; no `dotmd surfaces` command. Authors guess (`db`, `cli`, `tooling`) and fail.
2. **`modules:` required but scaffold writes empty list.** Scaffold emits `modules:` with a blank/empty value; validator rejects active plans without a real module / `platform` / `none`. Pure infra plans hit this every time.
3. **`current_state` 500-char cap is too tight.** Cap is enforced as error, not warning. The field is the primary resume-context for the next agent — 500 chars (~80 words) doesn't fit non-trivial state. Reporting agent's draft was 740 chars.
4. **`dotmd new <type> <name> @path` embeds body-file frontmatter as literal body content.** The natural pattern for an agent drafting a multi-line body is to write a full doc (with frontmatter) to a tempfile and pass `@path`. But `dotmd new` then *prepends* its own scaffold frontmatter and treats the tempfile contents — frontmatter and all — as body. Result: the doc has two `---` blocks and a duplicated title. The author either has to edit the file post-hoc (what this session did) or knew in advance to omit the leading `---` block from the body file. Neither is discoverable.

## Scope (four independent fixes, ship as one minor bump)

### Fix 1 — Discoverable surface taxonomy

- **New command:** `dotmd surfaces` — prints the configured `taxonomy.surfaces` list, one per line. `--json` for machines. Fast.
- **Scaffold comment:** `dotmd new plan` writes the valid surface list as a YAML comment above the `surfaces:` field, so the author sees it without leaving the file.

### Fix 2 — Scaffold emits valid defaults

- `dotmd new plan` writes `modules:\n  - none` (not an empty list).
- Decide: should the new doc default `status:` to `active` (as today) or `planned`? `planned` doesn't require modules — would also dodge this trap. **Lean: keep `active` default but emit `- none`**, because most plans want to be ready to pick up. Reopen if user disagrees.

### Fix 3 — `current_state` cap

Two sub-decisions:

- **Demote over-cap to warning** (not error). Authors choose readability vs. cap. Lowest blast radius. Keeps the cap as a nudge, not a wall.
- **Optionally raise cap** to 1500 chars. Sibling to the demotion — even if it stays an error, 1500 is what real resume-state needs.
- **Optionally: `lint --fix` auto-truncates** over-cap `current_state` to first-N-chars + appends a `## Current state` section to the body with the full text. Punt unless demotion alone is insufficient.

**Recommended subset for v1:** demote to warning + raise to 1500. Skip auto-truncation until someone asks for it — it's a destructive transform on prose.

### Fix 4 — `@path` body input strips an opening frontmatter block

When `dotmd new <type> <name> @file.md` (or stdin via `-`) sees a body that starts with `---\n…\n---\n`, treat that block as **the author's intended frontmatter merge source**, not as body content. Two reasonable behaviors:

- **Merge mode (preferred):** Parse the body's leading `---` block as YAML; overlay its keys onto the scaffold's default frontmatter (body wins on conflicts). Strip the block from the body before writing. This makes the agent-friendly "write a full doc to /tmp, pass @path" pattern Just Work.
- **Strip mode (simpler):** Just discard the leading `---…---` block silently and use whatever comes after as body. Loses the frontmatter values the author wrote, but avoids the duplicate-block bug.

Lean **merge mode** because the agent already encoded its intent (modules, surfaces, current_state) in the leading block — throwing those away after parsing them feels like a worse user experience than honoring them. Edge case: if the body's `---` block declares a `type:` that conflicts with the CLI arg, prefer the CLI arg and warn.

Tests:
- Body starts with `---…---` → merged keys land in scaffold; body content is everything after the second `---`.
- Body has no leading `---` → unchanged behavior (current path).
- Body's frontmatter `type` mismatches CLI arg → CLI wins, warning printed.
- Body has `---` mid-document (e.g. as a horizontal rule) but doesn't start with it → unchanged (body kept verbatim).

## Key files

- `src/index.mjs` — frontmatter validator (where the three errors fire).
- `src/scaffold.mjs` (or wherever `dotmd new` lives) — emit `- none` default + surfaces comment + parse leading `---` block from body input (Fix 4).
- `src/frontmatter.mjs` — parser already exists; reuse for Fix 4 merge.
- `src/lint.mjs` — extend `--fix` if pursuing Fix 3 sub-option C.
- `dotmd.config.example.mjs` line ~surfaces — document the taxonomy.
- `bin/dotmd.mjs` HELP — add `surfaces` command entry; update `new` help to document the `@path` frontmatter-merge behavior.

## Verification

- `npm test` clean (new tests for `dotmd surfaces`, scaffold default `- none`, current_state warning level).
- Repro the issue: `dotmd new plan test-scaffold-clean`, edit body without touching frontmatter, `dotmd check` → 0 errors.
- Negative: setting an unknown surface still errors (we don't silently accept bad values).

## Gotchas

- Don't break existing plans that have legit reasons for empty `modules:` (none exist today per `dotmd check`, but verify before scaffolding flips).
- The current_state demotion should still print the over-cap *length* so authors know they're past it.
- `dotmd surfaces` should read from the live config, not a hard-coded list (multi-root configs may override).

## Closeout

**Shipped in one session (bump target: 0.40.0, minor — additive).**

What landed:

- **Fix 1** — `dotmd surfaces` command (with `--json`) in `src/surfaces.mjs`. Scaffold now emits `# surfaces — valid: <list>` comment above the `surfaces:` line when `taxonomy.surfaces` is configured (gracefully omitted otherwise). Wired into bin/dotmd.mjs dispatch + HELP.
- **Fix 2** — `dotmd new plan` and `dotmd new doc` scaffolds emit `modules:\n  - none` by default, plus a `# modules — real module name(s), or \`none\` for tooling/infra` hint comment. Fresh scaffolds now pass `dotmd check` with 0 errors.
- **Fix 3** — `current_state` cap raised 500 → 1500 in `src/validate.mjs`. `frontmatter-fix.mjs` cap synced (1500 trigger, 1200 target after truncation). Skipped the "demote to warning" sub-decision because the cap was already at warning level, not error.
- **Fix 4** — `dotmd new <type> <name> @path` (and `-` stdin, `--message`) now detects a leading `---…---` block in the body input, parses it with `parseSimpleFrontmatter`, and overlays the keys onto the scaffold's frontmatter. `type:` is reserved for the CLI arg (warns on mismatch); `created`/`updated` are scaffold-owned. Body content is just what follows the closing `---` — no more duplicate blocks.

Tests added (12 new):

- `test/surfaces.test.mjs` (4 cases) — populated taxonomy, --json, no-taxonomy fallback, --json empty.
- `test/new.test.mjs` (8 cases) — scaffold modules default, surfaces comment when configured, no comment when not, full @path merge, plain body back-compat, CLI type wins over body type, timestamps scaffold-owned, body horizontal-rule survives.

Pre-existing tests updated for the new cap value (`test/doctor.test.mjs`, `test/plan-shape-lint.test.mjs`).

Verification: `npm test` 978/978 passing. Smoke-tested in /tmp fixture: fresh `dotmd new plan` + `dotmd check` → 0 errors (was 1 error pre-fix). `@path` merge test: body with full frontmatter produces exactly one frontmatter block in the output.

Deferred: the `lint --fix`-auto-truncates-current_state sub-option of Fix 3 — `dotmd doctor --frontmatter-fix` already does this, so a separate `lint --fix` path would be redundant. No follow-up filed.

Closes: issue #12.
