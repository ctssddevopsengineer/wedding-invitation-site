import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const script = fs.readFileSync(new URL('../scripts/test-visual-regression.mjs', import.meta.url), 'utf8');

test('pixel regression explicitly loads visible invitation fonts before hashing', () => {
  assert.match(script, /document\.querySelectorAll\('\.invitePage \*'\)/);
  assert.match(script, /document\.fonts\.load\(/);
  assert.match(script, /await document\.fonts\.ready/);
});

test('pixel regression waits for font metrics to reach paint before screenshot capture', () => {
  assert.match(script, /requestAnimationFrame\(\(\) => requestAnimationFrame\(resolve\)\)/);
  assert.match(script, /await waitForStableArtwork\(page\)[\s\S]*?locator\.screenshot/);
});
