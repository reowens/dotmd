---
type: prompt
status: archived
created: 2026-06-10T08:48:25Z
updated: 2026-06-10T09:27:32Z
dotmd_version: 0.59.0
context: "Resume Agent Ux Round B"
related_plans:
---

Resume: agent-ux round-B runlist (docs/plans/agent-ux-round-b.md). b1–b3 shipped + committed; b4 is next.

Pick up: `dotmd runlist next agent-ux-round-b` → b4-body-keyword-search.
- b4: add `--body` to `dotmd query` — lazy body scan (filter on frontmatter fields first, read bodies only for survivors), 1–2 matching-line excerpts per hit, compose with --type/--status/--limit, --json. Then `dotmd grep <term>` alias. Key spot: the keyword filter in src/query.mjs (~line 190).
- b5 after: FIRST reproduce the health-repo `edit-status` misuse hits (health/STATUS.md may be a filename false positive) before any deny escalation or sed/perl coverage.

Gotchas:
- Never read `$?` after a pipe — that's how the refuted b2 exit-code finding happened (`| head` swallows the code).
- `set paused` refiles plans into plans/held/ (filed-primitive); use `planned` in tests that assert a stable path.
- appendVersionHistory now takes { createSection } — notes create the VH section, plain transitions still skip bare docs.
- Close plans with `dotmd set <status> --note "why"` / `archive --note` (b3 feature — dogfood it).
- dotmd.config.example.mjs has the user's own pre-session modification — leave it uncommitted, don't include it in pathspecs.
- Suite was at 1054 passing; run `npm test` before any commit. Commit per-plan (one feat commit + docs commit pattern from b1–b3). Release (`npm version minor`) only when the user asks — likely after the runlist drains.

