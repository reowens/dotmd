---
type: plan
status: archived
created: 2026-07-10T06:00:55Z
updated: 2026-07-12T21:29:22Z
parent_plan: ../plans/dotmd-primary-consumer-hardening.md
related_plans:
related_docs:
  - "> ../dotmd-primary-consumer-audit.md"
current_state: Shipped. HTML export now allocates deterministic path-safe identities from the full corpus, rewrites emitted document links, and validates output ancestry before publication; DOT preserves full path IDs and tuple-safe edge identity.
next_step: None. Follow-up work, if needed, belongs in a separate persistent export-manifest or broader Markdown-renderer plan.
---

# Path Identity Outputs

> Runlist child of [Dotmd Primary Consumer Hardening](../plans/dotmd-primary-consumer-hardening.md).

## Problem

HTML export writes pages by basename and silently overwrites duplicate names. DOT generation uses basename node IDs and merges distinct documents into one graph node.

The full identity is already available before rendering: indexed documents use slash-normalized `doc.path`, graph nodes use that path as `id`, and graph edges retain full source and target paths. The primary collapse is isolated to `src/export.mjs` and `renderGraphDot()` in `src/graph.mjs`; tuple-safe edge identity also requires a narrow correction in `buildGraph()`.

HTML has two additional identity failures that must be solved with the filename collision:

- a document named `index.md` overwrites the generated site index;
- Markdown document links remain `.md` paths rather than links to emitted HTML pages.

## Goals

- Define one pure, deterministic logical-path-to-output identity contract.
- Preserve top-level, collision-free single-root output such as `docs/a.md -> a.html`.
- Allocate distinct HTML pages for nested duplicates, equal multi-root relative paths, reserved names, case-fold collisions, and file/directory prefix conflicts.
- Keep HTML page paths stable across filtered and full exports by allocating from the full indexed corpus.
- Use full logical paths for all real and synthetic DOT node IDs while retaining short labels.
- Escape filesystem paths, URL paths, HTML attributes, DOT IDs, and DOT labels at their own boundaries.
- Keep existing Markdown export, JSON export, graph JSON, graph text, index, reference, and lifecycle contracts unchanged.

## Non-Goals

- Canonicalizing output identity through `realpath`, inode, or machine-local absolute paths.
- Replacing the minimal Markdown renderer with a full CommonMark implementation.
- Cleaning stale files from an existing export directory.
- Changing `toSlug()` globally or disambiguating every basename used in human CLI views.
- Changing graph JSON fields or adding output identity metadata to indexed documents.

## Design Decisions

### Portable logical identity

- Normalize and key documents by `doc.path`; reject duplicate logical keys rather than choosing a winner.
- Treat `doc.root` as the owning lexical root and derive the root-relative source path from it. Overlapping roots therefore retain the most-specific root chosen by indexing.
- Never expose absolute paths or use physical filesystem identity in generated IDs.

### HTML allocation

- Build the map from the complete `index.docs` corpus before applying export selection. Emitting a subset must not change a document's URL.
- The preferred path is the owning-root-relative source path with only the terminal `.md` changed to `.html`:
  - `docs/a.md -> a.html`
  - `docs/guides/a.md -> guides/a.html`
- Reserve root `index.html` for the site index.
- Compare candidates by exact path, case-folded path, and file/directory prefix occupancy. This catches case-insensitive hosts and candidates such as `foo.md -> foo.html` versus `foo.html/bar.md -> foo.html/bar.html`.
- Reserve a fixed fallback namespace such as `__dotmd/`. Any preferred path inside that namespace is itself treated as conflicting.
- Allocate every conflict as a leaf under that namespace using a lowercase SHA-256 digest of the full logical path, not iteration order or a numeric suffix. Validate the digest-to-logical-path map and fail closed on the theoretical hash collision.
- Because preferred paths cannot occupy the namespace and fallback pages cannot be parent directories, fallback allocation reaches a fixed point without second-order exact, case-fold, or prefix conflicts.
- Validate final paths as unique, relative, contained under the output directory, and independent of input ordering before writing anything.
- Resolve the chosen output root through its nearest existing ancestor, record its physical identity, and reject any existing symlink in a destination's descendant path. Revalidate physical ancestry immediately before directory creation and page publication; the output root itself may be an intentional symlink, but a nested symlink may not redirect a page outside it.
- Create parent directories component-by-component only after the full allocation and render plan succeeds. Existing unrelated output files remain out of scope, but no two files in one invocation may overwrite each other.

