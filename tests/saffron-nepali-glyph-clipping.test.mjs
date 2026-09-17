import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/saffron-nepali-name-clipping.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Saffron Nepali front names allow Devanagari headline and matra glyphs to paint fully', () => {
  assert.match(css, /\[lang="ne"\]\[data-invitation-theme="saffron"\][\s\S]*?\.dynamicFrontNames\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(css, /\.dynamicFrontNames\s*\{[\s\S]*?line-height:\s*1\.34/);
  assert.match(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?line-height:\s*1\.34/);
});

test('Devanagari clipping fix remains narrowly scoped to Saffron Nepali front names', () => {
  assert.doesNotMatch(css, /\[lang="bn"\]/);
  assert.doesNotMatch(css, /data-invitation-theme="(?:classic|blush|magenta|navy|plum)"/);
  assert.doesNotMatch(css, /\.familyCoupleNames|\.heritageCoupleNames|\.receptionDetailsOverlay/);
});

test('Nepali clipping guard loads after responsive typography and before compact scrolling', () => {
  const responsive = layout.indexOf("import './saffron-responsive-typography.css';");
  const clipping = layout.indexOf("import './saffron-nepali-name-clipping.css';");
  const compact = layout.indexOf("import './compact-details-scroll.css';");
  assert.ok(responsive >= 0 && clipping > responsive, 'clipping guard must override responsive typography');
  assert.ok(compact > clipping, 'compact scrolling remains the final layout layer');
});
