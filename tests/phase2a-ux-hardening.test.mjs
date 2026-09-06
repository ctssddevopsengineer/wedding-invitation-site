import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  buildThemeRelativeUrl,
  getInitialThemeId,
  getThemeIdFromSearch
} from '../lib/theme-url.mjs';
import { getThemeWarmupAssets } from '../lib/theme-preload.mjs';

const book = fs.readFileSync(new URL('../components/InvitationBook.js', import.meta.url), 'utf8');
const switcher = fs.readFileSync(new URL('../components/ThemeSwitcher.js', import.meta.url), 'utf8');
const insideRight = fs.readFileSync(new URL('../components/InsideRight.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

test('shareable theme URLs resolve valid themes, aliases and invalid values safely', () => {
  assert.equal(getThemeIdFromSearch('?theme=navy'), 'navy');
  assert.equal(getThemeIdFromSearch('?theme=royalPlum'), 'plum');
  assert.equal(getThemeIdFromSearch('?foo=1'), null);
  assert.equal(getThemeIdFromSearch('?theme=does-not-exist'), 'classic');

  assert.equal(getInitialThemeId({ search: '?theme=saffron', storedTheme: 'navy' }), 'saffron');
  assert.equal(getInitialThemeId({ search: '', storedTheme: 'magenta' }), 'magenta');
  assert.equal(buildThemeRelativeUrl({ pathname: '/invite', search: '?guest=family', hash: '#card' }, 'plum'), '/invite?guest=family&theme=plum#card');
});

test('InvitationBook restores theme from URL first, persists selection and keeps the address bar shareable', () => {
  assert.match(book, /getInitialThemeId/);
  assert.match(book, /window\.location\.search/);
  assert.match(book, /window\.localStorage\.getItem\(THEME_STORAGE_KEY\)/);
  // Phase 2B extends the Phase 2A theme URL into a combined theme + page deep link.
  assert.match(book, /buildInvitationRelativeUrl/);
  assert.match(book, /window\.history\.replaceState/);
  assert.match(book, /window\.localStorage\.setItem\(THEME_STORAGE_KEY, themeId\)/);
});

test('theme picker uses real lazy-loaded artwork thumbnails instead of only colour dots', () => {
  assert.match(switcher, /getThemeAsset\(id, 'thumbnail'\)/);
  assert.match(switcher, /className="themeThumbnail"/);
  assert.match(switcher, /loading=\{active \? 'eager' : 'lazy'\}/);
  assert.match(switcher, /decoding="async"/);
  assert.match(css, /\.themeThumbnailFrame\s*\{/);
  assert.match(css, /\.themeThumbnail\s*\{/);
});

test('theme picker implements roving tabindex and arrow/Home/End keyboard controls', () => {
  assert.match(switcher, /tabIndex=\{active \? 0 : -1\}/);
  assert.match(switcher, /ArrowRight/);
  assert.match(switcher, /ArrowLeft/);
  assert.match(switcher, /ArrowDown/);
  assert.match(switcher, /ArrowUp/);
  assert.match(switcher, /event\.key === 'Home'/);
  assert.match(switcher, /event\.key === 'End'/);
  assert.match(switcher, /role="radiogroup"/);
  assert.match(switcher, /role="radio"/);
});

test('page navigation supports keyboard and keeps touch swipe behavior', () => {
  assert.match(book, /ArrowLeft/);
  assert.match(book, /ArrowRight/);
  assert.match(book, /event\.key === 'Home'/);
  assert.match(book, /event\.key === 'End'/);
  assert.match(book, /onTouchStart=\{handleTouchStart\}/);
  assert.match(book, /onTouchEnd=\{handleTouchEnd\}/);
  assert.match(book, /INTERACTIVE_SELECTOR/);
});

test('location UI remains mouse, touch and keyboard accessible and Escape closes it', () => {
  assert.match(insideRight, /onMouseEnter=\{openOnHover\}/);
  assert.match(insideRight, /onClick=\{togglePinnedLocation\}/);
  assert.match(insideRight, /onFocus=\{openOnHover\}/);
  assert.match(insideRight, /event\.key === 'Escape'/);
  assert.match(insideRight, /role="dialog"/);
  assert.match(insideRight, /aria-expanded=\{isLocationOpen\}/);
});

test('adjacent-page warmup only returns current and neighboring assets', () => {
  const frontAssets = getThemeWarmupAssets('navy', 0);
  assert.ok(frontAssets.some((item) => item.endsWith('/front.png')));
  assert.ok(frontAssets.some((item) => item.endsWith('/inside-left.png')));
  assert.equal(frontAssets.some((item) => item.endsWith('/back.png')), false);

  const rightAssets = getThemeWarmupAssets('navy', 2);
  assert.ok(rightAssets.some((item) => item.endsWith('/inside-left.png')));
  assert.ok(rightAssets.some((item) => item.endsWith('/inside-right.png')));
  assert.ok(rightAssets.some((item) => item.endsWith('/back.png')));
  assert.ok(rightAssets.some((item) => item.endsWith('/inside-right-monogram.png')));
});

test('hover/focus warming and lightweight crossfade are wired without mounting all four pages', () => {
  assert.match(switcher, /onPointerEnter=\{\(\) => onThemeWarm\?\.\(id\)\}/);
  assert.match(switcher, /onFocus=\{\(\) => onThemeWarm\?\.\(id\)\}/);
  assert.match(book, /new window\.Image\(\)/);
  assert.match(book, /getThemeWarmupAssets/);
  assert.match(book, /key=\{`\$\{themeId\}-\$\{pageIndex\}`\}/);
  assert.match(css, /@keyframes themePageCrossfade/);
  assert.match(css, /prefers-reduced-motion/);
});
