import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const overrides = JSON.parse(fs.readFileSync(new URL('./visual-baseline-overrides.json', import.meta.url), 'utf8'));
const runner = fs.readFileSync(new URL('../scripts/test-visual-regression.mjs', import.meta.url), 'utf8');

test('visual baseline overrides are limited to reviewed Nepali glyph-clipping and alignment cases', () => {
  assert.deepEqual(Object.keys(overrides.cases).sort(), [
    'android-classic-back-ne',
    'laptop-blush-back-ne',
    'laptop-blush-front-ne',
    'laptop-classic-front-ne',
    'laptop-magenta-back-ne',
    'laptop-magenta-front-ne',
    'laptop-navy-back-ne',
    'laptop-navy-front-ne',
    'laptop-plum-back-ne',
    'laptop-plum-front-ne',
    'laptop-saffron-back-ne',
    'laptop-saffron-front-ne',
    'large-desktop-classic-front-ne',
    'tablet-blush-back-ne',
    'tablet-blush-front-ne',
    'tablet-classic-front-ne',
    'tablet-magenta-back-ne',
    'tablet-magenta-front-ne',
    'tablet-navy-back-ne',
    'tablet-navy-front-ne',
    'tablet-plum-back-ne',
    'tablet-plum-front-ne',
    'tablet-saffron-back-ne',
    'tablet-saffron-front-ne'
  ]);
});

test('visual regression still performs exact hash/width/height comparison after merging reviewed overrides', () => {
  assert.match(runner, /visual-baseline-overrides\.json/);
  assert.match(runner, /\.\.\.baseline\.cases/);
  assert.match(runner, /\.\.\.\(overrides\.cases \|\| \{\}\)/);
  assert.match(runner, /expected\.hash !== digest\.hash/);
  assert.match(runner, /expected\.width !== digest\.width/);
  assert.match(runner, /expected\.height !== digest\.height/);
});
