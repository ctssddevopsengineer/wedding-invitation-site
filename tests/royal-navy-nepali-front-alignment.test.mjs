import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/royal-navy-nepali-name-alignment.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Royal Navy Nepali front names preserve full Devanagari glyph ink', () => {
  assert.match(css, /\[lang="ne"\]\[data-invitation-theme="navy"\][\s\S]*?\.dynamicFrontNames\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(css, /\.dynamicFrontNames\s*\{[\s\S]*?line-height:\s*1\.34/);
  assert.match(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?line-height:\s*1\.34/);
});

test('Royal Navy Nepali groom and bride names are optically lowered to the ampersand', () => {
  assert.match(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?vertical-align:\s*-\.10em/);
  assert.doesNotMatch(css, /margin-top\s*:/);
  assert.doesNotMatch(css, /(?:^|[;{]\s*)top\s*:/m);
  assert.doesNotMatch(css, /(?:^|[;{]\s*)transform\s*:/m);
});

test('Royal Navy Nepali front fix remains narrowly scoped', () => {
  assert.doesNotMatch(css, /\[lang="bn"\]/);
  assert.doesNotMatch(css, /data-invitation-theme="(?:classic|blush|magenta|plum|saffron)"/);
  assert.doesNotMatch(css, /\.familyCoupleNames|\.heritageCoupleNames|\.receptionDetailsOverlay/);
});

test('Royal Navy Nepali alignment guard loads after Navy responsive typography', () => {
  const responsive = layout.indexOf("import './royal-navy-responsive-typography.css';");
  const guard = layout.indexOf("import './royal-navy-nepali-name-alignment.css';");
  const plumResponsive = layout.indexOf("import './royal-plum-responsive-typography.css';");
  const compact = layout.indexOf("import './compact-details-scroll.css';");
  assert.ok(responsive >= 0 && guard > responsive, 'Royal Navy alignment guard must override Navy responsive typography');
  assert.ok(plumResponsive > guard, 'later unrelated theme typography remains ordered after the Navy guard');
  assert.ok(compact > guard, 'compact scrolling remains the final layout layer');
});