### HTML URLs and links

- Convert filesystem output paths to URL paths by percent-encoding segments, then HTML-escape the final attribute value.
- Derive TOC links, nested-page links back to `index.html`, and body document links from the same map.
- Resolve inline Markdown links using the existing document-relative then repository-relative precedence and preserve fragment text.
- Rewrite an internal document link only when its canonical target is part of the emitted subset.
- For a known but filtered-out document or unresolved local `.md` target, render the label without an anchor so the export does not manufacture a dead site link. External URLs, fragment-only links, and non-document assets retain their original destinations.
- "Resolves" means the emitted page component exists. The current renderer does not generate heading IDs, so validating or guaranteeing fragment anchors is explicitly out of scope.
- Keep link conversion limited to syntax the current renderer already turns into anchors; broader Markdown parsing and heading-anchor generation are not required by this child.

### DOT identity

- Declare real nodes by full `node.id` and edges by full `edge.source` / `edge.target`.
- Declare broken and filter-external synthetic nodes by their full target path, so they cannot alias each other or a real node with the same basename.
- Keep `node.slug` or target basename as the visual label only.
- Quote and escape IDs, labels, statuses, and edge-field labels with a DOT-string encoder that handles backslashes, quotes, CR/LF, and control characters. HTML escaping is not reused.
- Replace delimiter-concatenated graph identity keys with tuple-safe keys (nested maps or unambiguous structural encoding) for edge deduplication, reverse-edge lookup, and rendered-edge tracking. A legal `|` in a path or configured field must not merge distinct edges.
- Preserve mutual-edge detection and visual styling; graph JSON remains byte-shape compatible apart from its timestamp.

## Implementation Shape

- Add a small pure module, `src/output-identity.mjs`, responsible for logical-key validation, root-relative candidates, deterministic fallback allocation, path conflict detection, and URL conversion.
- Return a map keyed by `doc.path` with at least `logicalId`, `label`, `htmlPath`, and `htmlUrl`.
- Keep output identity out of `buildIndex()` and frontmatter. `runExport()` owns allocation because it has both the full corpus and selected subset.
- Pass the map and emitted-path set through `exportHtml()`, `buildIndexPage()`, `buildDocPage()`, and the Markdown link callback.
- Have `renderGraphDot()` consume the same logical-ID/label rules without mutating the graph model.
- Add pure allocator tests in `test/output-identity.test.mjs`; retain CLI integration coverage in `test/export.test.mjs`, `test/graph.test.mjs`, and `test/multi-root.test.mjs`.

## Phases

### Phase 1 - Output Identity Map ✅

- Implement normalized logical keys and owning-root-relative candidates.
- Preserve collision-free top-level compatibility.
- Detect reserved, exact, case-folded, and prefix conflicts before mutation.
- Allocate conflict fallbacks in the reserved hash namespace and prove fixed-point, order, and subset independence.
- Reject duplicate logical keys, malformed root ownership, traversal in root-relative output candidates/final paths, or any non-unique final allocation. Normalized logical IDs may retain leading `..` when they identify documents in configured roots outside the repository.

### Phase 2 - HTML Export ✅

- Build identity from the full corpus and render only the selected subset.
- Precompute every destination and page before creating directories or writing files.
- Write nested/collision-safe pages and derive TOC, index navigation, and body links from the same map.
- Preserve fragments and external/asset links; do not emit anchors to omitted or unresolved Markdown documents.
- Reject existing descendant symlinks and revalidate physical output ancestry before publication.
- Make dry-run execute the same allocation, link resolution, rendering, collision checks, and existing-ancestor validation as a real export while creating no output directories or files.

### Phase 3 - Graphviz DOT ✅

- Use full path IDs for real nodes, synthetic nodes, and every edge endpoint.
- Keep short title/slug labels for readability.
- Escape IDs, labels, statuses, and edge fields independently.
- Replace `|`-joined deduplication and mutual-edge keys with tuple-safe identity structures.
- Preserve graph JSON and existing style/mutual-edge behavior.

### Phase 4 - Compatibility And Adversarial Verification ✅

