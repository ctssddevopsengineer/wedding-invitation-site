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

test('Baby Pink alone opts into blank-front dynamic rendering without changing existing dynamicFront semantics', () => {
  assert.equal(THEMES.blush.dynamicFront, false);
  assert.equal(THEMES.blush.blankFront, true);
  assert.equal(THEMES.classic.blankFront, false);
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

test('Baby Pink uses the uploaded blank front template at production geometry', () => {
  const webPath = getThemeAsset('blush', 'front');
  assert.equal(webPath, '/themes/blush/front-enhanced.jpg');
  const imagePath = path.join(root, 'public', webPath.replace(/^\//, ''));
  assert.ok(fs.existsSync(imagePath));
  const header = fs.readFileSync(imagePath).subarray(0, 2);
  assert.equal(header[0], 0xff);
  assert.equal(header[1], 0xd8);
  assert.deepEqual(imageDimensions(imagePath), { width: 1087, height: 1536 });
  assert.ok(fs.statSync(imagePath).size > 20_000);
});
