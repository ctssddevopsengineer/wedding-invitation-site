import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/saffron-inside-right-centering.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Saffron inside-right text stack uses the reviewed optical center', () => {
  assert.match(css, /--saffron-inside-right-optical-center:\s*51\.5%/);
  assert.match(css, /\.insideRightDynamicTitle[\s\S]*?\.localizedPrintedDetailsTitle[\s\S]*?\.receptionDetailsOverlay[\s\S]*?left:\s*var\(--saffron-inside-right-optical-center\)/);
});

test('Saffron inside-right centering remains theme-scoped and does not move artwork geometry', () => {
  assert.match(css, /data-invitation-theme="saffron"/);
  assert.doesNotMatch(css, /data-invitation-theme="(?:classic|blush|magenta|navy|plum)"/);
  assert.doesNotMatch(css, /insideRightThemeMonogram\s*\{/);
  assert.doesNotMatch(css, /exactLocationHotspot\s*\{/);
  assert.doesNotMatch(css, /width\s*:/);
  assert.doesNotMatch(css, /height\s*:/);
  assert.doesNotMatch(css, /top\s*:/);
  assert.doesNotMatch(css, /transform\s*:/);
});

test('Saffron centering guard loads after shared inside-right parity and before later Saffron layers', () => {
  const parity = layout.indexOf("import './inside-right-saffron-parity.css';");
  const centering = layout.indexOf("import './saffron-inside-right-centering.css';");
  const magnifier = layout.indexOf("import './saffron-location-magnifier.css';");
  const compact = layout.indexOf("import './compact-details-scroll.css';");

  assert.ok(parity >= 0 && centering > parity, 'centering guard must override shared inside-right positioning');
  assert.ok(magnifier > centering, 'location magnifier stays layered after the centering guard');
  assert.ok(compact > centering, 'compact scrolling remains a later layout layer');
});
