'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const childProcess = require('child_process');
const { routeTask, formatRouteInjection } = require('./task-router');

const mode = process.argv[2] || '';

function readStdin() {
  return new Promise((resolve) => {
    let s = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (d) => { s += d; });
    process.stdin.on('end', () => {
      try { resolve(JSON.parse(s || '{}')); } catch { resolve({}); }
    });
  });
}

function output(value) {
  process.stdout.write(`${JSON.stringify(value || {})}\n`);
}

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function atomicJson(file, value) {
  ensureDir(path.dirname(file));
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, file);
}

function git(workspace, args) {
  try {
    return childProcess.execFileSync('git', ['-C', workspace, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return '';
  }
}

function canonical(p) {
  try { return fs.realpathSync(p); } catch { return path.resolve(p); }
}

function expandHome(p) {
  const value = String(p || '');
  if (!value) return '';
  if (value === '~') return os.homedir();
  if (value.startsWith('~/') || value.startsWith('~\\')) {
    return path.join(os.homedir(), value.slice(2));
  }
  return value;
}

function sanitizeRemote(remote) {
  let r = String(remote || '').trim();
  if (!r) return null;
  if (/^[^@\s]+@[^:]+:.+/.test(r)) return r.replace(/^[^@]+@/, 'git@');
  try {
    const u = new URL(r);
    u.username = '';
    u.password = '';
    u.search = '';
    u.hash = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return r.replace(/https?:\/\/[^/@]+@/, 'https://');
  }
}

function identity(workspace) {
  const top = git(workspace, ['rev-parse', '--show-toplevel']) || canonical(workspace);
  const root = canonical(top);
  const remote = sanitizeRemote(git(root, ['config', '--get', 'remote.origin.url']));
  return {
    id: crypto.createHash('sha256').update(`${root}\n${remote || ''}`).digest('hex').slice(0, 24),
    root,
    remote
  };
}

function isDockyard(workspace) {
  const pkg = readJson(path.join(workspace, 'package.json'), {});
  const name = String(pkg?.name || '').toLowerCase();
  const repo = String(pkg?.repository?.url || '').toLowerCase();
  if (name === 'dockyardos' || repo.includes('/dockyardos')) return true;
  const plugin = path.join(workspace, 'integrations', 'antigravity', 'plugin', 'plugin.json');
  return fs.existsSync(plugin) && String(readJson(plugin, {})?.name || '').toLowerCase() === 'dockyardos';
}

function ctx(input) {
  const workspace = input.workspacePaths?.[0];
  if (!workspace) return null;
  const id = identity(workspace);
  const marker = readJson(path.join(workspace, '.agents', 'cortex', 'workspace.json'), null);
  if (!marker || marker.owner !== 'cortex' || marker.projectId !== id.id || marker.mode !== 'primary' || isDockyard(workspace)) {
    return null;
  }
  const home = process.env.CORTEX_STATE_HOME || path.join(os.homedir(), '.antigravity-cortex');
  const dir = ensureDir(path.join(home, 'projects', id.id));
  return { w: workspace, id, marker, dir };
}

function snapshot(c) {
  const status = git(c.w, ['status', '--porcelain=v1']);
  const head = git(c.w, ['rev-parse', 'HEAD']) || null;
  const branch = git(c.w, ['branch', '--show-current']) || null;
  return {
    capturedAt: new Date().toISOString(),
    projectId: c.id.id,
    projectRoot: c.id.root,
    remote: c.id.remote,
    git: {
      branch,
      head,
      status,
      changed: status.split(/\r?\n/).filter(Boolean),
      fingerprint: crypto.createHash('sha256').update(JSON.stringify({ head, branch, status })).digest('hex')
    }
  };
}

function appendEvent(c, event, payload = {}) {
  const dir = ensureDir(path.join(c.dir, 'events'));
  const record = { at: new Date().toISOString(), event, ...payload };
  atomicJson(path.join(dir, `${Date.now()}-${process.pid}-${Math.random().toString(16).slice(2, 7)}.json`), record);
  return record;
}

function maybeCheckpoint(c, reason, extra = {}, force = false) {
  const latestFile = path.join(c.dir, 'latest-checkpoint.json');
  const latest = readJson(latestFile, null);
  const now = Date.now();
  if (!force && latest?.capturedAt && now - Date.parse(latest.capturedAt) < 30000) return null;
  const checkpoint = { schema: 2, ...snapshot(c), reason, extra };
  const dir = ensureDir(path.join(c.dir, 'checkpoints'));
  const file = path.join(dir, `${checkpoint.capturedAt.replace(/[:.]/g, '-')}-${reason}.json`);
  atomicJson(file, checkpoint);
  atomicJson(latestFile, checkpoint);
  const names = fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort();
  while (names.length > 200) {
    try { fs.rmSync(path.join(dir, names.shift()), { force: true }); } catch { break; }
  }
  return checkpoint;
}

function runtime(c) {
  return readJson(path.join(c.dir, 'runtime.json'), {
    schema: 2,
    verificationEvidence: {},
    needsVerification: false,
    activeTask: '',
    activeTaskHash: null,
    activeRoute: null
  });
}

function saveRuntime(c, value) {
  atomicJson(path.join(c.dir, 'runtime.json'), value);
}

function commandLine(input) {
  const args = input.toolCall?.args || {};
  return String(args.CommandLine || args.command || args.Command || '');
}

function targetPath(input) {
  const args = input.toolCall?.args || {};
  return String(args.TargetFile || args.path || args.filePath || '');
}

function verificationCategory(command, tool = '') {
  const cmd = String(command || '');
  const name = String(tool || '');
  if (/\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:test|check)\b|\bpytest\b|\bcargo\s+test\b|\bgo\s+test\b|\bgradlew(?:\.bat)?\s+test\b/i.test(cmd)) return 'test';
  if (/\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?build\b|\bcargo\s+build\b|\bgradlew(?:\.bat)?\s+(?:assemble|build)\b/i.test(cmd)) return 'build';
  if (/\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:lint|typecheck)\b|\beslint\b|\btsc\b/i.test(cmd)) return 'lint';
  if (/browser_|playwright/i.test(name) || /playwright-cli|playwright\s+(?:test|open|codegen|screenshot)|browser_/i.test(cmd)) return 'browser';
  if (/gitleaks|osv-scanner|\bstrix\b/i.test(cmd)) return 'security';
  return null;
}

