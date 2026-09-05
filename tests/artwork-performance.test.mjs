import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import sharp from 'sharp';
import { createArtworkLoader, getPageArtworkAssets, optimizedArtworkUrl } from '../lib/artwork.mjs';
import { THEMES, THEME_IDS } from '../lib/theme.mjs';

test('optimized companions preserve image geometry and reduce aggregate artwork bytes by at least 70%', async () => {
  let originalBytes = 0, optimizedBytes = 0;
  for (const theme of Object.values(THEMES)) for (const src of Object.values(theme.assets)) {
    if (!src.endsWith('.png')) continue;
    const original = fs.readFileSync(new URL(`../public${src}`, import.meta.url));
    const optimized = fs.readFileSync(new URL(`../public${optimizedArtworkUrl(src)}`, import.meta.url));
    const a = await sharp(original).metadata(), b = await sharp(optimized).metadata();
    assert.equal(b.format, 'webp');
    assert.equal(a.width, b.width); assert.equal(a.height, b.height);
    originalBytes += original.length; optimizedBytes += optimized.length;
  }
  assert.ok(optimizedBytes < originalBytes * .3);
  assert.equal(optimizedArtworkUrl('/wedding-invitation-site/themes/navy/front.png'), '/wedding-invitation-site/themes/navy/front.webp');
  assert.equal(optimizedArtworkUrl('/images/location-qr.png'), '/images/location-qr.png');
});

test('current-page warmup includes required crests without fetching other pages', () => {
  for (const theme of THEME_IDS) for (let page = 0; page < 4; page++) {
    const assets = getPageArtworkAssets(theme, page);
    assert.ok(assets.length >= 1 && assets.length <= 2);
    assert.ok(assets.every((src) => src.startsWith(`/themes/${theme}/`)));
  }
  assert.ok(getPageArtworkAssets('blush', 3).includes('/themes/blush/back-monogram.png'));
});

test('loader deduplicates, promotes urgent requests, and waits for decoding', async () => {
  const images = [];
  let release;
  const load = createArtworkLoader(() => { const image = { decode: () => new Promise((resolve) => { release = resolve; }) }; images.push(image); return image; });
  const first = load('/themes/navy/front.png');
  assert.equal(load('/themes/navy/front.png', 'high'), first);
  assert.equal(images.length, 1);
  assert.equal(images[0].src, '/themes/navy/front.webp');
  assert.equal(images[0].fetchPriority, 'high');
  const decoded = images[0].onload();
  let ready = false; first.then(() => { ready = true; });
  await Promise.resolve(); assert.equal(ready, false);
  release(); await decoded;
  assert.equal(await first, true);
});

test('failed loads can retry and decode failures do not strand theme switching', async () => {
  const images = [];
  const load = createArtworkLoader(() => { const image = { decode: async () => { throw new Error('decode unavailable'); } }; images.push(image); return image; });
  const failed = load('/themes/navy/front.png'); images[0].onerror();
  assert.equal(images[0].src, '/themes/navy/front.png');
  images[0].onerror();
  assert.equal(await failed, false);
  const retry = load('/themes/navy/front.png');
  assert.equal(images.length, 2);
  await images[1].onload(); assert.equal(await retry, true);
});

test('stalled downloads time out and allow retry without leaving the UI waiting', (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const load = createArtworkLoader(() => ({}));
  const first = load('/themes/navy/front.png');
  context.mock.timers.tick(12000);
  const retry = load('/themes/navy/front.png');
  assert.notEqual(first, retry);
  context.mock.timers.tick(12000);
  return Promise.all([first, retry]).then((values) => assert.deepEqual(values, [false, false]));
});
