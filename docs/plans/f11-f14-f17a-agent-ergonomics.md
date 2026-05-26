---
type: plan
status: active
created: 2026-05-26T04:41:46Z
updated: 2026-05-26T04:41:46Z
surfaces:
modules:
  - validate
  - prompts
  - journal
domain:
audience: internal
parent_plan:
related_plans:
  - "> docs/archived/f4-f13-doctor-safety-check-collapse.md"
related_docs:
  - "> docs/audit-beyond-platform.md"
current_state: Scoped not started. Plan body has full runlist with file:line refs; ready for pickup.
next_step: Pick a phase order (F17a-first vs F11-first vs as-written F11→F14→F17a), then start Phase 1 with the chosen finding.
---

# F11 F14 F17a Agent Ergonomics

> 0.38.0 agent-ergonomics bundle: F11 (`in-session` plans without active leases get a validate warning), F14 (`shelved` prompt status — hidden from hud/briefing, kept in `prompts list`), F17a (opt-in `.dotmd/journal.jsonl` + `dotmd journal` reader). All additive; no behavior break for users who don't opt in.

## Problem

Three findings from the beyond-platform audit (`docs/audit-beyond-platform.md`), all in the agent-ergonomics theme — none alone justifies a release, bundled they ship as one minor bump.

**F11 (P3) — `in-session` plans with no live lease.** Beyond had 8 plans with `status: in-session` but no `.dotmd/leases/` dir at audit time. Either 8 concurrent sessions (plausible — confirmed multi-instance user) or some statuses are stale from crashed sessions / non-graceful exits. The lease infrastructure (`src/lease.mjs`) already knows what's live; the validator just doesn't consult it. Today the only fix path is `dotmd release` or `dotmd status <plan> active`, and neither is surfaced.

**F14 (P2) — prompt lifecycle has no `shelved` state.** Beyond had 2 pending prompts that the user described as "next up" + "saved but parked". Both surface equally in `dotmd hud` and `dotmd briefing` because `pending` is the only non-terminal prompt status. Plans have nine stop-statuses tied to distinct unstuck-actions per CLAUDE.md's "status earns its keep" principle; prompts collapse two semantics into one. Workaround today is delete-and-rewrite or live with both at session start.

**F17a (P2 — feature, not defect) — no agent-usage observability.** dotmd's primary user is Claude (per memory), but there's no journal of what sessions did: failed invocations (wrong arity, typoed argv), retries, cross-session activity, "agents got this wrong" corpus. Every dotmd UX decision today is informed by guesswork or a one-shot audit snapshot. F17a is the foundation: opt-in JSONL journal at the tail of every `bin/dotmd.mjs` invocation + a `dotmd journal` reader. F17b (hud reads journal) and F17c (`die()` self-correcting hints) are downstream — ship F17a alone, watch ~1 week of real journal data inform F17b's render before scoping.

## Goals

- F11: warn on `in-session` plan with no matching live lease entry; suggest the exact unstuck command. Default-on (only fires on actual divergence — legit concurrent sessions have leases). No new flag.
- F14: `shelved` joins the prompt status vocab. Visible to `dotmd prompts list`; hidden from `hud`/`briefing` pending surfaces; excluded from `prompts next`. Sugar: `dotmd prompts shelve <file>` / `unshelve <file>`.
- F17a: opt-in JSONL journal at `.dotmd/journal.jsonl` + `dotmd journal` reader. Foundation for F17b/F17c; ships standalone.
- All three additive — no behavior break for users who don't opt into the new surfaces.
- Single release as 0.38.0 (F14 expands a default vocab, that's a feature; F17a is a new command; F11 is a new warning).

## Non-Goals

- F17b (hud reads journal): out of scope. Per audit, ship F17a alone, let ~1 week of journal data inform what F17b should render.
- F17c (`die()` self-correcting hints): future polish, informed by F17b.
- Making journal default-on: defer to a future call once real journal data shows whether the size/PII tradeoff is worth it. Default-off keeps the surface clean for non-agent users.
- Filing `shelved` prompts into a `shelved/` subdir: status flip only, no filesystem-layout change. F15 (`filed: true` primitive) would generalize that later.
- A new `--check-leases` flag for F11: the warning is always-on. If it turns out to be noisy for legit concurrent users, we'll revisit with config.

## Phases

### Phase 1 — F11: stale-lease warning in validateDoc ⬜

`src/validate.mjs`: in `validateDoc` (the always-runs validator, around line 109 where surface warnings live), add a check gated on `doc.status === 'in-session'`. Read leases via `readLeases(config)`; warn if no entry at `doc.path` OR if the entry is stale per `isLeaseStale`.

Two cases, one message each:
- No lease entry: `` `status: in-session` but no active lease found for this plan (last session may have crashed without releasing). Run `dotmd release <plan>` to clear, or `dotmd status <plan> active` to re-queue. ``
- Stale lease entry: `` `status: in-session` but the lease is stale (last touched <N>h ago, >24h threshold). Same fixes — `dotmd release` or `dotmd status`. ``

Validator already has access to `config`; `readLeases(config)` is cheap (single file read). Call once per validation pass (memoize on config? no — just call per-doc since the lease file is tiny). Use the existing `skipWarningsFor` suppression so archived/terminal plans don't trip (defense in depth — `in-session` already isn't a terminal status, but the pattern matters).

