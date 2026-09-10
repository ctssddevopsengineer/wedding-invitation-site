import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveBrowserTarget, SUPPORTED_BROWSER_ENGINES } from '../lib/browser-regression.mjs';

test('supports the three Playwright browser engines used by CI', () => {
  assert.deepEqual(SUPPORTED_BROWSER_ENGINES, ['chromium', 'firefox', 'webkit']);
});

test('defaults to bundled Chromium when no browser target is provided', () => {
  assert.deepEqual(resolveBrowserTarget({}), {
    engine: 'chromium',
    channel: null,
    label: 'chromium'
  });
});

test('supports installed Chrome and Edge channels through Chromium', () => {
  assert.deepEqual(resolveBrowserTarget({ BROWSER_ENGINE: 'chromium', BROWSER_CHANNEL: 'chrome' }), {
    engine: 'chromium',
    channel: 'chrome',
    label: 'chromium:chrome'
  });

  assert.deepEqual(resolveBrowserTarget({ BROWSER_ENGINE: 'chromium', BROWSER_CHANNEL: 'msedge' }), {
    engine: 'chromium',
    channel: 'msedge',
    label: 'chromium:msedge'
  });
});

test('supports Firefox and WebKit without branded channels', () => {
  assert.deepEqual(resolveBrowserTarget({ BROWSER_ENGINE: 'firefox' }), {
    engine: 'firefox',
    channel: null,
    label: 'firefox'
  });

  assert.deepEqual(resolveBrowserTarget({ BROWSER_ENGINE: 'webkit' }), {
    engine: 'webkit',
    channel: null,
    label: 'webkit'
  });
});

test('rejects unsupported engines and invalid non-Chromium channels', () => {
  assert.throws(() => resolveBrowserTarget({ BROWSER_ENGINE: 'opera' }), /Unsupported browser engine/);
  assert.throws(
    () => resolveBrowserTarget({ BROWSER_ENGINE: 'firefox', BROWSER_CHANNEL: 'chrome' }),
    /can only be used with the chromium engine/
  );
});
