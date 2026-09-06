import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_THEME_ID,
  THEME_IDS,
  THEMES,
  THEME_STORAGE_KEY,
  getThemeAsset,
  resolveThemeId
} from '../lib/theme.mjs';

const root = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const book = fs.readFileSync(new URL('../components/InvitationBook.js', import.meta.url), 'utf8');
const switcher = fs.readFileSync(new URL('../components/ThemeSwitcher.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const front = fs.readFileSync(new URL('../components/FrontCover.js', import.meta.url), 'utf8');
const left = fs.readFileSync(new URL('../components/InsideLeft.js', import.meta.url), 'utf8');
const right = fs.readFileSync(new URL('../components/InsideRight.js', import.meta.url), 'utf8');
const back = fs.readFileSync(new URL('../components/BackCover.js', import.meta.url), 'utf8');

const PAGE_ASSETS = ['front', 'insideLeft', 'insideRight', 'back'];
const ACTIVE_THEME_IDS = ['classic', 'blush', 'magenta', 'navy', 'plum', 'saffron'];

function imageDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  // PNG
  if (buffer.length > 24 && buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  // JPEG: find a Start Of Frame marker carrying dimensions.
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

test('theme engine exposes the approved production themes without altering classic or blush', () => {
  assert.equal(DEFAULT_THEME_ID, 'classic');
  assert.deepEqual(THEME_IDS, ACTIVE_THEME_IDS);
  assert.equal(THEME_IDS.length, 6);
  assert.equal(THEMES.classic.label, 'Original Deep Red');
  assert.equal(THEMES.blush.label, 'Blush Rose / Baby Pink');
  assert.equal(THEMES.magenta.label, 'Rani Magenta');
  assert.equal(THEMES.magenta.dynamicFront, true);
  assert.equal(THEMES.magenta.dynamicLocationLabel, true);
  assert.equal(THEMES.navy.label, 'Royal Navy');
  assert.equal(THEMES.navy.dynamicFront, true);
  assert.equal(THEMES.plum.label, 'Royal Plum');
  assert.equal(THEMES.plum.dynamicFront, true);
  assert.equal(THEMES.plum.dynamicLocationLabel, true);
  assert.equal(THEMES.plum.showLocationIcon, true);
  assert.equal(THEMES.saffron.label, 'Saffron Gold');
  assert.equal(THEMES.saffron.dynamicFront, true);
  assert.equal(THEMES.saffron.dynamicLocationLabel, true);
  assert.equal(THEMES.saffron.showLocationIcon, false);
});

test('legacy Pink selection and friendly aliases resolve safely while invalid values fall back to classic', () => {
  assert.equal(resolveThemeId('pink'), 'blush');
  assert.equal(resolveThemeId('royalPlum'), 'plum');
  assert.equal(resolveThemeId('saffronGold'), 'saffron');
  assert.equal(resolveThemeId('blush'), 'blush');
  assert.equal(resolveThemeId('classic'), 'classic');
  assert.equal(resolveThemeId('unknown'), 'classic');
  assert.equal(resolveThemeId(null), 'classic');
});

test('every active theme provides all four page artwork assets and files exist', () => {
  for (const themeId of THEME_IDS) {
    for (const asset of PAGE_ASSETS) {
      const webPath = getThemeAsset(themeId, asset);
      assert.ok(webPath, `${themeId}.${asset} missing`);
      const diskPath = path.join(root, 'public', webPath.replace(/^\//, ''));
      assert.ok(fs.existsSync(diskPath), `missing asset file ${diskPath}`);
      assert.ok(fs.statSync(diskPath).size > 5000, `asset looks unexpectedly small: ${diskPath}`);
    }
  }
});

test('theme artwork preserves approved card geometry while blank HD fronts may use near-identical source ratios', () => {
  const referenceTheme = 'magenta';
  for (const asset of PAGE_ASSETS) {
    const referencePath = path.join(root, 'public', getThemeAsset(referenceTheme, asset).replace(/^\//, ''));
    const expected = imageDimensions(referencePath);
    for (const themeId of THEME_IDS) {
      const themedPath = path.join(root, 'public', getThemeAsset(themeId, asset).replace(/^\//, ''));
      const actual = imageDimensions(themedPath);
      if (asset === 'front' && (themeId === 'classic' || themeId === 'blush')) {
        assert.ok(actual.width >= 1000 && actual.height >= 1400, `${themeId}.front is not high-definition enough: ${actual.width}x${actual.height}`);
        assert.ok(Math.abs(aspectRatio(actual) - aspectRatio(expected)) < 0.01, `${themeId}.front aspect ratio materially changed card geometry`);
      } else {
        assert.deepEqual(actual, expected, `${themeId}.${asset} changed dimensions`);
      }
    }
  }
});

test('all four invitation pages obtain artwork from the theme engine', () => {
  assert.match(front, /getThemeAsset\(themeId, 'front'\)/);
  assert.match(left, /getThemeAsset\(themeId, 'insideLeft'\)/);
  assert.match(left, /getThemeAsset\(themeId, 'insideLeftMonogram'\)/);
  assert.match(right, /getThemeAsset\(themeId, 'insideRight'\)/);
  assert.match(back, /getThemeAsset\(themeId, 'back'\)/);
  assert.match(back, /getThemeAsset\(themeId, 'backMonogram'\)/);
});

test('theme selector is accessible and renders every registered theme', () => {
  assert.match(switcher, /THEME_IDS\.map/);
  assert.match(switcher, /role="radiogroup"/);
  assert.match(switcher, /role="radio"/);
  assert.match(switcher, /aria-checked=\{active\}/);
  assert.match(switcher, /onThemeChange\(id\)/);
});

test('selected theme persists in localStorage and is restored safely', () => {
  assert.equal(THEME_STORAGE_KEY, 'sd-invitation-theme');
  assert.match(book, /localStorage\.getItem\(THEME_STORAGE_KEY\)/);
  assert.match(book, /localStorage\.setItem\(THEME_STORAGE_KEY, themeId\)/);
  assert.match(book, /resolveThemeId/);
  assert.match(book, /data-invitation-theme=\{themeId\}/);
});

test('dynamic overlay colours are provided through generic CSS variables instead of per-theme duplicated rules', () => {
  assert.match(book, /getTheme\(themeId\)/);
  assert.match(book, /'--theme-accent'/);
  assert.match(book, /'--theme-gold'/);
  assert.match(css, /\.bookApp\[data-invitation-theme\] \.familyBlessingsIntro h2/);
  assert.match(css, /\.bookApp\[data-invitation-theme\] \.receptionDetailLabel/);
  assert.match(css, /\.bookApp\[data-invitation-theme\] \.heritageBackIntro h2/);
});

test('theme selector layout stays responsive without changing invitation page aspect ratios', () => {
  assert.match(css, /grid-template-columns:\s*repeat\(auto-fit, minmax\(180px, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*?minmax\(140px, 1fr\)/);
  assert.match(css, /\.page-back \.pageViewport\s*\{[\s\S]*?aspect-ratio:\s*1536\s*\/\s*1085/);
  assert.match(css, /\.pageViewport\s*\{[\s\S]*?aspect-ratio:\s*3\s*\/\s*4\.25/);
});

test('high-contrast assistance panel remains theme-aware so names and phone values do not camouflage', () => {
  assert.match(css, /\.bookApp\[data-invitation-theme\] \.heritageAssistance\s*\{/);
  assert.match(css, /background:\s*color-mix\(in srgb, var\(--theme-soft\) 90%, transparent\)/);
  assert.match(css, /\.heritageAssistance \.contactCard a/);
});

test('blush uses matching monogram assets across pages 2, 3 and 4 while classic page 3 remains untouched', () => {
  assert.equal(getThemeAsset('classic', 'insideRightMonogram'), '');
  assert.equal(getThemeAsset('blush', 'insideLeftMonogram'), '/themes/blush/inside-left-monogram.png');
  assert.equal(getThemeAsset('blush', 'insideRightMonogram'), '/themes/blush/inside-right-monogram.png');
  assert.equal(getThemeAsset('blush', 'backMonogram'), '/themes/blush/back-monogram.png');

  for (const assetName of ['insideLeftMonogram', 'insideRightMonogram', 'backMonogram']) {
    const diskPath = path.join(root, 'public', getThemeAsset('blush', assetName).replace(/^\//, ''));
    assert.ok(fs.existsSync(diskPath), `${assetName} missing`);
    assert.ok(fs.statSync(diskPath).size > 100_000, `${assetName} is not a high-resolution asset`);
  }
});

test('InsideRight renders the optional theme monogram and dynamic title only when the theme provides one', () => {
  assert.match(right, /getThemeAsset\(themeId, 'insideRightMonogram'\)/);
  assert.match(right, /insideRightThemeMonogram/);
  assert.match(right, /insideRightDynamicTitle/);
  assert.match(right, /Reception Details/);
  assert.match(css, /\.insideRightThemeMonogram\s*\{/);
  assert.match(css, /\.insideRightDynamicTitle\s*\{/);
  assert.match(css, /\.bookApp\[data-invitation-theme="blush"\] \.receptionDetailsOverlay/);
});


test('Rani Magenta uses dedicated matching monogram assets across pages 2, 3 and 4', () => {
  assert.equal(getThemeAsset('magenta', 'insideLeftMonogram'), '/themes/magenta/inside-left-monogram.png');
  assert.equal(getThemeAsset('magenta', 'insideRightMonogram'), '/themes/magenta/inside-right-monogram.png');
  assert.equal(getThemeAsset('magenta', 'backMonogram'), '/themes/magenta/back-monogram.png');
  for (const assetName of ['insideLeftMonogram', 'insideRightMonogram', 'backMonogram']) {
    const diskPath = path.join(root, 'public', getThemeAsset('magenta', assetName).replace(/^\//, ''));
    assert.ok(fs.existsSync(diskPath), `${assetName} missing`);
    assert.ok(fs.statSync(diskPath).size > 100_000, `${assetName} is unexpectedly low-resolution`);
  }
});

test('Rani Magenta front is dynamic while classic and blush front implementations stay artwork-driven', () => {
  assert.equal(THEMES.classic.dynamicFront, false);
  assert.equal(THEMES.blush.dynamicFront, false);
  assert.equal(THEMES.magenta.dynamicFront, true);
  assert.equal(THEMES.magenta.dynamicLocationLabel, true);
  assert.equal(THEMES.navy.label, 'Royal Navy');
  assert.equal(THEMES.navy.dynamicFront, true);
  assert.match(front, /theme\.dynamicFront/);
  assert.match(front, /EVENT\.frontCover\.heading/);
  assert.match(front, /EVENT\.frontCover\.subheading/);
  assert.match(front, /EVENT\.tagline/);
  assert.match(front, /EVENT\.groomName/);
  assert.match(front, /EVENT\.brideName/);
  assert.match(css, /data-invitation-theme="magenta"\] \.dynamicFrontCopy/);
});

test('Rani Magenta has theme-specific layout guards for monograms and reception details', () => {
  assert.match(css, /data-invitation-theme="magenta"\] \.familyMonogramArtwork/);
  assert.match(css, /data-invitation-theme="magenta"\] \.insideRightThemeMonogram/);
  assert.match(css, /data-invitation-theme="magenta"\] \.receptionDetailsOverlay/);
  assert.match(css, /data-invitation-theme="magenta"\] \.heritageBackMonogram/);
});


test('Royal Navy uses embedded centred crests on pages 1, 2 and 4 and a dedicated overlay only on page 3', () => {
  assert.equal(getThemeAsset('navy', 'insideLeftMonogram'), '');
  assert.equal(getThemeAsset('navy', 'backMonogram'), '');
  assert.equal(getThemeAsset('navy', 'insideRightMonogram'), '/themes/navy/inside-right-monogram.png');
  const monogramPath = path.join(root, 'public', getThemeAsset('navy', 'insideRightMonogram').replace(/^\//, ''));
  assert.ok(fs.existsSync(monogramPath));
  assert.ok(fs.statSync(monogramPath).size > 50_000);
  assert.match(left, /insideLeftMonogram &&/);
  assert.match(back, /backMonogram &&/);
  assert.match(front, /frontMonogram &&/);
});

test('Royal Navy has dedicated layout guards for front text, centred page-3 monogram and readable back contacts', () => {
  assert.match(css, /data-invitation-theme="navy"\] \.dynamicFrontCopy/);
  assert.match(css, /data-invitation-theme="navy"\] \.insideRightThemeMonogram[\s\S]*?left:\s*50%[\s\S]*?translateX\(-50%\)/);
  assert.match(css, /data-invitation-theme="navy"\] \.receptionDetailsOverlay/);
  assert.match(css, /data-invitation-theme="navy"\] \.heritageAssistance[\s\S]*?background:\s*rgba\(252, 241, 217, \.94\)/);
});

test('Royal Navy keeps dynamic data wiring intact', () => {
  assert.match(front, /EVENT\.frontCover\.heading/);
  assert.match(front, /EVENT\.groomName/);
  assert.match(front, /EVENT\.brideName/);
  assert.match(left, /EVENT\.families\.groom\.father/);
  assert.match(left, /EVENT\.families\.bride\.mother/);
  assert.match(right, /EVENT\.dateLabel/);
  assert.match(right, /EVENT\.venueAddress/);
  assert.match(back, /EVENT\.contacts/);
});


test('Royal Plum uses embedded centred crests on pages 1, 2 and 4 and a matching overlay crest only on page 3', () => {
  assert.equal(getThemeAsset('plum', 'insideLeftMonogram'), '');
  assert.equal(getThemeAsset('plum', 'backMonogram'), '');
  assert.equal(getThemeAsset('plum', 'insideRightMonogram'), '/themes/plum/inside-right-monogram.png');
  const monogramPath = path.join(root, 'public', getThemeAsset('plum', 'insideRightMonogram').replace(/^\//, ''));
  assert.ok(fs.existsSync(monogramPath));
  assert.ok(fs.statSync(monogramPath).size > 50_000);
});

test('Royal Plum has dedicated layout guards for dynamic front, centred page-3 crest and readable assistance contacts', () => {
  assert.match(css, /data-invitation-theme="plum"\] \.dynamicFrontCopy/);
  assert.match(css, /data-invitation-theme="plum"\] \.insideRightThemeMonogram[\s\S]*?left:\s*50%[\s\S]*?translateX\(-50%\)/);
  assert.match(css, /data-invitation-theme="plum"\] \.receptionDetailsOverlay/);
  assert.match(css, /data-invitation-theme="plum"\] \.heritageAssistance[\s\S]*?background:\s*rgba\(252, 241, 217, \.95\)/);
});

test('Royal Plum location medallion renders a map-pin icon and premium hover treatment without a square hover artifact', () => {
  assert.match(right, /theme\.showLocationIcon/);
  assert.match(right, /insideRightLocationIcon/);
  assert.match(right, /viewBox="0 0 24 24"/);
  assert.match(css, /data-invitation-theme="plum"\] \.exactLocationHotspot::before[\s\S]*?border-radius:\s*50%/);
  assert.match(css, /data-invitation-theme="plum"\] \.locationDetailsPopover[\s\S]*?linear-gradient/);
});

test('Royal Plum keeps all event data dynamic instead of embedding invitation copy into React', () => {
  assert.match(front, /EVENT\.frontCover\.heading/);
  assert.match(front, /EVENT\.groomName/);
  assert.match(front, /EVENT\.brideName/);
  assert.match(left, /EVENT\.families\.groom\.father/);
  assert.match(left, /EVENT\.families\.bride\.mother/);
  assert.match(right, /EVENT\.dateLabel/);
  assert.match(right, /EVENT\.timeLabel/);
  assert.match(right, /EVENT\.venueName/);
  assert.match(right, /EVENT\.venueAddress/);
  assert.match(back, /EVENT\.contacts/);
});

test('Royal Plum alias resolves safely for persisted or external theme selection', () => {
  assert.equal(resolveThemeId('royalPlum'), 'plum');
  assert.equal(resolveThemeId('plum'), 'plum');
});


test('Saffron Gold uses embedded centred crests on pages 1, 2 and 4 and a dedicated overlay only on page 3', () => {
  assert.equal(getThemeAsset('saffron', 'insideLeftMonogram'), '');
  assert.equal(getThemeAsset('saffron', 'backMonogram'), '');
  assert.equal(getThemeAsset('saffron', 'insideRightMonogram'), '/themes/saffron/inside-right-monogram.png');
  const monogramPath = path.join(root, 'public', getThemeAsset('saffron', 'insideRightMonogram').replace(/^\//, ''));
  assert.ok(fs.existsSync(monogramPath));
  assert.ok(fs.statSync(monogramPath).size > 20_000);
});

test('Saffron Gold has theme-specific layout guards for centred page-3 monogram, readable text and attractive location hover state', () => {
  assert.match(css, /data-invitation-theme="saffron"\] \.dynamicFrontCopy/);
  assert.match(css, /data-invitation-theme="saffron"\] \.insideRightThemeMonogram[\s\S]*?left:\s*50%[\s\S]*?translateX\(-50%\)/);
  assert.match(css, /data-invitation-theme="saffron"\] \.receptionDetailsOverlay/);
  assert.match(css, /data-invitation-theme="saffron"\] \.insideRightDynamicLocationLabel/);
  assert.match(css, /data-invitation-theme="saffron"\] \.locationDetailsPopover/);
  assert.match(css, /data-invitation-theme="saffron"\] \.heritageAssistance/);
});
