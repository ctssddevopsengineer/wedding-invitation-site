import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const controls = fs.readFileSync(new URL('../app/invitation-controls.css', import.meta.url), 'utf8');
const responsive = fs.readFileSync(new URL('../lib/responsive.mjs', import.meta.url), 'utf8');
const browserRegression = fs.readFileSync(new URL('../scripts/test-multilingual-browser.mjs', import.meta.url), 'utf8');

test('wearable navigation separates arrows from page dots on ultra-narrow screens', () => {
  assert.match(controls, /@media \(max-width: 340px\)/);
  assert.match(controls, /\.bookNav \.pageDots[\s\S]*?grid-row:\s*2[\s\S]*?grid-column:\s*1 \/ -1/);
  assert.match(controls, /\.bookNav \.navArrow:first-child[\s\S]*?grid-row:\s*1[\s\S]*?grid-column:\s*1/);
  assert.match(controls, /\.bookNav \.navArrow:last-child[\s\S]*?grid-row:\s*1[\s\S]*?grid-column:\s*3/);
});

test('watch-class widths compact page-dot hit areas without shrinking arrow targets', () => {
  assert.match(controls, /@media \(max-width: 200px\)/);
  assert.match(controls, /\.pageDot[\s\S]*?width:\s*34px[\s\S]*?height:\s*34px/);
  assert.match(controls, /grid-template-rows:\s*44px 34px/);
  assert.match(controls, /\.navArrow[\s\S]*?width:\s*44px/);
});

test('responsive matrix includes Apple Watch-class viewports', () => {
  assert.match(responsive, /184x224/);
  assert.match(responsive, /162x197/);
});

test('browser regression rejects navigation overlap on wearable widths', () => {
  assert.match(browserRegression, /width <= 340/);
  assert.match(browserRegression, /previousDotsOverlap/);
  assert.match(browserRegression, /nextDotsOverlap/);
  assert.match(browserRegression, /dotArrowOverlap/);
  assert.match(browserRegression, /dotsInsideViewport/);
  assert.match(browserRegression, /keeps a 44px touch target/);
});
