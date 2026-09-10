import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const action = fs.readFileSync(new URL('../.github/actions/install-playwright/action.yml', import.meta.url), 'utf8');
const installScript = action.split('      run: |').at(-1).split('\n').map(line => line.replace(/^        /, '')).join('\n');

function install({ platform, browser, failures = 0 }) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'invitation-browser-install-'));
  try {
    fs.writeFileSync(path.join(directory, 'npx'), `#!/bin/bash
count=0
if [[ -f "$INSTALL_LOG" ]]; then count=$(wc -l < "$INSTALL_LOG"); fi
printf '%s\\n' "$*" >> "$INSTALL_LOG"
if [[ "$count" -lt "$FAILURES" ]]; then exit 1; fi
`, { mode: 0o755 });
    fs.writeFileSync(path.join(directory, 'sleep'), '#!/bin/bash\nexit 0\n', { mode: 0o755 });
    const log = path.join(directory, 'calls');
    const result = spawnSync('bash', ['-c', installScript], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${directory}${path.delimiter}${process.env.PATH}`, RUNNER_OS: platform, PLAYWRIGHT_BROWSER: browser, INSTALL_LOG: log, FAILURES: String(failures) }
    });
    assert.ifError(result.error);
    return { status: result.status, calls: fs.readFileSync(log, 'utf8').trim().split('\n') };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test('Linux installs pinned Playwright browsers with system dependencies', () => {
  assert.deepEqual(install({ platform: 'Linux', browser: 'chromium' }), {
    status: 0, calls: ['playwright install --with-deps chromium']
  });
});

test('macOS and Windows install their requested engine or channel without apt dependencies', () => {
  for (const [platform, browser] of [['macOS', 'webkit'], ['Windows', 'msedge']]) {
    assert.deepEqual(install({ platform, browser }), { status: 0, calls: [`playwright install ${browser}`] });
  }
});

test('transient installation failures retry up to three attempts', () => {
  const result = install({ platform: 'Linux', browser: 'firefox', failures: 2 });
  assert.equal(result.status, 0);
  assert.equal(result.calls.length, 3);
});

test('persistent installation failures remain a failing CI step', () => {
  const result = install({ platform: 'Linux', browser: 'chromium', failures: 5 });
  assert.equal(result.status, 1);
  assert.equal(result.calls.length, 3);
});

test('apt preparation moves only the unrelated Google Chrome feed and retains Ubuntu sources', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'invitation-apt-sources-'));
  try {
    const sources = path.join(directory, 'sources');
    const saved = path.join(directory, 'saved');
    fs.mkdirSync(sources);
    fs.mkdirSync(saved);
    fs.writeFileSync(path.join(sources, 'chrome.list'), 'deb https://dl.google.com/linux/chrome-stable/deb stable main\n');
    fs.writeFileSync(path.join(sources, 'chrome.sources'), 'Types: deb\nURIs: https://dl.google.com/linux/chrome/deb\nSuites: stable\n');
    fs.writeFileSync(path.join(sources, 'ubuntu.sources'), 'URIs: http://archive.ubuntu.com/ubuntu\n');
    fs.writeFileSync(path.join(directory, 'sudo'), '#!/bin/bash\nexec "$@"\n', { mode: 0o755 });
    const script = action.split('      run: |')[1].split('    - name:')[0]
      .split('\n').map(line => line.replace(/^        /, '')).join('\n')
      .replace('/etc/apt/sources.list.d/*', '"$APT_TEST_SOURCES"/*');
    const result = spawnSync('bash', ['-c', script], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${directory}${path.delimiter}${process.env.PATH}`, APT_TEST_SOURCES: sources, RUNNER_TEMP: saved }
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(fs.readdirSync(sources), ['ubuntu.sources']);
    assert.deepEqual(fs.readdirSync(saved).sort(), ['chrome.list.playwright-disabled', 'chrome.sources.playwright-disabled']);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
