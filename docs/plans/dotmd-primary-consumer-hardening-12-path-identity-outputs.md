---
type: plan
status: planned
created: 2026-07-10T06:00:55Z
updated: 2026-07-10T06:00:55Z
parent_plan: dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: This child owns only the generated-output half of F9. Transactional Moves owns rename identity; HTML and Graphviz can ship independently once their output mappings preserve canonical document paths.
next_step: Define one deterministic path-to-output-ID mapping for single-root and multi-root documents, then use it consistently for HTML files/links and DOT node IDs.
---

# Path Identity Outputs

> Runlist child of [Dotmd Primary Consumer Hardening](dotmd-primary-consumer-hardening.md).

## Problem

HTML export writes pages by basename and silently overwrites duplicate names. DOT generation uses basename node IDs and merges distinct documents into one graph node.

## Phases

### Phase 1 - Output Identity Map ⬜

- Map canonical document identity to deterministic root-relative output paths/IDs.
- Preserve current top-level single-root `a.md -> a.html` behavior where collision-free.
- Prefix root identity when multi-root relative paths collide.

### Phase 2 - HTML Export ⬜

- Write nested/collision-safe pages and derive TOC/internal links from the same map.

### Phase 3 - Graphviz DOT ⬜

- Use full path IDs and short title/slug labels.
- Escape IDs and labels independently.

## Acceptance

- `a/foo.md` and `b/foo.md` produce two pages and two graph nodes.
- Multi-root equal relative paths remain distinct.
- Existing collision-free top-level output remains compatible.
- Every generated HTML link resolves to an emitted page.


## Version History

- **2026-07-10T06:00:55Z** Created (runlist child of dotmd-primary-consumer-hardening).