function isVisualCapture(command, tool = '') {
  return /screenshot|snapshot|capture/i.test(String(tool || '')) ||
    /playwright[^\n]*(?:screenshot|snapshot)|page\.screenshot|browser_[^\s]*(?:screenshot|snapshot|capture)/i.test(String(command || ''));
}

function isCodeLike(file) {
  return /\.(?:js|jsx|ts|tsx|py|go|rs|java|kt|kts|cs|cpp|c|h|hpp|swift|dart|vue|svelte|html|css|scss|json|ya?ml|toml|gradle)$/i.test(file || '');
}

function roleValue(node) {
  if (!node || typeof node !== 'object') return '';
  const candidates = [
    node.role,
    node.type,
    node.kind,
    node.author?.role,
    typeof node.author === 'string' ? node.author : '',
    node.message?.role,
    node.step?.role
  ];
  return candidates.map((x) => String(x || '').toLowerCase()).find(Boolean) || '';
}

function preferredText(node, depth = 0) {
  if (depth > 7 || node == null) return '';
  if (typeof node === 'string') return node.trim();
  if (Array.isArray(node)) {
    return node.map((x) => preferredText(x, depth + 1)).filter(Boolean).join('\n').trim();
  }
  if (typeof node !== 'object') return '';

  const keys = ['userMessage', 'text', 'content', 'prompt', 'message', 'parts'];
  for (const key of keys) {
    if (node[key] == null) continue;
    if (key === 'message' && typeof node[key] === 'object' && node[key]?.role) {
      const nested = preferredText(node[key], depth + 1);
      if (nested) return nested;
      continue;
    }
    const value = preferredText(node[key], depth + 1);
    if (value) return value;
  }
  return '';
}

function findUserText(node, depth = 0) {
  if (depth > 8 || node == null || typeof node !== 'object') return '';
  if (typeof node.userMessage === 'string' && node.userMessage.trim()) return node.userMessage.trim();
  const role = roleValue(node);
  if (/(^|[_-])user($|[_-])|human/.test(role)) {
    const text = preferredText(node, depth + 1);
    if (text) return text;
  }
  for (const value of Object.values(node)) {
    if (value && typeof value === 'object') {
      const found = findUserText(value, depth + 1);
      if (found) return found;
    }
  }
  return '';
}

function latestUserPrompt(transcriptPath) {
  const file = expandHome(transcriptPath);
  if (!file || !fs.existsSync(file)) return '';
  try {
    const stat = fs.statSync(file);
    const max = Math.min(stat.size, 1024 * 1024);
    const fd = fs.openSync(file, 'r');
    const buffer = Buffer.alloc(max);
    fs.readSync(fd, buffer, 0, max, stat.size - max);
    fs.closeSync(fd);
    const lines = buffer.toString('utf8').split(/\r?\n/).filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      try {
        const parsed = JSON.parse(lines[i]);
        const text = findUserText(parsed);
        if (text && !/^CORTEX\b/i.test(text)) return text.slice(0, 12000);
      } catch {
        // Ignore malformed/truncated JSONL tail records.
      }
    }
  } catch {
    return '';
  }
  return '';
}

