---
type: plan
status: archived
created: 2026-05-24T22:39:43Z
updated: 2026-05-25T22:13:16Z
surfaces: [cli, slash-commands]
modules: [init, slash-commands]
domain: agent-ux
audience: internal
parent_plan:
related_plans: slash-commands-self-heal.md
related_docs: docs/agent-ux-audit.md
current_state: Phases 1+2 shipped — baton.md template + wiring landed in src/claude-commands.mjs; tests green (809/809). Awaiting Phase 3 release decision.
next_step: Decide bundle-vs-standalone for 0.33.0 release (see Phase 3).
dotmd_version: 0.32.1
---

# `/baton` slash command

> Formalize the "save a resume prompt before context runs out" flow that `CLAUDE.md` documents but currently leaves to vibes. Agents do it inconsistently or not at all. Originating ask: "a /baton slash command that tells the session to wind down the session, update all related docs, prepare to handoff, and create the new resume prompt at docs/prompts with dotmd."

## Problem

The session-handoff workflow lives in `CLAUDE.md` § "Resume prompts saved for future sessions" as prose. Some sessions do it; some don't. When done, it's done at varying quality. Agents need a single verb that triggers the whole flow.

## Goals

After this ships, `/baton` is the canonical agent-facing wrap-up command. One verb that triggers: status-update the in-flight plan, write a lean handoff prompt (~10-20 lines per `[[feedback-one-handoff-prompt-per-session]]`), release the session lease.

## Non-Goals

- No new dotmd verb. `/baton` is purely a Claude-side prompt that calls existing dotmd commands (`dotmd status`, `dotmd new prompt`, `dotmd release`).
- No prescriptive 50-line handoff-prompt template in the slash-command body. Lean on Claude's judgment for what the next session needs; the prompt body's shape is the agent's call.

## What Exists Today

- `dotmd new prompt <name> - <<EOF body EOF` — creates a prompt under `docs/prompts/`.
- `dotmd hud` (SessionStart hook) — surfaces pending prompts at session boot.
- `dotmd release` — releases the session lease for the current in-session plan.
- `scaffoldClaudeCommands` in `src/init.mjs` — pattern for shipping `.claude/commands/*.md` templates (already produces `plans.md`, `docs.md`).
- `src/commands.mjs` `KNOWN_COMMANDS` — referenced by the regression test that verifies every `dotmd <verb>` in a generated slash-command resolves.
- `[[feedback-one-handoff-prompt-per-session]]` memory rule constraining prompt size — `/baton` enforces this implicitly by guiding agents to write lean prompts.

## Constraints

- Slash-command body references only verbs in `src/commands.mjs` `KNOWN_COMMANDS` (otherwise the regression test in `test/init.test.mjs` fails).
- Generated file must include the `dotmd-generated: <version>` banner so `doctor` knows when to regen.

## Decisions

- **D1.** Slash command only. No new dotmd verb. Adds zero CLI surface; uses existing verbs entirely.
- **D2.** Body content (the handoff prompt's shape) is Claude's judgment call, gated by the prompt-leanness rule. Don't over-specify in the slash-command body.
- **D3.** Scaffolded same way as `plans.md` and `docs.md` — same banner, same regen-on-banner-update behavior in `doctor`, same KNOWN_COMMANDS regression test.

## Open Questions

- ~~Naming: `/baton` (relay handoff metaphor) vs. `/handoff` / `/wrap` / `/passport`.~~ Resolved: `/baton` shipped (user's originating pick; no reason surfaced to revisit during implementation).

## Phases

### Phase 1 — Template + wiring ✅

- Add `baton.md` template alongside existing slash-command templates (check `src/init.mjs` `scaffoldClaudeCommands` for current location).
- Wire into the scaffolder registry so `dotmd init` creates it on fresh installs.
- Verify `dotmd doctor` regenerates it on banner-updated files (no new code; uses existing regen loop).
- ~40 lines.

Shipped: `generateBatonCommand()` added in `src/claude-commands.mjs`; baton.md added to `scaffoldClaudeCommands` files registry and to the `checkClaudeCommands` watchlist. `dotmd doctor` regen comes for free via the existing loop.

### Phase 2 — Tests ✅

- `test/init.test.mjs` extension: assert `baton.md` is scaffolded on fresh init (mirror existing `plans.md` test).
- Reuse the regression test that parses every backtick `dotmd <verb>` and asserts each resolves against `KNOWN_COMMANDS` (no new test code; covers `baton.md` automatically once it exists).
- 1 explicit new test.

Shipped: new `scaffolds baton.md slash-command on fresh init` test in `test/init.test.mjs`. Updated existing claude-commands.test.mjs assertions (`results.length`, hardcoded file list in the KNOWN_COMMANDS regression, the updated/skipped action tests) to include baton.md. 809/809 green.

### Phase 3 — Release ⬜

Bundle into 0.33.0 alongside `modules-dashboard.md` and agent-UX A1/A2/A3 if landing together — coherent "session-handoff + scale-triage + agent-UX foundations" release story. Otherwise standalone minor.

## Deferred

- Auto-trigger `/baton` on context-pressure detection. Out of scope; that's a Claude Code feature, not a dotmd feature.
- Lint that flags handoff prompts >20 lines in `dotmd check`. Reasonable follow-up if the prompt-leanness rule keeps getting violated; not v1.

## Version History

- **2026-05-25T22:13:16Z** Archived.
- **2026-05-25T21:26:52Z** Status: in-session → awaiting.
- **2026-05-25T21:22:38Z** Phases 1+2 shipped. `generateBatonCommand()` in `src/claude-commands.mjs` (~13-line body, references only KNOWN_COMMANDS verbs: `plans`, `status`, `archive`, `new`, `release`, `hud`); registered in scaffolder + checker. New init test + updated existing claude-commands tests. 809/809 green. Phase 3 (release) deferred pending bundle-vs-standalone decision.
- **2026-05-25T21:22:38Z** Picked up (planned → in-session).
- **2026-05-24T22:39:43Z** Created. Captured from chat discussion; design moved out of the originally-too-long `docs/prompts/feature-baton-slash-command.md` into this plan, per `[[feedback-one-handoff-prompt-per-session]]`.

## Closeout

<!-- Filled on archive: what shipped, key commits, deferrals dispositioned. -->
