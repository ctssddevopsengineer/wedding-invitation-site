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

test('CSS includes targeted compact-phone, phone/tablet, large desktop and reduced-motion guards', () => {
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /@media \(min-width: 681px\) and \(max-width: 1024px\)/);
  assert.match(hardeningCss, /@media \(min-width: 1441px\)/);
  assert.match(hardeningCss, /@media \(prefers-reduced-motion: reduce\)/);
});

test('device hardening loads last and guards dynamic text from clipping or camouflage', () => {
  assert.match(layout, /import '\.\/classic-front\.css';\s*\nimport '\.\/device-hardening\.css';/);
  assert.match(hardeningCss, /overflow-wrap:\s*anywhere/);
  assert.match(hardeningCss, /white-space:\s*normal/);
  assert.match(hardeningCss, /flex-wrap:\s*wrap/);
  assert.match(hardeningCss, /color-mix\(in srgb, var\(--theme-ink\)/);
  assert.match(hardeningCss, /min-height:\s*44px/);
});

test('theme picker stays outside page viewport geometry and scales independently', () => {
  assert.match(css, /\.themeOptions[\s\S]*?repeat\(auto-fit, minmax\(132px, 1fr\)\)/);
  assert.match(css, /\.pageViewport[\s\S]*?aspect-ratio:/);
  assert.match(css, /\.page-back \.pageViewport[\s\S]*?aspect-ratio:/);
});
