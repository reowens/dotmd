# Docs

<!-- GENERATED:dotmd:start -->

## Active

| Doc | Status |
|-----|--------|
| [Dotmd Forward](plans/dotmd-forward.md) | Active |

## Planned

| Doc | Status |
|-----|--------|
| [Dotmd Plugin / Skill Drift Guards](plans/dotmd-plugin-skill-drift.md) | Planned |

## Reference

| Doc | Status |
|-----|--------|
| [Agent UX Audit — 2026-05-24](agent-ux-audit.md) | Reference |
| [dotmd audit against Beyond platform — 2026-05-24](audit-beyond-platform.md) | Reference |

## Archived

Archived docs are indexed by the CLI/JSON output. Showing 8 recent or high-signal highlights out of 64 archived docs:

| Doc | Status Snapshot |
|-----|-----------------|
| [Dotmd Durability Debt](archived/dotmd-durability-debt.md) | Archived: Roadmap Track 1. A forward-planning audit (3 parallel researchers, 2026-06-29) found correctness/durability debt that bites silently — no user files a ticket, they just get wrong behavior. Two classes — CRLF/Windows blindness and untested mutation modules. This is the one track that should jump dotmd's usual "wait for a real ask" queue because it's risk, not enhancement. |
| [Improve dotmd Onboarding (Brownfield + Plugin Discovery)](archived/improve-onboarding-brownfield-plugin.md) | Archived: All five onboarding-audit findings shipped. #1/#3/#4 + #2's postinstall nudge landed earlier (37f0008); this session finished #2 (update in `help all` Setup + README `### Updating` subsection) and #5 (npx try-before-install documented, `taxonomy.modules` emitted by generateDetectedConfig). Closing. |
| [Template & Scaffolding Improvements (Runlists, Samples, Polish)](archived/template-scaffolding-improvements.md) | Archived: Items #1 (runlist/coordination scaffolding) and #2a (worked runlist example in README + SKILL.md) shipped. #2b (`dotmd init --with-examples`) deliberately declined — the docs example covers onboarding without polluting a real repo. #3 (template polish: `--lite` + audit/findings variant) remains. |
| [Dotmd Review Findings Followups](archived/dotmd-review-findings-followups.md) | Archived: All 5 phases shipped. P1 dispatcher/filter correctness. P2 plugin files in both release paths. P3 custom archive-status preservation + moved-file ref rewriting. P4 onboarding (global-only hook decision, sharper README/init/postinstall guidance). P5 completion/help drift (completions now derive from KNOWN_COMMANDS + drift test; surfaces added; stale frontmatter-fix caps and prompt-status help fixed; example config gained held/shelved). All 3 open questions resolved. Full suite 1182/1182 green; dotmd check clean (1 pre-existing unrelated timestamp warning). Nothing committed yet. |
| [Surface coordination-hub body order (next-pickup) in runlist views](archived/surface-coordination-hub-next-pickup.md) | Archived: Scoped (not started). Coordination hubs encode next-pickup in prose (## Ranked queue tables — 13/27 platform hubs), invisible to the runlist views; only sprint runlist: hubs render a next → marker. Follow-up to the runlist-coordination-hubs branch. |
| [Agent UX Round B](archived/agent-ux-round-b.md) | Archived: Runlist hub for the 2026-06-10 round-B agent-UX findings; all five children drafted and queued. |
| [B5 Guard Sed Gap Misuse Recap](archived/b5-guard-sed-gap-misuse-recap.md) | Archived: Drafted from the 2026-06-10 review; sed bypass verified, misuse repeat-offense pattern observed in the health repo. |
| [B4 Body Keyword Search](archived/b4-body-keyword-search.md) | Archived: Drafted from the 2026-06-10 review; frontmatter-only keyword gap verified against 0.59.0. |

- Use `dotmd list` or `dotmd json` for the full inventory.
<!-- GENERATED:dotmd:end -->
