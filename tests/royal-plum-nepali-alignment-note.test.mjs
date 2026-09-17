import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/royal-plum-nepali-name-clipping.css', import.meta.url), 'utf8');

test('Royal Plum Nepali front name spans keep the approved optical offset', () => {
  assert.match(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?vertical-align:\s*-\.10em/);
});
