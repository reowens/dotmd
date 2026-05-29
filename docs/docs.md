# Docs

<!-- GENERATED:dotmd:start -->

## Active

| Doc | Status Snapshot |
|-----|-----------------|
| [Agent UX Audit — 2026-05-24](agent-ux-audit.md) | Active: No current_state set |
| [dotmd audit against Beyond platform — 2026-05-24](audit-beyond-platform.md) | Active: No current_state set |

## Archived

Archived docs are indexed by the CLI/JSON output. Showing 8 recent or high-signal highlights out of 41 archived docs:

| Doc | Status Snapshot |
|-----|-----------------|
| [Clear The Deck](archived/clear-the-deck.md) | Archived: Sequences all remaining work as a single runlist hub. Five phased releases drain 2 open issues (#13 P0, #12) and 3 active plans (F15/F17b/F17c). |
| [Release Ergonomics](archived/release-ergonomics.md) | Archived: Three release-UX warts surfaced shipping 0.40.0/0.40.1. (1) `npm version` only stages package.json — feature commits, archived plans, and index regen each force their own commit. (2) `dotmd release` is mostly a no-op (archive auto-releases) but prints a verbose stderr line on no-op. (3) The verb taxonomy is fragmented — `release`, `finish`, `archive`, `status` all flavors of "set status, do plumbing as side-effect"; agents have to learn each. Collapse to `dotmd set <status> [<path>]` and the lease lifecycle becomes a side-effect of the transition. |
| [Scaffold Validates Clean](archived/scaffold-validates-clean.md) | Archived: Issue #12 reports 3 first-failure validator traps (unknown surface, missing modules, over-cap current_state) that burn agent retries. This session hit a 4th while scaffolding this plan — `dotmd new @body.md` embeds the body file's frontmatter as literal body. None covered by `lint --fix`. Sibling to die-self-correcting-hints (repeat-failure); attacks first-failure scaffold ergonomics. |
| [F6 Partial Status Split](archived/f6-partial-status-split.md) | Archived: All 3 phases shipped. 951/951 tests passing. Live `dotmd stats` renders grouped (Plans / Docs / Prompts). |
| [F11 F14 F17a Agent Ergonomics](archived/f11-f14-f17a-agent-ergonomics.md) | Archived: Scoped not started. Plan body has full runlist with file:line refs; ready for pickup. |
| [0.36.2 polish bundle](archived/polish-0362.md) | Archived: Implementation + tests complete (863/863 passing). Pending audit-doc update, plan archive, and `npm version patch`. |
| [Modules Dashboard (F16)](archived/modules-dashboard.md) | Archived: Phases 1-5 shipped. Tests green (844/844). CHANGELOG drafted for 0.36.0. |
| [A4 — per-field unidirectional refs](archived/a4-unidirectional-refs.md) | Archived: Phases 1-3 shipped. Tests green (836/836). `dotmd check` warnings: 7 → 0. README + CHANGELOG drafted for 0.35.0. |

- Use `dotmd list` or `dotmd json` for the full inventory.
<!-- GENERATED:dotmd:end -->
