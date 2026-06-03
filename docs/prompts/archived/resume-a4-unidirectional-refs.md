---
type: prompt
status: archived
created: 2026-05-25T23:35:52Z
updated: 2026-05-26T00:00:35Z
dotmd_version: 0.34.0
context: "Resume A4 Unidirectional Refs"
related_plans:
---

Pick up `docs/plans/a4-unidirectional-refs.md` (status: active). Spawned at end of 0.34.0 session; targets 0.35.0. Design call already locked — per-ref `>` prefix wins over per-field config (D1 in the plan). Spec: `docs/agent-ux-audit.md` § A4.

**Next concrete decision:** start Phase 1 — parse the `>` prefix in `src/index.mjs:parseDocFile` and record directionality on a parallel `doc.refFieldDirections` structure. Sibling normalization happens via `normalizeStringList` (grep that for the canonical site). ~30 LOC + tests in `test/index.test.mjs`.

After Phase 1: Phase 2 wires the skip into `src/validate.mjs:checkBidirectionalReferences` (~10 LOC). Phase 3 is a mechanical 5-doc edit to retire the 6 false positives currently in `dotmd check` — including this plan's OWN ref to `docs/agent-ux-audit.md`. Phase 4 is README note + CHANGELOG + `npm version minor` → 0.35.0.

Open Questions in the plan are small (whether `parent_plan` should accept `>` as a no-op; whether check renders the prefix) — settle at implementation time.

Alternative pickup: `docs/plans/modules-dashboard.md` (active, older). Its next step: "Write `src/modules.mjs` + tests, wire dispatcher." Independent of A4 — could ship in parallel as 0.35.0 or 0.36.0. A4 is the natural continuation of this session because the design call is fresh and the false positives it retires are visible in `dotmd check` right now.

Gotcha: drafting A4 with `dotmd new plan ... "<full body>"` (using the just-shipped A2 feature) left a duplicate empty scaffold below the inserted body. Captured in A4's Deferred section. Either Write the full file directly, or restrict body args to single-section content.

