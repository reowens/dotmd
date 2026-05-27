---
type: plan
status: archived
created: 2026-05-27T09:17:53Z
updated: 2026-05-27T12:30:08Z
surfaces:
  - platform
# modules — real module name(s), or `none` for tooling/infra plans
modules:
  - none
domain:
audience: internal
parent_plan:
related_plans:
related_docs:
current_state: Three release-UX warts surfaced shipping 0.40.0/0.40.1. (1) `npm version` only stages package.json — feature commits, archived plans, and index regen each force their own commit. (2) `dotmd release` is mostly a no-op (archive auto-releases) but prints a verbose stderr line on no-op. (3) The verb taxonomy is fragmented — `release`, `finish`, `archive`, `status` all flavors of "set status, do plumbing as side-effect"; agents have to learn each. Collapse to `dotmd set <status> [<path>]` and the lease lifecycle becomes a side-effect of the transition.
next_step: Fix A (minimal cut) shipping as 0.42.0. `dotmd ship [patch|minor|major]` regenerates slash commands at the TARGET version, auto-stages dirty files matching a release allowlist (src/, test/, bin/, docs/, .claude/commands/, package*.json, dotmd.config*.mjs, README.md, CLAUDE.md, .gitignore), commits with an auto-generated message, then runs `npm version <bump>`. Files outside the allowlist (secrets, sibling-session WIP, lock files) are left dirty. Last remaining piece of the plan: Fix B (auto lease-scrub) — smaller patch.
---

# Release Ergonomics

Sibling cleanup pair born from shipping `scaffold-validates-clean` (0.40.0 + 0.40.1). Two distinct fixes, same theme: **manual release steps that should be automatic.**

## Fix A — `dotmd ship` (release wrapper)

The CLAUDE.md promise is "One command. That's it. `npm version patch`." In practice you need three commits:

1. Commit your actual feature work
2. (If you held a plan) archive it + regen index → commit
3. `npm version <bump>` → its own commit + tag + push + publish
4. **Then** next session: hooks regenerate `.claude/commands/*.md` to the new version stamp + `docs/docs.md` → ANOTHER commit of dirty tree

Plus the bump workflow has no foreground/background middle ground — foreground floods the chat with CI output, background hides progress so you have to trust it.

### What `dotmd ship` does

One imperative command, equivalent to:

```bash
dotmd ship [patch|minor|major]
```

1. **Preflight checks** (fail-fast with actionable hints):
   - Tests pass (`npm test`)
   - Working tree has staged or unstaged content (otherwise: nothing to ship)
   - Branch is `main` (or `--allow-branch` to override)
2. **Auto-prep:**
   - If a plan is in-session and the user passes `--archive-plan`, archive it
   - Regenerate `.claude/commands/*.md` with the *target* version stamp (not the pre-bump version — this avoids the "first commit after bump has stale stamps" cycle)
   - Regenerate `docs/docs.md` index
3. **Stage + commit:** stage tracked changes (NOT `-A`), commit with a templated message including the held plan's title if any
4. **Bump:** call `npm version <bump>` (which handles tag, push, publish)
5. **Verify:** poll the publish workflow once, print the version + npm link

Concrete UX:

```
$ dotmd ship minor
✓ Tests pass (978/978)
✓ Working tree dirty (3 files)
✓ On main, clean of pre-existing remote commits
→ Archiving held plan: scaffold-validates-clean
→ Regenerating .claude/commands/*.md → v0.41.0
→ Regenerating docs/docs.md
→ Committed: "feat: release-ergonomics — ship command + lease auto-scrub"
→ Bumping to 0.41.0…
→ Tagged + pushed
✓ Published v0.41.0 (https://npm.im/dotmd-cli/v/0.41.0)
```

### Open scope decisions

- **Does `ship` commit unstaged files?** Lean no — only files matching a curated allowlist (src/, test/, bin/, docs/, .claude/commands/, dotmd.config.mjs, package*.json). Anything else requires explicit `git add` first. Avoids accidentally including `.env` or unrelated WIP.
- **What about pre-existing commits ahead of remote?** Probably fine to roll forward — the bump just adds another commit on top. Worth a one-line "pushing N commits + bump" note so it's not silent.
- **Conflict with existing `dotmd release` (lease command)?** Yes — that's why this is `ship` not `release`.

## Fix B — Auto lease-scrub

Today, leases get orphaned when:

- A session crashes / is `/cleared` / network-disconnected (SessionEnd hook never fires)
- The user runs `dotmd archive` from a *different* session than the one holding (archive releases by path, but a different orphaned lease elsewhere stays)
- The user manually `dotmd release`s but the lease was already auto-released by archive — produces the noisy "No leases for session <UUID>" line

### What we can actually detect without a daemon

A heartbeat-on-every-CLI-invocation was considered and rejected: it conflates "session ran dotmd recently" with "session is alive." A Claude session that picks up a plan and then spends 20 minutes editing code and running tests doesn't touch dotmd in that window — but is clearly alive. With a 10-min heartbeat threshold, another session's read-side command would scrub that healthy lease. Useless without a long-lived process.

