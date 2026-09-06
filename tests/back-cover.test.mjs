import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const component = fs.readFileSync(new URL('../components/BackCover.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const event = fs.readFileSync(new URL('../lib/event.mjs', import.meta.url), 'utf8');
const theme = fs.readFileSync(new URL('../lib/theme.mjs', import.meta.url), 'utf8');

test('back cover uses the supplied blank Heritage Landscape artwork', () => {
  assert.match(component, /getThemeAsset\(themeId, 'back'\)/);
  assert.match(theme, /back:\s*asset\(`\/themes\/\$\{themeId\}\/back\.png`\)/);
  assert.match(component, /heritageBackArtwork/);
});

test('back cover renders copy, couple and contacts only from EVENT configuration', () => {
  assert.match(component, /EVENT\.backCover/);
  assert.match(component, /EVENT\.groomName/);
  assert.match(component, /EVENT\.brideName/);
  assert.match(component, /EVENT\.contacts/);
});

test('phase 1 back cover contains no QR or NFC UI', () => {
  assert.doesNotMatch(component, /heritageTechnology|heritageNfc|heritageQr|location-qr/i);
  assert.doesNotMatch(event, /technologyHeading|qrCaption|qrImage/);
});

test('landscape viewport preserves the native artwork aspect ratio', () => {
  assert.match(css, /\.page-back \.pageViewport\s*\{[\s\S]*?aspect-ratio:\s*1536\s*\/\s*1085/);
  assert.match(css, /container-type:\s*inline-size/);
});

test('back-cover typography scales against the page container', () => {
  assert.match(css, /\.heritageBackIntro h2[\s\S]*?cqw/);
  assert.match(css, /\.heritageCoupleNames[\s\S]*?cqw/);
  assert.match(css, /\.heritageBackMessage[\s\S]*?cqw/);
});

test('critical back-cover text zones are separated vertically', () => {
  const top = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = css.match(new RegExp(escaped + '\\s*\\{[\\s\\S]*?top:\\s*([0-9.]+)%'));
    assert.ok(match, `missing top for ${selector}`);
    return Number(match[1]);
  };
  assert.ok(top('.heritageBackIntro') < top('.heritageCoupleNames'));
  assert.ok(top('.heritageCoupleNames') < top('.heritageJourneyMessage'));
  assert.ok(top('.heritageJourneyMessage') < top('.heritageAssistance'));
});

test('back-cover monogram uses dedicated high-resolution transparent artwork', () => {
  assert.match(component, /getThemeAsset\(themeId, 'backMonogram'\)/);
  assert.match(theme, /backMonogram:\s*backMonogram \? asset\(`\/themes\/\$\{themeId\}\/back-monogram\.png`\) : ''/);
  assert.match(css, /\.heritageBackMonogram[\s\S]*?opacity:\s*1/);
  assert.doesNotMatch(css.match(/\.heritageBackMonogram\s*\{[\s\S]*?\}/)?.[0] ?? '', /mix-blend-mode|mask-image/);
});

test('assistance contacts have a high-contrast readability treatment', () => {
  assert.match(css, /\.heritageAssistance\s*\{[\s\S]*?background:\s*rgba\(249, 239, 216, \.90\)/);
  assert.match(css, /\.heritageAssistance \.contactCard h3[\s\S]*?font-weight:\s*700/);
  assert.match(css, /\.heritageAssistance \.contactCard a,[\s\S]*?font-weight:\s*700/);
  assert.match(css, /\.heritageAssistance \.contactCard p\.muted/);
});
