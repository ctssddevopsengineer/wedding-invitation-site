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

function pngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  assert.equal(buffer[0], 0x89);
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('Baby Pink alone opts into blank-front dynamic rendering without changing existing dynamicFront semantics', () => {
  assert.equal(THEMES.blush.dynamicFront, false);
  assert.equal(THEMES.blush.blankFront, true);
  assert.equal(THEMES.classic.blankFront, false);
  assert.equal(THEMES.magenta.dynamicFront, true);
});

test('FrontCover preserves multilingual support and uses blankFront for Baby Pink dynamic copy', () => {
  assert.match(frontSource, /useLanguage/);
  assert.match(frontSource, /theme\.dynamicFront \|\| theme\.blankFront/);
  assert.match(frontSource, /usesDynamicFrontCopy \|\| language !== 'en'/);
  assert.match(frontSource, /frontMonogram && usesDynamicFrontCopy/);
  assert.match(frontSource, /EVENT\.frontCover\.heading/);
  assert.match(frontSource, /EVENT\.groomName/);
  assert.match(frontSource, /EVENT\.brideName/);
});

test('Baby Pink enhancement CSS loads after language CSS and is isolated to Page 1', () => {
  assert.match(layoutSource, /import '\.\/languages\.css';\s*\nimport '\.\/blush-front\.css';/);
  assert.match(css, /data-invitation-theme="blush"\] \.frontCover::before/);
  assert.match(css, /data-invitation-theme="blush"\] \.frontCover \.dynamicFrontCopy/);
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

test('Baby Pink continues using the approved front asset geometry so existing asset contracts remain intact', () => {
  const webPath = getThemeAsset('blush', 'front');
  assert.equal(webPath, '/themes/blush/front.png');
  const imagePath = path.join(root, 'public', webPath.replace(/^\//, ''));
  assert.ok(fs.existsSync(imagePath));
  assert.deepEqual(pngDimensions(imagePath), { width: 1087, height: 1536 });
  assert.ok(fs.statSync(imagePath).size > 500_000);
});
