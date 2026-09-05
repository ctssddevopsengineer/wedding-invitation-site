import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { getThemeAsset, THEME_IDS, THEMES, THEME_PAGE_ASSETS } from '../lib/theme.mjs';

const root = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));

function dimensions(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.length > 24 && buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      offset += 2;
      if (marker === 0xd8 || marker === 0xd9) continue;
      const length = buffer.readUInt16BE(offset);
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
      }
      offset += length;
    }
  }
  throw new Error(`Unsupported page image: ${file}`);
}

function diskPath(webPath) {
  return path.join(root, 'public', webPath.replace(/^\//, ''));
}

function aspectRatio({ width, height }) {
  return width / height;
}

test('every theme keeps all page assets inside its own theme directory', () => {
  for (const themeId of THEME_IDS) {
    const theme = THEMES[themeId];
    for (const [name, asset] of Object.entries(theme.assets)) {
      if (!asset) continue;
      assert.match(asset, new RegExp(`^/themes/${themeId}/`), `${themeId}.${name} points at another theme`);
    }
  }
});

test('every theme has four page assets plus a compact thumbnail', () => {
  for (const themeId of THEME_IDS) {
    for (const assetName of THEME_PAGE_ASSETS) {
      const file = diskPath(getThemeAsset(themeId, assetName));
      assert.ok(fs.existsSync(file), `${themeId}.${assetName} is missing`);
      const minimumBytes = themeId === 'blush' && assetName === 'front' ? 5_000 : 20_000;
      assert.ok(fs.statSync(file).size > minimumBytes, `${themeId}.${assetName} is unexpectedly small`);
    }

    const thumbnail = diskPath(getThemeAsset(themeId, 'thumbnail'));
    assert.ok(fs.existsSync(thumbnail), `${themeId} thumbnail is missing`);
    assert.ok(fs.statSync(thumbnail).size > 3_000, `${themeId} thumbnail is unexpectedly small`);
    assert.ok(fs.statSync(thumbnail).size < 160_000, `${themeId} thumbnail is too large for a picker preview`);
    const header = fs.readFileSync(thumbnail).subarray(0, 4).toString('ascii');
    assert.equal(header, 'RIFF', `${themeId} thumbnail is not WebP/RIFF`);
  }
});

test('all themes preserve approved card geometry; Baby Pink front may use an optimized same-ratio source', () => {
  const expected = Object.fromEntries(THEME_PAGE_ASSETS.map((asset) => [asset, dimensions(diskPath(getThemeAsset('classic', asset)))]));
  for (const themeId of THEME_IDS) {
    for (const asset of THEME_PAGE_ASSETS) {
      const actual = dimensions(diskPath(getThemeAsset(themeId, asset)));
      if (themeId === 'blush' && asset === 'front') {
        assert.ok(actual.width >= 320 && actual.height >= 450, `blush.front resolution too small: ${actual.width}x${actual.height}`);
        assert.ok(Math.abs(aspectRatio(actual) - aspectRatio(expected.front)) < 0.002, 'blush.front aspect ratio changed card geometry');
      } else {
        assert.deepEqual(actual, expected[asset], `${themeId}.${asset} geometry mismatch`);
      }
    }
  }
});

test('optional monograms exist only when configured and never silently fall back to another theme', () => {
  for (const themeId of THEME_IDS) {
    for (const assetName of ['insideLeftMonogram', 'insideRightMonogram', 'backMonogram']) {
      const asset = getThemeAsset(themeId, assetName);
      if (!THEMES[themeId].assets[assetName]) {
        assert.equal(asset, '');
        continue;
      }
      const file = diskPath(asset);
      assert.ok(fs.existsSync(file), `${themeId}.${assetName} missing`);
      assert.ok(fs.statSync(file).size > 10_000, `${themeId}.${assetName} is unexpectedly small`);
    }
  }
});
