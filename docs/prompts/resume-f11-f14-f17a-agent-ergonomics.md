---
type: prompt
status: pending
created: 2026-05-26T04:44:51Z
updated: 2026-05-26T04:44:51Z
dotmd_version: 0.37.0
context: "Resume F11 F14 F17a Agent Ergonomics"
related_plans:
---

**Current state.** 0.37.0 shipped (commits `0806f43` F4+F13, `5a16a18` archive — both pushed). F4 (`dotmd doctor` previews by default; `--apply` writes) and F13 (`check` collapses high-frequency auto-fixable warnings into bulk-fix hints) both verified end-to-end against the installed binary.

**Next plan to pick up:** `dotmd pickup docs/plans/f11-f14-f17a-agent-ergonomics.md`. Bundle of three agent-ergonomics findings from `docs/audit-beyond-platform.md` — F11 (stale-lease warning in validate), F14 (`shelved` prompt status), F17a (opt-in JSONL journal + reader). All additive; ships as 0.38.0 (minor bump because F14 expands the default prompt vocab and F17a adds a new command). Plan body has the full runlist: file:line refs for lease.mjs / config.mjs / validate.mjs / hud.mjs / briefing.mjs / prompts.mjs, ~12 new tests across three test files (target 886 → ~898), CHANGELOG + audit-doc + CLAUDE.md updates.

**Sequencing call to make.** Phase order in the plan is F11 → F14 → F17a. Reasonable alternative: F17a first (foundation; pure-additive new module), then F11/F14 in either order. Pick whichever feels right when you read the plan.

**Then 0.38.x or 0.39.0:** F17b (hud reads journal — previous-self/fleet/recent-rejections sections). Per audit, hold for ~1 week of real journal data so the render is shaped by what's actually signal vs. noise. F17c (`die()` self-correcting hints) downstream of F17b.

**Gotchas.**
- `.claude/commands/{baton,docs,plans}.md` are currently stale at v0.36.2 — SessionStart hook auto-heals them to v0.37.0 on the next session boot, then commit as `chore: self-heal slash commands to v0.37.0`.
- `dotmd doctor` is now preview-by-default (F4 just shipped). Use `dotmd doctor --apply` when you actually want it to write.
- `docs/archived/baton-slash-command.md` has been untracked across multiple sessions — not related to current work, leave alone.
- F11's stale-lease check should default-on (not opt-in). Plan explains why — legit concurrent sessions have live leases so the warning only fires on real divergence.

