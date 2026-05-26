---
type: prompt
status: archived
created: 2026-05-26T03:34:45Z
updated: 2026-05-26T03:35:20Z
dotmd_version: 0.36.2
context: "Resume F18 Then F4 F13"
related_plans:
---

**Current state.** 0.36.2 shipped (commits `1c08947` + `9e1d352` doc-pass — `9e1d352` is local-only, push before/after next work). Audit doc has a release table at the tail.

**Next plan to pick up:** `dotmd pickup docs/plans/f18-deprecate-singular-keys.md`. F18 is the schema-correctness fix — deprecate singular `module:` / `surface:` in favor of plural arrays. P1 because the duality is a real wart, not polish. Ships as 0.36.3 (patch, no behavior break — reader stays back-compat in step 1). The plan body has the full runlist: validator change at `src/validate.mjs:360-378`, lint migration at `src/lint.mjs:70-75` + `186-206`, ~7 tests, doc + audit + CHANGELOG updates, `npm version patch`.

**Then 0.37.0:** F4 (doctor dry-run-default) + F13 (collapse high-frequency `check` warnings into bulk-fix hints). ~200 lines + tests. Scope a fresh plan via `dotmd new plan polish-0.37.0` when F18 is done.

**After that:** F17a (opt-in `.dotmd/journal.jsonl` + reader command) — see `docs/audit-beyond-platform.md` F17 section. Pairs with F11 + F14 as the agent-ergonomics bundle.

**Gotchas.** `dotmd new plan polish-0.36.2` lowercases dots to `polish-0362` — adjust slug expectations. `.claude/commands/*.md` will be stale at v0.36.1 until the SessionStart hook self-heals them to v0.36.2; this surfaces as 3 warnings in `dotmd check` until then. Beyond's own data is the canonical test corpus for F18 (had 91 `Both module/modules` warnings pre-F3).

