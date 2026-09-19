import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { RESPONSIVE_VALIDATION_VIEWPORTS } from '../lib/responsive.mjs';

const css = fs.readFileSync(
  new URL('../app/saffron-bengali-back-name-clipping.css', import.meta.url),
  'utf8'
);
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Saffron Gold Bengali back-page names preserve upper glyph ink on mobile without moving geometry', () => {
  assert.match(css, /@media \(max-width:\s*680px\)/);
  assert.match(
    css,
    /\.bookApp\[lang="bn"\]\[data-invitation-theme="saffron"\][\s\S]*?\.heritageBackContent \.heritageCoupleNames\s*\{[\s\S]*?overflow:\s*visible\s*!important;[\s\S]*?line-height:\s*1\.32\s*!important;/
  );
  assert.match(
    css,
    /\.heritageBackContent \.heritageCoupleNames > span\s*\{[\s\S]*?overflow:\s*visible\s*!important;[\s\S]*?line-height:\s*1\.32\s*!important;/
  );

  const declarations = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\n/)
    .map((line) => line.trim());

  for (const forbidden of ['top:', 'left:', 'right:', 'bottom:', 'width:', 'height:', 'transform:', 'position:', 'font-size:']) {
    assert.equal(
      declarations.some((line) => line.startsWith(forbidden)),
      false,
      `Saffron Bengali glyph fix must not alter back-page geometry/type scale with ${forbidden}`
    );
  }
});

test('Saffron Gold Bengali back-page glyph guard covers the repository mobile viewport matrix', () => {
  const mobileViewports = RESPONSIVE_VALIDATION_VIEWPORTS.filter(({ width }) => width <= 680);
  assert.ok(mobileViewports.length > 0);

  for (const { width } of mobileViewports) {
    assert.ok(width <= 680, `expected mobile width ${width}px to remain covered by max-width: 680px`);
  }

  for (const expected of ['240x320', '320x1100', '360x780', '390x1100', '412x915', '430x1100', '540x1100', '640x360']) {
    assert.ok(
      mobileViewports.some(({ width, height }) => `${width}x${height}` === expected),
      `missing mobile regression viewport ${expected}`
    );
  }
});

test('Saffron Bengali mobile clipping guard is loaded after Saffron Nepali clipping and before compact scrolling', () => {
  const nepali = layout.indexOf("import './saffron-nepali-name-clipping.css';");
  const bengali = layout.indexOf("import './saffron-bengali-back-name-clipping.css';");
  const compact = layout.indexOf("import './compact-details-scroll.css';");
  assert.ok(nepali >= 0 && bengali > nepali && compact > bengali);
});
