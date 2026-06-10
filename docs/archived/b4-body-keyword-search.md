---
type: plan
status: archived
created: 2026-06-10T07:45:49Z
updated: 2026-06-10T09:37:15Z
surfaces: [cli]
modules: [cli, query]
domain: agent-ux
audience: internal
parent_plan: docs/plans/agent-ux-round-b.md
related_plans:
related_docs:
current_state: Drafted from the 2026-06-10 review; frontmatter-only keyword gap verified against 0.59.0.
next_step: Add --body lazy body scan + excerpts to query.
---

# B4 Body Keyword Search

> Let query --keyword scan document bodies (lazy, with excerpts) so "which doc discussed X" gets structured doc cards instead of a raw-grep fallback.

## Problem

`dotmd query --keyword` only matches frontmatter-derived fields — title, summary, currentState, nextStep, path, blockers (`src/query.mjs` keyword filter). Document *bodies* are invisible: verified 2026-06-10, `dotmd query --keyword skipStale` returned 0 results while `grep -rl skipStale docs/` found 3 files.

"Which plan/doc discussed X?" is a constant agent question. Today the answer requires falling back to raw grep, which returns bare paths with no type/status/staleness context and happily matches archived docs without saying so. dotmd has the index to answer this properly and currently loses to grep.

## Goals

- `dotmd query --keyword <term> --body` (or a `dotmd grep <term>` alias) that also scans document bodies and returns the standard doc cards (type, status, updated, path, matching-line excerpt).
- Body reads are lazy: filter on frontmatter fields first, read bodies only for remaining candidates — the index does not need to store bodies.
- Show 1–2 matching-line excerpts per hit so the agent can rank without opening files.
- `--json` support consistent with existing query output.

## Non-Goals

- Full-text indexing, ranking, or stemming. Plain case-insensitive substring over bodies is enough; the corpus is hundreds of files, not millions.

## Phases

### Phase 1 — --body flag ✅
Lazy body scan + excerpt extraction in `src/query.mjs`; respect `--type`/`--status`/`--limit` composition. Tests: body-only match found, frontmatter-only still works, excerpt rendering, json shape.

Shipped: `--body` defers the keyword filter until after all frontmatter filters, so bodies are only read for surviving candidates (frontmatter matches keep their spot with no file read at all). Hits carry up to 2 `{ line, text }` excerpts — line numbers are file-absolute so they feed straight into a Read offset; long lines are windowed to 120 chars around the needle. `--body` without `--keyword` errors with guidance.

### Phase 2 — ergonomic alias ✅
`dotmd grep <term>` → `query --keyword <term> --body --all`. Help text + completions.

Shipped: `--all` is only injected when the caller didn't bound the result themselves (`--limit`/`--all` pass through). Registered in KNOWN_COMMANDS (did-you-mean), shell completions, `dotmd help grep`, and `help all`; SKILL.md + CLAUDE.md point agents at it over raw grep.

## Version History

- **2026-06-10T09:37:15Z** Archived — Shipped both phases: query --keyword --body lazy body scan with line-numbered excerpts, and the dotmd grep alias. 13 new tests; suite at 1067.
