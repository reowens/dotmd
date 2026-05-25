---
type: prompt
status: pending
created: 2026-05-25T22:21:40Z
updated: 2026-05-25T22:21:40Z
dotmd_version: 0.33.0
context: "Resume Agent Ux A1 A3"
related_plans:
---

Pick up `docs/plans/agent-ux-a1-a3.md` (status: active). Three audit findings bundled into 0.34.0: A1 (`dotmd index` write-by-default), A2 (`dotmd new plan` accepts body), A3 (ref/glossary/module suggestion hints).

**Next concrete decision:** start Phase 1 (A1). Lowest-LOC, highest-ROI; fixes a footgun this session and the drafting session both hit live. Roughly: flip `dotmd index` default to write, add `--print` flag for old behavior, update `runCheck`'s stale-index error message and the HELP text, sweep tests that assert stdout from `dotmd index`.

Phase 2 (A2) needs one design call at implementation time — D2 in the plan locks the body-insertion section as `## Problem` (not `## Overview`); verify the built-in plan template's section ordering matches before coding.

Phase 3 (A3) has one open question: filter `Did you mean` candidates by ref-field type (a `related_plans` ref only suggests plans). Plan recommends defaulting to "same type if known, else any." Confirm or override.

Spec: `docs/agent-ux-audit.md` § A1–A3 (canonical wording for each fix's why/how). Bundle pattern: same as the 0.33.0 release that just shipped (/baton + self-heal) — feature commits + CHANGELOG commit + `npm version minor`.

Gotcha: the global `dotmd` binary is now 0.33.0; the repo's `.claude/commands/*.md` are still at 0.32.1 and will auto-refresh on next session-start hud (validates the self-heal mechanism that just shipped — leave it alone, it's the test).

