import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/royal-navy-mobile-monogram-fix.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Royal Navy mobile monogram override loads after overlap fixes', () => {
  assert.match(layout, /import '\.\/mobile-overlap-fixes\.css';\s*\nimport '\.\/royal-navy-mobile-monogram-fix\.css';/);
});

test('Royal Navy mobile crest aligns with the artwork lotus with clearance above it', () => {
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /left:\s*51\.6%\s*!important/);
  assert.match(css, /top:\s*1\.5%\s*!important/);
  assert.match(css, /width:\s*13\.6%\s*!important/);
  assert.match(css, /height:\s*auto\s*!important/);
  assert.match(css, /transform:\s*translateX\(-50%\)\s*!important/);
  // Visible crest ends at y=542 in the 640px square asset. The page artwork
  // is 1087 x 1536, with the lotus beginning at approximately y=160.
  const visibleBottom = 0.015 + (0.136 * 1087 / 1536) * (542 / 640);
  assert.ok(visibleBottom < 160 / 1536 - 0.005, 'leave a proportional gap above the lotus');
  assert.equal((css.match(/@media/g) || []).length, 1, 'all phone widths share the artwork alignment');
});
