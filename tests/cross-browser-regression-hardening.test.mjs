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

test('countdown collision detection measures painted countdown content, not its flex allocation box', () => {
  assert.match(source, /\['\.receptionCountdownItem \.countdown', '\.localizedDetailsClosing'\]/);
  assert.doesNotMatch(source, /\['\.receptionCountdownItem', '\.localizedDetailsClosing'\]/);
});

test('back-cover collision detection uses semantic boxes instead of macOS Firefox glyph ranges', () => {
  assert.match(source, /\['\.heritageCoupleNames', '\.heritageJourneyMessage'\]/);
  assert.match(source, /\['\.heritageJourneyMessage', '\.heritageAssistance'\]/);
  assert.match(source, /\.heritageJourneyMessage > span/);
  assert.match(source, /\.heritageAssistance > h3/);
  assert.match(source, /\.heritageAssistance \.contactGrid/);
  assert.match(source, /\.heritageAssistance \.contactCard/);
  assert.match(source, /const semanticZones = '[^']*\.heritageJourneyMessage[^']*\.heritageAssistance/);
});

test('legacy viewports below 320px remain visible in reports without blocking supported-device CI', () => {
  assert.match(source, /const advisories = \[\]/);
  assert.match(source, /if \(width < 320\) \{/);
  assert.match(source, /advisories\.push\(issueSummary\)/);
  assert.match(source, /console\.warn\(`Advisory viewport issue:/);
  assert.match(source, /JSON\.stringify\(\{ browser: browserTarget, checked, viewports: validationViewports, failureScreenshots, advisories, errors \}/);
});

test('cross-browser matrix still fails on real semantic overlaps at supported widths', () => {
  assert.match(source, /a\.bottom > b\.top \+ 2/);
  assert.match(source, /issues\.push\(`overlap: \$\{first\}\/\$\{second\}`\)/);
  assert.match(source, /else \{\s*errors\.push\(issueSummary\);\s*\}/);
  assert.match(source, /assert\.deepEqual\(errors, \[\]\)/);
});
