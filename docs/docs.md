# Docs

<!-- GENERATED:dotmd:start -->

## Active

| Doc | Status |
|-----|--------|
| [Improve dotmd Onboarding (Brownfield + Plugin Discovery)](plans/improve-onboarding-brownfield-plugin.md) | Active |

## Reference

| Doc | Status |
|-----|--------|
| [Agent UX Audit — 2026-05-24](agent-ux-audit.md) | Reference |
| [dotmd audit against Beyond platform — 2026-05-24](audit-beyond-platform.md) | Reference |

## Archived

Archived docs are indexed by the CLI/JSON output. Showing 8 recent or high-signal highlights out of 58 archived docs:

| Doc | Status Snapshot |
|-----|-----------------|
| [Template & Scaffolding Improvements (Runlists, Samples, Polish)](archived/template-scaffolding-improvements.md) | Archived: Items #1 (runlist/coordination scaffolding) and #2a (worked runlist example in README + SKILL.md) shipped. #2b (`dotmd init --with-examples`) deliberately declined — the docs example covers onboarding without polluting a real repo. #3 (template polish: `--lite` + audit/findings variant) remains. |
| [Dotmd Review Findings Followups](archived/dotmd-review-findings-followups.md) | Archived: All 5 phases shipped. P1 dispatcher/filter correctness. P2 plugin files in both release paths. P3 custom archive-status preservation + moved-file ref rewriting. P4 onboarding (global-only hook decision, sharper README/init/postinstall guidance). P5 completion/help drift (completions now derive from KNOWN_COMMANDS + drift test; surfaces added; stale frontmatter-fix caps and prompt-status help fixed; example config gained held/shelved). All 3 open questions resolved. Full suite 1182/1182 green; dotmd check clean (1 pre-existing unrelated timestamp warning). Nothing committed yet. |
| [Surface coordination-hub body order (next-pickup) in runlist views](archived/surface-coordination-hub-next-pickup.md) | Archived: Scoped (not started). Coordination hubs encode next-pickup in prose (## Ranked queue tables — 13/27 platform hubs), invisible to the runlist views; only sprint runlist: hubs render a next → marker. Follow-up to the runlist-coordination-hubs branch. |
| [Agent UX Round B](archived/agent-ux-round-b.md) | Archived: Runlist hub for the 2026-06-10 round-B agent-UX findings; all five children drafted and queued. |
| [B5 Guard Sed Gap Misuse Recap](archived/b5-guard-sed-gap-misuse-recap.md) | Archived: Drafted from the 2026-06-10 review; sed bypass verified, misuse repeat-offense pattern observed in the health repo. |
| [B4 Body Keyword Search](archived/b4-body-keyword-search.md) | Archived: Drafted from the 2026-06-10 review; frontmatter-only keyword gap verified against 0.59.0. |
| [B3 Set Note Worklog](archived/b3-set-note-worklog.md) | Archived: Drafted from the 2026-06-10 review. |
| [B2 Exit Codes And Briefing Wording](archived/b2-exit-codes-and-briefing-wording.md) | Archived: Closed. Phase 1 (exit codes) refuted — the exit-0 readings were a `\| head` pipe artifact; everything already exits 1. Phase 2 (live-first briefing headline) shipped with 2 tests. |

- Use `dotmd list` or `dotmd json` for the full inventory.
<!-- GENERATED:dotmd:end -->
