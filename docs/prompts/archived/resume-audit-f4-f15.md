---
type: prompt
status: archived
created: 2026-05-26T01:44:46Z
updated: 2026-05-26T01:45:04Z
dotmd_version: 0.36.1
context: "Resume Audit F4 F15"
related_plans:
---

Read `docs/audit-beyond-platform.md` § Findings 4-15. F1-F3 shipped 0.32.1; F16 shipped 0.36.0; everything else open.

**Next concrete decision:** which finding to pick up. Candidates by ease/leverage:
- **F14** (`shelved` prompt status) — smallest, well-specified, was on `modules-dashboard.md`'s "bundle if implemented same session" list and didn't ship there.
- **F4** (`dotmd doctor` is mutating but listed as "safe" in the audit's safe-commands list — no preview by default) — P2, concrete fix.
- **F5** (glossary error "section found but no entries parsed" lies when section is missing) — P2, concrete fix.
- **F6** (`partial` status conflates plan-type and doc-type in `stats`/briefing totals) — P2.
- **F7-F13** — P3 polish: `dotmd query` truncation signaling, status precedence, briefing tail bound, etc.

After picking: `dotmd new plan <slug>` → design call → phases → ship as 0.37.0 (if additive feature like F14) or 0.36.2 (if polish/fix).

Current state at handoff: 0.36.1 just shipped (847/847 tests, `dotmd check` clean, plans pipeline empty). This session shipped 0.35.0 (A4 `>` prefix), 0.36.0 (modules dashboard), 0.36.1 (A2+A3 polish).

Gotcha per feedback memory: the audit was a one-shot. Before scoping a finding, re-run the relevant command against this repo (or Beyond's corpus if available) to confirm the finding hasn't already decayed/fixed itself in the 0.32-0.36 series.

Skip: F1-F3 (shipped 0.32.1), F16 (shipped 0.36.0), A1-A5 (shipped 0.34.0-0.36.1).