function fresh(evidence, after) {
  if (!evidence) return false;
  if (!after) return true;
  return Date.parse(evidence) >= Date.parse(after);
}

function compactResume(c, r = runtime(c)) {
  const snap = snapshot(c);
  const cp = readJson(path.join(c.dir, 'latest-checkpoint.json'), null);
  const vr = readJson(path.join(c.dir, 'verification', 'latest.json'), null);
  const sr = readJson(path.join(c.dir, 'security', 'latest.json'), null);
  const changed = snap.git.changed.slice(0, 20).join('\n') || '(clean)';
  let next = 'Inspect current state and continue from the first unfinished action.';
  if (vr?.status === 'fail') next = 'Repair failed deterministic verification before new work.';
  else if (snap.git.changed.length) next = 'Inspect existing changes before writing more code; do not redo work blindly.';
  else if (cp?.extra?.nextAction) next = cp.extra.nextAction;

  const activeRoute = r.activeRoute?.mode ? `${r.activeRoute.mode} [${(r.activeRoute.reasons || []).join(', ')}]` : 'general';
  return [
    `CORTEX ACTIVE — project ${c.id.id}. Cortex is the primary orchestrator for this workspace; never modify DockyardOS/GameFoundry orchestration paths.`,
    `Branch: ${snap.git.branch || '(detached)'}  HEAD: ${snap.git.head || 'none'}`,
    `Checkpoint: ${cp?.capturedAt || 'none'} (${cp?.reason || 'none'})`,
    `Active route: ${activeRoute}`,
    `Changed files:\n${changed}`,
    `Latest verification: ${vr?.status || 'none'}; security: ${sr?.status || 'none'}; verification needed: ${r.needsVerification ? 'yes' : 'no'}.`,
    `Next action: ${next}`,
    'Workflow: restore -> inspect -> research if needed -> plan -> selective skills -> implement -> verify -> browser/runtime check when relevant -> security -> checkpoint. Treat repository state as authoritative over old chat memory.'
  ].join('\n').slice(0, 6500);
}

function gateIssues(r) {
  const issues = [];
  if (r.needsVerification) issues.push('deterministic code verification is stale or missing');
  if (r.activeRoute?.requirements?.browserEvidence && !fresh(r.verificationEvidence?.browser, r.lastModificationAt)) {
    issues.push('browser/runtime evidence is missing after the latest UI change');
  }
  if (r.activeRoute?.requirements?.visualEvidence && !fresh(r.verificationEvidence?.visual, r.lastModificationAt)) {
    issues.push('fresh screenshot/visual evidence is missing after the latest UI change');
  }
  return issues;
}

