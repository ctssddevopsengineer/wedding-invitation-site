import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/plum-inside-right-centering.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Royal Plum inside-right text stack uses the reviewed optical center', () => {
  assert.match(css, /--plum-inside-right-optical-center:\s*51\.5%/);
  assert.match(css, /\.insideRightDynamicTitle[\s\S]*?\.localizedPrintedDetailsTitle[\s\S]*?\.receptionDetailsOverlay[\s\S]*?left:\s*var\(--plum-inside-right-optical-center\)/);
});

test('Royal Plum inside-right centering remains theme-scoped and does not move artwork geometry', () => {
  assert.match(css, /data-invitation-theme="plum"/);
  assert.doesNotMatch(css, /data-invitation-theme="(?:classic|blush|magenta|navy|saffron)"/);
  assert.doesNotMatch(css, /insideRightThemeMonogram\s*\{/);
  assert.doesNotMatch(css, /exactLocationHotspot\s*\{/);
  assert.doesNotMatch(css, /width\s*:/);
  assert.doesNotMatch(css, /height\s*:/);
  assert.doesNotMatch(css, /top\s*:/);
  assert.doesNotMatch(css, /transform\s*:/);
});

test('Royal Plum centering guard loads after shared inside-right parity and before later utility layers', () => {
  const parity = layout.indexOf("import './inside-right-saffron-parity.css';");
  const plumCentering = layout.indexOf("import './plum-inside-right-centering.css';");
  const magnifier = layout.indexOf("import './saffron-location-magnifier.css';");
  const compact = layout.indexOf("import './compact-details-scroll.css';");

  assert.ok(parity >= 0 && plumCentering > parity, 'Royal Plum centering must override shared inside-right positioning');
  assert.ok(magnifier > plumCentering, 'location magnifier remains after the centering guard');
  assert.ok(compact > plumCentering, 'compact scrolling remains a later layout layer');
});
