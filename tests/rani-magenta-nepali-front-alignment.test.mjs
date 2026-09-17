import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/rani-magenta-nepali-name-alignment.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Rani Magenta Nepali front names preserve full Devanagari glyph ink', () => {
  assert.match(css, /\[lang="ne"\]\[data-invitation-theme="magenta"\][\s\S]*?\.dynamicFrontNames\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(css, /\.dynamicFrontNames\s*\{[\s\S]*?text-overflow:\s*clip/);
  assert.match(css, /\.dynamicFrontNames\s*\{[\s\S]*?line-height:\s*1\.34/);
  assert.match(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?line-height:\s*1\.34/);
});

test('Rani Magenta Nepali groom and bride names are optically lowered to the ampersand', () => {
  assert.match(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?vertical-align:\s*-\.10em/);
  assert.doesNotMatch(css, /margin-top\s*:/);
  assert.doesNotMatch(css, /(?:^|[;{]\s*)top\s*:/m);
  assert.doesNotMatch(css, /(?:^|[;{]\s*)transform\s*:/m);
});

test('Rani Magenta Nepali front alignment fix remains narrowly scoped', () => {
  assert.doesNotMatch(css, /\[lang="bn"\]|\[lang="en"\]/);
  assert.doesNotMatch(css, /data-invitation-theme="(?:classic|blush|navy|plum|saffron)"/);
  assert.doesNotMatch(css, /\.familyCoupleNames|\.heritageCoupleNames|\.receptionDetailsOverlay/);
});

test('Rani Magenta Nepali alignment guard loads after Magenta responsive typography', () => {
  const responsive = layout.indexOf("import './rani-magenta-responsive-typography.css';");
  const guard = layout.indexOf("import './rani-magenta-nepali-name-alignment.css';");
  const navyResponsive = layout.indexOf("import './royal-navy-responsive-typography.css';");
  const compact = layout.indexOf("import './compact-details-scroll.css';");
  assert.ok(responsive >= 0 && guard > responsive, 'Magenta alignment guard must override Magenta responsive typography');
  assert.ok(navyResponsive > guard, 'later unrelated theme typography remains ordered after the Magenta guard');
  assert.ok(compact > guard, 'compact scrolling remains the final layout layer');
});
