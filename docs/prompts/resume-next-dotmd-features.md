---
type: prompt
status: pending
created: 2026-05-27T02:01:22Z
updated: 2026-05-27T02:01:22Z
dotmd_version: 0.39.6
context: "Resume Next Dotmd Features"
related_plans:
---

Pick up dotmd at 0.39.6. The audit-beyond-platform backlog is empty of polish items — F6 closed 2026-05-26 (typed countsByType + grouped stats render). What remains are four feature items, none scoped yet:

- **F19 — runlist primitive.** User-requested 2026-05-26 mid-session: "support for runlists that group plans like in platform". Captured as F19 in `docs/audit-beyond-platform.md`. Sketch is there (hub plan with `runlist:` field vs `type: runlist` doc; `dotmd runlist next <name>` flow); open questions on doc type, partial-status handling, relationship to `parent_plan`. **Probably scope this first since it has explicit user pull.**
- **F15 — `filed: true` filing primitive.** Generalize `archive: true` into a typed filing primitive. Bigger schema call.
- **F17b — hud reads journal.** Was held for ~1 week of real journal data after 0.38.0; that window has elapsed. Cheap once data is there.
- **F17c — `die()` self-correcting hints.** Downstream of F17b — wait until journal patterns inform what hints to surface.

**Re-verify before scoping any of them.** The audit findings predate 0.39.x; some may have decayed (F11 + F14 + F17a already shipped 0.38.0; F4 + F13 shipped 0.37.0; F6 shipped 0.39.6). Re-read the specific finding section in `docs/audit-beyond-platform.md` and check the current code before committing to an implementation.

Recommended first move: scope F19 (`dotmd new plan runlist-primitive`), settle the doc-type / partial-handling / parent_plan open questions on a quick design pass, then phase out implementation. Could ship as 0.40.0 (additive minor) if it adds a new doc type, or 0.39.7 if it's just a `runlist:` field on plans.

