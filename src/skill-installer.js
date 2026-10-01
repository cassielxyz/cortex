'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { STATE_HOME, IDE_GLOBAL_SKILLS, CLI_GLOBAL_SKILLS } = require('./constants');
const { ensureDir, atomicWriteJson, copyDirSafe } = require('./fs-safe');
const { run } = require('./process');
const { catalogEntry } = require('./skill-catalog');
const { namespacedSkillName, registerSkill } = require('./skill-registry');

const SYNC_MEMO = new Map();

function targetsForScope(scope) {
  if (scope === 'cli-global') return [CLI_GLOBAL_SKILLS];
  if (scope === 'both') return [IDE_GLOBAL_SKILLS, CLI_GLOBAL_SKILLS];
  return [IDE_GLOBAL_SKILLS];
}

function rewriteSkillName(markdown, newName, description) {
  let text = String(markdown || '');
  if (text.startsWith('---\n')) {
    const end = text.indexOf('\n---', 4);
    if (end > 0) {
      let fm = text.slice(4, end);
      if (/^name\s*:/m.test(fm)) fm = fm.replace(/^name\s*:.*$/m, `name: ${newName}`);
      else fm = `name: ${newName}\n${fm}`;
      if (description && !/^description\s*:/m.test(fm)) fm += `\ndescription: ${description}`;
      return `---\n${fm}\n---${text.slice(end + 4)}`;
    }
  }
  return `---\nname: ${newName}\ndescription: ${description || 'Cortex namespaced trusted skill.'}\n---\n\n${text}`;
}

function repoCacheKey(entry) {
  return crypto.createHash('sha256').update(`${entry.repo}\n${entry.ref || 'main'}`).digest('hex').slice(0, 20);
}

async function syncRepo(entry) {
  const key = repoCacheKey(entry);
  if (SYNC_MEMO.has(key)) return SYNC_MEMO.get(key);

  const task = (async () => {
    const cache = ensureDir(path.join(STATE_HOME, 'cache', 'repos'));
    const dest = path.join(cache, key);
    if (!fs.existsSync(path.join(dest, '.git'))) {
      fs.rmSync(dest, { recursive: true, force: true });
      const r = await run('git', ['clone', '--depth', '1', '--branch', entry.ref || 'main', entry.repo, dest], {
        timeoutMs: 180000,
        maxOutput: 100000
      });
      if (r.code !== 0) throw new Error(`Clone failed for ${entry.id}: ${r.stderr.slice(-800)}`);
    } else {
      let r = await run('git', ['-C', dest, 'fetch', '--depth', '1', 'origin', entry.ref || 'main'], {
        timeoutMs: 120000,
        maxOutput: 100000
      });
      if (r.code !== 0) throw new Error(`Fetch failed for ${entry.id}: ${r.stderr.slice(-800)}`);
      r = await run('git', ['-C', dest, 'reset', '--hard', 'FETCH_HEAD'], {
        timeoutMs: 30000,
        maxOutput: 20000
      });
      if (r.code !== 0) throw new Error(`Reset failed for ${entry.id}`);
    }

    const sha = (await run('git', ['-C', dest, 'rev-parse', 'HEAD'], {
      timeoutMs: 10000,
      maxOutput: 4096
    })).stdout.trim();
    return { dest, sha };
  })();

  SYNC_MEMO.set(key, task);
  try {
    return await task;
  } catch (e) {
    SYNC_MEMO.delete(key);
    throw e;
  }
}

function skillDirCandidates(entry) {
  const values = [];
  if (entry.skillDir) values.push(entry.skillDir);
  if (Array.isArray(entry.skillDirs)) values.push(...entry.skillDirs);
  if (!values.length) values.push('.');
  return [...new Set(values.map(v => String(v || '.')))];
}

function resolveSkillDirectory(entry, repoDir) {
  const checked = [];
  for (const rel of skillDirCandidates(entry)) {
    const src = path.resolve(repoDir, rel);
    const skillFile = path.join(src, 'SKILL.md');
    checked.push(rel);
    if (fs.existsSync(skillFile)) return { src, selectedSkillDir: rel, checked };
  }
  throw new Error(`SKILL.md not found for ${entry.id}; checked: ${checked.join(', ')}`);
}

