import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';

test('both wedding figures are real alpha cutouts with transparent borders, not rectangular pictures', async () => {
  for (const name of ['bride', 'groom']) {
    const file = new URL(`../public/intro/${name}.webp`, import.meta.url);
    const buffer = await fs.readFile(file);
    const metadata = await sharp(buffer).metadata();
    assert.equal(metadata.hasAlpha, true, `${name} must preserve transparency`);
    assert.ok(metadata.height >= 800, 'enough resolution for high density displays');
    const { data, info } = await sharp(buffer).extractChannel('alpha').raw().toBuffer({ resolveWithObject: true });
    let transparent = 0, opaque = 0, transparentBorder = 0, border = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      const value = data[y * info.width + x];
      if (value === 0) transparent++;
      if (value > 240) opaque++;
      if (x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1) {
        border++;
        if (value < 5) transparentBorder++;
      }
    }
    assert.ok(transparent > data.length * .2, `${name} needs a genuinely empty background`);
    assert.ok(opaque > data.length * .1, `${name} must contain a visible figure`);
    assert.ok(transparentBorder > border * .95, `${name} should not have a visible rectangular frame`);
    assert.ok(buffer.length < 250_000, `${name} exceeds the intro asset budget`);
  }
});

test('the separate scenic backdrop stays within a bounded transfer budget', async () => {
  const buffer = await fs.readFile(new URL('../public/intro/wedding-scene.webp', import.meta.url));
  const metadata = await sharp(buffer).metadata();
  assert.ok(metadata.width >= 1280);
  assert.ok(metadata.width > metadata.height);
  assert.ok(buffer.length < 450_000);
  const mobile = await fs.readFile(new URL('../public/intro/wedding-scene-mobile.webp', import.meta.url));
  const mobileMetadata = await sharp(mobile).metadata();
  assert.ok(mobileMetadata.height > mobileMetadata.width, 'phones have a portrait composition');
  assert.ok(mobile.length < 300_000);
});
