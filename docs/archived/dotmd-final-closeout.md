---
type: plan
status: archived
created: 2026-07-14T00:05:55Z
updated: 2026-07-14T00:17:31Z
surfaces:
modules:
domain:
audience: internal
parent_plan:
related_plans:
  - "> dotmd-primary-consumer-hardening-09-operational-cleanup.md"
  - "> dotmd-runlist-mutation.md"
  - "> dotmd-plugin-skill-drift.md"
  - "> dotmd-forward.md"
  - "> dotmd-primary-consumer-hardening-10-mcp-readonly.md"
  - "> dotmd-primary-consumer-hardening-01-release-integrity.md"
  - "> dotmd-primary-consumer-hardening.md"
related_docs:
  - "> dotmd-primary-consumer-audit.md"
current_state: All eight ranked entries are archived. Documentation cleanup shipped, drained plans closed, the MCP experiment produced a measured remove decision, Release Integrity closed from automated evidence, and the audit and hardening hub are complete.
next_step: Run final verification and archive this coordination hub. No successor or release is required.
execution_mode: coordination
---

# Dotmd Final Closeout

> One execution queue for all remaining work. Follow the ranks without creating
> another planning layer or waiting for a future release.

## Scope

- Finish the remaining documentation and MCP implementation work.
- Close shipped or explicitly rejected tails instead of leaving them partial.
- Archive the audit and hardening hub after every child has a final disposition.
- Do not schedule, require, suggest, or perform a release as part of this runlist.


## Ranked Queue

<!-- One row per coordinated plan, in pickup order; the gating column explains
dependencies. Wire each plan into related_plans: so the "N related" count and
graph pick it up. -->

| # | Plan | Why / gating | Status |
|---|------|--------------|--------|
| 1 | [Documentation and Deck Hygiene](dotmd-primary-consumer-hardening-09-operational-cleanup.md) | Consolidated README, restored changelog continuity, added enforcement, and coordinated drained-plan closeouts. | archived |
| 2 | [Runlist Mutation](dotmd-runlist-mutation.md) | Recorded shipped mutation verbs and finalized rejected auto-rollup. | archived |
| 3 | [Plugin / Skill Drift](dotmd-plugin-skill-drift.md) | Recorded the shipped drift guard and finalized the rejected skill sweep. | archived |
| 4 | [Dotmd Forward](dotmd-forward.md) | Archived the drained roadmap after its final children closed. | archived |
| 5 | [MCP Read-Only Experiment](dotmd-primary-consumer-hardening-10-mcp-readonly.md) | Measured 0% tool-call reduction and removed the experiment and registration. | archived |
| 6 | [Release Integrity](dotmd-primary-consumer-hardening-01-release-integrity.md) | Closed from completed implementation and automated acceptance; live checks remain operational documentation. | archived |
| 7 | [Primary-Consumer Audit](dotmd-primary-consumer-audit.md) | Recorded final dispositions for F1-F15. | archived |
| 8 | [Primary Consumer Hardening](dotmd-primary-consumer-hardening.md) | Archived the program after all fifteen children closed. | archived |

## Completion Rule

The queue is complete only when all eight entries are archived and this hub is
archived. A future release is outside this runlist and cannot block completion.

## Closeout

- All eight ranked entries are archived.
- README and changelog cleanup shipped with changelog continuity enforcement.
- Runlist Mutation, Plugin / Skill Drift, and Dotmd Forward closed with rejected tails recorded as final decisions.
- The MCP experiment passed protocol/parity/no-write tests, measured no reduction versus direct `agent-context`, and was removed completely.
- Release Integrity, the primary-consumer audit, and the fifteen-child hardening runlist closed without a release gate.
- Final verification is the complete test suite, `dotmd check --verbose`, and `git diff --check`.

## Version History

- **2026-07-14T00:17:31Z** Archived — All eight ranked entries are archived; 1,594 tests pass and dotmd check reports zero errors and warnings.
- **2026-07-14T00:06:24Z** Started (active → in-session).
- **2026-07-14T00:05:55Z** Created (coordination hub).
