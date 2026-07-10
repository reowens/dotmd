import { spawnSync } from 'node:child_process';
import { existsSync, renameSync } from 'node:fs';
import path from 'node:path';

// Best-effort `git check-ignore` for a path. Returns true only when git
// definitively reports the path is ignored; any failure (not a repo, git
// missing, path outside the tree) returns false so callers never block on a
// false positive. Used by the guard hook and `dotmd new` to warn that a
// freshly-created doc lives under a gitignored path (the "agent tries to
// commit a session-local prompt" confusion).
export function isGitIgnored(absPath, repoRoot) {
  try {
    const result = spawnSync('git', ['check-ignore', '-q', '--', absPath], {
      cwd: repoRoot || process.cwd(),
      encoding: 'utf8',
    });
    // exit 0 → ignored, 1 → not ignored, 128 → not a git repo / other error.
    return result.status === 0;
  } catch {
    return false;
  }
}

let gitChecked = false;
function ensureGit() {
  if (gitChecked) return;
  const result = spawnSync('git', ['--version'], { encoding: 'utf8' });
  if (result.error) {
    throw new Error('git is not installed or not found in PATH. dotmd requires git for this operation.');
  }
  gitChecked = true;
}

export function getGitLastModified(relPath, repoRoot) {
  const result = spawnSync('git', ['log', '-1', '--format=%aI', '--', relPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.error || result.status !== 0 || !result.stdout.trim()) return null;
  return result.stdout.trim();
}

export function getGitFirstAdded(relPath, repoRoot) {
  const result = spawnSync('git', ['log', '--diff-filter=A', '--follow', '--format=%aI', '--', relPath], {
    cwd: repoRoot, encoding: 'utf8',
  });
  if (result.error || result.status !== 0 || !result.stdout.trim()) return null;
  // `git log` returns newest-first; the file's add commit is the LAST entry.
  const lines = result.stdout.trim().split('\n').filter(Boolean);
  return lines[lines.length - 1] ?? null;
}

export function getGitLastModifiedBatch(repoRoot) {
  const result = spawnSync('git', [
    'log', '--format=commit %aI', '--name-only', '--diff-filter=ACDMR', 'HEAD',
  ], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (result.error || result.status !== 0) return new Map();

  const map = new Map();
  let currentDate = null;
  for (const line of result.stdout.split('\n')) {
    if (line.startsWith('commit ')) {
      currentDate = line.slice(7).trim();
    } else if (line && currentDate && !map.has(line)) {
      map.set(line, currentDate);
    }
  }
  return map;
}

function parseNullPaths(result) {
  if (result.error || result.status !== 0) return [];
  return result.stdout.split('\0').filter(Boolean);
}

function parsePorcelainRecords(result) {
  if (result.error || result.status !== 0) return [];
  const fields = result.stdout.split('\0').filter(Boolean);
  const records = [];
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    if (field.length < 4 || field[2] !== ' ') continue;
    const status = field.slice(0, 2);
    records.push({ status, path: field.slice(3) });
    // In porcelain v1 -z, rename/copy records put the destination first and
    // the old source path in the following NUL field. The command includes the
    // destination state, not the now-missing live source.
    if (/[RC]/.test(status)) i += 1;
  }
  return records;
}

function parseShortOptions(arg, valueOptions = new Set()) {
  const parsed = { options: new Set(), consumesNext: false };
  if (!/^-[^-]/.test(arg)) return parsed;
  const chars = arg.slice(1);
  for (let i = 0; i < chars.length; i++) {
    const option = chars[i];
    parsed.options.add(option);
    if (valueOptions.has(option)) {
      parsed.consumesNext = i === chars.length - 1;
      break; // remaining characters are this option's attached value
    }
  }
  return parsed;
}

function hasShortOption(args, option, valueOptions = new Set()) {
  return args.some(arg => parseShortOptions(arg, valueOptions).options.has(option));
}

function gitPathspecs(args, subcommand) {
  const separator = args.indexOf('--');
  if (separator >= 0) return args.slice(separator + 1);
  const valueFlags = subcommand === 'commit'
    ? new Set(['-m', '--message', '-F', '--file', '-C', '-c', '--reuse-message', '--reedit-message', '-t', '--template', '--author', '--date', '--cleanup', '--fixup', '--squash', '--trailer'])
    : new Set(['--chmod', '--pathspec-from-file']);
  const paths = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (valueFlags.has(arg)) { i += 1; continue; }
    if (subcommand === 'commit' && /^-[^-]/.test(arg)) {
      const short = parseShortOptions(arg, new Set(['m', 'F', 'C', 'c', 't', 'S']));
      if (short.consumesNext) i += 1;
      continue;
    }
    if (arg.startsWith('-')) continue;
    paths.push(arg);
  }
  return paths;
}

