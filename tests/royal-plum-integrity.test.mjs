import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const baselines = Object.freeze({
  classic: 'ec39325b94ce6eb30845cf492aba194013c992c50f3a5fbbee304c470aed0036',
  blush: 'c7bb6c94bf0f5d22b2a8e5421c79fc872f948aa4c5f1a5aad4863f3e3449f26b',
  magenta: '0e72ce9a6afe5ed3669adb65da17a54afe336e5f167fdbec4c590787625988ff',
  navy: '0a99ea2770c0aa84ed801f7b7c9e78f8f9fa0677cb787e8add0cf765c1908548'
});

const ADDITIVE_APPROVED_ASSETS = new Set([
  'front-enhanced.jpg',
  'front-blank.jpg'
]);

function directoryDigest(directory) {
  const hash = crypto.createHash('sha256');
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        const relative = path.relative(directory, full).split(path.sep).join('/');
        // Derived thumbnails/optimized companions and explicitly approved additive
        // front templates must not invalidate the historical Royal Plum baseline.
        // The original approved artwork files are still byte-for-byte protected.
        if (relative.endsWith('.webp') || ADDITIVE_APPROVED_ASSETS.has(relative)) continue;
        hash.update(relative);
        hash.update('\0');
        hash.update(fs.readFileSync(full));
        hash.update('\0');
      }
    }
  };
  walk(directory);
  return hash.digest('hex');
}

for (const [themeId, expected] of Object.entries(baselines)) {
  test(`Royal Plum addition does not modify existing ${themeId} theme assets`, () => {
    const actual = directoryDigest(path.join(root, 'public', 'themes', themeId));
    assert.equal(actual, expected);
  });
}
