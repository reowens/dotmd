---
type: plan
status: active
created: 2026-05-25T22:57:09Z
updated: 2026-05-25T22:57:09Z
surfaces: [cli]
modules: [validate, index]
domain: agent-ux
audience: internal
parent_plan:
related_plans:
related_docs: docs/agent-ux-audit.md
current_state: Plan drafted. Design call settled — per-ref `>` prefix wins over per-field config.
next_step: Pick up Phase 1 — parse the `>` prefix in `src/index.mjs:parseDocFile`.
---

# A4 — per-field unidirectional refs

> The bidirectional-reciprocity warning fires on every leaf→upstream-parent ref (audit doc, hub doc) the agent can't cleanly fix. Generalize the existing `referenceFields.unidirectional` mechanism so a ref can opt out of bidirectional enforcement without forcing edits to a "frozen" parent doc. Spec: `[[agent-ux-audit]]` § A4.

## Problem

`config.referenceFields.bidirectional = ['related_plans', 'related_docs']` is the default. Anything in that list triggers the "does not reference back" warning in `src/validate.mjs:checkBidirectionalReferences`. Right now in this repo, 5 of 6 `dotmd check` warnings are A4 false positives — leaf plans/docs referencing parent audit docs or sibling archived plans where back-refs would force editing a stable historical snapshot. The existing escape hatch (move the field to `unidirectional`) is all-or-nothing per field, and `related_docs` is genuinely bidirectional in some patterns (cross-references between sibling design docs).

## Goals

- Retire the 5 false-positive `does not reference back` warnings in this repo without losing legit reciprocity checks elsewhere.
- Make the opt-out cheap to express — an agent shouldn't have to edit a "frozen" parent doc to clear a warning.
- Keep the existing config shape backwards-compatible.

## Non-Goals

- Removing bidirectional checks entirely (legit signal for `related_plans` between sibling plans).
- LSP-style cross-doc refactoring.
- Per-field-globally-unidirectional config (deferred — the per-ref prefix covers the same use case more precisely; revisit if a user requests it).

## What Exists Today

- `src/config.mjs:86-92`: `referenceFields.bidirectional = ['related_plans', 'related_docs']`, `unidirectional = ['parent_plan']`. Per-field, all-or-nothing.
- `src/validate.mjs:checkBidirectionalReferences` (line ~258): iterates `referenceFields.bidirectional` only, builds a refMap, warns when A→B has no B→A entry in the same biField.
- Five warnings live in this repo right now: 3 upstream-parent refs (`agent-ux-audit.md`, `audit-beyond-platform.md`) and 2 archived sibling refs.

## Constraints

- Backwards compat: existing configs with `referenceFields: { bidirectional: [...], unidirectional: [...] }` must keep working unchanged.
- No new file format. The opt-out lives in frontmatter, not a sidecar.

## Decisions

- **D1. Per-ref `>` prefix wins over per-field config.** Per-field would force the user to choose: `related_docs` is bidirectional everywhere OR nowhere. Real corpora mix (sibling cross-refs = bi, upstream parent = uni). Per-ref opt-out via a `>` prefix on the value matches existing markdown-link semantics and stays in the ref where the intent lives. Example:
  ```
  related_docs:
    - docs/sibling-design.md            # bidirectional (default for the field)
    - "> docs/audit-beyond-platform.md" # one-way upstream — no back-ref expected
  ```
- **D2. The prefix is parsed and stripped before path resolution.** `src/index.mjs:parseDocFile` already normalizes ref values into `doc.refFields[field]`. Add normalization there: detect leading `>` (with optional whitespace), strip it, and record the directionality on a parallel structure (e.g. `doc.refFieldDirections[field][i] = 'one-way' | 'two-way'`).
- **D3. `checkBidirectionalReferences` skips one-way entries on the outbound side.** A→B with `>` prefix means "I reference B, but B is not expected to reference me back." The existing refMap-symmetry check loops on bidirectional fields; add a guard that skips the warning for entries marked one-way.
- **D4. Default directionality for built-in fields stays the same.** `related_plans` and `related_docs` are bidirectional by default. The `>` prefix is opt-in per ref, not a new default.

## Open Questions

- Should `parent_plan` (already in `unidirectional`) ALSO accept the `>` prefix as a no-op for consistency? Probably yes — orthogonal, but harmless. Settle at implementation.
- Should `dotmd check` render the `>` prefix in its output? Probably no — output shows the resolved path, not the literal frontmatter.

## Phases

### Phase 1 — Parse the `>` prefix ⬜

- In `src/index.mjs:parseDocFile`, where `refFields[field]` is populated, detect a leading `>` (with optional surrounding whitespace) and:
  - Strip it to the canonical path (so ref-resolution still works).
  - Store directionality alongside, e.g. `doc.refFieldDirections = { related_docs: ['two-way', 'one-way'] }` indexed parallel to `doc.refFields[field]`.
- Grep for `normalizeStringList` usage near ref fields to find the canonical normalization site.
- Tests in `test/index.test.mjs`: ref value `> docs/foo.md` parses to path `docs/foo.md` with directionality `one-way`; plain `docs/foo.md` stays `two-way`; mixed list parses correctly per-entry.
- ~30 LOC + tests.

### Phase 2 — Skip reciprocity warning for one-way refs ⬜

- In `src/validate.mjs:checkBidirectionalReferences`, skip entries marked `one-way` on the outbound side when checking reciprocity.
- Tests: A → `> B` should NOT warn even if B does not reference A back. A → B (no prefix) and B → A still satisfies reciprocity normally. Mixed list (some `>`, some not) only checks the un-prefixed ones.
- ~10 LOC + tests.

### Phase 3 — Retire the false positives in this repo ⬜

- Edit `docs/archived/agent-ux-a1-a3.md` and `docs/plans/modules-dashboard.md` so `related_docs: docs/agent-ux-audit.md` becomes `related_docs: "> docs/agent-ux-audit.md"`.
- Edit `docs/agent-ux-audit.md` so its reference to `docs/audit-beyond-platform.md` gets the prefix.
- Edit `docs/archived/baton-slash-command-20260525T221316Z.md` and `docs/archived/audit-followup.md` similarly.
- Run `dotmd check` — should drop from 6 warnings to 0.
- ~5-doc edit, no code change.

### Phase 4 — Document + release ⬜

- README: short note under the ref-fields section about the `>` prefix.
- CHANGELOG entry under 0.35.0 (additive, no breaking change). Call out the convention with a one-line example.
- `npm version minor` → 0.35.0.

## Deferred

- Per-field-globally-unidirectional config opt-in. The `>` prefix covers the same use case more precisely; revisit only if a user requests it.
- Generalizing the `>` prefix to body links (e.g. inside `[text](path.md)` syntax). Probably never wanted; markdown links are read-only references by nature, and bidirectional checks only run on frontmatter.
- A3 follow-up (extend `Did you mean` to `dotmd status <file> <unknown-status>`) — same suggestion helper, new wire-up site. Trivial; could bundle into 0.35.0 if scope allows.
- A2-template-overlap polish: `dotmd new plan <name> "<full-plan-body>"` leaves a duplicate scaffold below the inserted body (discovered drafting this very plan). Either detect/strip overlap, or document that A2's body insertion is for a SECTION'S worth of content, not a full plan.

## Version History

- **2026-05-25** Created. Spec: `[[agent-ux-audit]]` § A4. Deferred from the 0.34.0 release because A4 needed a config-schema design call; that decision is now in D1 (per-ref `>` prefix wins).

## Closeout

<!-- Filled on archive: what shipped, key commits, deferrals dispositioned. -->
