---
type: plan
status: archived
created: 2026-07-10T06:00:55Z
updated: 2026-07-10T20:23:28Z
parent_plan: ../plans/dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: Audit F7 confirmed the advertised Notion import/export/sync paths are incompatible with the declared SDK and have no API-contract coverage. Repair would require identity, serialization, conflict, partial-failure, and live-workspace decisions beyond this hardening cycle.
next_step: Remove the unsupported command and dependencies before command-schema inventory, then document a concrete restoration gate rather than leaving dead implementation hidden.
---

# Notion Removal

> Runlist child of [Dotmd Primary Consumer Hardening](../plans/dotmd-primary-consumer-hardening.md).

## Problem

The Notion surface is currently guaranteed to fail against the installed SDK, while unsafe YAML serialization and incorrect counters remain behind that first failure. Advertising it creates false confidence and forces command-schema work to preserve a command with no supported contract.

## Decision

De-advertise and remove Notion now. Git history preserves the implementation; restoration requires SDK mocks plus a live workspace smoke test and explicit sync semantics.

## Phases

### Phase 1 - Remove Product Surface ✅

- Remove dispatch, help, completion, command registry, config example, README/CLAUDE claims, and package keywords.

### Phase 2 - Remove Implementation And Dependencies ✅

- Remove `src/notion.mjs`, shallow tests, optional dependencies, and lockfile entries.
- Verify normal installs have zero optional runtime packages.

### Phase 3 - Record Restoration Gate ✅

- Add changelog notice explaining no supported SDK contract existed.
- Require data-source API mocks, stable `notion_id`, YAML-safe serialization, conflict policy, partial-failure reporting, and live smoke test before restoration.

## Acceptance

- No shipped/help/config/package surface claims Notion support.
- `dotmd notion` follows ordinary unknown-command behavior.
- Package contains no Notion dependency or keyword.
- Command-schema inventory runs after removal and does not carry a tombstone command.

## Closeout

Removed the unsupported Notion command from dispatch, help, completions, command inventory, default/example configuration, package metadata, and user-facing documentation. Deleted the implementation, shallow tests, optional dependencies, and all runtime lockfile packages. The replacement regression suite verifies ordinary unknown-command behavior, absence from resolved defaults and shipped surfaces, and a clean install of the packed tarball with zero transitive runtime dependencies. The changelog records the API mocks, identity, serialization, conflict, partial-failure, and live-smoke requirements for any future restoration. The full 1,394-test suite and independent closure review passed with no remaining findings.


## Version History

- **2026-07-10T20:23:28Z** Archived — Removed unsupported Notion surfaces and runtime dependencies; clean packed-install regression, 1,394-test suite, and independent closure review passed.
- **2026-07-10T11:45:21Z** Started (planned → in-session).
- **2026-07-10T06:00:55Z** Created (runlist child of dotmd-primary-consumer-hardening).
