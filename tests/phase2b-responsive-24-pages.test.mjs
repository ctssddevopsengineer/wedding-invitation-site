import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { THEME_IDS, getThemeAsset } from '../lib/theme.mjs';

const root = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/responsive-layout.css', import.meta.url), 'utf8');

const PAGE_ASSETS = ['front', 'insideLeft', 'insideRight', 'back'];
const EXPECTED_THEMES = ['classic', 'blush', 'magenta', 'navy', 'plum', 'saffron'];

function assetExists(webPath) {
  const diskPath = path.join(root, 'public', webPath.replace(/^\//, ''));
  return fs.existsSync(diskPath) && fs.statSync(diskPath).size > 5000;
}

test('responsive stylesheet is loaded after Phase 2B styles', () => {
  const phase2bIndex = layout.indexOf("import './phase2b.css';");
  const responsiveIndex = layout.indexOf("import './responsive-layout.css';");
  assert.ok(phase2bIndex >= 0, 'phase2b.css import missing');
  assert.ok(responsiveIndex > phase2bIndex, 'responsive-layout.css must load after phase2b.css');
});

test('exactly six approved themes are active', () => {
  assert.deepEqual(THEME_IDS, EXPECTED_THEMES);
});

test('all 24 theme/page combinations resolve to real artwork assets', () => {
  let combinations = 0;
  for (const themeId of THEME_IDS) {
    for (const assetName of PAGE_ASSETS) {
      const webPath = getThemeAsset(themeId, assetName);
      assert.ok(webPath, `${themeId}.${assetName} did not resolve`);
      assert.ok(assetExists(webPath), `${themeId}.${assetName} file is missing or unexpectedly small`);
      combinations += 1;
    }
  }
  assert.equal(combinations, 24);
});

test('all four card types use container-relative responsive typography', () => {
  assert.match(css, /\.pageViewport\s*\{[\s\S]*?container-type:\s*inline-size/);
  assert.match(css, /\.dynamicFrontNames\s*\{[\s\S]*?cqw/);
  assert.match(css, /\.familyCoupleNames\s*\{[\s\S]*?cqw/);
  assert.match(css, /\.receptionDetailLabel\s*\{[\s\S]*?cqw/);
  assert.match(css, /\.heritageCoupleNames\s*\{[\s\S]*?cqw/);
});

test('Page 4 explicitly separates gratitude, names, journey and assistance zones', () => {
  const requiredSelectors = [
    '.heritageBackIntro',
    '.heritageCoupleNames',
    '.heritageNamesRule',
    '.heritageJourneyMessage',
    '.heritageAssistance'
  ];

  for (const selector of requiredSelectors) {
    assert.ok(css.includes(selector), `${selector} responsive override missing`);
  }

  assert.match(css, /\.heritageCoupleNames\s*\{[\s\S]*?top:\s*46\.2%/);
  assert.match(css, /\.heritageJourneyMessage\s*\{[\s\S]*?top:\s*57\.4%/);
  assert.match(css, /\.heritageAssistance\s*\{[\s\S]*?top:\s*69\.5%/);
});

test('responsive guards cover compact phone, phone, tablet and desktop widths', () => {
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /@media \(min-width: 681px\) and \(max-width: 1024px\)/);
});

test('mobile Page 4 names have an explicit width cap and smaller container-relative type', () => {
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?\.heritageCoupleNames,[\s\S]*?max-width:\s*63%/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?font-size:\s*clamp\(10px,\s*2\.95cqw,\s*31px\)/);
});
