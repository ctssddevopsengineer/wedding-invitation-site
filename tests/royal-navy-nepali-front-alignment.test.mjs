import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/royal-navy-nepali-name-alignment.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');
const frontCss = css.split('/* BACK / LAST PAGE */')[0];

test('Royal Navy Nepali front names preserve full Devanagari glyph ink', () => {
  assert.match(frontCss, /\[lang="ne"\]\[data-invitation-theme="navy"\][\s\S]*?\.dynamicFrontNames\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(frontCss, /\.dynamicFrontNames\s*\{[\s\S]*?line-height:\s*1\.34/);
  assert.match(frontCss, /\.dynamicFrontNames > span\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(frontCss, /\.dynamicFrontNames > span\s*\{[\s\S]*?line-height:\s*1\.34/);
});

test('Royal Navy Nepali groom and bride names are optically lowered to the ampersand', () => {
  assert.match(frontCss, /\.dynamicFrontNames > span\s*\{[\s\S]*?vertical-align:\s*-\.10em/);
  assert.doesNotMatch(frontCss, /margin-top\s*:/);
  assert.doesNotMatch(frontCss, /(?:^|[;{]\s*)top\s*:/m);
  assert.doesNotMatch(frontCss, /(?:^|[;{]\s*)transform\s*:/m);
});

test('Royal Navy Nepali front fix remains narrowly scoped', () => {
  assert.doesNotMatch(frontCss, /\[lang="bn"\]/);
  assert.doesNotMatch(frontCss, /data-invitation-theme="(?:classic|blush|magenta|plum|saffron)"/);
  assert.doesNotMatch(frontCss, /\.familyCoupleNames|\.heritageCoupleNames|\.receptionDetailsOverlay/);
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
