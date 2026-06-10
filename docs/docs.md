# Docs

<!-- GENERATED:dotmd:start -->

## Active

| Doc | Status |
|-----|--------|
| [Agent UX Round B](plans/agent-ux-round-b.md) | Active |

## Planned

| Doc | Status |
|-----|--------|
| [B4 Body Keyword Search](plans/b4-body-keyword-search.md) | Planned |
| [B5 Guard Sed Gap Misuse Recap](plans/b5-guard-sed-gap-misuse-recap.md) | Planned |

## Reference

| Doc | Status |
|-----|--------|
| [Agent UX Audit — 2026-05-24](agent-ux-audit.md) | Reference |
| [dotmd audit against Beyond platform — 2026-05-24](audit-beyond-platform.md) | Reference |

## Archived

Archived docs are indexed by the CLI/JSON output. Showing 8 recent or high-signal highlights out of 48 archived docs:

| Doc | Status Snapshot |
|-----|-----------------|
| [B3 Set Note Worklog](archived/b3-set-note-worklog.md) | Archived: Drafted from the 2026-06-10 review. |
| [B2 Exit Codes And Briefing Wording](archived/b2-exit-codes-and-briefing-wording.md) | Archived: Closed. Phase 1 (exit codes) refuted — the exit-0 readings were a `\| head` pipe artifact; everything already exits 1. Phase 2 (live-first briefing headline) shipped with 2 tests. |
| [B1 Slug Resolution Everywhere](archived/b1-slug-resolution-everywhere.md) | Archived: Shipped. resolveDocArg() in src/index.mjs, wired into use/set/status/archive/touch/rename/unblocks/deps/diff/summary/runlist; did-you-mean on miss; 5 new CLI tests. |
| [Package Dotmd As Plugin](archived/package-dotmd-as-plugin.md) | Archived: All five phases shipped. Plugin live (marketplace + plugins/dotmd/ with hooks.json, plugin.json, SKILL.md, commands/{plans,docs,prompts,baton}.md); hooks cut over from global settings. Phase 4 done — per-repo `.claude/commands` scaffolding retired: `src/claude-commands.mjs` is now removal-only (banner-gated cleanup of dotmd-generated files, hand-authored ones untouched), `dotmd hud`/`doctor` sweep stale files, `init` recommends the plugin instead of scaffolding, `/baton` ported into the plugin. Full suite green (1029). |
| [Clear The Deck](archived/clear-the-deck.md) | Archived: Sequences all remaining work as a single runlist hub. Five phased releases drain 2 open issues (#13 P0, #12) and 3 active plans (F15/F17b/F17c). |
| [Release Ergonomics](archived/release-ergonomics.md) | Archived: Three release-UX warts surfaced shipping 0.40.0/0.40.1. (1) `npm version` only stages package.json — feature commits, archived plans, and index regen each force their own commit. (2) `dotmd release` is mostly a no-op (archive auto-releases) but prints a verbose stderr line on no-op. (3) The verb taxonomy is fragmented — `release`, `finish`, `archive`, `status` all flavors of "set status, do plumbing as side-effect"; agents have to learn each. Collapse to `dotmd set <status> [<path>]` and the lease lifecycle becomes a side-effect of the transition. |
| [Scaffold Validates Clean](archived/scaffold-validates-clean.md) | Archived: Issue #12 reports 3 first-failure validator traps (unknown surface, missing modules, over-cap current_state) that burn agent retries. This session hit a 4th while scaffolding this plan — `dotmd new @body.md` embeds the body file's frontmatter as literal body. None covered by `lint --fix`. Sibling to die-self-correcting-hints (repeat-failure); attacks first-failure scaffold ergonomics. |
| [F6 Partial Status Split](archived/f6-partial-status-split.md) | Archived: All 3 phases shipped. 951/951 tests passing. Live `dotmd stats` renders grouped (Plans / Docs / Prompts). |

- Use `dotmd list` or `dotmd json` for the full inventory.
<!-- GENERATED:dotmd:end -->