- Exercise nested duplicates, multi-root equal relative paths, `index.md`, reserved-namespace sources, case-only names, unusual characters, preferred/fallback interactions, and file/directory conflicts.
- Verify every emitted internal HTML href resolves to an emitted page and nested pages navigate back to the site index.
- Verify filtered exports retain the same allocated URL as full exports.
- Verify descendant output symlinks fail before writes and dry-run reports the same planning errors without mutation.
- Parse generated DOT with Graphviz when `dot` is available; otherwise assert exact quoted IDs and escapes.
- Run the full suite, `dotmd check`, skill drift, and an adversarial collision/portability review.

## Acceptance

- `a/foo.md` and `b/foo.md` produce two pages and two graph nodes.
- Multi-root equal relative paths remain distinct.
- Existing collision-free top-level output remains compatible.
- `index.md` cannot replace the generated site index.
- Case-fold and file/directory conflicts are detected before any page write.
- Preferred and fallback pages cannot collide, including documents whose source path starts with the reserved fallback namespace.
- Full and filtered exports assign the same URL to the same document.
- Every generated internal HTML link's page component resolves to an emitted page; omitted document targets are not emitted as dead anchors. Fragment text is preserved, but heading-anchor validation is out of scope.
- Nested pages link back to the root site index with the correct relative URL.
- A nested symlink in an existing output tree cannot redirect a generated page outside the chosen physical output root.
- DOT uses distinct full-path IDs for real, broken, and external nodes and remains valid with quotes, backslashes, and control characters.
- Paths and fields containing `|` cannot collide during graph edge deduplication or mutual-edge detection.
- Graph JSON and collision-free top-level HTML behavior remain compatible.

## Test Matrix

- Pure map: top-level, nested, duplicate basename, multi-root duplicate relative path, overlapping roots, reserved index and fallback namespace, case-fold collision, prefix conflict, preferred/fallback interaction, unsafe segments, duplicate logical IDs, shuffled input, and selected-subset stability.
- HTML: two duplicate pages exist with distinct TOC links; all local page hrefs resolve; fragments survive textually; external and asset links remain; omitted docs render without dead anchors; nested index navigation works; nested symlinks fail; dry-run performs validation and creates nothing.
- DOT: duplicate basenames remain separate; edges bind to full targets; real/synthetic and synthetic/synthetic basename collisions remain separate; unusual IDs/labels and `|` tuple components remain distinct and escaped; mutual edges still collapse to one `dir=both` edge.
- Multi-root: equal relative names receive stable distinct HTML paths and DOT IDs while graph JSON keeps existing full paths.

## Risks And Boundaries

- Nested documents intentionally move from today's flat basename URL to a nested path; only collision-free top-level URLs are compatibility-protected.
- Filter-stable allocation means adding a new conflicting document can change a previously preferred URL. Once a persistent export manifest is required, that belongs in a separate versioned-output plan.
- Roots outside the repository can produce logical paths containing `..`; the fallback encoder and containment validation must prevent those segments from becoming output traversal.
- Case-insensitive collision checks are conservative on case-sensitive hosts by design, so generated sites remain portable.
- Physical output checks remain path-based; completely eliminating ancestor-swap TOCTOU would require descriptor-relative filesystem APIs unavailable in Node's portable API.
- Existing stale pages are not deleted. The command guarantees no collisions among files planned by the current invocation, not a clean mirror of the destination directory.
- Links beyond the current renderer's inline-link syntax remain out of scope rather than gaining a second incomplete Markdown parser.

## Closeout

- Added deterministic, portable HTML output identities with collision fallbacks and full-corpus allocation.
- Reworked HTML publication and links around the shared identity map with dry-run-equivalent path safety checks.
- Preserved full logical identity in DOT and replaced delimiter-based graph keys with tuple-safe maps.
- Verified the implementation with the full suite, focused adversarial cases, Graphviz parsing, and independent review.


## Version History

- **2026-07-12T21:29:22Z** Archived — Shipped deterministic HTML output allocation and link rewriting, guarded publication, full-path DOT identities, and tuple-safe edge handling; full and adversarial suites pass.
- **2026-07-12** Shipped deterministic output identity allocation, collision-safe HTML export and links, guarded publication, full-path DOT IDs, tuple-safe graph keys, and adversarial coverage.
- **2026-07-12T21:15:32Z** Started (planned → in-session).
- **2026-07-12** Preplanned output identity allocation, HTML link behavior, DOT identity/escaping, compatibility boundaries, and adversarial test coverage.
- **2026-07-10T06:00:55Z** Created (runlist child of dotmd-primary-consumer-hardening).
