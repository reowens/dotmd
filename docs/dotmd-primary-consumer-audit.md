---
type: doc
status: review
created: 2026-07-09T23:16:17Z
updated: 2026-07-09T23:27:20Z
modules:
  - cli
  - lifecycle
  - guard
  - integrations
  - release
surfaces:
  - cli
  - plugin
  - docs
domain: agent-ux
audience: internal
related_plans:
  - "> plans/dotmd-primary-consumer-hardening.md"
related_docs:
  - "> agent-ux-audit.md"
  - "> audit-beyond-platform.md"
dotmd_version: 0.69.0
---

# Dotmd Primary-Consumer Audit - Second Pass

> A source-verified audit of dotmd as an agent's primary interface. The second pass narrows the first-pass findings, groups them by root cause, and records concrete failure paths without committing to implementation design.

## Overview

dotmd is already unusually strong at agent-facing workflow design. Its breadth is not the problem. The remaining risk is that several central promises - safe lifecycle transitions, session ownership, dry-run behavior, generated command truth, and repository-local guardrails - are implemented by separate paths that do not share the same invariants.

The test suite is broad and green, but many findings below are behavior that existing tests either codify or do not exercise. The next phase should therefore prioritize invariant and adversarial tests over more feature surface.

This audit supersedes the initial conversational findings from 2026-07-09. It does not supersede the historical audits linked below; those remain useful records of already-shipped work.

## Audit Boundary

Second-pass validation covered:

- lifecycle and ownership: `use`, `set`, prompt consume-to-claim, baton, pickup cards, and HUD;
- mutation safety: path resolution, status/archive/file moves, runlist writes, rename, dry-run, and concurrency;
- release and integrations: `dotmd ship`, npm version hooks, Notion, HTML export, and Graphviz output;
- agent surfaces: plugin guard, SessionStart priming, compact JSON, command help, completions, and current documentation;
- a project-local OpenCode MCP experiment.

Validation combined source inspection, focused existing tests, and isolated temporary-repository reproductions. No product source was changed during the audit.

## Priority Summary

| Priority | Findings | Planning meaning |
|---|---|---|
| P0 | F1-F6 | Correctness, data safety, release safety, or privacy boundaries. Resolve before adding feature surface. |
| P1 | F7-F12 | Broken optional integration or agent contracts that cause silent wrong behavior and repeated recovery calls. |
| P2 | F13-F15 | Scale, portability, documentation hygiene, and a deferred MCP experiment. |

## Findings

### F1. Pickup and consume-to-claim do not share lifecycle invariants - P0 - Confirmed

Direct plan pickup rejects only literal `blocked`; it accepts `paused`, `partial`, `awaiting`, `queued-after`, and physically archived plans, then writes `in-session` (`src/lifecycle.mjs:366-398`). A reproduced `use` of an archived plan changed its status while leaving it under `docs/archived/`.

Prompt consume-to-claim is a second, weaker pickup implementation. It rejects only missing status, `in-session`, and literal `archived`, then calls `updateFrontmatter` directly (`src/prompts.mjs:292-332`). It bypasses type checks, configured terminal statuses, `updated`, Version History, index regeneration, and lifecycle hooks. A configured terminal `done` plan was reproduced changing to `in-session` while its index row, timestamp, history, and hook state remained unchanged.

Scope correction from the first pass: non-plan `use` is not affected. `src/use.mjs:38-50` routes docs to read-only output and prompts to consumption; only plans reach `startPlan`.

Planning boundary: establish one authoritative pickup transition and one definition of pickup-able status, reused by direct `use`, prompt claim, runlist next, and roadmap next.

### F2. Session ownership is inferred from opt-in observability - P0 - Confirmed

The command journal defaults off (`src/config.mjs:117-119`), but baton reconstructs ownership from journal entries and falls back to the sole global `in-session` plan when the journal is silent (`src/baton.mjs:31-75`). This makes telemetry an authority for mutation.

