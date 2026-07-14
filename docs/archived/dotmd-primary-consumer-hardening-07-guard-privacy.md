---
type: plan
status: archived
created: 2026-07-10T05:53:02Z
updated: 2026-07-10T11:45:11Z
parent_plan: dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> dotmd-primary-consumer-audit.md"
current_state: Audit F6 confirmed the global guard acts in non-dotmd repositories, broad Git commands bypass prompt protection, and global logs retain unredacted bodies/commands. Redaction must land before broader guard inspection increases captured data.
next_step: Specify the retained telemetry schema and legacy-log policy, then implement one sanitizer shared by command, error, and misuse logging.
---

# Guard Privacy

> Runlist child of [Dotmd Primary Consumer Hardening](dotmd-primary-consumer-hardening.md).

## Problem

The plugin guard is installed globally but activation is inferred from common directory names. Its strongest prompt-commit promise covers explicit pathspecs only, while logs can persist command bodies, lifecycle notes, replacements, and credentials.

## Phases

### Phase 1 - Privacy Boundary ✅

- Centralize sanitization for journal, global error, and guard event records.
- Redact body/note/message values, positional prompt bodies, credential-shaped flags, commit messages, and replacement expressions.
- Preserve command names, timing, exit state, rule names, and required ownership path references.
- Decide purge/rotation treatment for historical unsanitized logs.

### Phase 2 - Repository Activation ✅

- No-op guard evaluation unless a dotmd config was discovered.
- Keep missing config/Git failures fail-open and non-blocking.
- Ensure non-dotmd calls create no misuse records.

### Phase 3 - Git-State Enforcement ✅

- Inspect staged/eligible paths for `git add .`, directory pathspecs, `-A`, pathless commit, and commit `-a`.
- Deny only when a live prompt is actually included; archived/ignored/clean prompts remain allowed.
- Keep inspection argument-array based and injectable for tests.

### Phase 4 - Wrapper Coverage ✅

- Ensure broad Git forms and Windows paths reach the Node guard fast path.
- Preserve `{}`/exit-zero behavior when the wrapper or inspector cannot decide.

## Acceptance

- Unique secret sentinels never appear in any future log surface.
- Non-dotmd repositories receive no guard opinion for prompt-like paths.
- `git add .` and pathless commit deny when they include live prompts.
- Quoted prose and commit-message mentions remain non-matches.
- Existing baton ownership/hints still work with sanitized journal entries until ownership migration removes that dependency.

## Closeout

Shipped schema-2 telemetry sanitization shared by journal, global-error, and misuse writers, with purge-before-read/write treatment for legacy unsanitized logs. Guard activation now requires a discovered dotmd config and malformed configs fail open. Git enforcement inspects actual eligible/staged paths for explicit, broad, forced, pathless, bundled-option, wrapper, changed-directory, and unborn-branch forms while allowing ignored, clean, archived, and dry-run prompts. Misuse records retain only rule-relevant commands and paths. Baton ownership and repeat hints remain compatible with canonicalized safe journal entries. Independent adversarial review closed with no blocker, high, or medium findings; the full suite passed 1,397 tests.


## Version History

- **2026-07-10T11:45:11Z** Archived — Shipped schema-2 log redaction/purge, repo-scoped fail-open guard activation, Git-state-aware broad command enforcement, and wrapper/Windows coverage; adversarial review and 1,397-test suite passed.
- **2026-07-10T11:02:33Z** Started (planned → in-session).
- **2026-07-10T05:53:02Z** Created (runlist child of dotmd-primary-consumer-hardening).
