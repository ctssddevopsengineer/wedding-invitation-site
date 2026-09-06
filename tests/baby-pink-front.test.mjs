import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { THEMES, getThemeAsset } from '../lib/theme.mjs';

const root = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const frontSource = fs.readFileSync(new URL('../components/FrontCover.js', import.meta.url), 'utf8');
const layoutSource = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/blush-front.css', import.meta.url), 'utf8');

function imageDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
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
  throw new Error(`Unsupported image format: ${filePath}`);
}

function aspectRatio({ width, height }) {
  return width / height;
}

function isSupportedRaster(filePath) {
  const header = fs.readFileSync(filePath).subarray(0, 8);
  const isPng = header[0] === 0x89 && header.toString('ascii', 1, 4) === 'PNG';
  const isJpeg = header[0] === 0xff && header[1] === 0xd8;
  return isPng || isJpeg;
}

test('Blank-artwork themes opt into overlay rendering without changing dynamicFront semantics', () => {
  assert.equal(THEMES.blush.dynamicFront, false);
  assert.equal(THEMES.blush.blankFront, true);
  assert.equal(THEMES.classic.dynamicFront, false);
  assert.equal(THEMES.classic.blankFront, true);
  assert.equal(THEMES.magenta.dynamicFront, true);
});

test('FrontCover preserves multilingual support and writes Baby Pink copy directly over its blank artwork', () => {
  assert.match(frontSource, /useLanguage/);
  assert.match(frontSource, /theme\.dynamicFront \|\| theme\.blankFront/);
  assert.match(frontSource, /usesDynamicFrontCopy \|\| language !== 'en'/);
  assert.match(frontSource, /frontMonogram && usesDynamicFrontCopy/);
  assert.match(frontSource, /EVENT\.frontCover\.heading/);
  assert.match(frontSource, /EVENT\.groomName/);
  assert.match(frontSource, /EVENT\.brideName/);
});

test('Baby Pink CSS is isolated to Page 1 and never paints an opaque masking layer', () => {
  assert.match(layoutSource, /import '\.\/languages\.css';\s*\nimport '\.\/blush-front\.css';/);
  assert.match(css, /data-invitation-theme="blush"\] \.frontCover \.dynamicFrontCopy/);
  assert.doesNotMatch(css, /\.frontCover::before/);
  assert.doesNotMatch(css, /linear-gradient\(rgba\(251,232,214/);
  assert.match(css, /background:\s*transparent/);
  assert.match(css, /box-shadow:\s*none/);
  assert.doesNotMatch(css, /data-invitation-theme="classic"/);
  assert.doesNotMatch(css, /\.familyBlessingsContent/);
  assert.doesNotMatch(css, /\.receptionDetailsOverlay/);
  assert.doesNotMatch(css, /\.heritageBackContent/);
});

test('Baby Pink front keeps readable floor sizes for Latin, Bengali and Nepali text', () => {
  assert.match(css, /font-size:\s*clamp\(1\.55rem, 7\.2cqw, 4\.15rem\)/);
  assert.match(css, /font-size:\s*clamp\(\.78rem, 2\.35cqw, 1\.35rem\)/);
  assert.match(css, /:is\(\[lang="bn"\], \[lang="ne"\]\)/);
  assert.match(css, /font-size:\s*clamp\(1\.35rem, 6\.4cqw, 3\.65rem\)/);
});

test('Baby Pink uses a high-definition blank front template without changing card geometry', () => {
  const webPath = getThemeAsset('blush', 'front');
  assert.equal(webPath, '/themes/blush/front-enhanced.jpg');
  const imagePath = path.join(root, 'public', webPath.replace(/^\//, ''));
  assert.ok(fs.existsSync(imagePath));
  assert.ok(isSupportedRaster(imagePath), 'Baby Pink front must contain valid PNG or JPEG image bytes');

  const actual = imageDimensions(imagePath);
  const classic = imageDimensions(path.join(root, 'public', getThemeAsset('classic', 'front').replace(/^\//, '')));
  assert.ok(actual.width >= 1000 && actual.height >= 1400, `Baby Pink front is not high-definition enough: ${actual.width}x${actual.height}`);
  assert.ok(Math.abs(aspectRatio(actual) - aspectRatio(classic)) < 0.01, 'Baby Pink front aspect ratio would materially distort/crop the approved card geometry');
  assert.ok(fs.statSync(imagePath).size > 500_000, 'Baby Pink front file is unexpectedly small for the approved HD artwork');
});