In an isolated reproduction with journaling disabled, a second session ran no-argument baton, adopted another session's sole in-session plan, flipped it to `active`, and created its resume prompt. The fallback is intentional and tested, but it is not ownership.

The same root cause explains the unimplemented optional target advertised by the canonical `dotmd set <status> [<file>]` contract. `runSet` still requires an explicit path (`src/lifecycle.mjs:633-639`), while CLAUDE.md, the plugin skill, and HUD advertise inference.

Planning boundary: separate durable session ownership from optional command analytics, then decide whether no-target mutations are safe enough to support. Until then, documentation should require explicit targets.

### F3. Mutation paths are not confined to configured document roots - P0 - Confirmed

`resolveDocPath` accepts any existing absolute path and repo-relative traversal without checking membership in `docsRoots` (`src/util.mjs:160-173`). `new` and `rename` similarly construct destinations from user input without a shared containment check (`src/new.mjs:710-758`, `src/rename.mjs:36-46`).

An isolated `dotmd touch /tmp/.../outside-target.md` exited successfully and changed a Markdown file outside both the repository and configured roots. Equivalent source and destination escapes are available to other mutation verbs.

Planning boundary: define one canonical, symlink-aware containment primitive for every mutation source and destination. Read-only commands may retain broader path support if explicitly intended.

### F4. Multi-step mutations are non-transactional and race-prone - P0 - Confirmed

Lifecycle transitions update status and Version History before moves that can fail (`src/lifecycle.mjs:254-290`, `src/lifecycle.mjs:541-551`). A forced `git mv` failure left the source file in place but already marked `archived` with an archive history entry.

Core writes are non-atomic read/replace/write operations (`src/lifecycle.mjs:985-1052`). Creation and archive naming use check-then-write or check-then-move sequences without reservation (`src/new.mjs:761-763`, `src/new.mjs:834-849`, `src/lifecycle.mjs:111-124`). A six-process transition stress test produced a transient truncated-file read and lost one successful history entry.

Runlist and reference mutations use the same independent read-modify-write shape, so the issue is systemic rather than local to status changes.

Planning boundary: design a shared safe-mutation layer covering atomic replacement, optimistic conflict detection or locking, destination reservation, multi-file ordering, and rollback/recovery expectations.

### F5. Both release paths can publish unintended or incomplete state - P0 - Confirmed

`dotmd ship` filters what it passes to `git add`, but its subsequent `git commit` has no pathspec (`src/ship.mjs:89-125`). A reproduced pre-staged `secret.env` was committed alongside an allowed document even though ship reported the file as outside its staging allowlist.

The npm `version` hook chains synchronization and staging with semicolons and ends in `true` (`package.json:45`). Plugin-version synchronization or staging can therefore fail without blocking the version commit and tag.

Planning boundary: make the accepted Git index explicit before committing and make artifact synchronization failures fatal. The next planning pass should also choose one canonical release entrypoint rather than preserve two subtly different safety models.

### F6. Global guard and logging cross repository and privacy boundaries - P0 - Confirmed

The plugin installs its PreToolUse guard globally (`plugins/dotmd/hooks.json:36-45`), but `evaluateGuard` lacks HUD's `configFound` gate (`src/guard.mjs:248-257`). An unrelated repository path named `docs/prompts/private.md` was classified as a dotmd prompt even when no dotmd config existed.

Prompt commit protection matches explicit prompt path tokens only. `git add .` and a pathless `git commit` receive no guard opinion, so the strongest advertised guardrail is bypassed by common agent commands.

Failed CLI invocations are always logged globally with full, unredacted arguments, and guard events retain command detail (`src/journal.mjs:139-182`, `src/journal.mjs:203-223`). Inline prompt bodies, `--message` values, commit text, replacement expressions, and credentials can therefore be persisted under `~/.claude/logs`.

Planning boundary: treat repository activation, staged-file inspection, and centralized redaction as one guard/privacy workstream.

