import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { RESPONSIVE_VALIDATION_WIDTHS, RESPONSIVE_VALIDATION_VIEWPORTS, viewportBucket } from '../lib/responsive.mjs';

const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const hardeningCss = fs.readFileSync(new URL('../app/device-hardening.css', import.meta.url), 'utf8');
const mobileFixCss = fs.readFileSync(new URL('../app/mobile-overlap-fixes.css', import.meta.url), 'utf8');
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

test('Classic Bengali and Nepali laptop typography has readable floors without changing geometry', () => {
  const css = fs.readFileSync(new URL('../app/classic-multilingual-laptop.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(min-width:\s*681px\)/);
  assert.match(css, /dynamicFrontHeading > span[\s\S]*?font-size:\s*clamp\(1\.85rem, 7\.1cqw, 4rem\)\s*!important/);
  assert.match(css, /dynamicFrontHeading > em[\s\S]*?font-size:\s*clamp\(1\.45rem, 5\.5cqw, 3\.05rem\)\s*!important/);
  assert.match(css, /dynamicFrontTagline[\s\S]*?font-size:\s*clamp\(\.92rem, 2\.4cqw, 1\.35rem\)\s*!important/);
  assert.match(css, /dynamicFrontNames[\s\S]*?font-size:\s*clamp\(1\.5rem, 5\.35cqw, 3\.05rem\)\s*!important/);
  assert.match(css, /dynamicFrontClosing[\s\S]*?font-size:\s*clamp\(\.9rem, 2\.2cqw, 1\.28rem\)\s*!important/);
  assert.match(css, /familyBlessingsIntro h2[\s\S]*?font-size:\s*clamp\(1\.5rem, 3\.6cqw, 2\.55rem\)\s*!important/);
  assert.match(css, /familyBlessingsIntro p[\s\S]*?font-size:\s*clamp\(\.9rem, 1\.95cqw, 1\.28rem\)\s*!important/);
  assert.match(css, /familyCoupleNames[\s\S]*?font-size:\s*clamp\(1\.7rem, 5\.25cqw, 3\.35rem\)\s*!important/);
  assert.match(css, /familyBlock h3[\s\S]*?font-size:\s*clamp\(1\.12rem, 2\.55cqw, 1\.7rem\)\s*!important/);
  assert.match(css, /familyBlock p[\s\S]*?font-size:\s*clamp\(\.92rem, 1\.9cqw, 1\.22rem\)\s*!important/);
  assert.match(css, /familyBlessingsClosing[\s\S]*?font-size:\s*clamp\(\.9rem, 1\.85cqw, 1\.18rem\)\s*!important/);
  assert.doesNotMatch(css, /\b(top|left|right|bottom|width|height|transform|position)\s*:/);
});

test('typography hardening remains geometry-free and mobile overlap fixes load after it', () => {
  assert.match(layout, /import '\.\/classic-front\.css';\s*\nimport '\.\/device-hardening\.css';\s*\nimport '\.\/mobile-overlap-fixes\.css';/);
  assert.match(hardeningCss, /font-size:\s*clamp\(/);
  assert.match(hardeningCss, /color:\s*var\(--theme-ink\)/);
  assert.match(hardeningCss, /color:\s*var\(--theme-accent-dark\)/);
  assert.match(hardeningCss, /color:\s*var\(--theme-gold\)/);

  // Typography hardening must still never alter template/card geometry, zoom or cropping.
  for (const property of [
    'width', 'max-width', 'min-width', 'height', 'max-height', 'min-height',
    'aspect-ratio', 'transform', 'object-fit', 'position', 'top', 'right', 'bottom',
    'left', 'margin', 'padding', 'overflow', 'white-space', 'flex-wrap', 'gap'
  ]) {
    assert.doesNotMatch(hardeningCss, new RegExp(`(^|[;{\\s])${property}\\s*:`, 'm'), `${property} must not be overridden by typography hardening`);
  }

  // Geometry corrections are isolated to narrow screens and affected themes only.
  assert.match(mobileFixCss, /@media \(max-width: 680px\)/);
  assert.match(mobileFixCss, /data-invitation-theme="blush"/);
  assert.match(mobileFixCss, /data-invitation-theme="plum"/);
  assert.match(mobileFixCss, /data-invitation-theme="saffron"/);
  assert.match(mobileFixCss, /data-invitation-theme="classic"/);
});

test('Samsung A55-class viewport is represented by the 390 and 430 px validation widths', () => {
  assert.ok(RESPONSIVE_VALIDATION_WIDTHS.includes(390));
  assert.ok(RESPONSIVE_VALIDATION_WIDTHS.includes(430));
  assert.match(mobileFixCss, /@media \(min-width: 361px\) and \(max-width: 430px\)/);
});

test('theme picker stays outside page viewport geometry and scales independently', () => {
  assert.match(css, /\.themeOptions[\s\S]*?repeat\(auto-fit, minmax\(132px, 1fr\)\)/);
  assert.match(css, /\.pageViewport[\s\S]*?aspect-ratio:/);
  assert.match(css, /\.page-back \.pageViewport[\s\S]*?aspect-ratio:/);
});

test('exact viewport coverage includes short landscape, 240px phones and legacy widths without duplicates', () => {
  const sizes = RESPONSIVE_VALIDATION_VIEWPORTS.map(({ width, height }) => `${width}x${height}`);
  assert.equal(new Set(sizes).size, sizes.length);
  for (const size of ['240x320', '640x360', '360x780', '412x915', '1024x768', '1920x1080']) assert.ok(sizes.includes(size));
  for (const width of RESPONSIVE_VALIDATION_WIDTHS) assert.ok(sizes.includes(`${width}x1100`));
});
