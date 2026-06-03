---
type: prompt
status: archived
created: 2026-05-27T11:24:53Z
updated: 2026-05-27T11:25:24Z
dotmd_version: 0.42.0
context: "Resume Release Ergonomics"
related_plans:
---

Plan: docs/plans/release-ergonomics.md (was in-session, now active).

Done in the prior session: 5 releases (0.40.2 → 0.42.0) covering Fix D (slash-command vocab), Fix C (`dotmd set` orchestrator + drop `finish` + deprecate `status`), Fix A (`dotmd ship` regen+commit+bump wrapper). Last open piece is Fix B — auto lease-scrub. Plan body has full scope at lines 77-99.

Next concrete decision: scope Fix B. Plan calls for three pieces: (a) opportunistic stale-lease scrub on read-side commands (hud/briefing/plans/list/pickup/context), (b) `dotmd release` becomes silent on no-op (today prints "No leases to release for session <UUID>"), (c) heartbeat write on every invocation so "fresh lease" means <10min since last bump. Lean: bundle as one 0.42.1 patch; (a) + (b) are small, (c) needs the most thought.

Gotcha from this session: `npm version`'s postversion script does `gh run watch $(gh run list ... --jq ...)` — when the `gh run list` HTTP call times out, the command-substitution returns empty and `gh run watch` errors with no run ID. Hit this on both 0.41.0 and 0.42.0. `dotmd ship` inherits the same fragility. A retry wrapper around the postversion CI-wait would close this — could be folded into Fix B scope or live as its own follow-up.

Picking-up: `dotmd pickup docs/plans/release-ergonomics.md` then start with the Fix B scope question above.