### F7. The Notion integration is incompatible with its declared SDK - P1 - Confirmed

The package declares `@notionhq/client ^5.13.0`, whose current API exposes query under `client.dataSources.query`. Dotmd calls removed `client.databases.query` methods (`src/notion.mjs:209-229`) and expects database retrieval to return schema properties in the old location (`src/notion.mjs:303-305`). Import, export, and sync fail before useful work under the locked SDK.

The same integration serializes remote text into YAML without quoting or escaping (`src/notion.mjs:182-194`), and import checks file existence after writing, causing every successful creation to be reported as an update (`src/notion.mjs:280-287`). Existing tests cover help and missing credentials, not SDK contracts.

Planning boundary: either repair and contract-test the integration against the supported SDK, or stop advertising it until that work is complete.

### F8. Command grammar, help, validation, and completion lack one executable specification - P1 - Confirmed

Roadmap pickup is documented as `dotmd roadmap <hub> next`, but the dispatcher recognizes mutation only when `next` is the first argument (`bin/dotmd.mjs:1537-1548`). The show handler discards a later `next` token (`src/roadmap.mjs:95-98`), so the documented command exits successfully after displaying the roadmap instead of starting work.

`roadmap` and `roadmaps` are missing from `KNOWN_COMMANDS`, flag specs, completion metadata, and dedicated help (`src/commands.mjs:5-13`, `src/completions.mjs:23-75`, `bin/dotmd.mjs:28-64`). Invalid roadmap flags are silently accepted, and the completion drift test is circular because it derives expectations from the incomplete registry.

The same ownership problem affects flags: global normalization removes `--type` before `bulk-tag` can interpret it as a command-local override (`bin/dotmd.mjs:1350-1365`, `src/bulk-tag.mjs:38-47`). The optional `set` target contradiction in F2 is another symptom.

Planning boundary: one declarative command schema should own verb names, aliases, positional grammar, subcommands, flags and value arity, help, completion, and conformance tests.

### F9. Rename and generated outputs collapse path identity to basename - P1 - Confirmed

Rename selects files containing the old basename and performs an unrestricted string replacement (`src/rename.mjs:58-97`). A reproduced cross-directory move changed unrelated `grandchild.md` text, rewrote `a/child.md` to the broken `a/new.md`, and never produced the required `b/new.md` reference. References inside the moved file are skipped entirely.

HTML export names pages using only `path.basename`, so two documents such as `a/foo.md` and `b/foo.md` overwrite one output file (`src/export.mjs:245-270`). Graphviz DOT output similarly uses basename node identifiers and merges distinct documents (`src/graph.mjs:199-250`).

Planning boundary: preserve full path identity through resolution and use display slugs only as labels. Rename should reuse path-aware reference rewriting rather than raw text substitution.

### F10. Agent-facing context is not a stable, configuration-derived contract - P1 - Confirmed

`agent-context` hard-codes active statuses, omits built-in `partial`, mixes non-plan documents into plan buckets, duplicates awaiting/blocked plans, and silently slices arrays without totals or truncation signals (`bin/dotmd.mjs:1832-1860`). The current repository has three live partial plans while `plans.active` is empty.

The plugin says SessionStart prints the repository's valid status vocabulary, but HUD emits a fixed verb line with no statuses (`plugins/dotmd/skills/dotmd/SKILL.md:9,42`, `src/hud.mjs:341-350`). Default `stale` and `actionable` presets also retain hard-coded legacy status sets (`src/config.mjs:125-128`).

Pickup-card targeted-read ranges are body-relative but presented as full-file offsets (`src/pickup-card.mjs:72-75`, `src/pickup-card.mjs:226-255`). A reproduced card pointed six lines before the actual heading because it omitted frontmatter lines.

Planning boundary: define a versioned, bounded, type-correct agent context derived from resolved status metadata. Human cards and machine JSON should share coordinate and state semantics.

