import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/blush-nepali-name-alignment.css', import.meta.url), 'utf8');
const [, backSection = ''] = css.split('/* BACK / LAST PAGE */');

test('Baby Pink Nepali back names preserve full Devanagari glyph ink', () => {
  assert.match(backSection, /\[lang="ne"\]\[data-invitation-theme="blush"\][\s\S]*?\.heritageCoupleNames\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(backSection, /\.heritageCoupleNames\s*\{[\s\S]*?text-overflow:\s*clip/);
  assert.match(backSection, /\.heritageCoupleNames\s*\{[\s\S]*?line-height:\s*1\.34/);
  assert.match(backSection, /\.heritageCoupleNames > span\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(backSection, /\.heritageCoupleNames > span\s*\{[\s\S]*?line-height:\s*1\.34/);
});

test('Baby Pink Nepali back groom and bride names are optically lowered to the ampersand', () => {
  assert.match(backSection, /\.heritageCoupleNames > span\s*\{[\s\S]*?vertical-align:\s*-\.10em/);
  assert.doesNotMatch(backSection, /margin-top\s*:/);
  assert.doesNotMatch(backSection, /(?:^|[;{]\s*)top\s*:/m);
  assert.doesNotMatch(backSection, /(?:^|[;{]\s*)transform\s*:/m);
});

test('Baby Pink Nepali back alignment fix remains narrowly scoped', () => {
  assert.doesNotMatch(backSection, /\[lang="bn"\]|\[lang="en"\]/);
  assert.doesNotMatch(backSection, /data-invitation-theme="(?:classic|magenta|navy|plum|saffron)"/);
  assert.doesNotMatch(backSection, /\.dynamicFrontNames|\.familyCoupleNames|\.receptionDetailsOverlay/);
});
