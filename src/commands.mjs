// Canonical dispatcher registry. Every built-in command is classified here so
// adding a new dispatcher branch requires an explicit mutation/path policy.
// Dynamic config presets are the sole exception; they always dispatch to the
// read-only query engine.
const none = Object.freeze({ mutation: 'none', pathPolicy: 'read-only' });
const mutates = (pathPolicy) => Object.freeze({ mutation: 'conditional', pathPolicy });

export const COMMAND_POLICIES = Object.freeze({
  help: none,
  completions: none,
  list: none,
  json: none,
  coverage: none,
  stats: none,
  graph: none,
  deps: none,
  briefing: none,
  context: none,
  'agent-context': none,
  hud: none,
  focus: none,
  query: none,
  grep: none,
  plans: none,
  runlists: none,
  roadmaps: none,
  diff: none,
  summary: none,
  unblocks: none,
  health: none,
  glossary: none,
  modules: none,
  module: none,
  surfaces: none,
  journal: none,
  misuse: none,
  'self-check': none,

  init: mutates('repository setup paths and config files'),
  watch: mutates('proxy: child command policy applies'),
  roadmap: mutates('managed source when `next`; otherwise read-only'),
  prompts: mutates('managed sources/destinations by subcommand'),
  use: mutates('managed source when starting/consuming; docs remain read-only'),
  next: mutates('managed prompt source and same-root archive destination'),
  baton: mutates('managed plan/prompt sources and managed prompt destination'),
  export: mutates('external output path intentionally unrestricted'),
  guard: mutates('global misuse log; no managed document writes'),
  update: mutates('global CLI and plugin installation state'),
  runlist: mutates('managed hubs/children and managed scaffold destinations'),
  status: mutates('managed source and same-root destination'),
  set: mutates('managed source and same-root destination'),
  ship: mutates('repository release/index paths and global release tooling'),
  archive: mutates('managed source and same-root destination'),
  bulk: mutates('managed source sweep; archive destinations preserve roots'),
  'bulk-tag': mutates('managed source sweep'),
  touch: mutates('managed source or managed source sweep'),
  new: mutates('managed document destination; external body input unrestricted'),
  lint: mutates('managed source sweep with --fix; otherwise read-only'),
  rename: mutates('managed source, same-root destination, and rewrite sweep'),
  migrate: mutates('managed source sweep'),
  'fix-refs': mutates('managed source sweep'),
  doctor: mutates('managed sweeps, repo index, and maintenance config paths by mode'),
  statuses: mutates('project config path; document scan is read-only'),
  check: mutates('managed fix sweeps and repo-generated index; otherwise validation'),
  index: mutates('repo-generated index destination; --print is read-only'),

  // Removed commands still have dispatcher branches, but those branches only
  // return an error and cannot mutate.
  pickup: none,
  unpickup: none,
  release: none,
  finish: none,
  handoff: none,

  // Built-in read-only presets. User-defined presets follow the same policy.
  stale: none,
  actionable: none,
});

export const KNOWN_COMMANDS = Object.freeze(Object.keys(COMMAND_POLICIES));
export const MUTATION_CAPABLE_COMMANDS = Object.freeze(new Set(
  Object.entries(COMMAND_POLICIES)
    .filter(([, policy]) => policy.mutation !== 'none')
    .map(([command]) => command),
));

export function commandPolicy(command) {
  return COMMAND_POLICIES[command] ?? null;
}
