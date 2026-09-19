import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(
  new URL('../app/classic-bengali-back-name-clipping.css', import.meta.url),
  'utf8'
);
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Classic Bengali back-page names keep full upper glyph ink without moving geometry', () => {
  assert.match(
    css,
    /\.bookApp\[lang="bn"\]\[data-invitation-theme="classic"\][\s\S]*?\.heritageBackContent \.heritageCoupleNames\s*\{[\s\S]*?overflow:\s*visible\s*!important;[\s\S]*?line-height:\s*1\.32\s*!important;/
  );
  assert.match(
    css,
    /\.heritageBackContent \.heritageCoupleNames > span\s*\{[\s\S]*?overflow:\s*visible;[\s\S]*?line-height:\s*1\.32;/
  );

  const declarations = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\n/)
    .map((line) => line.trim());

  for (const forbidden of ['top:', 'left:', 'right:', 'bottom:', 'width:', 'height:', 'transform:', 'position:', 'font-size:']) {
    assert.equal(
      declarations.some((line) => line.startsWith(forbidden)),
      false,
      `Bengali glyph fix must not alter back-page geometry/type scale with ${forbidden}`
    );
  }
});

test('Classic Bengali back-page glyph guard explicitly covers the complete mobile band', () => {
  assert.match(css, /@media \(max-width:\s*680px\)/);
  assert.match(
    css,
    /@media \(max-width:\s*680px\)[\s\S]*?heritageCoupleNames[\s\S]*?overflow:\s*visible\s*!important;[\s\S]*?line-height:\s*1\.32\s*!important;/
  );
});

test('Bengali back-page clipping guard is loaded after the existing Classic Nepali guard', () => {
  assert.match(
    layout,
    /import '\.\/classic-nepali-name-alignment\.css';\s*\nimport '\.\/classic-bengali-back-name-clipping\.css';/
  );
});
