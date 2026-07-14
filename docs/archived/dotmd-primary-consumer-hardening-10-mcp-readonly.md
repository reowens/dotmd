---
type: plan
status: archived
created: 2026-07-10T05:53:02Z
updated: 2026-07-14T00:13:37Z
parent_plan: dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> dotmd-primary-consumer-audit.md"
current_state: All entry gates are satisfied: agent-context v1, passive read-only guarantees, lifecycle hardening, and cross-platform contracts are shipped. The experiment is no longer deferred.
next_step: Build the single project-local read-only orientation tool now, run the fixed comparison, record a graduate/remove decision, and archive this plan either way before any future release.
---

# MCP Read-Only Experiment

> Runlist child of [Dotmd Primary Consumer Hardening](dotmd-primary-consumer-hardening.md).

## Problem

An MCP layer could reduce agent syntax selection cost, but exposing unstable CLI/machine contracts would create a second source of truth. This child is an evaluation, not a commitment to productize MCP.

## Entry Gate

Gate status: satisfied. Begin the experiment without another planning or waiting phase.

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
- Archive the plan after that decision whether the experiment graduates or is removed.

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
- No release is part of this experiment or its closeout.

## Evaluation Results

The experiment implemented a zero-dependency line-delimited JSON-RPC server,
registered it project-locally, and exercised initialize, initialized
notification, ping, tools/list, tools/call, malformed input, unknown methods,
unknown tools, invalid arguments, invalid config, structured output parity, and
byte-identical no-write behavior.

| Corpus task | Direct CLI | MCP | Recovery calls |
|---|---:|---:|---:|
| Briefing orientation | 1 | 1 | 0 / 0 |
| Status vocabulary | 1 | 1 | 0 / 0 |
| Pending prompt | 1 | 1 | 0 / 0 |
| Active and partial plans | 1 | 1 | 0 / 0 |
| Bounded truncation | 1 | 1 | 0 / 0 |
| Root and type scope | 1 | 1 | 0 / 0 |
| Empty repository | 1 | 1 | 0 / 0 |
| Invalid configuration | 1 | 1 | 0 / 0 |
| Large-corpus orientation | 1 | 1 | 0 / 0 |
| No-write verification | 1 | 1 | 0 / 0 |

- Startup/protocol failures: 0.
- Focused verification: 7/7 agent-context and MCP subprocess tests passed.
- Direct CLI baseline: one `dotmd agent-context` invocation per task with zero recovery calls.
- MCP result: one `dotmd_agent_context` invocation per task with zero recovery calls.
- Reduction: 0% in primary tool calls and no recoveries available to eliminate, below the required 25% improvement.

## Closeout

- Decision: remove. The MCP transport reproduced agent-context v1 correctly but did not reduce tool-call or recovery cost relative to the direct CLI.
- Cleanup: delete the project-local `opencode.json`, stdio server, and experiment-only tests so no MCP product surface or compatibility burden remains.
- Retained contract: `dotmd agent-context` remains the single bounded, passive orientation interface.
- Release impact: none; the experiment is closed before any future release.


## Version History

- **2026-07-14T00:13:37Z** Archived — Experiment passed protocol and no-write tests but produced 0% tool-call reduction versus direct agent-context, so registration and implementation were removed.
- **2026-07-14T00:10:49Z** Started (planned → in-session).
- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
