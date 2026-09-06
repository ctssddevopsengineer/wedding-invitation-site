import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { RESPONSIVE_VALIDATION_WIDTHS, viewportBucket } from '../lib/responsive.mjs';

const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const hardeningCss = fs.readFileSync(new URL('../app/device-hardening.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('responsive validation matrix covers compact phones through large desktop displays', () => {
  assert.deepEqual(RESPONSIVE_VALIDATION_WIDTHS, [320, 360, 390, 430, 540, 768, 820, 1024, 1280, 1440, 1920]);
  assert.equal(viewportBucket(320), 'compact-phone');
  assert.equal(viewportBucket(390), 'phone');
  assert.equal(viewportBucket(540), 'large-phone');
  assert.equal(viewportBucket(768), 'tablet');
  assert.equal(viewportBucket(1024), 'tablet');
  assert.equal(viewportBucket(1280), 'desktop');
  assert.equal(viewportBucket(1440), 'desktop');
  assert.equal(viewportBucket(1920), 'large-desktop');
});

test('existing responsive CSS keeps the approved template geometry guards', () => {
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /@media \(min-width: 681px\) and \(max-width: 1024px\)/);
});

test('typography hardening loads last and changes only font size and colour', () => {
  assert.match(layout, /import '\.\/classic-front\.css';\s*\nimport '\.\/device-hardening\.css';/);
  assert.match(hardeningCss, /font-size:\s*clamp\(/);
  assert.match(hardeningCss, /color:\s*var\(--theme-ink\)/);
  assert.match(hardeningCss, /color:\s*var\(--theme-accent-dark\)/);
  assert.match(hardeningCss, /color:\s*var\(--theme-gold\)/);

  // The enhancement must not alter template/card geometry, zoom or cropping.
  for (const property of [
    'width', 'max-width', 'min-width', 'height', 'max-height', 'min-height',
    'aspect-ratio', 'transform', 'object-fit', 'position', 'top', 'right', 'bottom',
    'left', 'margin', 'padding', 'overflow', 'white-space', 'flex-wrap', 'gap'
  ]) {
    assert.doesNotMatch(hardeningCss, new RegExp(`(^|[;{\\s])${property}\\s*:`, 'm'), `${property} must not be overridden by typography hardening`);
  }
});

test('theme picker stays outside page viewport geometry and scales independently', () => {
  assert.match(css, /\.themeOptions[\s\S]*?repeat\(auto-fit, minmax\(132px, 1fr\)\)/);
  assert.match(css, /\.pageViewport[\s\S]*?aspect-ratio:/);
  assert.match(css, /\.page-back \.pageViewport[\s\S]*?aspect-ratio:/);
});
