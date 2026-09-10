import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { THEME_IDS, THEMES } from '../lib/theme.mjs';

const ROOT = process.cwd();
const cssPath = path.join(ROOT, 'app', 'inside-left-saffron-parity.css');
const layoutPath = path.join(ROOT, 'app', 'layout.js');
const insideLeftPath = path.join(ROOT, 'components', 'InsideLeft.js');
const css = fs.readFileSync(cssPath, 'utf8');
const layout = fs.readFileSync(layoutPath, 'utf8');
const insideLeft = fs.readFileSync(insideLeftPath, 'utf8');

function count(source, token) {
  return source.split(token).length - 1;
}

test('all six themes keep native palette tokens while sharing inside-left styling', () => {
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
  ]) assert.ok(css.includes(token), `inside-left styling uses ${token}`);
});

test('Saffron-style family hierarchy covers all inside-left semantic zones', () => {
  const selectors = [
    '.familyBlessingsIntro h2',
    '.familyBlessingsIntro p',
    '.familyCoupleNames',
    '.familyCoupleNames b',
    '.familyGoldDivider',
    '.familyGoldDivider::before',
    '.familyGoldDivider span',
    '.familyBlock h3',
    '.familyBlock h3 span',
    '.familyBlock p',
    '.familyBlessingsClosing'
  ];

  for (const selector of selectors) {
    assert.ok(css.includes(selector), `inside-left parity covers ${selector}`);
  }

  assert.match(css, /\.familyBlessingsIntro h2[\s\S]*?font-weight:\s*700/);
  assert.match(css, /\.familyCoupleNames[\s\S]*?var\(--invitation-script/);
  assert.match(css, /\.familyCoupleNames b[\s\S]*?var\(--inside-left-gold\)/);
  assert.match(css, /\.familyGoldDivider::before,[\s\S]*?linear-gradient/);
  assert.match(css, /\.familyBlock h3[\s\S]*?font-weight:\s*700/);
  assert.match(css, /\.familyBlessingsClosing[\s\S]*?var\(--inside-left-heading-strong\)/);
});

test('theme-native contrast and ornaments derive only from shared palette variables', () => {
  for (const customToken of [
    '--inside-left-heading',
    '--inside-left-heading-strong',
    '--inside-left-ink',
    '--inside-left-gold',
    '--inside-left-paper',
    '--inside-left-gold-soft',
    '--inside-left-gold-strong',
    '--inside-left-shadow'
  ]) assert.ok(css.includes(customToken), `${customToken} is defined`);

  assert.match(css, /--inside-left-heading:\s*var\(--theme-accent\)/);
  assert.match(css, /--inside-left-heading-strong:\s*var\(--theme-accent-dark\)/);
  assert.match(css, /--inside-left-ink:\s*var\(--theme-ink\)/);
  assert.match(css, /--inside-left-gold:\s*var\(--theme-gold\)/);
  assert.match(css, /color-mix\(in srgb, var\(--theme-soft\)/);
});

test('Bengali and Nepali keep dedicated Unicode fonts and relaxed tracking', () => {
  assert.match(css, /\.bookApp\[lang="bn"\][\s\S]*?font-family:\s*var\(--font-bengali\)/);
  assert.match(css, /\.bookApp\[lang="ne"\][\s\S]*?font-family:\s*var\(--font-devanagari\)/);
  assert.match(css, /\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)[\s\S]*?\.familyBlock h3[\s\S]*?letter-spacing:\s*0/);
  assert.match(css, /\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)[\s\S]*?\.familyBlock p[\s\S]*?line-height:\s*1\.48/);
  assert.match(css, /\.familyCoupleNames[\s\S]*?font-style:\s*normal/);
});

test('responsive safeguards cover tablet, phone, very narrow phone and short landscape', () => {
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /@media \(orientation: landscape\) and \(max-height: 520px\)/);

  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?\.familyBlessingsIntro h2[\s\S]*?font-size:\s*clamp\(/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?\.familyBlessingsIntro p[\s\S]*?font-size:\s*clamp\(/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?\.familyBlock h3[\s\S]*?font-size:\s*clamp\(/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?\.familyBlock p[\s\S]*?font-size:\s*clamp\(/);
});

test('inside-left visual parity never overwrites approved artwork geometry', () => {
  const declarations = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\n/)
    .map((line) => line.trim());

  for (const forbidden of ['top:', 'left:', 'right:', 'bottom:', 'inset:', 'transform:', 'width:', 'height:', 'position:']) {
    assert.equal(
      declarations.some((line) => line.startsWith(forbidden)),
      false,
      `inside-left visual parity must not override geometry with ${forbidden}`
    );
  }
});

test('InsideLeft continues to expose every styled semantic class', () => {
  for (const className of [
    'familyBlessingsContent',
    'familyBlessingsIntro',
    'familyCoupleNames',
    'familyGoldDivider',
    'familyBlock',
    'familyGroomBlock',
    'familyBrideBlock',
    'familyBlessingsClosing'
  ]) assert.ok(insideLeft.includes(className), `InsideLeft still exposes ${className}`);
});

test('inside-left parity keeps its ordering before front layers and compact details scrolling', () => {
  const generalImport = "import './saffron-typography-parity.css';";
  const insideRightImport = "import './inside-right-saffron-parity.css';";
  const parityImport = "import './inside-left-saffron-parity.css';";
  const frontSeparatorImport = "import './saffron-front-separator.css';";
  const frontParityImport = "import './front-saffron-parity.css';";
  const compactScrollImport = "import './compact-details-scroll.css';";

  for (const required of [generalImport, insideRightImport, parityImport, frontSeparatorImport, frontParityImport, compactScrollImport]) {
    assert.ok(layout.includes(required));
  }
  assert.ok(layout.indexOf(parityImport) > layout.indexOf(insideRightImport));
  assert.ok(layout.indexOf(frontSeparatorImport) > layout.indexOf(parityImport));
  assert.ok(layout.indexOf(frontParityImport) > layout.indexOf(frontSeparatorImport));
  assert.ok(layout.indexOf(compactScrollImport) > layout.indexOf(frontParityImport));

  const importLines = layout.split('\n').filter((line) => line.startsWith("import './"));
  assert.equal(importLines.at(-4), parityImport);
  assert.equal(importLines.at(-3), frontSeparatorImport);
  assert.equal(importLines.at(-2), frontParityImport);
  assert.equal(importLines.at(-1), compactScrollImport);
  assert.equal(count(css, '{'), count(css, '}'));
});
