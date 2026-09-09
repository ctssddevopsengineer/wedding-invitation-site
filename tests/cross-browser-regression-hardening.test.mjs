import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../scripts/test-multilingual-browser.mjs', import.meta.url), 'utf8');

test('WebKit matrix periodically refreshes the document before History API throttling', () => {
  assert.match(source, /browserTarget\.engine === 'webkit' && webkitHistoryOps >= 32/);
  assert.match(source, /await page\.goto\(`\$\{url\}\$\{search\}`\)/);
  assert.match(source, /webkitHistoryOps = 0/);
});

test('front-page collision detection uses semantic element boxes across browser font engines', () => {
  assert.match(source, /\['\.dynamicFrontHeading > span', '\.dynamicFrontHeading > em'\]/);
  assert.match(source, /\['\.dynamicFrontTagline', '\.dynamicFrontNames'\]/);
  assert.match(source, /const semanticZones = '[^']*\.dynamicFrontHeading[^']*\.dynamicFrontTagline[^']*\.dynamicFrontNames/);
});

test('cross-browser matrix still fails on real semantic overlaps', () => {
  assert.match(source, /a\.bottom > b\.top \+ 2/);
  assert.match(source, /issues\.push\(`overlap: \$\{first\}\/\$\{second\}`\)/);
  assert.match(source, /assert\.deepEqual\(errors, \[\]\)/);
});
