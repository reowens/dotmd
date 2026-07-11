import {
  closeSync,
  existsSync,
  fchmodSync,
  fstatSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

const sleepBuffer = new Int32Array(new SharedArrayBuffer(4));
let tempSequence = 0;
const PROCESS_STARTED_AT = new Date(Date.now() - Math.floor(process.uptime() * 1000)).toISOString();

function processStartIdentity(pid) {
  try {
    const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
    const afterName = stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/);
    return `linux:${afterName[19]}`;
  } catch {
    return null;
  }
}

const PROCESS_START_IDENTITY = processStartIdentity(process.pid);

export class MutationConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MutationConflictError';
    this.code = 'DOTMD_MUTATION_CONFLICT';
  }
}

export class MutationLockError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MutationLockError';
    this.code = 'DOTMD_MUTATION_LOCK_TIMEOUT';
  }
}

function contentHash(content) {
  return createHash('sha256').update(content).digest('hex');
}

function statIdentity(stat) {
  return {
    dev: stat.dev.toString(),
    ino: stat.ino.toString(),
    size: stat.size.toString(),
    mtimeNs: stat.mtimeNs.toString(),
    ctimeNs: stat.ctimeNs.toString(),
    mode: Number(stat.mode & 0o7777n),
  };
}

function sameIdentity(a, b) {
  return a.dev === b.dev && a.ino === b.ino && a.size === b.size
    && a.mtimeNs === b.mtimeNs && a.ctimeNs === b.ctimeNs;
}

function sameGenerationIdentity(a, b) {
  return a.dev === b.dev && a.ino === b.ino && a.size === b.size;
}

export function snapshotFile(filePath) {
  const resolved = path.resolve(filePath);
  const before = statSync(resolved, { bigint: true });
  if (!before.isFile()) throw new Error(`Mutation source is not a file: ${resolved}`);
  const content = readFileSync(resolved, 'utf8');
  const after = statSync(resolved, { bigint: true });
  const identity = statIdentity(after);
  if (!sameIdentity(statIdentity(before), identity) || BigInt(Buffer.byteLength(content)) !== after.size) {
    throw new MutationConflictError(`File changed while it was being read: ${resolved}`);
  }
  return { path: resolved, content, hash: contentHash(content), identity };
}

export function assertSnapshotCurrent(snapshot) {
  let current;
  try { current = snapshotFile(snapshot.path); }
  catch (err) {
    if (err?.code === 'ENOENT') throw new MutationConflictError(`File disappeared after it was read: ${snapshot.path}`);
    throw err;
  }
  const identityMatches = snapshot.identityKind === 'inode-content'
    ? sameGenerationIdentity(snapshot.identity, current.identity)
    : sameIdentity(snapshot.identity, current.identity);
  if (!identityMatches || snapshot.hash !== current.hash) {
    throw new MutationConflictError(`File changed after it was read; refusing to overwrite newer content: ${snapshot.path}`);
  }
}

