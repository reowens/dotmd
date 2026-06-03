---
type: prompt
status: archived
created: 2026-05-25T21:26:49Z
updated: 2026-05-25T22:13:16Z
dotmd_version: 0.32.1
context: "Resume Baton Release"
related_plans:
---

`/baton` slash command — phases 1+2 shipped, awaiting release decision.

Plan: `docs/plans/baton-slash-command.md` (status: awaiting). Tests green (809/809). The plan body Phase 3 captures the open decision.

**Next concrete decision:** ship 0.33.0 as a bundled release with `modules-dashboard` + agent-UX A1/A2/A3, OR cut baton alone as 0.32.2. The plan recommends bundling if those siblings are close to ready — otherwise standalone is fine and clears the queue.

Files touched:
- `src/claude-commands.mjs` — new `generateBatonCommand()`, registered in scaffolder + checker
- `test/claude-commands.test.mjs` — count/list updates so existing scaffold/regression tests cover baton.md
- `test/init.test.mjs` — new `scaffolds baton.md slash-command on fresh init` test
- `docs/plans/baton-slash-command.md` — phase boxes ticked, history + open question updated

Gotcha: the KNOWN_COMMANDS regression at `test/claude-commands.test.mjs:158` has a hardcoded `['plans.md', 'docs.md', 'baton.md']` list. Any future slash command needs its filename added there too.

Release command per `CLAUDE.md`: `npm version minor` (or `patch` if standalone). It runs tests, bumps, tags, pushes, and publishes in one shot.