function materialize(entry, repoDir) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cortex-skill-'));
  ensureDir(tmp);
  let selectedSkillDir = null;
  let selectedSourceFile = null;

  if (entry.sourceFile) {
    const source = path.join(repoDir, entry.sourceFile);
    if (!fs.existsSync(source)) throw new Error(`Skill source file not found for ${entry.id}: ${entry.sourceFile}`);
    const body = fs.readFileSync(source, 'utf8');
    fs.writeFileSync(path.join(tmp, 'SKILL.md'), body);
    selectedSourceFile = entry.sourceFile;
  } else {
    const resolved = resolveSkillDirectory(entry, repoDir);
    selectedSkillDir = resolved.selectedSkillDir;
    copyDirSafe(resolved.src, tmp, {
      maxFiles: Number(entry.maxFiles || 1000),
      maxBytes: Number(entry.maxBytes || 25 * 1024 * 1024)
    });
  }

  const upstream = fs.readFileSync(path.join(tmp, 'SKILL.md'), 'utf8');
  const namespaced = namespacedSkillName(entry.installName || entry.id);
  fs.writeFileSync(path.join(tmp, 'SKILL.md'), rewriteSkillName(upstream, namespaced, entry.description));

  for (const n of ['LICENSE', 'LICENSE.md', 'COPYING']) {
    const f = path.join(repoDir, n);
    if (fs.existsSync(f)) {
      fs.copyFileSync(f, path.join(tmp, 'LICENSE.upstream'));
      break;
    }
  }

  return { tmp, namespaced, selectedSkillDir, selectedSourceFile };
}

async function installTrustedSkill({ extensionRoot, id, scope = 'ide-global' }) {
  const entry = catalogEntry(extensionRoot, id);
  if (entry.trusted !== true) throw new Error(`Skill ${id} is not allow-listed`);

  const { dest: repoDir, sha } = await syncRepo(entry);
  const { tmp, namespaced, selectedSkillDir, selectedSourceFile } = materialize(entry, repoDir);
  const installed = [];

  try {
    for (const base of targetsForScope(scope)) {
      ensureDir(base);
      const target = path.join(base, namespaced);
      const stage = `${target}.stage-${process.pid}`;
      fs.rmSync(stage, { recursive: true, force: true });
      copyDirSafe(tmp, stage, {
        maxFiles: Number(entry.maxFiles || 1000) + 10,
        maxBytes: Number(entry.maxBytes || 25 * 1024 * 1024) + 1024 * 1024
      });
      atomicWriteJson(path.join(stage, '.cortex-source.json'), {
        schema: 2,
        id,
        repo: entry.repo,
        ref: entry.ref || 'main',
        commit: sha,
        license: entry.license || null,
        selectedSkillDir,
        selectedSourceFile,
        installedAt: new Date().toISOString(),
        installer: 'cortex-static-copy-no-third-party-scripts'
      });
      fs.rmSync(target, { recursive: true, force: true });
      fs.renameSync(stage, target);
      installed.push(registerSkill({
        id,
        source: entry.repo,
        commit: sha,
        installedPath: target,
        scope,
        upstreamName: entry.upstreamName || entry.id,
        license: entry.license || null
      }));
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  return installed;
}

function isInstalled(id, scope = 'ide-global') {
  const name = namespacedSkillName(id);
  return targetsForScope(scope).every(base => fs.existsSync(path.join(base, name, 'SKILL.md')));
}

async function ensureSkills({ extensionRoot, ids, scope = 'ide-global' }) {
  const results = [];
  for (const id of [...new Set(ids || [])]) {
    if (isInstalled(id, scope)) {
      results.push({ id, status: 'present' });
      continue;
    }
    try {
      const records = await installTrustedSkill({ extensionRoot, id, scope });
      results.push({ id, status: 'installed', records });
    } catch (e) {
      results.push({ id, status: 'failed', error: e.message });
    }
  }
  return results;
}

module.exports = {
  targetsForScope,
  rewriteSkillName,
  repoCacheKey,
  syncRepo,
  skillDirCandidates,
  resolveSkillDirectory,
  materialize,
  installTrustedSkill,
  isInstalled,
  ensureSkills
};