Real liveness needs either (a) a daemon that pings while the session is alive, or (b) walking `process.ppid` past the transient shell to find the actual Claude Code process pid and using `process.kill(pid, 0)`. Both are too much surface for this patch. See follow-up note at the bottom.

So this fix only does what's honestly detectable from age:

### Fix shape (option A — age-based, no liveness)

**Lower the stale threshold** from 24h to **4h** (`STALE_LEASE_AGE_MS` in `src/lease.mjs`). 4h is long enough to survive a normal coffee/lunch break or an afternoon spent in a single Claude session, short enough that a crashed lease from this morning doesn't sit there overnight.

**Opportunistic scrubbing** on every read-side command (`hud`, `briefing`, `plans`, `list`, `pickup`, `context`):

- Read all leases
- For each: is `pickedUpAt` older than `STALE_LEASE_AGE_MS`?
- If yes: silently delete the entry **and** flip the plan's frontmatter from `in-session` back to its recorded `oldStatus`. No stderr output. Log to journal at debug level only.

**Manual `dotmd release` becomes silent on no-op.** Today (`src/lifecycle.mjs:477`) it prints "No leases to release for session <UUID>." Change to: print nothing, exit 0. Only print when work was actually done ("Released N leases: X, Y.").

**Pickup auto-takeover for stale leases (post-scrub).** With opportunistic scrub running on `pickup` itself, a stale conflict normally evaporates before the takeover branch is reached. If a race leaves a `conflict-stale` outcome, take over silently with a one-line note ("Picked up — prior session <id> exited without releasing."). Keep `--takeover` requirement for `conflict-alive`.

### Out of scope (deferred)

- **Real liveness detection** (heartbeat-via-daemon or ancestor-pid lookup). File a follow-up if 4h-age scrubbing isn't enough in practice.
- **Anything that needs a long-lived process.**

## Fix C — `dotmd set <status> [<path>]` collapses the verb taxonomy

Today there are five verbs for status transitions, each with subtle plumbing:

- `dotmd pickup <file>` — sets `in-session` + writes lease (asymmetric: this one stays)
- `dotmd release [<file>]` — leaves `in-session`, cleans up lease
- `dotmd archive <file>` — sets `archived` + moves file + updates refs
- `dotmd finish <file> [done|active]` — terminal transition (mostly archive)
- `dotmd status <file> <status>` — generic transition, but doesn't touch leases or move files

Agents have to learn which verb maps to which transition. The actual semantic is identical: **change status; the plumbing (lease, file move, ref-fixup) follows from the source and target statuses.**

### Signature (locked)

```bash
dotmd set <status> [<path>]
```

- `<status>` first because path is inferable from the active lease in the common case.
- `<path>` omitted → infer from the holding session's lease. Multi-lease sessions: list and ask interactively, or `--all` to apply to every held lease.
- The transition's side-effects come from the *target* (and where relevant, *source*) status:
  - Leaving `in-session` → release lease
  - Target in `archiveStatuses` → move file to archive dir + auto-update refs (current `archive` behavior)
  - Target in `unarchiveStatuses` → move file out of archive (current `status` behavior)
  - Always: bump `updated:`, append Version History entry

### What collapses

