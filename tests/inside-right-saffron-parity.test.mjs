import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { THEME_IDS, THEMES } from '../lib/theme.mjs';

const ROOT = process.cwd();
const cssPath = path.join(ROOT, 'app', 'inside-right-saffron-parity.css');
const layoutPath = path.join(ROOT, 'app', 'layout.js');
const insideRightPath = path.join(ROOT, 'components', 'InsideRight.js');
const css = fs.readFileSync(cssPath, 'utf8');
const layout = fs.readFileSync(layoutPath, 'utf8');
const insideRight = fs.readFileSync(insideRightPath, 'utf8');

function count(source, token) {
  return source.split(token).length - 1;
}

test('all six themes keep native palette tokens while sharing inside-right styling', () => {
  assert.deepEqual(THEME_IDS, ['classic', 'blush', 'magenta', 'navy', 'plum', 'saffron']);

  for (const themeId of THEME_IDS) {
    const theme = THEMES[themeId];
    for (const token of ['accent', 'accentDark', 'gold', 'soft', 'ink']) {
      assert.ok(theme[token], `${themeId} keeps ${token}`);
    }
  }

  for (const token of [
    'var(--theme-accent)',
    'var(--theme-accent-dark)',
    'var(--theme-gold)',
    'var(--theme-soft)',
    'var(--theme-ink)'
  ]) assert.ok(css.includes(token), `shared styling uses ${token}`);
});

test('Saffron-style reception hierarchy covers title, labels, values, dividers and utilities', () => {
  const selectors = [
    '.insideRightDynamicTitle',
    '.localizedPrintedDetailsTitle',
    '.receptionDetailLabel',
    '.receptionDetailValue',
    '.receptionDetailDivider',
    '.receptionCalendarItem .btn',
    '.receptionCountdownItem .countdownUnit',
    '.insideRightDynamicLocationLabel',
    '.insideRightLocationIcon',
    '.exactLocationHotspot::before',
    '.locationDetailsPopover',
    '.locationPopoverHeader p',
    '.locationVenueName',
    '.locationVenueAddress',
    '.utilityCloseButton'
  ];

  for (const selector of selectors) {
    assert.ok(css.includes(selector), `inside-right parity covers ${selector}`);
  }

  assert.match(css, /\.receptionDetailLabel[\s\S]*?font-weight:\s*700/);
  assert.match(css, /\.receptionDetailValue[\s\S]*?font-weight:\s*500/);
  assert.match(css, /\.receptionDetailDivider::before,[\s\S]*?linear-gradient/);
  assert.match(css, /\.receptionCalendarItem \.btn[\s\S]*?linear-gradient/);
  assert.match(css, /\.receptionCountdownItem \.countdownUnit[\s\S]*?var\(--inside-right-paper-strong\)/);
});

test('theme-native contrast and ornamental treatment are derived from palette variables', () => {
  for (const customToken of [
    '--inside-right-heading',
    '--inside-right-heading-strong',
    '--inside-right-ink',
    '--inside-right-gold',
    '--inside-right-paper',
    '--inside-right-gold-soft',
    '--inside-right-gold-strong',
    '--inside-right-shadow'
  ]) assert.ok(css.includes(customToken), `${customToken} is defined`);

  assert.match(css, /--inside-right-heading:\s*var\(--theme-accent\)/);
  assert.match(css, /--inside-right-heading-strong:\s*var\(--theme-accent-dark\)/);
  assert.match(css, /--inside-right-ink:\s*var\(--theme-ink\)/);
  assert.match(css, /--inside-right-gold:\s*var\(--theme-gold\)/);
  assert.match(css, /color-mix\(in srgb, var\(--theme-soft\)/);
});

test('Bengali and Nepali keep dedicated fonts and reduced tracking', () => {
  assert.match(css, /\.bookApp\[lang="bn"\][\s\S]*?font-family:\s*var\(--font-bengali\)/);
  assert.match(css, /\.bookApp\[lang="ne"\][\s\S]*?font-family:\s*var\(--font-devanagari\)/);
  assert.match(css, /\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)[\s\S]*?\.receptionDetailLabel[\s\S]*?letter-spacing:\s*0/);
  assert.match(css, /\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)[\s\S]*?\.receptionDetailValue[\s\S]*?line-height:\s*1\.3/);
});

test('responsive safeguards cover tablet, phone, very narrow phone and short landscape', () => {
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /@media \(orientation: landscape\) and \(max-height: 520px\)/);

  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?\.receptionDetailLabel[\s\S]*?font-size:\s*clamp\(/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?\.receptionDetailValue[\s\S]*?font-size:\s*clamp\(/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?\.receptionCalendarItem \.btn[\s\S]*?font-size:\s*clamp\(/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?\.countdownUnit[\s\S]*?font-size:\s*clamp\(/);
});

test('inside-right visual parity never overwrites artwork geometry', () => {
  const declarations = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\n/)
    .map((line) => line.trim());

  for (const forbidden of ['top:', 'left:', 'right:', 'bottom:', 'inset:', 'transform:', 'width:', 'height:', 'position:']) {
    assert.equal(
      declarations.some((line) => line.startsWith(forbidden)),
      false,
      `visual parity must not override geometry with ${forbidden}`
    );
  }
});

test('InsideRight continues to expose every styled semantic class', () => {
  for (const className of [
    'insideRightDynamicTitle',
    'localizedPrintedDetailsTitle',
    'receptionDetailLabel',
    'receptionDetailValue',
    'receptionDetailDivider',
    'receptionCalendarItem',
    'receptionCountdownItem',
    'insideRightDynamicLocationLabel',
    'insideRightLocationIcon',
    'exactLocationHotspot',
    'locationDetailsPopover',
    'locationPopoverHeader',
    'locationVenueName',
    'locationVenueAddress',
    'utilityCloseButton'
  ]) assert.ok(insideRight.includes(className), `InsideRight still exposes ${className}`);
});

test('inside-right parity loads after general typography and before later targeted layers', () => {
  const generalImport = "import './saffron-typography-parity.css';";
  const parityImport = "import './inside-right-saffron-parity.css';";
  const insideLeftImport = "import './inside-left-saffron-parity.css';";
  const frontSeparatorImport = "import './saffron-front-separator.css';";
  const frontParityImport = "import './front-saffron-parity.css';";

  for (const required of [generalImport, parityImport, insideLeftImport, frontSeparatorImport, frontParityImport]) {
    assert.ok(layout.includes(required));
  }
  assert.ok(layout.indexOf(parityImport) > layout.indexOf(generalImport));
  assert.ok(layout.indexOf(insideLeftImport) > layout.indexOf(parityImport));
  assert.ok(layout.indexOf(frontSeparatorImport) > layout.indexOf(insideLeftImport));
  assert.ok(layout.indexOf(frontParityImport) > layout.indexOf(frontSeparatorImport));

  const importLines = layout.split('\n').filter((line) => line.startsWith("import './"));
  assert.equal(importLines.at(-4), parityImport);
  assert.equal(importLines.at(-3), insideLeftImport);
  assert.equal(importLines.at(-2), frontSeparatorImport);
  assert.equal(importLines.at(-1), frontParityImport);
  assert.equal(count(css, '{'), count(css, '}'));
});
