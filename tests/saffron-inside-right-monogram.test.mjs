import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const right = fs.readFileSync(new URL('../components/InsideRight.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/mobile-overlap-fixes.css', import.meta.url), 'utf8');

test('Saffron Gold inside-right reuses the supplied inside-left artwork as the crest source', () => {
  assert.match(right, /const useSaffronInsideLeftMonogram = themeId === 'saffron';/);
  assert.match(
    right,
    /const insideRightMonogram = useSaffronInsideLeftMonogram\s*\? getThemeAsset\(themeId, 'insideLeft'\)\s*:\s*getThemeAsset\(themeId, 'insideRightMonogram'\);/
  );
  assert.match(right, /insideRightThemeMonogramFromInsideLeft/);
});

test('Saffron inside-left crest reuse is clipped without changing invitation geometry', () => {
  const match = css.match(/\.bookApp\[data-invitation-theme="saffron"\] \.insideRightThemeMonogramFromInsideLeft\s*\{([\s\S]*?)\}/);
  assert.ok(match, 'missing Saffron inside-left crest reuse rule');
  const block = match[1];

  assert.match(block, /left:\s*0\s*!important/);
  assert.match(block, /top:\s*2\.6%\s*!important/);
  assert.match(block, /width:\s*100%\s*!important/);
  assert.match(block, /height:\s*100%\s*!important/);
  assert.match(block, /transform:\s*none\s*!important/);
  assert.match(block, /object-fit:\s*cover\s*!important/);
  assert.match(block, /object-position:\s*center top\s*!important/);
  assert.match(block, /clip-path:\s*inset\(0 38% 82% 38%\)/);
  assert.match(block, /filter:\s*none\s*!important/);
});
