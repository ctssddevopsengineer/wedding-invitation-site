import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/saffron-mobile-inside-right-centering.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Saffron mobile inside-right uses a phone-only optical correction', () => {
  assert.match(css, /@media\s*\(max-width:\s*680px\)/);
  assert.match(css, /--saffron-mobile-inside-right-optical-center:\s*52\.5%/);
  assert.match(css, /\.insideRightDynamicTitle[\s\S]*?\.localizedPrintedDetailsTitle[\s\S]*?\.receptionDetailsOverlay[\s\S]*?left:\s*var\(--saffron-mobile-inside-right-optical-center\)/);
});

test('Saffron mobile centering remains theme-scoped and language-neutral', () => {
  assert.match(css, /data-invitation-theme="saffron"/);
  assert.doesNotMatch(css, /data-invitation-theme="(?:classic|blush|magenta|navy|plum)"/);
  assert.doesNotMatch(css, /\[lang="(?:en|bn|ne)"\]/);
});

test('Saffron mobile centering does not move monogram, hotspot, or artwork geometry', () => {
  assert.doesNotMatch(css, /insideRightThemeMonogram\s*\{/);
  assert.doesNotMatch(css, /exactLocationHotspot\s*\{/);
  assert.doesNotMatch(css, /(?:^|[;{]\s*)width\s*:/m);
  assert.doesNotMatch(css, /(?:^|[;{]\s*)height\s*:/m);
  assert.doesNotMatch(css, /(?:^|[;{]\s*)top\s*:/m);
  assert.doesNotMatch(css, /(?:^|[;{]\s*)transform\s*:/m);
});

test('Saffron mobile layer overrides only after the general Saffron centering layer', () => {
  const general = layout.indexOf("import './saffron-inside-right-centering.css';");
  const mobile = layout.indexOf("import './saffron-mobile-inside-right-centering.css';");
  const plum = layout.indexOf("import './plum-inside-right-centering.css';");
  const compact = layout.indexOf("import './compact-details-scroll.css';");

  assert.ok(general >= 0 && mobile > general, 'mobile Saffron centering must load after general Saffron centering');
  assert.ok(plum > mobile, 'other theme centering layers remain after the Saffron mobile override');
  assert.ok(compact > mobile, 'compact details scroll remains a later utility layer');
});
