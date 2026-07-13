---
type: plan
status: archived
created: 2026-07-10T06:00:55Z
updated: 2026-07-13T18:35:04Z
parent_plan: ../plans/dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: Audit F10 confirmed hard-coded/mixed/duplicated agent buckets, silent truncation, missing dynamic status priming, and body-relative pickup-card offsets. This plan consumes the command-schema seam but owns machine and human agent-state semantics.
next_step: Extract resolved status metadata into a shared module, then define and contract-test agent-context schema version 1 before changing HUD or presets.
---

# Agent Context V1

> Runlist child of [Dotmd Primary Consumer Hardening](../plans/dotmd-primary-consumer-hardening.md).

## Problem

Agent-facing state is reconstructed separately in statuses, presets, HUD, compact context, and pickup cards. Custom statuses disappear, partial plans can vanish from focus, non-plans enter plan arrays, and targeted reads point at the wrong lines.

## Phases

### Phase 1 - Effective Status Metadata ⬜

- Share ordered status behavior across statuses, HUD, presets, and context.
- Replace hard-coded stale/actionable status lists with configured semantics.

### Phase 2 - Agent Context V1 ⬜

- Add schema name/version, explicit scope, status vocabulary, type-correct focus buckets, and total/shown/truncated metadata.
- Reuse one read-only builder for `agent-context` and compact context.

### Phase 3 - Dynamic Priming ⬜

- Print bounded configured plan status vocabulary in SessionStart and SubagentStart.
- Make plugin wording match actual truncation/fallback behavior.

### Phase 4 - Absolute Pickup Coordinates ⬜

- Add body line offset metadata and convert exposed card coordinates to full-file 1-indexed lines.
- Keep `walkSections` body-relative internally and cover CRLF/no-frontmatter files.

## Acceptance

- Current partial plans appear in the configured focus bucket.
- Docs/prompts named awaiting or blocked never enter plan collections.
- Every bounded collection reports total, shown, and truncated.
- Custom status vocabularies drive HUD, stale, actionable, prompts, and context.
- Human and JSON card offsets land exactly on the reported heading.
- Builder execution leaves index and repository byte-identical.

## Closeout

- Outcomes: effective status behavior is shared and type-aware; Agent Context V1 is versioned, scoped, deterministic, bounded, and reused by both compact entry points.
- Agent surfaces: HUD and prompt pickup honor configured expanded statuses, SessionStart/SubagentStart print bounded plan vocabularies, and briefing focus follows configured semantics.
- Coordinates: pickup-card and body-search lines are full-file 1-indexed values across LF, CRLF, frontmatter, and no-frontmatter documents.
- Verification: the full 1,583-test suite passes; passive agent-context calls leave repository and external state byte-identical.
- Deferrals: bounded git-history metadata remains in `dotmd-primary-consumer-hardening-14-bounded-git-metadata.md`.


## Version History

- **2026-07-13T18:35:04Z** Archived — Shipped shared status metadata, Agent Context V1, dynamic HUD/prompt semantics, passive machine context, and absolute pickup coordinates; all 1,583 tests pass.
- **2026-07-13T18:08:47Z** Started (planned → in-session).
- **2026-07-10T06:00:55Z** Created (runlist child of dotmd-primary-consumer-hardening).
