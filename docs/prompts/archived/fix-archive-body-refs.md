---
type: prompt
status: archived
created: 2026-05-27T09:31:59Z
updated: 2026-05-27T09:45:48Z
dotmd_version: 0.40.1
context: "Fix Archive Body Refs"
related_plans:
---

Fix the asymmetry in `dotmd archive`'s ref updates.

**Bug:** When a file is archived, `updateRefsAfterMove` (src/lifecycle.mjs:825) only updates frontmatter refs in other docs — it never touches body markdown links `[text](path.md)`. Meanwhile `updateRefsFromMovedFile` (line 863) DOES fix body links, but only inside the archived file itself.

**Effect:** "Updated references in N file(s)" is misleading. After archive, sibling docs that link to the moved file in prose have broken links.

**Fix:** Extend `updateRefsAfterMove` (line 825) to also scan and rewrite body markdown links matching `/\[[^\]]*\]\(([^)]+\.md)\)/g`. Mirror the logic from `updateRefsFromMovedFile` lines 886-895 — same regex, same `resolveRefPath` + `path.relative` rebuild. Honor the same skip-http guard.

**Tests to add:**
- archive a file referenced by another doc's body link → other doc's body link is rewritten to the archived path
- archive when the link uses `./` prefix → rewritten correctly
- http(s) links left alone
- "Updated references in N file(s)" count includes body-only-touched files

**Verification:** repro with two docs A.md and B.md where A's body contains `[B](./B.md)`. `dotmd archive B.md` → A.md's body link should now point to `archived/B.md` (or however the relative path resolves from A's location).

Reported by a sibling Claude session; verified in this session.

