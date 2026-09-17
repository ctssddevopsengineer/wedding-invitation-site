import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/royal-navy-nepali-name-alignment.css', import.meta.url), 'utf8');

test('Royal Navy Nepali back names preserve full Devanagari glyph ink', () => {
  assert.match(css, /\[lang="ne"\]\[data-invitation-theme="navy"\][\s\S]*?\.heritageBackContent \.heritageCoupleNames\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(css, /\.heritageCoupleNames\s*\{[\s\S]*?line-height:\s*1\.34/);
  assert.match(css, /\.heritageCoupleNames > span\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(css, /\.heritageCoupleNames > span\s*\{[\s\S]*?line-height:\s*1\.34/);
});

test('Royal Navy Nepali back groom and bride names are optically lowered to the ampersand', () => {
  assert.match(css, /\.heritageCoupleNames > span\s*\{[\s\S]*?vertical-align:\s*-\.10em/);
});

test('Royal Navy Nepali back alignment fix remains narrowly scoped', () => {
  const backSection = css.slice(css.indexOf('/* BACK / LAST PAGE */'));
  assert.match(backSection, /\[lang="ne"\]\[data-invitation-theme="navy"\]/);
  assert.doesNotMatch(backSection, /\[lang="bn"\]/);
  assert.doesNotMatch(backSection, /data-invitation-theme="(?:classic|blush|magenta|plum|saffron)"/);
  assert.doesNotMatch(backSection, /\.familyCoupleNames|\.dynamicFrontNames|\.receptionDetailsOverlay/);
  assert.doesNotMatch(backSection, /margin-top\s*:/);
  assert.doesNotMatch(backSection, /(?:^|[;{]\s*)top\s*:/m);
  assert.doesNotMatch(backSection, /(?:^|[;{]\s*)transform\s*:/m);
});