### Phase 2 — F14: `shelved` prompt status ⬜

`src/config.mjs:38-42`: extend prompt status vocab:
```js
prompt: {
  statuses: ['pending', 'shelved', 'claimed', 'archived'],
  context: { expanded: ['pending'], listed: ['shelved'], counted: ['claimed', 'archived'] },
  staleDays: { pending: 30 },  // shelved is intentionally quiet — no stale pressure
},
```

`shelved` goes in `listed` (visible to `dotmd prompts list` and `briefing` listed section) rather than `expanded` (which feeds the "expand full body" hud/briefing surface) so the user still sees parked prompts but they don't blast the SessionStart hook.

Audit `src/hud.mjs`, `src/briefing.mjs`, and `src/prompts.mjs`:
- `prompts next` already consumes only `pending` (per CLAUDE.md). Verify and add a regression test.
- `dotmd hud` surfaces pending prompts; confirm shelved is excluded.
- `dotmd briefing` listed section should show `shelved` as a separate count.

Optional sugar (Phase 2b): `dotmd prompts shelve <file>` and `dotmd prompts unshelve <file>` as one-liners over `dotmd status <file> shelved` / `dotmd status <file> pending`. ~15 lines in `src/prompts.mjs`. Keeps the verb close to `prompts use`/`prompts next`/`prompts archive`.

### Phase 3 — F17a: JSONL journal + reader ⬜

New `src/journal.mjs`:
- `appendJournalEntry(config, entry)`: opt-in via `config.journal === true` OR `process.env.DOTMD_JOURNAL === '1'`. Returns silently if disabled. Writes `JSON.stringify(entry) + '\n'` via `appendFileSync` with `O_APPEND` (atomic for entries under `PIPE_BUF` = 512B on macOS / 4KB on Linux — our entries are well under). Path: `.dotmd/journal.jsonl`. No locking needed.
- Entry shape: `{ts: ISO8601, sid: sessionId(), pid, argv: [...], exit: 0|1, ms, v: dotmd_version, err?: string}`. `sid` reuses `currentSessionId()` from `src/lease.mjs`.
- Rotation: lazy, check size + age on each append. If `>5MB` OR oldest line `>30d`, rotate to `.dotmd/journal.jsonl.1` (single backup). One rotation function shared with future readers.

`bin/dotmd.mjs`: instrument the dispatcher tail. Wrap `main()` to capture `argv`, `exit`, elapsed `ms`, `err`. One call site after the command-dispatch try/catch — append before exit.

New `src/journal-read.mjs` + `dotmd journal` command:
- `dotmd journal --tail 20` (default): last N entries, pretty-printed `[ts] argv (exit, Nms)`.
- `dotmd journal --errors`: filter `exit !== 0`.
- `dotmd journal --session <id>`: filter by sid.
- `dotmd journal --by-command`: group by argv[0], count + median ms + error rate.
- `dotmd journal --since <iso>`: filter by ts.
- `--json`: raw line-by-line dump.
- Disabled-state UX: if no journal file, print `Journal is opt-in. Enable with \`DOTMD_JOURNAL=1\` (env) or \`journal: true\` (in dotmd.config.mjs).`

`.gitignore` snippet baked into `dotmd init` output: add `.dotmd/journal.jsonl*` line (already gitignored if `.dotmd/` is, but worth being explicit).

