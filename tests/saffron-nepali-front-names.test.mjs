import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/front-saffron-parity.css', import.meta.url), 'utf8');

test('Saffron Nepali front names use a dedicated native-script row', () => {
  assert.match(css, /\[lang="ne"\]\[data-invitation-theme="saffron"\][\s\S]*?\.dynamicFrontNames\s*\{[\s\S]*?display:\s*grid/);
  assert.match(css, /font-family:\s*var\(--font-devanagari\)/);
  assert.match(css, /justify-content:\s*center/);
  assert.match(css, /font-style:\s*normal/);
});

test('Saffron Nepali groom and bride names stay intact instead of wrapping inside Devanagari text', () => {
  assert.match(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?white-space:\s*nowrap/);
  assert.match(css, /overflow-wrap:\s*normal/);
  assert.match(css, /word-break:\s*keep-all/);
  assert.match(css, /line-break:\s*strict/);
});

test('Saffron Nepali compact mode preserves name integrity below 375px', () => {
  assert.match(css, /@media \(max-width:\s*374px\)[\s\S]*?\[lang="ne"\]\[data-invitation-theme="saffron"\][\s\S]*?\.dynamicFrontNames/);
});


test('Saffron Nepali wearable fallback reduces type without allowing internal name wrapping', () => {
  assert.match(css, /@media \(max-width:\s*200px\)[\s\S]*?\[lang="ne"\]\[data-invitation-theme="saffron"\][\s\S]*?font-size:\s*clamp\(\.74rem, 6\.8cqw, \.9rem\)\s*!important/);
  assert.match(css, /@media \(max-width:\s*200px\)[\s\S]*?\.dynamicFrontNames > span\s*\{[\s\S]*?flex:\s*1 1 0/);
  assert.match(css, /@media \(max-width:\s*200px\)[\s\S]*?\.dynamicFrontNames > span\s*\{[\s\S]*?max-width:\s*none/);
});


test('Saffron Nepali names use content-sized columns without invisible percentage spacing', () => {
  assert.match(css, /grid-template-columns:\s*max-content auto max-content/);
  assert.match(css, /column-gap:\s*clamp\(\.18rem, \.7cqw, \.42rem\)/);
  assert.match(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?width:\s*max-content/);
  assert.match(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?max-width:\s*none/);
  assert.doesNotMatch(css, /\.dynamicFrontNames > span\s*\{[\s\S]*?max-width:\s*4[24]%/);
});

test('Saffron Nepali wearable fallback deliberately switches back to flex', () => {
  assert.match(css, /@media \(max-width:\s*200px\)[\s\S]*?\.dynamicFrontNames\s*\{[\s\S]*?display:\s*flex/);
});