// Paths a broad `git add`/`git commit` would actually include. Read-only and
// fail-open: any Git error returns an empty list so the PreToolUse guard never
// blocks on an uncertain repository state.
export function inspectGitCommandPaths(subcommand, args, repoRoot) {
  try {
    if ((subcommand === 'add' || subcommand === 'stage')
      && (hasShortOption(args, 'n') || args.includes('--dry-run'))) return [];
    if (subcommand === 'commit' && args.includes('--dry-run')) return [];
    const pathspecs = gitPathspecs(args, subcommand);
    if (subcommand === 'add' || subcommand === 'stage') {
      const cmd = ['status', '--porcelain=v1', '-z', '--untracked-files=all'];
      if (pathspecs.length > 0) cmd.push('--', ...pathspecs);
      const updateOnly = hasShortOption(args, 'u') || args.includes('--update');
      const records = parsePorcelainRecords(spawnSync('git', cmd, { cwd: repoRoot, encoding: 'utf8' }));
      const paths = records
        .filter(record => !updateOnly || record.status !== '??')
        .map(record => record.path)
        .filter(candidate => existsSync(path.resolve(repoRoot, candidate)));
      const forceAll = hasShortOption(args, 'A') || args.includes('--all');
      if ((hasShortOption(args, 'f') || args.includes('--force')) && (pathspecs.length > 0 || forceAll)) {
        const ignoredCmd = ['ls-files', '--others', '--ignored', '--exclude-standard', '-z'];
        if (pathspecs.length > 0) ignoredCmd.push('--', ...pathspecs);
        paths.push(...parseNullPaths(spawnSync('git', ignoredCmd, { cwd: repoRoot, encoding: 'utf8' })));
      }
      return [...new Set(paths)];
    }
    if (subcommand !== 'commit') return [];

    const commands = [];
    const commitValueOptions = new Set(['m', 'F', 'C', 'c', 't', 'S']);
    const commitAll = args.includes('--all') || hasShortOption(args, 'a', commitValueOptions);
    if (pathspecs.length > 0) {
      const hasHead = spawnSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).status === 0;
      if (hasHead) commands.push(['diff', 'HEAD', '--name-only', '--diff-filter=ACMR', '-z', '--', ...pathspecs]);
      else commands.push(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z', '--', ...pathspecs]);
      if (args.includes('-i') || args.includes('--include')) {
        commands.push(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']);
      }
    } else if (commitAll) {
      // commit -a replaces tracked index entries with worktree state. Comparing
      // HEAD directly to the worktree models that final commit and avoids a
      // false deny when a staged prompt change was subsequently reverted.
      commands.push(['diff', 'HEAD', '--name-only', '--diff-filter=ACMR', '-z']);
    } else {
      commands.push(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']);
    }
    return [...new Set(commands.flatMap(cmd => parseNullPaths(spawnSync('git', cmd, { cwd: repoRoot, encoding: 'utf8' }))))];
  } catch {
    return [];
  }
}

export function listStagedPaths(repoRoot) {
  const result = spawnSync('git', ['diff', '--cached', '--name-only', '--no-renames', '-z'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Cannot inspect staged files: ${result.error?.message || result.stderr.trim() || 'git diff failed'}`);
  }
  return result.stdout.split('\0').filter(Boolean);
}

export function assertGitIndex(repoRoot, expectedPaths = []) {
  const actual = [...new Set(listStagedPaths(repoRoot))].sort();
  const expected = [...new Set(expectedPaths)].sort();
  if (actual.length === expected.length && actual.every((item, index) => item === expected[index])) {
    return actual;
  }

  const expectedLabel = expected.length > 0 ? expected.join(', ') : 'empty';
  const actualLabel = actual.length > 0 ? actual.join(', ') : 'empty';
  throw new Error(`Git index mismatch (expected: ${expectedLabel}; staged: ${actualLabel}). Commit or unstage existing work before releasing.`);
}

export function gitMv(source, target, repoRoot) {
  ensureGit();
  // Source is untracked (scaffolded this session, never committed; or repoRoot
  // is not a git repo at all): a plain rename is the only correct move. `git mv`
  // would error with `fatal: not under version control` and the user can't act
  // on that — the file is genuinely a doc, just not yet staged.
  if (!isTracked(source, repoRoot)) {
    const absSource = path.isAbsolute(source) ? source : path.join(repoRoot, source);
    const absTarget = path.isAbsolute(target) ? target : path.join(repoRoot, target);
    try {
      renameSync(absSource, absTarget);
      return { status: 0, stderr: '' };
    } catch (err) {
      return { status: 1, stderr: err.message };
    }
  }
  const result = spawnSync('git', ['mv', source, target], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return { status: result.status, stderr: result.stderr };
}

function isTracked(source, repoRoot) {
  const relSource = path.isAbsolute(source) ? path.relative(repoRoot, source) : source;
  const result = spawnSync('git', ['ls-files', '--error-unmatch', '--', relSource], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return result.status === 0;
}

export function gitDiffSince(relPath, sinceDate, repoRoot, opts = {}) {
  ensureGit();
  // Find the last commit at or before sinceDate
  const baseline = spawnSync('git', [
    'log', '-1', '--before=' + sinceDate + 'T23:59:59', '--format=%H', '--', relPath
  ], { cwd: repoRoot, encoding: 'utf8' });

  const baseRef = baseline.stdout.trim();
  if (!baseRef) return null;

  const diffArgs = ['diff', baseRef, 'HEAD'];
  if (opts.stat) diffArgs.push('--stat');
  diffArgs.push('--', relPath);

  const result = spawnSync('git', diffArgs, { cwd: repoRoot, encoding: 'utf8' });
  return result.stdout || null;
}
