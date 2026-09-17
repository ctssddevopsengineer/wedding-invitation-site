import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/royal-plum-nepali-name-clipping.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Royal Plum Nepali front names allow full Devanagari headline and matra rendering', () => {
  assert.match(css, /\[lang="ne"\]\[data-invitation-theme="plum"\][\s\S]*?\.dynamicFrontNames\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(css, /\.dynamicFrontNames\s*\{[\s\S]*?line-height:\s*1\.34/);
  assert.match(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?line-height:\s*1\.34/);
});

test('Royal Plum Nepali clipping fix stays front-page and theme/language scoped', () => {
  assert.doesNotMatch(css, /\[lang="bn"\]/);
  assert.doesNotMatch(css, /data-invitation-theme="(?:classic|blush|magenta|navy|saffron)"/);
  assert.doesNotMatch(css, /\.familyCoupleNames|\.heritageCoupleNames|\.receptionDetailsOverlay/);
});

test('Royal Plum Nepali clipping guard loads after Plum responsive typography and before later layout layers', () => {
  const responsive = layout.indexOf("import './royal-plum-responsive-typography.css';");
  const clipping = layout.indexOf("import './royal-plum-nepali-name-clipping.css';");
  const saffronResponsive = layout.indexOf("import './saffron-responsive-typography.css';");
  const compact = layout.indexOf("import './compact-details-scroll.css';");
  assert.ok(responsive >= 0 && clipping > responsive, 'Royal Plum clipping guard must override its responsive typography');
  assert.ok(saffronResponsive > clipping, 'unrelated later theme typography remains ordered after the Plum guard');
  assert.ok(compact > clipping, 'compact scrolling remains the final layout layer');
});