function canonicalPath(filePath) {
  const resolved = path.resolve(filePath);
  if (existsSync(resolved)) return realpathSync(resolved);
  const suffix = [];
  let cursor = resolved;
  while (!existsSync(cursor)) {
    suffix.unshift(path.basename(cursor));
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return path.join(realpathSync(cursor), ...suffix);
}

function lockPathFor(canonical, repoRoot) {
  const key = createHash('sha256').update(canonical).digest('hex');
  return path.join(path.resolve(repoRoot), '.dotmd', 'locks', `${key}.lock`);
}

function ownerDescription(lockPath) {
  try {
    const owner = JSON.parse(readFileSync(path.join(lockPath, 'owner.json'), 'utf8'));
    const age = Math.max(0, Date.now() - Date.parse(owner.createdAt));
    return `pid ${owner.pid} on ${owner.hostname} (process started ${owner.processStartedAt ?? 'unknown'}, lock age ${age}ms)`;
  } catch {
    return 'another process';
  }
}

function lockOwner(lockPath) {
  try { return JSON.parse(readFileSync(path.join(lockPath, 'owner.json'), 'utf8')); }
  catch { return null; }
}

function ownerIsDemonstrablyDead(owner) {
  if (!owner || owner.hostname !== os.hostname() || !Number.isInteger(owner.pid)) return false;
  try {
    process.kill(owner.pid, 0);
    const currentStart = processStartIdentity(owner.pid);
    return Boolean(owner.processStartIdentity && currentStart && owner.processStartIdentity !== currentStart);
  }
  catch (err) { return err?.code === 'ESRCH'; }
}

function reclaimLock(lockPath) {
  try { statSync(lockPath); } catch { return true; }
  const owner = lockOwner(lockPath);
  if (!ownerIsDemonstrablyDead(owner)) return false;

  // A marker inside the old directory serializes reclaimers. A live owner is
  // never reclaimed. An ownerless directory is deliberately left for bounded
  // timeout/manual recovery: reclaiming it could steal from a live process
  // paused between mkdir and atomic owner publication.
  let marker;
  try {
    marker = openSync(path.join(lockPath, 'reclaiming'), 'wx');
    closeSync(marker);
  } catch { return false; }
  const tombstone = `${lockPath}.reclaimed-${process.pid}-${Date.now()}-${tempSequence++}`;
  try {
    renameSync(lockPath, tombstone);
    rmSync(tombstone, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

export function withPathLocks(filePaths, options, callback) {
  const { repoRoot, timeoutMs = 2000, retryMs = 20 } = options;
  if (!repoRoot) throw new Error('withPathLocks requires repoRoot.');
  const canonicals = [...new Set(filePaths.map(canonicalPath))].sort();
  const lockRoot = path.join(path.resolve(repoRoot), '.dotmd', 'locks');
  mkdirSync(lockRoot, { recursive: true });
  const acquired = [];
  const deadline = Date.now() + timeoutMs;
  try {
    for (const canonical of canonicals) {
      const lockPath = lockPathFor(canonical, repoRoot);
      while (true) {
        const token = randomUUID();
        let madeLock = false;
        try {
          mkdirSync(lockPath);
          madeLock = true;
          const ownerTemp = path.join(lockPath, `.owner-${token}.tmp`);
          writeFileSync(ownerTemp, JSON.stringify({
            token,
            pid: process.pid,
            hostname: os.hostname(),
            createdAt: new Date().toISOString(),
            processStartedAt: PROCESS_STARTED_AT,
            processStartIdentity: PROCESS_START_IDENTITY,
            path: canonical,
          }) + '\n', { flag: 'wx' });
          renameSync(ownerTemp, path.join(lockPath, 'owner.json'));
          if (lockOwner(lockPath)?.token !== token) {
            throw new MutationConflictError(`Mutation lock ownership changed while claiming ${canonical}.`);
          }
          acquired.push({ lockPath, token });
          break;
        } catch (err) {
          if (madeLock) {
            try {
              const owner = lockOwner(lockPath);
              if (!owner || owner.token === token) rmSync(lockPath, { recursive: true, force: true });
            } catch { /* best effort */ }
          }
          if (err?.code !== 'EEXIST') throw err;
          if (reclaimLock(lockPath)) continue;
          if (Date.now() >= deadline) {
            throw new MutationLockError(`Timed out after ${timeoutMs}ms waiting for mutation lock on ${canonical} (held by ${ownerDescription(lockPath)}).`);
          }
          Atomics.wait(sleepBuffer, 0, 0, Math.min(retryMs, Math.max(1, deadline - Date.now())));
        }
      }
    }
    return callback();
  } finally {
    for (const { lockPath, token } of acquired.reverse()) {
      try {
        if (lockOwner(lockPath)?.token === token) rmSync(lockPath, { recursive: true });
      } catch { /* preserve original error */ }
    }
  }
}

function tempPathFor(filePath) {
  const base = path.basename(filePath);
  return path.join(path.dirname(filePath), `.${base}.dotmd-tmp-${process.pid}-${Date.now()}-${tempSequence++}`);
}

function fsyncDirectory(dirPath, options = {}, phase = 'directory') {
  let fd;
  try {
    fd = openSync(dirPath, 'r');
    options.testHooks?.beforeDirectoryFsync?.(phase, dirPath);
    fsyncSync(fd);
  } catch (err) {
    if (!['EINVAL', 'ENOTSUP', 'EBADF', 'EISDIR', 'EPERM'].includes(err?.code)) throw err;
  } finally {
    if (fd !== undefined) try { closeSync(fd); } catch { /* best effort */ }
  }
}

function writeCompleteTemp(filePath, content, mode) {
  const tempPath = tempPathFor(filePath);
  let fd;
  try {
    fd = openSync(tempPath, 'wx', mode);
    writeFileSync(fd, content, 'utf8');
    fchmodSync(fd, mode);
    fsyncSync(fd);
    const finalStat = fstatSync(fd, { bigint: true });
    closeSync(fd);
    fd = undefined;
    return {
      path: tempPath,
      content,
      hash: contentHash(content),
      identity: statIdentity(finalStat),
    };
  } catch (err) {
    if (fd !== undefined) try { closeSync(fd); } catch { /* best effort */ }
    try { unlinkSync(tempPath); } catch { /* best effort */ }
    throw err;
  }
}

function committedGeneration(prepared, finalPath) {
  return {
    path: path.resolve(finalPath),
    content: prepared.content,
    hash: prepared.hash,
    identity: prepared.identity,
    identityKind: 'inode-content',
  };
}

function recoveryArtifact(filePath, content, mode, label) {
  const artifact = path.join(path.dirname(filePath), `.${path.basename(filePath)}.dotmd-recovery-${label}-${randomUUID()}`);
  const temp = writeCompleteTemp(artifact, content, mode);
  renameSync(temp.path, artifact);
  fsyncDirectory(path.dirname(artifact));
  return artifact;
}

function rollbackConflict(error, message) {
  error.message += `\nRollback conflict: ${message}`;
}

function removeCommitted(snapshot, error, label) {
  try {
    assertSnapshotCurrent(snapshot);
    unlinkSync(snapshot.path);
    try { fsyncDirectory(path.dirname(snapshot.path)); }
    catch (durabilityError) {
      rollbackConflict(error, `${label} was removed, but its directory could not be durably synced: ${durabilityError.message}`);
    }
    return true;
  } catch (conflict) {
    rollbackConflict(error, `${label} was replaced; left current file untouched at ${snapshot.path}.`);
    return false;
  }
}

function restoreUpdate(committed, original, error) {
  try {
    assertSnapshotCurrent(committed);
    replaceSnapshot(committed, original.content, { repoRoot: path.dirname(original.path), locked: true });
    return true;
  } catch (conflict) {
    let artifact = 'could not write recovery artifact';
    try { artifact = recoveryArtifact(original.path, original.content, original.identity.mode, 'original'); } catch { /* report fallback text */ }
    rollbackConflict(error, `${original.path} changed after commit; left it untouched. Original content: ${artifact}.`);
    return false;
  }
}

function reserveExclusive(filePath, mode, content, testHooks = {}) {
  let fd;
  let openedIdentity;
  let reservation;
  try {
    fd = openSync(filePath, 'wx', mode);
    const opened = fstatSync(fd, { bigint: true });
    openedIdentity = { dev: opened.dev, ino: opened.ino };
    const reservationContent = content ?? JSON.stringify({ dotmdReservation: true, pid: process.pid, createdAt: new Date().toISOString() }) + '\n';
    writeFileSync(fd, reservationContent, 'utf8');
    testHooks.afterReserveWrite?.(filePath);
    testHooks.beforeReserveFsync?.(filePath);
    fsyncSync(fd);
    const finalStat = fstatSync(fd, { bigint: true });
    reservation = {
      path: path.resolve(filePath),
      content: reservationContent,
      hash: contentHash(reservationContent),
      identity: statIdentity(finalStat),
    };
    closeSync(fd);
    fd = undefined;
    return reservation;
  } catch (err) {
    if (fd !== undefined) try { closeSync(fd); } catch { /* best effort */ }
    if (openedIdentity) {
      try {
        const current = lstatSync(filePath, { bigint: true });
        if (current.dev === openedIdentity.dev && current.ino === openedIdentity.ino) unlinkSync(filePath);
      } catch { /* missing or replaced by another actor */ }
    }
    throw err;
  }
}

export function replaceSnapshot(snapshot, newContent, options = {}) {
  const { repoRoot, locked = false } = options;
  const commit = () => {
    const prepared = writeCompleteTemp(snapshot.path, newContent, snapshot.identity.mode);
    let committed;
    try {
      options.testHooks?.beforeReplacePublish?.({ snapshot, tempPath: prepared.path });
      assertSnapshotCurrent(snapshot);
      renameSync(prepared.path, snapshot.path);
      committed = committedGeneration(prepared, snapshot.path);
      options.testHooks?.afterPublicationBeforePathOpen?.('replace', snapshot.path);
      try { fsyncDirectory(path.dirname(snapshot.path), options, 'replace-publish'); }
      catch (err) { err.committedSnapshot = committed; throw err; }
      return committed;
    } catch (err) {
      try { unlinkSync(prepared.path); } catch { /* already renamed or best effort */ }
      if (committed && !err.committedSnapshot) err.committedSnapshot = committed;
      throw err;
    }
  };
  return locked ? commit() : withPathLocks([snapshot.path], { repoRoot, ...options }, commit);
}

export function mutateFile(filePath, options, render) {
  return withPathLocks([filePath], options, () => {
    options.testHooks?.beforeMutationSnapshot?.(filePath);
    const snapshot = snapshotFile(filePath);
    const rendered = render(snapshot.content, snapshot);
    if (rendered === snapshot.content) return { changed: false, snapshot };
    try {
      const committed = replaceSnapshot(snapshot, rendered, { ...options, locked: true });
      return { changed: true, snapshot, committed };
    } catch (err) {
      if (err.committedSnapshot) restoreUpdate(err.committedSnapshot, snapshot, err);
      throw err;
    }
  });
}

export function createFileExclusive(filePath, content, options) {
  const { repoRoot, mode = 0o666 & ~process.umask(), locked = false } = options;
  const create = () => {
    if (existsSync(filePath)) throw new MutationConflictError(`Destination already exists: ${path.resolve(filePath)}`);
    const prepared = writeCompleteTemp(filePath, content, mode);
    let tempPublished = false;
    let committed;
    try {
      try {
        if (options.testHooks?.forceLinkUnsupported) {
          const error = new Error('injected unsupported hard link');
          error.code = 'ENOTSUP';
          throw error;
        }
        linkSync(prepared.path, filePath);
        committed = committedGeneration(prepared, filePath);
        options.testHooks?.afterPublicationBeforePathOpen?.('create-hardlink', filePath);
      } catch (err) {
        if (!['ENOTSUP', 'EOPNOTSUPP', 'EPERM', 'EXDEV', 'EMLINK'].includes(err?.code)) throw err;
        // Portable fallback: reserve with O_EXCL, then replace only our own
        // reservation. This may expose the reservation briefly, but can never
        // overwrite a competing creator's file.
        let fallbackReserved = false;
        let reservation;
        try {
          reservation = reserveExclusive(filePath, mode, undefined, options.testHooks);
          fallbackReserved = true;
          options.testHooks?.afterReservationAcquired?.(filePath);
          options.testHooks?.afterCreateReservation?.(filePath);
          assertSnapshotCurrent(reservation);
          renameSync(prepared.path, filePath);
          tempPublished = true;
          committed = committedGeneration(prepared, filePath);
          options.testHooks?.afterPublicationBeforePathOpen?.('create-rename', filePath);
        } catch (fallbackError) {
          if (fallbackReserved) {
            try { assertSnapshotCurrent(reservation); unlinkSync(filePath); } catch { /* replaced by another actor */ }
          }
          throw fallbackError;
        }
      }
      if (!tempPublished) unlinkSync(prepared.path);
      try { fsyncDirectory(path.dirname(filePath), options, 'creation-publish'); }
      catch (err) { err.committedSnapshot = committed; throw err; }
      return committed;
    } catch (err) {
      try { unlinkSync(prepared.path); } catch { /* best effort */ }
      if (committed) removeCommitted(committed, err, 'created file after durability failure');
      if (err?.code === 'EEXIST') throw new MutationConflictError(`Destination already exists: ${path.resolve(filePath)}`);
      throw err;
    }
  };
  return locked ? create() : withPathLocks([filePath], options, create);
}

export function moveFileAtomic(sourcePath, targetPath, render, options) {
  const { repoRoot, finalize, rollbackFinalize, testHooks, updates = [] } = options;
  return withPathLocks([sourcePath, targetPath, ...updates.map(item => item.path)], options, () => {
    testHooks?.beforeMoveSnapshot?.({ sourcePath, targetPath });
    const source = snapshotFile(sourcePath);
    const targetDir = path.dirname(targetPath);
    const newContent = typeof render === 'function' ? render(source.content, source) : render;
    const preparedUpdates = updates.map(item => {
      const snapshot = snapshotFile(item.path);
      return { ...item, snapshot, content: item.render(snapshot.content, snapshot) };
    }).filter(item => item.content !== item.snapshot.content);
    const prepared = writeCompleteTemp(targetPath, newContent, source.identity.mode);
    const transactionId = `${process.pid}-${Date.now()}-${tempSequence++}`;
    const backup = path.join(path.dirname(sourcePath), `.${path.basename(sourcePath)}.dotmd-move-${transactionId}`);
    let reserved = false;
    let reservation;
    let moved = false;
    let published = false;
    let publishedSnapshot;
    let backupSnapshot;
    const committedUpdates = [];
    let finalizeAttempted = false;
    let pastRecoveryBoundary = false;
    try {
      try {
        reservation = reserveExclusive(targetPath, source.identity.mode, JSON.stringify({
          dotmdReservation: true,
          transactionId,
          sourcePath,
          backup,
          pid: process.pid,
          createdAt: new Date().toISOString(),
        }) + '\n', testHooks);
      } catch (err) {
        if (err?.code === 'EEXIST') throw new MutationConflictError(`Destination already exists: ${path.resolve(targetPath)}`);
        throw err;
      }
      reserved = true;
      testHooks?.afterReservationAcquired?.(targetPath);
      fsyncDirectory(targetDir);

      testHooks?.afterMoveReservation?.({ source, sourcePath, targetPath });
      assertSnapshotCurrent(source);
      testHooks?.afterMoveValidation?.({ source, sourcePath, targetPath });
      // Revalidate immediately before the move, after every hook/preparation
      // step that can permit an injected or external source edit.
      assertSnapshotCurrent(source);
      for (const item of preparedUpdates) assertSnapshotCurrent(item.snapshot);
      renameSync(sourcePath, backup);
      moved = true;
      backupSnapshot = { ...source, path: backup, identityKind: 'inode-content' };
      fsyncDirectory(path.dirname(sourcePath));

      testHooks?.afterSourceMove?.({ backup, sourcePath, targetPath });
      assertSnapshotCurrent(reservation);
      renameSync(prepared.path, targetPath);
      published = true;
      reserved = false;
      publishedSnapshot = committedGeneration(prepared, targetPath);
      testHooks?.afterPublicationBeforePathOpen?.('move-target', targetPath);
      fsyncDirectory(targetDir, options, 'move-target-publish');
      for (const item of preparedUpdates) {
        try {
          const committed = replaceSnapshot(item.snapshot, item.content, { ...options, locked: true });
          committedUpdates.push({ ...item, committed });
        } catch (err) {
          if (err.committedSnapshot) committedUpdates.push({ ...item, committed: err.committedSnapshot });
          throw err;
        }
      }
      testHooks?.afterMovePublish?.({ backup, sourcePath, targetPath });

      if (finalize) {
        finalizeAttempted = true;
        finalize({ sourcePath, targetPath, backup });
      }
      testHooks?.afterMoveFinalize?.({ backup, sourcePath, targetPath });
      rmSync(backup, { force: true });
      moved = false;
      pastRecoveryBoundary = true;
      fsyncDirectory(path.dirname(backup), options, 'move-backup-delete');
      return { source, target: publishedSnapshot, updatedPaths: preparedUpdates.map(item => item.path) };
    } catch (err) {
      if (pastRecoveryBoundary) {
        err.message += '\nMove content and Git index are committed; backup deletion could not be durably synced. No rollback was attempted after the recovery boundary.';
        throw err;
      }
      for (const item of committedUpdates.reverse()) restoreUpdate(item.committed, item.snapshot, err);
      if (published) {
        removeCommitted(publishedSnapshot, err, 'published move target');
        published = false;
      } else if (reserved) {
        try { assertSnapshotCurrent(reservation); unlinkSync(targetPath); } catch { /* replaced by another actor */ }
        reserved = false;
      }
      if (moved) {
        try {
          assertSnapshotCurrent(backupSnapshot);
          if (existsSync(sourcePath)) {
            rollbackConflict(err, `source was recreated at ${sourcePath}; left recoverable original at ${backup}.`);
          } else {
            renameSync(backup, sourcePath);
            moved = false;
          }
        } catch (rollbackError) {
          rollbackConflict(err, `could not restore source; recoverable original remains at ${backup}: ${rollbackError.message}`);
        }
      }
      try { unlinkSync(prepared.path); } catch { /* best effort */ }
      try { if (finalizeAttempted) rollbackFinalize?.({ sourcePath, targetPath, backup }); } catch (rollbackError) {
        rollbackConflict(err, `could not restore Git index: ${rollbackError.message}`);
      }
      try { fsyncDirectory(targetDir); } catch { /* preserve original error */ }
      throw err;
    }
  });
}

export function mutateFileSet({ updates = [], creations = [] }, options) {
  const paths = [...updates.map(item => item.path), ...creations.map(item => item.path)];
  return withPathLocks(paths, options, () => {
    const preparedUpdates = updates.map(item => {
      const snapshot = snapshotFile(item.path);
      if (item.expectedContent !== undefined && snapshot.content !== item.expectedContent) {
        throw new MutationConflictError(`File changed while the mutation set was being prepared: ${snapshot.path}`);
      }
      return { ...item, snapshot, content: item.render ? item.render(snapshot.content, snapshot) : item.content };
    });
    for (const item of creations) {
      if (existsSync(item.path)) throw new MutationConflictError(`Destination already exists: ${path.resolve(item.path)}`);
    }
    options.testHooks?.afterSetPreflight?.({ updates: preparedUpdates, creations });

    const committedUpdates = [];
    const committedCreations = [];
    try {
      for (const item of preparedUpdates) {
        try {
          const committed = replaceSnapshot(item.snapshot, item.content, { ...options, locked: true });
          committedUpdates.push({ ...item, committed });
        } catch (err) {
          if (err.committedSnapshot) committedUpdates.push({ ...item, committed: err.committedSnapshot });
          throw err;
        }
        options.testHooks?.afterSetCommit?.(committedUpdates.length + committedCreations.length, item.path);
      }
      for (const item of creations) {
        const committed = createFileExclusive(item.path, item.content, { ...options, mode: item.mode, locked: true });
        committedCreations.push({ ...item, committed });
        options.testHooks?.afterSetCommit?.(committedUpdates.length + committedCreations.length, item.path);
      }
      return { updates: preparedUpdates, creations };
    } catch (err) {
      for (const item of committedCreations.reverse()) {
        removeCommitted(item.committed, err, 'created file');
      }
      for (const item of committedUpdates.reverse()) {
        restoreUpdate(item.committed, item.snapshot, err);
      }
      throw err;
    }
  });
}