### Phase 4 — Tests ⬜

`test/validate.test.mjs` (F11):
- Plan with `status: in-session` + no `.dotmd/leases/` file → warning emitted, names `dotmd release` / `dotmd status` as fixes.
- Plan with `status: in-session` + lease entry (fresh `pickedUpAt`) → no warning.
- Plan with `status: in-session` + lease entry but `pickedUpAt` >24h old → stale-lease variant of the warning.
- Plan with `status: active` (not in-session) → no warning even with no lease (regression — only `in-session` triggers).

`test/prompts.test.mjs` (F14):
- `dotmd prompts list` shows shelved prompt with its status badge.
- `dotmd prompts next` skips shelved, consumes only pending.
- `dotmd hud` does not surface shelved in the "pending prompts" section.
- `dotmd prompts shelve <file>` flips status to `shelved`; `unshelve` flips back to `pending`.

`test/journal.test.mjs` (F17a):
- Journal disabled (default): no `.dotmd/journal.jsonl` created after a `dotmd plans` call.
- Journal enabled via env: file exists, one JSONL line per invocation, has all expected keys.
- Journal enabled via config: same.
- Concurrent writes (spawn 5 `dotmd plans` in parallel with journal on): final file has exactly 5 well-formed lines (`O_APPEND` atomicity holds).
- Rotation: pre-seed `.dotmd/journal.jsonl` with 5MB+1B → next append triggers rotation; backup created; new file starts fresh.
- Reader: `dotmd journal --tail 3 --json` returns last 3 lines as JSON array.
- Reader: `dotmd journal --errors` filters non-zero exits.
- Reader disabled-state: clear hint message naming the env var and config key.

Total: ~12 new tests. Total count: 886 → ~898.

### Phase 5 — Docs ⬜

- `bin/dotmd.mjs` HELP: new `journal` block; `prompts` block mentions shelve/unshelve.
- Top-level HELP one-liner: `journal [--tail N|--errors|...]    View opt-in command-usage journal`.
- `CHANGELOG.md` 0.38.0 entry: `### Added` (shelved status, `dotmd journal`, F11 stale-lease warning).
- `docs/audit-beyond-platform.md`: mark F11, F14, F17a shipped in release-table row; bump `updated:`.
- `CLAUDE.md`: document shelved status in the prompt-status table at the top (current table only mentions pending/claimed/archived).
- `README.md`: probably no change (prompts and journal are agent-facing, not in the highlighted features list).

### Phase 6 — Release ⬜

`npm version minor` → 0.38.0. Smoke test against installed binary:
- F11: `/tmp/` repo with a manual `status: in-session` plan + no lease → `dotmd check` shows the new warning.
- F14: write a `pending` prompt, `dotmd prompts shelve` it, confirm `prompts next` skips and `prompts list` shows it with the shelved badge.
- F17a: with `DOTMD_JOURNAL=1`, run a few `dotmd` commands, `dotmd journal --tail 5` prints them; `dotmd journal --errors` shows just the failing call when one of them was wrong.

## Verification

1. `npm test` — all pass, ~898 total.
2. F11: own repo `dotmd check` — no new warnings (no manually-set `in-session` plans without leases in own corpus).
3. F11 negative: `/tmp/` repo with `status: in-session` + no `.dotmd/leases/` — warning fires.
4. F14: own repo `dotmd prompts list` shows nothing new (no shelved prompts). Add one, confirm visibility split.
5. F17a: `DOTMD_JOURNAL=1 dotmd plans` creates `.dotmd/journal.jsonl`; entry has all 7 keys; subsequent `dotmd journal --tail 1` reads it back.
6. Post-release: `dotmd --version` = 0.38.0.

## Refs

- audit: docs/audit-beyond-platform.md (F11, F14, F17 §a)
- existing infra: src/lease.mjs (`readLeases`, `isLeaseStale`, `findStaleLeases`, `currentSessionId`)
- existing infra: src/config.mjs:38-42 (prompt status vocab)
- related: docs/archived/f4-f13-doctor-safety-check-collapse.md (shipped 0.37.0 — F13 collapse pattern that F11's warning will eventually feed into if it gets noisy at scale)
- downstream: F17b (hud reads journal) — hold for ~1 week of real journal data after F17a ships
