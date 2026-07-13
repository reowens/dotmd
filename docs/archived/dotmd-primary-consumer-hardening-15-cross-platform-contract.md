---
type: plan
status: archived
created: 2026-07-10T06:00:55Z
updated: 2026-07-13T23:24:02Z
parent_plan: ../plans/dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: Audit F13 confirmed Windows-sensitive root ownership and watch URL handling while CI runs only on Ubuntu. Runtime support and maintainer release support need separate explicit policies.
next_step: Add macOS/Windows characterization lanes first, classify failures, then replace root-prefix logic with the managed containment primitive rather than adding another path helper.
---

# Cross Platform Contract

> Runlist child of [Dotmd Primary Consumer Hardening](../plans/dotmd-primary-consumer-hardening.md).

## Problem

The installed CLI presents as portable Node code, but literal separators, prefix checks, URL pathnames, and untested filesystem behavior can assign roots or launch watch incorrectly. Bash-based release automation is a separate maintainer concern.

## Decisions

- Runtime target: Linux, macOS, Windows.
- Release automation: explicitly POSIX-only.
- Root ownership/archive destinations reuse Managed Path Containment.

## Phases

### Phase 1 - CI Characterization ✅

- Add macOS and Windows Node 22 lanes while retaining Ubuntu Node 20/22/24.
- Record failures before changing assertions or behavior.

### Phase 2 - Path Corrections ✅

- Replace URL `.pathname` with `fileURLToPath` in watch.
- Replace root string-prefix logic across index/lifecycle/lint/bulk-tag with shared containment.

### Phase 3 - Contract Documentation ✅

- State runtime platforms and POSIX-only release scope in contributor/user docs.

## Acceptance

- Full suite passes on all three operating systems.
- Sibling-prefix roots cannot claim each other's documents.
- Root ownership/archive destination is separator independent.
- Watch launches correctly from paths with spaces and URL-escaped characters.

## Closeout

- Outcomes: the runtime contract now covers Linux, macOS, and Windows, while release automation and the plugin shell wrapper remain explicitly POSIX-only.
- Path behavior: root ownership, archive destinations, file-URL imports, prompt links, migration matching, and lifecycle ownership are separator independent.
- Verification: the full suite passes on Ubuntu Node 20/22/24, macOS Node 22, and Windows Node 22 in CI run `29292704300`.
- Platform boundaries: Windows skips are limited to POSIX-only behavior or filesystem contracts Windows cannot represent.


## Version History

- **2026-07-13T23:24:02Z** Archived — Cross-platform CI passes on Ubuntu Node 20/22/24, macOS Node 22, and Windows Node 22.
- **2026-07-13T21:58:34Z** Started (planned → in-session).
- **2026-07-10T06:00:55Z** Created (runlist child of dotmd-primary-consumer-hardening).
