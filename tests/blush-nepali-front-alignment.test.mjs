import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/blush-nepali-name-alignment.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');
const [frontSection = ''] = css.split('/* BACK / LAST PAGE */');

test('Baby Pink Nepali front names preserve full Devanagari glyph ink', () => {
  assert.match(frontSection, /\[lang="ne"\]\[data-invitation-theme="blush"\][\s\S]*?\.dynamicFrontNames\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(frontSection, /\.dynamicFrontNames\s*\{[\s\S]*?text-overflow:\s*clip/);
  assert.match(frontSection, /\.dynamicFrontNames\s*\{[\s\S]*?line-height:\s*1\.34/);
  assert.match(frontSection, /\.dynamicFrontNames > span\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(frontSection, /\.dynamicFrontNames > span\s*\{[\s\S]*?line-height:\s*1\.34/);
});

test('Baby Pink Nepali groom and bride names are optically lowered to the ampersand', () => {
  assert.match(frontSection, /\.dynamicFrontNames > span\s*\{[\s\S]*?vertical-align:\s*-\.10em/);
  assert.doesNotMatch(frontSection, /margin-top\s*:/);
  assert.doesNotMatch(frontSection, /(?:^|[;{]\s*)top\s*:/m);
  assert.doesNotMatch(frontSection, /(?:^|[;{]\s*)transform\s*:/m);
});

test('Baby Pink Nepali front alignment fix remains narrowly scoped', () => {
  assert.doesNotMatch(frontSection, /\[lang="bn"\]|\[lang="en"\]/);
  assert.doesNotMatch(frontSection, /data-invitation-theme="(?:classic|magenta|navy|plum|saffron)"/);
  assert.doesNotMatch(frontSection, /\.familyCoupleNames|\.heritageCoupleNames|\.receptionDetailsOverlay/);
});

test('Baby Pink Nepali alignment guard loads after Baby Pink responsive typography', () => {
  const responsive = layout.indexOf("import './blush-responsive-typography.css';");
  const guard = layout.indexOf("import './blush-nepali-name-alignment.css';");
  const magentaResponsive = layout.indexOf("import './rani-magenta-responsive-typography.css';");
  const compact = layout.indexOf("import './compact-details-scroll.css';");
  assert.ok(responsive >= 0 && guard > responsive, 'Baby Pink alignment guard must override Baby Pink responsive typography');
  assert.ok(magentaResponsive > guard, 'later unrelated theme typography remains ordered after the Baby Pink guard');
  assert.ok(compact > guard, 'compact scrolling remains the final layout layer');
});
