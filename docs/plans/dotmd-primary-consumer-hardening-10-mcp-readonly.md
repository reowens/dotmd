---
type: plan
status: planned
created: 2026-07-10T05:53:02Z
updated: 2026-07-10T05:53:02Z
parent_plan: dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: MCP remains deliberately deferred. Its technical gate is agent-context v1 plus passive read-only guarantees; the runlist keeps it strategically last until P0 lifecycle hardening is closed so an experiment cannot distract from correctness.
next_step: Do not implement yet. When all gates pass, build one project-local read-only orientation tool and compare its recovery/tool-call cost with direct CLI use.
---

# MCP Read-Only Experiment

> Runlist child of [Dotmd Primary Consumer Hardening](dotmd-primary-consumer-hardening.md).

## Problem

An MCP layer could reduce agent syntax selection cost, but exposing unstable CLI/machine contracts would create a second source of truth. This child is an evaluation, not a commitment to productize MCP.

## Entry Gate

- Agent-context v1 and configuration-derived status metadata are stable.
- Agent context and SessionStart are proven read-only.
- Full suite and `dotmd check` are clean.

Mutation tools remain separately prohibited until F1/F2/F4/F8 are closed. They are not part of this experiment.

## Experiment

- Add a zero-runtime-dependency stdio server under `scripts/`.
- Support `initialize`, initialized notification, `tools/list`, and `tools/call`.
- Expose one tool only: `dotmd_agent_context` with empty input and read-only annotations.
- Return agent-context v1 as structured content plus JSON text fallback.
- Register through project-local `opencode.json`; do not modify global/plugin/npm bin surfaces.
- Add subprocess protocol tests for malformed input, unknown methods/tools, and no-write behavior.

## Evaluation

- Use a fixed ten-task corpus covering briefing, status vocabulary, pending prompt, active/partial plans, truncation, root/type scope, empty repo, invalid config, and large-corpus orientation.
- Record startup/protocol failures and shell recovery calls.
- Graduate only if MCP has zero startup/protocol failures and at least 25% fewer recovery shell calls than the direct-CLI baseline.
- Otherwise delete the project-local registration and experiment without compatibility burden.
- Record the measurements and explicit graduate/remove decision in this plan's Closeout.

## Explicit Deferrals

- No mutation tools.
- No MCP runtime dependency.
- No plugin/global configuration.
- No product documentation until the experiment earns promotion.

## Acceptance

- OpenCode reports the project-local server connected after restart.
- Tool output matches the shared agent-context builder apart from generated time.
- Repository files and generated index remain byte-identical after calls.
- Removing `opencode.json` fully removes the experiment.


## Version History

- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