### F11. Dry-run and SessionStart still permit hidden side effects - P1 - Confirmed

Plan `use --dry-run` skips the frontmatter write but invokes `onPickup` unconditionally (`src/lifecycle.mjs:383-398`, `src/lifecycle.mjs:420-426`). A reproduced dry-run left the plan unchanged while a custom hook wrote external state.

`check --dry-run` still enables index auto-heal before command dry-run handling, so it can rewrite a stale generated index (`bin/dotmd.mjs:1643-1650`, `src/index-file.mjs:120-126`). HUD also requests auto-heal and silently rewrites index drift during SessionStart (`src/hud.mjs:248-256`).

Scope correction from the first pass: HUD no longer performs every warning-only cross-document check. Its `errorsOnly` mode substantially reduced the earlier performance finding. The remaining issue is hidden mutation plus an unavoidable O(corpus) parse and per-file validation pass, not the previously reported full validation cost.

Planning boundary: establish a cross-command invariant that dry-run and passive session hooks do not mutate local or external state.

### F12. Baton composes valid mutations but gives an incomplete commit boundary - P1 - Confirmed

Baton creates a prompt and releases the plan through normal mutation paths, both of which regenerate the shared index (`src/baton.mjs:195-235`). It then says only the plan is repository state and prints a plan-only commit command (`src/baton.mjs:240-257`). In a repository with a tracked generated index, baton left both the plan and index modified while instructing the agent to commit only the plan.

This is not an index-staleness finding: the final index is normally synchronized. It is a composite-operation and concurrency-boundary mismatch. Baton also has no supported `--no-index` mode.

Planning boundary: decide whether baton owns index regeneration and inclusion, or deliberately defers it. Its output, `--json` contract, and touched-file reporting should describe the same boundary.

### F13. Git-history and platform assumptions limit scale and portability - P2 - Confirmed

Ordinary index builds can invoke an unbounded full-history `git log` and buffer up to 10 MB (`src/git.mjs:53-68`, `src/index.mjs:113-139`). On large histories this adds latency; beyond the buffer limit the code silently returns no history and staleness checks disappear.

Multi-root ownership uses literal slash concatenation in several paths, watch derives an executable path from URL `.pathname`, and release automation requires Bash plus POSIX tools (`src/index.mjs:328-331`, `src/lifecycle.mjs:14-17`, `src/watch.mjs:6-9`, `package.json:46`). CI runs only on Ubuntu (`.github/workflows/ci.yml:9-20`).

Planning boundary: treat bounded Git metadata lookup and explicit supported-platform policy as separate decisions. Do not claim cross-platform behavior without path-focused Windows coverage.

### F14. Documentation and quiet partial plans preserve stale operational claims - P2 - Confirmed

README command and behavior descriptions lag shipped roadmap and runlist functionality, and several statements contradict runtime behavior. Examples include omitted roadmap commands, incomplete runlist mutation coverage, `context` described as compact, HUD described as silent when clean, and status transitions described as doing nothing beyond frontmatter.

The three live partial plans are not stale by configured age, but their metadata is stale. `dotmd-runlist-mutation` and `dotmd-plugin-skill-drift` still describe shipped Phase 1 work as the next step, while `dotmd-forward` mixes an unfinished current-state description with a drained next step. Because `partial` is intentionally quiet, current checks do not pressure this metadata to converge.

The changelog also stops at 0.61.0 while the package is 0.69.0.

Planning boundary: narrow README to onboarding and concepts, generate reference surfaces from the command schema, and define closure hygiene for quiet partial/archived snapshots.

### F15. A project-local OpenCode MCP is premature - P2 - Confirmed decision

No MCP server exists in the repository: there is no stdio entrypoint, protocol implementation, dependency, or project-local OpenCode configuration. Registering the one-shot CLI or a generic shell server would duplicate Bash and hide the command-contract defects above rather than test a real product surface.

