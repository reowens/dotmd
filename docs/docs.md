# Docs

<!-- GENERATED:dotmd:start -->

## Active

| Doc | Status |
|-----|--------|
| [Improve dotmd Onboarding (Brownfield + Plugin Discovery)](plans/improve-onboarding-brownfield-plugin.md) | Active |
| [Template & Scaffolding Improvements (Runlists, Samples, Polish)](plans/template-scaffolding-improvements.md) | Active |

## Reference

| Doc | Status |
|-----|--------|
| [Agent UX Audit — 2026-05-24](agent-ux-audit.md) | Reference |
| [dotmd audit against Beyond platform — 2026-05-24](audit-beyond-platform.md) | Reference |

## Archived

Archived docs are indexed by the CLI/JSON output. Showing 8 recent or high-signal highlights out of 56 archived docs:

| Doc | Status Snapshot |
|-----|-----------------|
| [Surface coordination-hub body order (next-pickup) in runlist views](archived/surface-coordination-hub-next-pickup.md) | Archived: Scoped (not started). Coordination hubs encode next-pickup in prose (## Ranked queue tables — 13/27 platform hubs), invisible to the runlist views; only sprint runlist: hubs render a next → marker. Follow-up to the runlist-coordination-hubs branch. |
| [Agent UX Round B](archived/agent-ux-round-b.md) | Archived: Runlist hub for the 2026-06-10 round-B agent-UX findings; all five children drafted and queued. |
| [B5 Guard Sed Gap Misuse Recap](archived/b5-guard-sed-gap-misuse-recap.md) | Archived: Drafted from the 2026-06-10 review; sed bypass verified, misuse repeat-offense pattern observed in the health repo. |
| [B4 Body Keyword Search](archived/b4-body-keyword-search.md) | Archived: Drafted from the 2026-06-10 review; frontmatter-only keyword gap verified against 0.59.0. |
| [B3 Set Note Worklog](archived/b3-set-note-worklog.md) | Archived: Drafted from the 2026-06-10 review. |
| [B2 Exit Codes And Briefing Wording](archived/b2-exit-codes-and-briefing-wording.md) | Archived: Closed. Phase 1 (exit codes) refuted — the exit-0 readings were a `\| head` pipe artifact; everything already exits 1. Phase 2 (live-first briefing headline) shipped with 2 tests. |
| [B1 Slug Resolution Everywhere](archived/b1-slug-resolution-everywhere.md) | Archived: Shipped. resolveDocArg() in src/index.mjs, wired into use/set/status/archive/touch/rename/unblocks/deps/diff/summary/runlist; did-you-mean on miss; 5 new CLI tests. |
| [Package Dotmd As Plugin](archived/package-dotmd-as-plugin.md) | Archived: All five phases shipped. Plugin live (marketplace + plugins/dotmd/ with hooks.json, plugin.json, SKILL.md, commands/{plans,docs,prompts,baton}.md); hooks cut over from global settings. Phase 4 done — per-repo `.claude/commands` scaffolding retired: `src/claude-commands.mjs` is now removal-only (banner-gated cleanup of dotmd-generated files, hand-authored ones untouched), `dotmd hud`/`doctor` sweep stale files, `init` recommends the plugin instead of scaffolding, `/baton` ported into the plugin. Full suite green (1029). |

- Use `dotmd list` or `dotmd json` for the full inventory.
<!-- GENERATED:dotmd:end -->
