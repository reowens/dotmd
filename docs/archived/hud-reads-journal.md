---
type: plan
status: archived
created: 2026-05-27T02:39:39Z
updated: 2026-05-28T04:16:37Z
surfaces:
modules:
domain:
audience: internal
parent_plan: clear-the-deck
related_plans:
related_docs:
current_state:
next_step:
---

# Hud Reads Journal

**F17b — `dotmd hud` reads the journal.** Audit ref: `docs/audit-beyond-platform.md:285-289`. Held since 0.38.0 (when journal infra shipped as F17a) to accumulate real journal data — that window has elapsed. Bump target: **0.40.0** (additive minor — `hud` gains journal-aware sections, no behavior change for non-journal users).

## Goal

Make `dotmd hud` answer questions the lease system alone can't:

- "What was my previous self doing before /clear or auto-compaction?"
- "Which concurrent sessions are alive vs. diverged?"
- "Are there warning patterns across the fleet that suggest a template / die-message problem?"

Today hud surfaces lease state + pending prompts. The journal (opt-in JSONL at `.dotmd/journal.jsonl`, shipped in 0.38.0 via F17a) is silent in hud despite holding the data that answers all three.

## Design (decisions locked)

1. **Gating:** All three new sections strictly gated on `existsSync(journalFilePath(config))`. Non-journal users' hud stays unchanged. No fallback render when the journal is absent or empty.
2. **Three sections, in this order:**
   - **Your previous self** — last 3 entries for `currentSessionId()`, formatted as `cmd args  (Xs ago, exit N)`. Shows ONLY when there's at least one prior entry for this session. Reorients a fresh post-/clear session in one glance.
   - **Fleet** — one line per OTHER session with activity in the last 24h. Format: `session <sid> · <N> cmds · last <X>m ago · holding <plan?>`. Stale-but-still-leased sessions highlighted (uses lease module's `STALE_LEASE_AGE_MS` for the threshold).
   - **Recent rejections** — top 3 error patterns from journal entries with `exit != 0` in the last 1h, grouped by `(command, error-class)`. Format: `4× "Both module/modules" on foyer plans (last 1h)`.
3. **Caps:** previous-self ≤ 3 entries, fleet ≤ 5 sessions, rejections ≤ 3 patterns. Configurable later if needed; defaults chosen to keep hud one-screen.
4. **JSON shape:** `hud --json` grows three keys: `previousSelf: []`, `fleet: []`, `recentRejections: []`. Existing keys (`held`, `pendingPrompts`, etc.) untouched — additive only.
5. **Silent-when-clean rule:** If a section has no entries, omit the section entirely (no empty headers). hud is already silent-when-clean on lease/prompt — same contract applies here.

## Open questions to settle DURING implementation, not now

- **"Error class" classification for grouping rejections.** Cheap heuristic: first 4-6 words of stderr after a known prefix (`"Both module/modules"`). Refine after observing what the journal corpus looks like.
- **Should rejections include warnings or only errors?** Start with errors only (exit != 0). Warnings flood the journal; can revisit after observing.
- **Helper for "X min ago" rendering** — check whether `src/render.mjs` already exposes one before adding.

## Scope (estimated ~80-100 lines + tests)

**Core:**
- `src/hud.mjs` — three new render helpers: `renderPreviousSelf(entries, sid)`, `renderFleet(entries, currentSid, leases)`, `renderRecentRejections(entries)`. Wired between existing sections.
- `src/journal.mjs` — verify `readJournalEntries` supports time-window + sid filters; add `readRecentEntries(config, { sinceMs, sessionId? })` thin wrapper if not.
- `src/util.mjs` — small helper for relative-time formatting if no equivalent exists.

**Tests:**
- `test/hud-journal.test.mjs` — previous-self renders entries, omits when empty, omits the current invocation (it hasn't been journaled yet at hud-time). Fleet renders other sessions, hides own. Rejections groups by pattern, caps at 3. JSON shape contains the three new keys. No-journal-file path keeps existing hud output byte-identical (regression guard).

**Docs:**
- `CLAUDE.md` — short note under journal area that hud surfaces journal-aware sections when enabled.
- `bin/dotmd.mjs` HELP.hud — mention the new sections.

## Key files to read before starting

- `src/hud.mjs` — existing section order + silent-when-clean rule.
- `src/journal.mjs:66` — `readJournalEntries(config)`.
- `src/journal-read.mjs` — existing reader formatting; reuse helpers where possible (don't duplicate group-by logic).
- `src/lease.mjs:17` — `currentSessionId()` for journal filtering; `isLeaseStale`, `STALE_LEASE_AGE_MS` for fleet section.

## Verification plan

- `npm test` clean.
- Smoke on dotmd's own repo with `DOTMD_JOURNAL=1`: run a handful of commands, then `dotmd hud`. Previous-self should show last 3 cmds for current sid.
- Concurrent-session test: write journal entries with distinct `sid` values into a fixture and assert fleet section shows the other session, hides own.

## Gotchas

- Don't include the current invocation in previous-self — journal write happens at process exit per `recordCliInvocation` (so hud's own row isn't in the file yet when hud reads).
- `currentSessionId()` falls back to a shell-username hash when no Claude env var is set. Don't assume Claude session UUIDs; the comparison must be string-equality on whatever the function returns.
- Journal file may not exist at hud-time even when `config.journal: true` if no prior command ran. `existsSync` check first.

## Closeout

(Add when shipped: what landed, any decisions revised mid-impl, bump used.)
