import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/inside-right-mobile-centering.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('mobile inside-right centering covers Magenta, Navy, Plum and Saffron only', () => {
  for (const theme of ['magenta', 'navy', 'plum', 'saffron']) {
    assert.match(css, new RegExp(`data-invitation-theme="${theme}"`));
  }

  assert.doesNotMatch(css, /data-invitation-theme="(?:classic|blush)"/);
  assert.doesNotMatch(css, /\[lang="(?:en|bn|ne)"\]/);
});

test('mobile inside-right centering is phone-scoped and uses the reviewed optical center', () => {
  assert.match(css, /@media\s*\(max-width:\s*680px\)/);
  assert.match(css, /--inside-right-mobile-optical-center:\s*51\.5%/);
  assert.match(css, /\.insideRightDynamicTitle[\s\S]*?\.localizedPrintedDetailsTitle[\s\S]*?\.receptionDetailsOverlay[\s\S]*?left:\s*var\(--inside-right-mobile-optical-center\)/);
});

test('mobile centering does not move monogram, map hotspot or artwork geometry', () => {
  assert.doesNotMatch(css, /insideRightThemeMonogram\s*\{/);
  assert.doesNotMatch(css, /exactLocationHotspot\s*\{/);
  assert.doesNotMatch(css, /(?:^|[;{]\s*)width\s*:/m);
  assert.doesNotMatch(css, /(?:^|[;{]\s*)height\s*:/m);
  assert.doesNotMatch(css, /(?:^|[;{]\s*)top\s*:/m);
  assert.doesNotMatch(css, /(?:^|[;{]\s*)transform\s*:/m);
});

test('mobile centering loads after theme centering guards and before later utility layers', () => {
  const saffron = layout.indexOf("import './saffron-inside-right-centering.css';");
  const plum = layout.indexOf("import './plum-inside-right-centering.css';");
  const navy = layout.indexOf("import './navy-inside-right-centering.css';");
  const mobile = layout.indexOf("import './inside-right-mobile-centering.css';");
  const magnifier = layout.indexOf("import './saffron-location-magnifier.css';");
  const compact = layout.indexOf("import './compact-details-scroll.css';");

  assert.ok(saffron >= 0 && plum > saffron && navy > plum, 'existing theme centering layers must remain ordered');
  assert.ok(mobile > navy, 'mobile layer must override theme centering on phone widths');
  assert.ok(magnifier > mobile, 'magnifier layer remains after mobile centering');
  assert.ok(compact > mobile, 'compact scroll remains a later layout layer');
});
