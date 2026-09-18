import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/classic-nepali-name-alignment.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');
const [frontSection = ''] = css.split('/* BACK / LAST PAGE */');

test('Classic Nepali front names preserve full Devanagari glyph ink', () => {
  assert.match(frontSection, /\[lang="ne"\]\[data-invitation-theme="classic"\][\s\S]*?\.dynamicFrontNames\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(frontSection, /\.dynamicFrontNames\s*\{[\s\S]*?text-overflow:\s*clip/);
  assert.match(frontSection, /\.dynamicFrontNames\s*\{[\s\S]*?line-height:\s*1\.34/);
  assert.match(frontSection, /\.dynamicFrontNames > span\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(frontSection, /\.dynamicFrontNames > span\s*\{[\s\S]*?line-height:\s*1\.34/);
});

test('Classic Nepali groom and bride names are optically lowered to the ampersand', () => {
  assert.match(frontSection, /\.dynamicFrontNames > span\s*\{[\s\S]*?vertical-align:\s*-\.10em/);
  assert.doesNotMatch(frontSection, /margin-top\s*:/);
  assert.doesNotMatch(frontSection, /(?:^|[;{]\s*)top\s*:/m);
  assert.doesNotMatch(frontSection, /(?:^|[;{]\s*)transform\s*:/m);
});

test('Classic Nepali front alignment fix remains narrowly scoped', () => {
  assert.doesNotMatch(frontSection, /\[lang="bn"\]|\[lang="en"\]/);
  assert.doesNotMatch(frontSection, /data-invitation-theme="(?:blush|magenta|navy|plum|saffron)"/);
  assert.doesNotMatch(frontSection, /\.familyCoupleNames|\.heritageCoupleNames|\.receptionDetailsOverlay/);
});

test('Classic Nepali alignment guard loads after Classic multilingual typography', () => {
  const responsive = layout.indexOf("import './classic-multilingual-laptop.css';");
  const guard = layout.indexOf("import './classic-nepali-name-alignment.css';");
  const blushResponsive = layout.indexOf("import './blush-responsive-typography.css';");
  const compact = layout.indexOf("import './compact-details-scroll.css';");
  assert.ok(responsive >= 0 && guard > responsive, 'Classic alignment guard must override Classic multilingual typography');
  assert.ok(blushResponsive > guard, 'later unrelated theme typography remains ordered after the Classic guard');
  assert.ok(compact > guard, 'compact scrolling remains the final layout layer');
});