(async () => {
  const input = await readStdin();
  const c = ctx(input);

  if (!c) {
    if (mode === 'stop') return output({ decision: 'stop' });
    return output({});
  }

  if (mode === 'pre-invocation') {
    const r = runtime(c);
    const recoveredTask = String(input.userMessage || latestUserPrompt(input.transcriptPath) || r.activeTask || '').trim();
    const route = routeTask(recoveredTask);
    const taskHash = crypto.createHash('sha256').update(recoveredTask).digest('hex').slice(0, 20);
    const taskChanged = Boolean(recoveredTask) && taskHash !== r.activeTaskHash;

    if (taskChanged || !r.activeRoute) {
      r.activeTask = recoveredTask;
      r.activeTaskHash = taskHash;
      r.activeRoute = route;
      r.visualReviewNudgeKey = null;
      appendEvent(c, 'task-routed', {
        task: recoveredTask.slice(0, 2000),
        route: {
          reasons: route.reasons,
          mode: route.mode,
          bundledSkills: route.bundledSkills,
          externalSkills: route.externalSkills,
          requirements: route.requirements
        },
        conversationId: input.conversationId
      });
    }

    const routeKey = `${input.conversationId || 'conversation'}:${r.activeTaskHash || 'none'}`;
    const fullRoute = r.lastRouteInjectionKey !== routeKey;
    if (fullRoute) r.lastRouteInjectionKey = routeKey;
    saveRuntime(c, r);

    const routeMessage = fullRoute
      ? formatRouteInjection(r.activeRoute || route)
      : `CORTEX ROUTE ACTIVE — ${(r.activeRoute || route).mode}; keep using the selected renderer/workflow and only the relevant skills.`;

    return output({
      injectSteps: [{
        ephemeralMessage: `${compactResume(c, r)}\n\n${routeMessage}`.slice(0, 12000)
      }]
    });
  }

  if (mode === 'post-tool') {
    const tool = String(input.toolCall?.name || '');
    const error = String(input.error || '');
    const cmd = commandLine(input);
    const target = targetPath(input);
    const r = runtime(c);
    const now = new Date().toISOString();

    if (['write_to_file', 'replace_file_content', 'multi_replace_file_content'].includes(tool)) {
      r.lastModificationAt = now;
      r.lastModificationPath = target || null;
      r.needsVerification = r.needsVerification || isCodeLike(target);
      r.modificationFingerprint = snapshot(c).git.fingerprint;
    }

    const category = verificationCategory(cmd, tool);
    if (category && !error) {
      r.verificationEvidence = r.verificationEvidence || {};
      r.verificationEvidence[category] = now;
      r.lastVerificationAt = now;
      if (['test', 'build', 'lint'].includes(category)) r.needsVerification = false;
    }

    if (!error && (category === 'browser' || /browser_|playwright/i.test(tool))) {
      r.verificationEvidence = r.verificationEvidence || {};
      r.verificationEvidence.browser = now;
    }

    if (!error && isVisualCapture(cmd, tool)) {
      r.verificationEvidence = r.verificationEvidence || {};
      r.verificationEvidence.visual = now;
    }

    if (error) r.lastError = { at: now, tool, message: error.slice(0, 1200) };

    saveRuntime(c, r);
    appendEvent(c, 'post-tool', {
      tool,
      command: cmd.slice(0, 500) || undefined,
      target: target || undefined,
      error: error || undefined,
      verificationCategory: category || undefined,
      visualCapture: !error && isVisualCapture(cmd, tool) || undefined,
      modelName: input.modelName,
      conversationId: input.conversationId
    });

    if (error || category || ['write_to_file', 'replace_file_content', 'multi_replace_file_content'].includes(tool)) {
      maybeCheckpoint(c, error ? 'tool-error' : category ? `verified-${category}` : 'file-change', {
        tool,
        target,
        verificationCategory: category
      }, false);
    }

    return output({});
  }

  if (mode === 'stop') {
    const r = runtime(c);
    const snap = snapshot(c);
    maybeCheckpoint(c, 'agent-stop', {
      terminationReason: input.terminationReason,
      error: input.error || null,
      activeRoute: r.activeRoute?.mode || null
    }, true);
    appendEvent(c, 'stop', {
      terminationReason: input.terminationReason,
      error: input.error || undefined,
      fullyIdle: input.fullyIdle,
      conversationId: input.conversationId
    });

    if (input.terminationReason !== 'model_stop' || input.fullyIdle !== true) {
      return output({ decision: 'stop' });
    }

    const issues = gateIssues(r);
    if (issues.length) {
      const gateKey = crypto.createHash('sha256').update(JSON.stringify({
        fingerprint: snap.git.fingerprint,
        task: r.activeTaskHash,
        issues,
        evidence: r.verificationEvidence || {},
        modified: r.lastModificationAt || null
      })).digest('hex').slice(0, 24);

      if (r.lastGateNudgeKey !== gateKey) {
        r.lastGateNudgeKey = gateKey;
        saveRuntime(c, r);
        return output({
          decision: 'continue',
          reason: `Cortex completion gate: ${issues.join('; ')}. Run the missing evidence now. For UI/cinematic work, open the real page, exercise the scroll/interactions, capture desktop and mobile screenshots after the latest change, inspect them, repair failures, and then checkpoint before claiming completion.`
        });
      }
    }

    if (r.activeRoute?.requirements?.subjectFidelity || r.activeRoute?.requirements?.referenceCritical) {
      const visualAt = r.verificationEvidence?.visual || 'none';
      const reviewKey = `${r.activeTaskHash || 'none'}:${visualAt}:${snap.git.fingerprint}`;
      if (r.visualReviewNudgeKey !== reviewKey) {
        r.visualReviewNudgeKey = reviewKey;
        saveRuntime(c, r);
        return output({
          decision: 'continue',
          reason: 'Cortex visual fidelity gate: explicitly review the latest captured page against the user request and authentic references before finishing. Confirm the real subject is instantly recognizable, colors/details are not invented, the hero is not merely a floating background image, and the page does not fall back to generic AI cards/neon decoration. If any material mismatch exists, repair it and re-capture visual evidence.'
        });
      }
    }

    return output({ decision: 'stop' });
  }

  return output({});
})().catch(() => {
  if (mode === 'stop') output({ decision: 'stop' });
  else output({});
});
