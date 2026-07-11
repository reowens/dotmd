import { afterEach, describe, it } from 'node:test';
import { match, ok, strictEqual, throws } from 'node:assert';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  createFileExclusive,
  moveFileAtomic,
  mutateFileSet,
  MutationConflictError,
  replaceSnapshot,
  snapshotFile,
  withPathLocks,
} from '../src/atomic-mutation.mjs';
import { resolveConfig } from '../src/config.mjs';
import { runArchive } from '../src/lifecycle.mjs';
import { consumePrompt } from '../src/prompts.mjs';

const modulePath = path.resolve(import.meta.dirname, '..', 'src', 'atomic-mutation.mjs');
const bin = path.resolve(import.meta.dirname, '..', 'bin', 'dotmd.mjs');
let tmpDir;

function setup() {
  tmpDir = mkdtempSync(path.join(os.tmpdir(), 'dotmd-atomic-'));
  return tmpDir;
}

function child(code, args = []) {
  return spawn(process.execPath, ['--input-type=module', '-e', code, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
}

function completed(proc) {
  return new Promise(resolve => {
    let stdout = '', stderr = '';
    proc.stdout.on('data', chunk => { stdout += chunk; });
    proc.stderr.on('data', chunk => { stderr += chunk; });
    proc.on('close', status => resolve({ status, stdout, stderr }));
  });
}

async function waitForFiles(files, timeoutMs = 2000) {
  const deadline = Date.now() + timeoutMs;
  while (!files.every(existsSync)) {
    if (Date.now() >= deadline) throw new Error(`Timed out waiting for barriers: ${files.join(', ')}`);
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}

function lockEntries(root) {
  const lockRoot = path.join(root, '.dotmd', 'locks');
  return existsSync(lockRoot) ? readdirSync(lockRoot) : [];
}

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

describe('atomic mutation substrate', () => {
  it('rejects an intervening edit and removes its temp and lock', () => {
    const root = setup();
    const file = path.join(root, 'doc.md');
    writeFileSync(file, 'old\n');
    const snapshot = snapshotFile(file);
    writeFileSync(file, 'intervening\n');

    throws(() => replaceSnapshot(snapshot, 'new\n', { repoRoot: root }), MutationConflictError);
    strictEqual(readFileSync(file, 'utf8'), 'intervening\n');
    strictEqual(readdirSync(root).filter(name => name.includes('dotmd-tmp')).length, 0);
    strictEqual(lockEntries(root).length, 0);
  });

  it('preserves mode and cleans a lock when the callback fails', () => {
    const root = setup();
    const file = path.join(root, 'doc.md');
    writeFileSync(file, 'old\n');
    chmodSync(file, 0o640);
    const snapshot = snapshotFile(file);
    replaceSnapshot(snapshot, 'new\n', { repoRoot: root });
    strictEqual(statSync(file).mode & 0o777, 0o640);

    throws(() => withPathLocks([file], { repoRoot: root }, () => { throw new Error('boom'); }), /boom/);
    strictEqual(lockEntries(root).length, 0);
  });

  it('publishes exactly one complete winner under concurrent exclusive creation', async () => {
    const root = setup();
    const destination = path.join(root, 'winner.md');
    const gate = path.join(root, 'create.go');
    const code = `
      import { existsSync, writeFileSync } from 'node:fs';
      import { createFileExclusive } from ${JSON.stringify(modulePath)};
      writeFileSync(process.argv[5], 'ready');
      while (!existsSync(process.argv[4])) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
      try { createFileExclusive(process.argv[1], process.argv[2], { repoRoot: process.argv[3] }); }
      catch (err) { process.stderr.write(err.code || err.message); process.exit(2); }
    `;
    const attempts = Array.from({ length: 8 }, (_, i) => {
      const content = `winner-${i}:` + 'x'.repeat(100_000);
      const ready = path.join(root, `create-${i}.ready`);
      return { content, ready, done: completed(child(code, [destination, content, root, gate, ready])) };
    });
    await waitForFiles(attempts.map(a => a.ready));
    writeFileSync(gate, 'go');
    const results = await Promise.all(attempts.map(a => a.done));
    strictEqual(results.filter(r => r.status === 0).length, 1);
    const final = readFileSync(destination, 'utf8');
    ok(attempts.some(a => a.content === final), 'destination contains one full contender payload');
    strictEqual(lockEntries(root).length, 0);
  });

  it('index-style replacement readers observe only complete old or new content', async () => {
    const root = setup();
    const file = path.join(root, 'docs.md');
    const oldContent = `OLD:${'a'.repeat(500_000)}`;
    const newContent = `NEW:${'b'.repeat(500_000)}`;
    writeFileSync(file, oldContent);
    const ready = path.join(root, 'replace.ready');
    const gate = path.join(root, 'replace.go');
    const code = `
      import { existsSync, writeFileSync } from 'node:fs';
      import { snapshotFile, replaceSnapshot } from ${JSON.stringify(modulePath)};
      const snapshot = snapshotFile(process.argv[1]);
      replaceSnapshot(snapshot, process.argv[2], { repoRoot: process.argv[3], testHooks: { beforeReplacePublish: () => {
        writeFileSync(process.argv[4], 'ready');
        while (!existsSync(process.argv[5])) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
      } } });
    `;
    const proc = child(code, [file, newContent, root, ready, gate]);
    const done = completed(proc);
    await waitForFiles([ready]);
    strictEqual(readFileSync(file, 'utf8'), oldContent);
    writeFileSync(gate, 'go');
    const result = await done;
    strictEqual(result.status, 0, result.stderr);
    strictEqual(readFileSync(file, 'utf8'), newContent);
  });

  it('orders reversed multi-lock requests and finishes within the bound', async () => {
    const root = setup();
    const a = path.join(root, 'a.md');
    const b = path.join(root, 'b.md');
    writeFileSync(a, 'a');
    writeFileSync(b, 'b');
    const gate = path.join(root, 'locks.go');
    const code = `
      import { existsSync, writeFileSync } from 'node:fs';
      import { withPathLocks } from ${JSON.stringify(modulePath)};
      writeFileSync(process.argv[4], 'ready');
      while (!existsSync(process.argv[5])) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
      withPathLocks([process.argv[1], process.argv[2]], { repoRoot: process.argv[3], timeoutMs: 1000 }, () => {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
      });
    `;
    const started = Date.now();
    const readyA = path.join(root, 'locks-a.ready');
    const readyB = path.join(root, 'locks-b.ready');
    const pending = [completed(child(code, [a, b, root, readyA, gate])), completed(child(code, [b, a, root, readyB, gate]))];
    await waitForFiles([readyA, readyB]);
    writeFileSync(gate, 'go');
    const results = await Promise.all(pending);
    ok(Date.now() - started < 2000, 'requests must not wait indefinitely');
    ok(results.every(r => r.status === 0), results.map(r => r.stderr).join('\n'));
    strictEqual(lockEntries(root).length, 0);
  });

  it('dry-run creation creates no destination, temp, or lock tree', () => {
    const root = setup();
    mkdirSync(path.join(root, 'docs'));
    writeFileSync(path.join(root, 'dotmd.config.mjs'), `export const root = 'docs';\n`);
    const result = spawnSync(process.execPath, [bin, 'new', 'doc', 'dry', '--dry-run', '--config', path.join(root, 'dotmd.config.mjs')], {
      cwd: root, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' },
    });
    strictEqual(result.status, 0, result.stderr);
    strictEqual(existsSync(path.join(root, 'docs', 'dry.md')), false);
    strictEqual(existsSync(path.join(root, '.dotmd')), false);
    strictEqual(readdirSync(path.join(root, 'docs')).some(name => name.includes('dotmd-tmp')), false);
  });

  it('portable exclusive-create fallback never overwrites a race winner', () => {
    const root = setup();
    const destination = path.join(root, 'winner.md');
    const contender = path.join(root, 'contender.md');
    writeFileSync(contender, 'race-winner\n');
    throws(() => createFileExclusive(destination, 'dotmd\n', {
      repoRoot: root,
      testHooks: {
        forceLinkUnsupported: true,
        afterCreateReservation: reserved => renameSync(contender, reserved),
      },
    }), MutationConflictError);
    strictEqual(readFileSync(destination, 'utf8'), 'race-winner\n');
    strictEqual(lockEntries(root).length, 0);
  });

  it('reclaims demonstrably dead locks but never steals ownerless or live claims', () => {
    const root = setup();
    const file = path.join(root, 'doc.md');
    writeFileSync(file, 'x');
    const canonical = realpathSync(file);
    const key = createHash('sha256').update(canonical).digest('hex');
    const lockPath = path.join(root, '.dotmd', 'locks', `${key}.lock`);
    mkdirSync(lockPath, { recursive: true });
    writeFileSync(path.join(lockPath, 'owner.json'), JSON.stringify({
      pid: 99999999, hostname: os.hostname(), createdAt: new Date().toISOString(), processStartedAt: 'dead', path: canonical,
    }));
    strictEqual(withPathLocks([file], { repoRoot: root }, () => 'recovered'), 'recovered');

    mkdirSync(lockPath, { recursive: true });
    writeFileSync(path.join(lockPath, 'owner.json'), JSON.stringify({
      pid: process.pid, hostname: os.hostname(), createdAt: new Date().toISOString(), processStartedAt: 'live', path: canonical,
    }));
    throws(() => withPathLocks([file], { repoRoot: root, timeoutMs: 30, retryMs: 5 }, () => {}), err => {
      match(err.message, new RegExp(`pid ${process.pid}.*lock age`));
      return true;
    });
    rmSync(lockPath, { recursive: true });

    mkdirSync(lockPath, { recursive: true });
    throws(() => withPathLocks([file], { repoRoot: root, timeoutMs: 30, retryMs: 5 }, () => {}), /another process/);
    rmSync(lockPath, { recursive: true });
  });

  it('move validates the source immediately before moving', () => {
    const root = setup();
    const source = path.join(root, 'source.md');
    const target = path.join(root, 'target.md');
    writeFileSync(source, 'original\n');
    throws(() => moveFileAtomic(source, target, 'rendered\n', {
      repoRoot: root,
      testHooks: { afterMoveValidation: () => writeFileSync(source, 'intervening\n') },
    }), MutationConflictError);
    strictEqual(readFileSync(source, 'utf8'), 'intervening\n');
    strictEqual(existsSync(target), false);
  });

  it('move reservation preserves a race winner and rolls the source back', () => {
    const root = setup();
    const source = path.join(root, 'source.md');
    const target = path.join(root, 'target.md');
    const contender = path.join(root, 'contender.md');
    writeFileSync(source, 'original\n');
    writeFileSync(contender, 'race-winner\n');
    throws(() => moveFileAtomic(source, target, 'rendered\n', {
      repoRoot: root,
      testHooks: { afterSourceMove: () => renameSync(contender, target) },
    }), MutationConflictError);
    strictEqual(readFileSync(source, 'utf8'), 'original\n');
    strictEqual(readFileSync(target, 'utf8'), 'race-winner\n');
  });

  it('rolls a move back after a post-publication failure', () => {
    const root = setup();
    const source = path.join(root, 'source.md');
    const target = path.join(root, 'target.md');
    writeFileSync(source, 'original\n');
    throws(() => moveFileAtomic(source, target, 'rendered\n', {
      repoRoot: root,
      testHooks: { afterMovePublish: () => { throw new Error('injected publish failure'); } },
    }), /injected publish failure/);
    strictEqual(readFileSync(source, 'utf8'), 'original\n');
    strictEqual(existsSync(target), false);
  });

  it('rolls every file back when a multi-file commit fails', () => {
    const root = setup();
    const a = path.join(root, 'a.md');
    const b = path.join(root, 'b.md');
    const created = path.join(root, 'created.md');
    writeFileSync(a, 'a-old');
    writeFileSync(b, 'b-old');
    throws(() => mutateFileSet({
      updates: [{ path: a, content: 'a-new' }, { path: b, content: 'b-new' }],
      creations: [{ path: created, content: 'created' }],
    }, {
      repoRoot: root,
      testHooks: { afterSetCommit: count => { if (count === 2) throw new Error('injected set failure'); } },
    }), /injected set failure/);
    strictEqual(readFileSync(a, 'utf8'), 'a-old');
    strictEqual(readFileSync(b, 'utf8'), 'b-old');
    strictEqual(existsSync(created), false);
  });

  it('does not remove a concurrently replaced published target during rollback', () => {
    const root = setup();
    const source = path.join(root, 'source.md');
    const target = path.join(root, 'target.md');
    writeFileSync(source, 'original\n');
    throws(() => moveFileAtomic(source, target, 'transaction\n', {
      repoRoot: root,
      testHooks: { afterMovePublish: () => { writeFileSync(target, 'new-owner\n'); throw new Error('fail'); } },
    }), err => {
      match(err.message, /Rollback conflict: published move target was replaced/);
      return true;
    });
    strictEqual(readFileSync(target, 'utf8'), 'new-owner\n');
    strictEqual(readFileSync(source, 'utf8'), 'original\n');
  });

  it('does not overwrite a concurrently recreated source during rollback', () => {
    const root = setup();
    const source = path.join(root, 'source.md');
    const target = path.join(root, 'target.md');
    writeFileSync(source, 'original\n');
    let backup;
    throws(() => moveFileAtomic(source, target, 'transaction\n', {
      repoRoot: root,
      testHooks: { afterMovePublish: info => { backup = info.backup; writeFileSync(source, 'recreated\n'); throw new Error('fail'); } },
    }), err => {
      match(err.message, /source was recreated/);
      return true;
    });
    strictEqual(readFileSync(source, 'utf8'), 'recreated\n');
    strictEqual(readFileSync(backup, 'utf8'), 'original\n');
    strictEqual(existsSync(target), false);
  });

  it('does not clobber replaced multi-file updates or creations during rollback', () => {
    const root = setup();
    const updated = path.join(root, 'updated.md');
    writeFileSync(updated, 'old');
    throws(() => mutateFileSet({ updates: [{ path: updated, content: 'committed' }] }, {
      repoRoot: root,
      testHooks: { afterSetCommit: () => { writeFileSync(updated, 'replacement'); throw new Error('fail update'); } },
    }), err => {
      match(err.message, /Original content: .*dotmd-recovery-original/);
      return true;
    });
    strictEqual(readFileSync(updated, 'utf8'), 'replacement');
    const recovery = readdirSync(root).find(name => name.includes('dotmd-recovery-original'));
    strictEqual(readFileSync(path.join(root, recovery), 'utf8'), 'old');

    const created = path.join(root, 'created.md');
    throws(() => mutateFileSet({ creations: [{ path: created, content: 'committed' }] }, {
      repoRoot: root,
      testHooks: { afterSetCommit: () => { writeFileSync(created, 'replacement'); throw new Error('fail creation'); } },
    }), /Rollback conflict: created file was replaced/);
    strictEqual(readFileSync(created, 'utf8'), 'replacement');
  });

  it('cleans identifiable reservations when write or fsync fails', () => {
    const root = setup();
    const created = path.join(root, 'created.md');
    throws(() => createFileExclusive(created, 'content', {
      repoRoot: root,
      testHooks: { forceLinkUnsupported: true, beforeReserveFsync: () => { throw new Error('fsync failure'); } },
    }), /fsync failure/);
    strictEqual(existsSync(created), false);

    const source = path.join(root, 'source.md');
    const target = path.join(root, 'target.md');
    writeFileSync(source, 'source');
    throws(() => moveFileAtomic(source, target, 'target', {
      repoRoot: root,
      testHooks: { beforeReserveFsync: () => { throw new Error('reservation failure'); } },
    }), /reservation failure/);
    strictEqual(readFileSync(source, 'utf8'), 'source');
    strictEqual(existsSync(target), false);
  });

  it('rolls back committed replacements when directory fsync fails', () => {
    const root = setup();
    const file = path.join(root, 'file.md');
    writeFileSync(file, 'original');
    throws(() => mutateFileSet({ updates: [{ path: file, content: 'replacement' }] }, {
      repoRoot: root,
      testHooks: { beforeDirectoryFsync: phase => { if (phase === 'replace-publish') throw new Error('replace fsync failure'); } },
    }), /replace fsync failure/);
    strictEqual(readFileSync(file, 'utf8'), 'original');
  });

  it('retains move recovery material through target fsync and never rolls back after backup deletion', () => {
    const root = setup();
    const source = path.join(root, 'source.md');
    const target = path.join(root, 'target.md');
    writeFileSync(source, 'original');
    throws(() => moveFileAtomic(source, target, 'committed', {
      repoRoot: root,
      testHooks: { beforeDirectoryFsync: phase => { if (phase === 'move-target-publish') throw new Error('target fsync failure'); } },
    }), /target fsync failure/);
    strictEqual(readFileSync(source, 'utf8'), 'original');
    strictEqual(existsSync(target), false);

    throws(() => moveFileAtomic(source, target, 'committed', {
      repoRoot: root,
      testHooks: { beforeDirectoryFsync: phase => { if (phase === 'move-backup-delete') throw new Error('cleanup fsync failure'); } },
    }), err => {
      match(err.message, /content and Git index are committed/);
      return true;
    });
    strictEqual(existsSync(source), false);
    strictEqual(readFileSync(target, 'utf8'), 'committed');
    strictEqual(readdirSync(root).some(name => name.includes('dotmd-move')), false);
  });

  it('registers reservation ownership before post-reservation failures', () => {
    const root = setup();
    const created = path.join(root, 'created.md');
    throws(() => createFileExclusive(created, 'content', {
      repoRoot: root,
      testHooks: { forceLinkUnsupported: true, afterReservationAcquired: () => { throw new Error('snapshot phase failure'); } },
    }), /snapshot phase failure/);
    strictEqual(existsSync(created), false);

    const source = path.join(root, 'source.md');
    const target = path.join(root, 'target.md');
    writeFileSync(source, 'source');
    throws(() => moveFileAtomic(source, target, 'target', {
      repoRoot: root,
      testHooks: { afterReservationAcquired: () => { throw new Error('move snapshot phase failure'); } },
    }), /move snapshot phase failure/);
    strictEqual(readFileSync(source, 'utf8'), 'source');
    strictEqual(existsSync(target), false);
  });

  it('rolls back failures injected immediately after rename or hard-link publication without reopening first', () => {
    const root = setup();
    const updated = path.join(root, 'updated.md');
    writeFileSync(updated, 'original');
    throws(() => mutateFileSet({ updates: [{ path: updated, content: 'replacement' }] }, {
      repoRoot: root,
      testHooks: { afterPublicationBeforePathOpen: phase => { if (phase === 'replace') throw new Error('after replace rename'); } },
    }), /after replace rename/);
    strictEqual(readFileSync(updated, 'utf8'), 'original');

    const created = path.join(root, 'created.md');
    throws(() => createFileExclusive(created, 'created', {
      repoRoot: root,
      testHooks: { afterPublicationBeforePathOpen: phase => { if (phase === 'create-hardlink') throw new Error('after hard link'); } },
    }), /after hard link/);
    strictEqual(existsSync(created), false);
    strictEqual(readdirSync(root).some(name => name.includes('dotmd-tmp')), false);

    const fallback = path.join(root, 'fallback.md');
    throws(() => createFileExclusive(fallback, 'created', {
      repoRoot: root,
      testHooks: {
        forceLinkUnsupported: true,
        afterPublicationBeforePathOpen: phase => { if (phase === 'create-rename') throw new Error('after create rename'); },
      },
    }), /after create rename/);
    strictEqual(existsSync(fallback), false);

    const source = path.join(root, 'source.md');
    const target = path.join(root, 'target.md');
    writeFileSync(source, 'source');
    throws(() => moveFileAtomic(source, target, 'target', {
      repoRoot: root,
      testHooks: { afterPublicationBeforePathOpen: phase => { if (phase === 'move-target') throw new Error('after move rename'); } },
    }), /after move rename/);
    strictEqual(readFileSync(source, 'utf8'), 'source');
    strictEqual(existsSync(target), false);
  });
});

describe('concurrent lifecycle transitions', () => {
  it('serializes ordinary and git touch writers with a lifecycle transition', async () => {
    const root = setup();
    mkdirSync(path.join(root, 'docs'));
    const configPath = path.join(root, 'dotmd.config.mjs');
    writeFileSync(configPath, `export const root = 'docs';\n`);
    const plan = path.join(root, 'docs', 'plan.md');
    writeFileSync(plan, `---\ntype: plan\nstatus: active\nupdated: 2020-01-01\n---\n# Plan\n\n## Version History\n`);
    spawnSync('git', ['init', '-q'], { cwd: root });
    spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
    spawnSync('git', ['config', 'user.name', 'Test'], { cwd: root });
    spawnSync('git', ['add', '.'], { cwd: root });
    spawnSync('git', ['commit', '-qm', 'future'], {
      cwd: root,
      env: { ...process.env, GIT_AUTHOR_DATE: '2030-01-01T00:00:00Z', GIT_COMMITTER_DATE: '2030-01-01T00:00:00Z' },
    });
    const gate = path.join(root, 'touch.go');
    const wrapper = `
      import { existsSync, writeFileSync } from 'node:fs';
      import { spawnSync } from 'node:child_process';
      writeFileSync(process.argv[1], 'ready');
      while (!existsSync(process.argv[2])) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
      const result = spawnSync(process.execPath, JSON.parse(process.argv[3]), { cwd: process.argv[4], stdio: 'inherit', env: process.env });
      process.exit(result.status ?? 1);
    `;
    const commands = [
      [bin, 'touch', plan, '--config', configPath],
      [bin, 'touch', '--git', plan, '--config', configPath],
      [bin, 'set', 'planned', plan, '--note', 'concurrent lifecycle', '--no-index', '--config', configPath],
    ];
    const pending = commands.map((args, index) => {
      const ready = path.join(root, `touch-${index}.ready`);
      return { ready, done: completed(child(wrapper, [ready, gate, JSON.stringify(args), root])) };
    });
    await waitForFiles(pending.map(item => item.ready));
    writeFileSync(gate, 'go');
    const results = await Promise.all(pending.map(item => item.done));
    ok(results.every(result => result.status === 0), results.map(result => result.stderr).join('\n'));
    const final = readFileSync(plan, 'utf8');
    match(final, /^status: planned$/m);
    match(final, /concurrent lifecycle/);
    ok(final.startsWith('---\n') && final.includes('\n---\n# Plan'));
  });

  it('serializes six transitions without truncation and preserves every history entry', async () => {
    const root = setup();
    mkdirSync(path.join(root, 'docs'));
    writeFileSync(path.join(root, 'dotmd.config.mjs'), `export const root = 'docs';\n`);
    const plan = path.join(root, 'docs', 'plan.md');
    writeFileSync(plan, `---
type: plan
status: active
updated: 2026-01-01T00:00:00Z
---
# Plan

## Version History

- **2026-01-01T00:00:00Z** Created.
`);
    const statuses = ['planned', 'in-session', 'awaiting', 'partial', 'blocked', 'queued-after'];
    const gate = path.join(root, 'transitions.go');
    const wrapper = `
      import { existsSync, writeFileSync } from 'node:fs';
      import { spawnSync } from 'node:child_process';
      writeFileSync(process.argv[1], 'ready');
      while (!existsSync(process.argv[2])) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
      const result = spawnSync(process.execPath, JSON.parse(process.argv[3]), { cwd: process.argv[4], stdio: 'inherit', env: process.env });
      process.exit(result.status ?? 1);
    `;
    const pending = statuses.map((status, index) => {
      const ready = path.join(root, `transition-${index}.ready`);
      const args = [bin, 'set', status, plan, '--note', `transition-${status}`, '--no-index', '--config', path.join(root, 'dotmd.config.mjs')];
      return { ready, done: completed(child(wrapper, [ready, gate, JSON.stringify(args), root])) };
    });
    await waitForFiles(pending.map(item => item.ready));
    writeFileSync(gate, 'go');
    const runs = pending.map(item => item.done);
    const results = await Promise.all(runs);
    ok(results.every(r => r.status === 0), results.map(r => r.stderr).join('\n'));
    const final = readFileSync(plan, 'utf8');
    ok(final.startsWith('---\n') && final.includes('\n---\n# Plan'));
    for (const status of statuses) {
      strictEqual((final.match(new RegExp(`transition-${status}`, 'g')) ?? []).length, 1, `history preserved for ${status}`);
    }
    strictEqual(lockEntries(root).length, 0);
  });

  it('keeps the normal generated index current across concurrent transitions', async () => {
    const root = setup();
    mkdirSync(path.join(root, 'docs'));
    const configPath = path.join(root, 'dotmd.config.mjs');
    writeFileSync(configPath, `export const root = 'docs';\nexport const index = { path: 'docs/docs.md', startMarker: '<!-- START -->', endMarker: '<!-- END -->' };\n`);
    const plan = path.join(root, 'docs', 'plan.md');
    writeFileSync(plan, `---\ntype: plan\nstatus: active\ntitle: Plan\nupdated: 2026-01-01\n---\n# Plan\n\n## Version History\n`);
    writeFileSync(path.join(root, 'docs', 'docs.md'), `# Index\n\n<!-- START -->\n\n<!-- END -->\n`);
    const gate = path.join(root, 'indexed.go');
    const wrapper = `
      import { existsSync, writeFileSync } from 'node:fs';
      import { spawnSync } from 'node:child_process';
      writeFileSync(process.argv[1], 'ready');
      while (!existsSync(process.argv[2])) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
      const result = spawnSync(process.execPath, JSON.parse(process.argv[3]), { cwd: process.argv[4], stdio: 'inherit', env: process.env });
      process.exit(result.status ?? 1);
    `;
    const statuses = ['planned', 'in-session', 'awaiting', 'partial', 'blocked', 'queued-after'];
    const pending = statuses.map((status, index) => {
      const ready = path.join(root, `indexed-${index}.ready`);
      const args = [bin, 'set', status, plan, '--note', `indexed-${status}`, '--config', configPath];
      return { ready, done: completed(child(wrapper, [ready, gate, JSON.stringify(args), root])) };
    });
    await waitForFiles(pending.map(item => item.ready));
    writeFileSync(gate, 'go');
    const results = await Promise.all(pending.map(item => item.done));
    ok(results.every(result => result.status === 0), results.map(result => result.stderr).join('\n'));
    const printed = spawnSync(process.execPath, [bin, 'index', '--print', '--config', configPath], { cwd: root, encoding: 'utf8' });
    strictEqual(printed.status, 0, printed.stderr);
    strictEqual(readFileSync(path.join(root, 'docs', 'docs.md'), 'utf8'), printed.stdout);
  });
});

describe('atomic lifecycle moves', () => {
  it('prompt consumption emits the body from the locked committed source generation', async () => {
    const root = setup();
    mkdirSync(path.join(root, 'docs', 'prompts', 'archived'), { recursive: true });
    const configPath = path.join(root, 'dotmd.config.mjs');
    writeFileSync(configPath, `export const root = 'docs';\n`);
    const prompt = path.join(root, 'docs', 'prompts', 'resume.md');
    const makePrompt = body => `---\ntype: prompt\nstatus: pending\nupdated: 2026-01-01\n---\n${body}\n`;
    writeFileSync(prompt, makePrompt('stale body'));
    const config = await resolveConfig(root, configPath);
    let stdout = '';
    const originalWrite = process.stdout.write;
    process.stdout.write = chunk => { stdout += String(chunk); return true; };
    try {
      consumePrompt(prompt, config, {
        noIndex: true,
        testHooks: { beforeMoveSnapshot: () => writeFileSync(prompt, makePrompt('locked body')) },
      });
    } finally {
      process.stdout.write = originalWrite;
    }
    strictEqual(stdout, 'locked body\n');
    match(readFileSync(path.join(root, 'docs', 'prompts', 'archived', 'resume.md'), 'utf8'), /locked body/);
  });

  it('rolls source, destination, and inbound references back together', async () => {
    const root = setup();
    mkdirSync(path.join(root, 'docs', 'plans'), { recursive: true });
    mkdirSync(path.join(root, 'docs', 'archived'), { recursive: true });
    const configPath = path.join(root, 'dotmd.config.mjs');
    writeFileSync(configPath, `export const root = 'docs';\n`);
    const source = path.join(root, 'docs', 'plans', 'plan.md');
    const inbound = path.join(root, 'docs', 'other.md');
    const sourceRaw = `---\ntype: plan\nstatus: active\nupdated: 2026-01-01\nrelated_docs:\n  - ../other.md\n---\n# Plan\n`;
    const inboundRaw = `---\ntype: doc\nstatus: active\nupdated: 2026-01-01\nrelated_plans:\n  - plans/plan.md\n---\n[Plan](plans/plan.md)\n`;
    writeFileSync(source, sourceRaw);
    writeFileSync(inbound, inboundRaw);
    const config = await resolveConfig(root, configPath);
    throws(() => runArchive([source, '--no-index'], config, {
      testHooks: { afterMovePublish: () => { throw new Error('reference transaction failure'); } },
    }), /reference transaction failure/);
    strictEqual(readFileSync(source, 'utf8'), sourceRaw);
    strictEqual(readFileSync(inbound, 'utf8'), inboundRaw);
    strictEqual(existsSync(path.join(root, 'docs', 'archived', 'plan.md')), false);
  });

  it('renders closeout from the locked current body without losing a concurrent edit', async () => {
    const root = setup();
    const plans = path.join(root, 'docs', 'plans');
    mkdirSync(path.join(root, 'docs', 'archived'), { recursive: true });
    mkdirSync(plans, { recursive: true });
    const configPath = path.join(root, 'dotmd.config.mjs');
    writeFileSync(configPath, `export const root = 'docs';\n`);
    const source = path.join(plans, 'plan.md');
    const initial = `---\ntype: plan\nstatus: active\nupdated: 2026-01-01\n---\n# Plan\n\n## Version History\n\n- **2026-01-01** Created.\n`;
    writeFileSync(source, initial);
    const config = await resolveConfig(root, configPath);
    runArchive([source, '--closeout-template', '--no-index'], config, {
      testHooks: { beforeMoveSnapshot: () => writeFileSync(source, initial.replace('# Plan', '# Plan\n\nConcurrent body edit').replace('- **2026-01-01** Created.', '- **2026-02-01** Concurrent history.\n- **2026-01-01** Created.')) },
    });
    const archived = readFileSync(path.join(root, 'docs', 'archived', 'plan.md'), 'utf8');
    match(archived, /Concurrent body edit/);
    match(archived, /Concurrent history/);
    match(archived, /## Closeout/);
    match(archived, /Archived\./);
  });

  it('preserves git staging semantics for a tracked move', async () => {
    const root = setup();
    mkdirSync(path.join(root, 'docs', 'plans'), { recursive: true });
    mkdirSync(path.join(root, 'docs', 'archived'), { recursive: true });
    const configPath = path.join(root, 'dotmd.config.mjs');
    writeFileSync(configPath, `export const root = 'docs';\n`);
    const source = path.join(root, 'docs', 'plans', 'plan.md');
    writeFileSync(source, `---\ntype: plan\nstatus: active\nupdated: 2026-01-01\n---\n# Plan\n\n## Version History\n`);
    spawnSync('git', ['init', '-q'], { cwd: root });
    spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
    spawnSync('git', ['config', 'user.name', 'Test'], { cwd: root });
    spawnSync('git', ['add', '.'], { cwd: root });
    spawnSync('git', ['commit', '-qm', 'initial'], { cwd: root });
    const config = await resolveConfig(root, configPath);
    runArchive([source, '--no-index'], config);
    const staged = spawnSync('git', ['diff', '--cached', '--name-only'], { cwd: root, encoding: 'utf8' }).stdout.trim().split('\n').sort();
    strictEqual(staged.includes('docs/plans/plan.md'), true);
    strictEqual(staged.includes('docs/archived/plan.md'), true);
    strictEqual(staged.some(item => item.includes('dotmd-move')), false);
  });

  it('restores the exact Git index entries when a tracked move rolls back', async () => {
    const root = setup();
    mkdirSync(path.join(root, 'docs', 'plans'), { recursive: true });
    mkdirSync(path.join(root, 'docs', 'archived'), { recursive: true });
    const configPath = path.join(root, 'dotmd.config.mjs');
    writeFileSync(configPath, `export const root = 'docs';\n`);
    const source = path.join(root, 'docs', 'plans', 'plan.md');
    writeFileSync(source, `---\ntype: plan\nstatus: active\nupdated: 2026-01-01\n---\n# Initial\n`);
    spawnSync('git', ['init', '-q'], { cwd: root });
    spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
    spawnSync('git', ['config', 'user.name', 'Test'], { cwd: root });
    spawnSync('git', ['add', '.'], { cwd: root });
    spawnSync('git', ['commit', '-qm', 'initial'], { cwd: root });
    writeFileSync(source, readFileSync(source, 'utf8').replace('# Initial', '# Staged'));
    spawnSync('git', ['add', source], { cwd: root });
    const indexBefore = spawnSync('git', ['ls-files', '--stage', '--', 'docs/plans/plan.md', 'docs/archived/plan.md'], { cwd: root, encoding: 'utf8' }).stdout;
    writeFileSync(source, readFileSync(source, 'utf8').replace('# Staged', '# Worktree'));
    const config = await resolveConfig(root, configPath);
    throws(() => runArchive([source, '--no-index'], config, {
      testHooks: { afterMoveFinalize: () => { throw new Error('after staging'); } },
    }), /after staging/);
    const indexAfter = spawnSync('git', ['ls-files', '--stage', '--', 'docs/plans/plan.md', 'docs/archived/plan.md'], { cwd: root, encoding: 'utf8' }).stdout;
    strictEqual(indexAfter, indexBefore);
    match(readFileSync(source, 'utf8'), /# Worktree/);
    strictEqual(existsSync(path.join(root, 'docs', 'archived', 'plan.md')), false);
  });

  it('does not restore the Git index when failure occurs before staging is attempted', async () => {
    const root = setup();
    mkdirSync(path.join(root, 'docs', 'plans'), { recursive: true });
    mkdirSync(path.join(root, 'docs', 'archived'), { recursive: true });
    const configPath = path.join(root, 'dotmd.config.mjs');
    writeFileSync(configPath, `export const root = 'docs';\n`);
    const source = path.join(root, 'docs', 'plans', 'plan.md');
    const concurrent = path.join(root, 'concurrent.txt');
    writeFileSync(source, `---\ntype: plan\nstatus: active\nupdated: 2026-01-01\n---\n# Plan\n`);
    writeFileSync(concurrent, 'initial');
    spawnSync('git', ['init', '-q'], { cwd: root });
    spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
    spawnSync('git', ['config', 'user.name', 'Test'], { cwd: root });
    spawnSync('git', ['add', '.'], { cwd: root });
    spawnSync('git', ['commit', '-qm', 'initial'], { cwd: root });
    const config = await resolveConfig(root, configPath);
    throws(() => runArchive([source, '--no-index'], config, {
      testHooks: { afterReservationAcquired: () => {
        writeFileSync(concurrent, 'concurrent staged edit');
        spawnSync('git', ['add', concurrent], { cwd: root });
        throw new Error('early move failure');
      } },
    }), /early move failure/);
    const staged = spawnSync('git', ['diff', '--cached', '--name-only'], { cwd: root, encoding: 'utf8' }).stdout.trim().split('\n');
    strictEqual(staged.includes('concurrent.txt'), true);
    strictEqual(readFileSync(source, 'utf8').includes('# Plan'), true);
  });
});