| old verb | new equivalent |
|---|---|
| `dotmd release` | `dotmd set <prior-status>` (defaults to lease's `oldStatus`, falls back to `active`) |
| `dotmd release --to active` | `dotmd set active` |
| `dotmd archive <f>` | `dotmd set archived <f>` |
| `dotmd finish <f> done` | `dotmd set done <f>` (or `archived` per status vocab) |
| `dotmd status <f> <s>` | `dotmd set <s> <f>` (arg order flipped) |

`dotmd pickup` stays — it's the only one that *writes* a lease, and lock semantics need a dedicated command.

### Arg-order migration for existing `dotmd status`

The existing `dotmd status <path> <status>` order conflicts with the new `dotmd set <status> [<path>]` order. Two ways to handle:

1. **Flip `dotmd status` to match.** `dotmd status <status> [<path>]`. Breaking change for anyone scripting it. Print a one-time migration warning on detection of the old order (heuristic: if argv[0] looks like a path).
2. **Deprecate `dotmd status` in favor of `dotmd set`.** Print a deprecation warning when `dotmd status` is invoked; remove in a later major. No order flip needed.

**Lean: option 2.** Less disruptive — old usage keeps working with a warning; new code uses `set`. Documents the verb consolidation in one place (the deprecation message) instead of forcing existing scripts to flip args.

### Aliases for muscle memory

Keep these as thin wrappers (silent — no deprecation warning since they're idiomatic):

- `dotmd archive <f>` → `dotmd set archived <f>`
- `dotmd release` → `dotmd set <prior-status>`
- `dotmd pickup` → unchanged (still primary verb for the asymmetric case)

Drop entirely:

- `dotmd finish` — it's just `dotmd set <terminal>`. Low usage in this codebase, no aliasing needed.

### Why this also fixes the verbose-no-op bug

When `dotmd release` becomes `dotmd set <prior-status>`, the no-op case is "you asked to set status X but it's already X" — which already has clean handling (`runStatus` line 157-160: `already <status>, no changes made.`). The new verb naturally inherits that. The verbose "No leases to release for session <UUID>" path goes away because there is no longer a release-specific command path.

## Fix D — Status vocab in slash-command frontmatter

Once `dotmd set <status>` is the universal transition verb, agents need to know what `<status>` values are valid per type. Today that requires `dotmd statuses list` or grepping the config. Bake the vocab into the slash-command frontmatter so it's always visible in the description that Claude Code surfaces next to the command name.

`dotmd` already generates `.claude/commands/plans.md`, `.claude/commands/docs.md`, `.claude/commands/baton.md` (the version-stamped files we saw refresh on every SessionStart). Extend the generator to inline per-type status vocabs in the `description:` frontmatter.

Concrete shape:

```yaml
---
description: dotmd-managed plan briefing for this repo. Use when the user asks what's on the plate, references a plan slug, or wants to pick up / set status / archive a plan. Valid plan statuses: in-session, active, planned, blocked, partial, paused, awaiting, queued-after, archived. Valid doc statuses: draft, active, review, reference, deprecated, archived. Valid prompt statuses: pending, shelved, claimed, archived.
---
```

Cost: a few hundred bytes in the description. Benefit: every Claude session sees the vocab without running a discovery command, and `dotmd set <bad-status>` becomes much rarer because the agent has the right values in context already.

### Implementation notes

- The generator lives in `src/claude-commands.mjs` (the regen path SessionStart already invokes). Add a vocab block computed from `config.typeStatuses` (already resolved in config load).
- Vocab block format: one short clause per type, comma-separated values. Truncate if a type has >12 statuses (no current user has this).
- This is a generator change, not a behavior change to `dotmd` itself — the slash-command files are markdown that Claude Code reads at SessionStart. Existing version-stamp regen logic already triggers on bump, so this lands automatically with the next ship.
- HUD stays terse — the vocab lives in the slash-command description, not in the SessionStart hook output. (Option 1 was "print on first SessionStart" — explicitly *not* what we're doing.)

### Verification

- After regen, `head .claude/commands/plans.md` shows the vocab in the description line.
- Generated description fits Claude Code's display limits (no truncation in the UI).
- New tests: vocab block contains all declared type-statuses; respects per-type override from config.

## Scope cut for v1

Four fixes; recommended order:

- **v1 — Status vocab in slash-command frontmatter (Fix D).** Ship FIRST. Pure generator change, zero risk, every other fix gets a better landing pad because agents arrive with the vocab already in context. Patch-sized; could even ride a 0.40.x patch independently.
- **v2 — `dotmd set` + verb consolidation (Fix C).** Highest leverage user-facing change: collapses 5 verbs to 2 (`set` + `pickup`), eliminates the verbose-no-op bug as a side-effect. Aliases preserve muscle memory. Minor bump (0.41.0).
- **v3 — `dotmd ship` (Fix A).** Independent of Fix C. Could ship same bump if there's appetite.
- **v4 — auto lease-scrub (Fix B).** Cleanest when paired with Fix C — the lease lifecycle becomes "side-effect of set" + "scrubbed on read." Could be later (0.42.x).

All four are additive; bundling is fine but Fix D is the prerequisite that makes Fix C's vocab discoverable.

## Key files

- `bin/dotmd.mjs` — dispatch for new `ship` command + HELP entry
- `src/ship.mjs` (new) — orchestrates preflight, prep, commit, bump
- `src/lease.mjs` — heartbeat write on every invocation; expose `scrubStaleLeases()`
- `src/hud.mjs`, `src/briefing.mjs`, `src/plans.mjs` — call `scrubStaleLeases()` on entry
- `bin/dotmd.mjs` — release command goes silent on no-op
- `CLAUDE.md` — update the "Releasing" section to recommend `dotmd ship` and document the actual flow honestly

## Verification

- `dotmd ship --dry-run` previews the full sequence without writing/pushing
- New tests: ship preflight failures, lease scrub on dead pid, lease scrub on stale timestamp, manual release silent-on-no-op, pickup auto-takeover on dead pid
- Smoke: orphan a lease by killing a node process mid-pickup, run `dotmd hud` from a fresh session, confirm the orphan is gone

## Gotchas

- Pid-liveness check must work cross-platform (no `/proc` on macOS). `process.kill(pid, 0)` throws ESRCH if dead — that's the canonical check.
- Don't scrub leases held by sid=`unknown` from old format unless the timestamp is also very old (>24h). Backwards-compat shim.
- `npm version` runs in a child process; capturing its progress for `dotmd ship` requires streaming stdout, not buffering. Pipe through.
- `.claude/commands/*.md` regen logic already exists for SessionStart — reuse it; don't duplicate.

## Closeout

(Add when shipped: which sub-fixes landed, bump used, follow-ups filed.)