Minimum prerequisite for an experiment: a smoke-tested stdio server supporting `initialize`, `tools/list`, and `tools/call`, with at least one read-only orientation tool backed by the corrected, versioned agent-context schema from F10. Mutation tools should wait for F1, F2, F4, and F8 so lifecycle and argument contracts are not duplicated again.

Once those prerequisites exist, configure it only in this checkout through project-local `opencode.json` and evaluate whether typed tools reduce recovery calls compared with direct CLI use.

## Root-Cause Groups

The 15 findings reduce to six planning streams:

1. **Lifecycle authority:** F1, F2, and F12.
2. **Safe mutation substrate:** F3, F4, F9, and the mutation half of F11.
3. **Release and trust boundaries:** F5 and F6.
4. **Executable command and agent contracts:** F8 and F10.
5. **Integration and operational durability:** F7 and F13.
6. **Self-maintenance and future interface work:** F14 and F15.

These groups are intentionally broader than implementation phases. The next planning pass should determine which can ship independently and where a shared primitive must land first.

## Prior Findings Not Reopened

The second pass checked historical audit records to avoid re-proposing shipped work. The following remain closed:

- `dotmd index` write-default and truthful remediation guidance;
- plan/doc/prompt body input and template preservation;
- reference did-you-mean hints and per-ref one-way opt-outs;
- prompt archive-before-emit ordering;
- generated plugin workflow drift checking;
- global flag placement and filtered count consistency;
- custom archive-status preservation and moved-file reference improvements;
- plugin global-install onboarding and missing-binary hints.

Still-open historical findings such as non-interactive `dotmd statuses` exiting successfully after abort and broad file-not-found suggestions are valid but lower priority than this audit's P0/P1 set. They should be considered during fix planning rather than silently folded into unrelated work.

## Validation Record

- Full suite before the second pass: 1,306/1,306 passing.
- Focused lifecycle/ownership suite: 182/182 passing.
- Focused mutation/release/integration suite: 164/164 passing.
- Focused command/guard/HUD suite: 89/89 passing.
- Reproductions ran in isolated temporary Git repositories outside the workspace.
- `dotmd briefing` reported no document errors or warnings before this audit document was created.
- Existing unrelated untracked archived documents and prompts were not modified.

Passing tests do not invalidate the findings: several defects are currently explicit behavior, while the adversarial cases lack coverage.

## Suggested Planning Order

1. Lifecycle authority and session ownership (F1, F2).
2. Safe mutation substrate and containment (F3, F4).
3. Release, guard, and privacy boundaries (F5, F6).
4. Command schema and agent contract (F8, F10).
5. Rename/path identity, dry-run, and baton boundaries (F9, F11, F12).
6. Notion, scale, portability, and documentation hygiene (F7, F13, F14).
7. MCP experiment only after its prerequisites are satisfied (F15).


## Version History

- **2026-07-10** Fix-planning pass completed and cross-reviewed: audit findings mapped into the ordered `dotmd-primary-consumer-hardening` runlist with 15 executable child plans and explicit F1-F15 ownership.
- **2026-07-09T23:27:20Z** Status: active → review — Second-pass findings source-verified, reproduced where safe, and ready for fix-planning review.
- **2026-07-09** Second-pass audit completed: 15 findings grouped into six root-cause streams; first-pass overstatements narrowed; MCP deferred behind lifecycle, command-schema, and agent-context prerequisites.
- **2026-07-09T23:16:17Z** Created.

## Related Documentation

- [`agent-ux-audit.md`](agent-ux-audit.md) - historical methodology audit; concrete A1-A5 findings shipped, with three lower-priority meta-sweep tails still open.
- [`audit-beyond-platform.md`](audit-beyond-platform.md) - historical large-corpus audit; useful context for scale and agent-friction priorities.
- [`archived/dotmd-review-findings-followups.md`](archived/dotmd-review-findings-followups.md) - prior implementation audit and shipped v0.64.0 follow-ups.
