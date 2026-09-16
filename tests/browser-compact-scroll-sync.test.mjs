import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const script = fs.readFileSync(new URL('../scripts/test-multilingual-browser.mjs', import.meta.url), 'utf8');

test('compact browser regression waits for the active compact media-query contract', () => {
  assert.match(script, /async function waitForCompactScrollContract\(page, width, pageName\)/);
  assert.match(script, /matchMedia\('\(max-width: 374px\)'\)\.matches/);
  assert.match(script, /style\.overflowY === 'auto'/);
  assert.match(script, /style\.overflowX === 'hidden'/);
  assert.match(script, /style\.overscrollBehaviorY === 'contain'/);
  assert.match(script, /await waitForCompactScrollContract\(page, width, pageName\)/);
});

test('compact browser regression selects the scroll region for the active page explicitly', () => {
  assert.match(script, /const compactRegionByPage = \{[\s\S]*front: 'front'[\s\S]*family: 'inside-left'[\s\S]*details: 'inside-right'[\s\S]*back: 'back'/);
  assert.match(script, /data-compact-scroll-region/);
  assert.match(script, /requestAnimationFrame\(\(\) => requestAnimationFrame\(resolve\)\)/);
});
