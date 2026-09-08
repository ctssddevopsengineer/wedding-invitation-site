import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { THEME_IDS, THEMES } from '../lib/theme.mjs';

const ROOT = process.cwd();
const parityPath = path.join(ROOT, 'app', 'saffron-typography-parity.css');
const layoutPath = path.join(ROOT, 'app', 'layout.js');
const parityCss = fs.readFileSync(parityPath, 'utf8');
const layout = fs.readFileSync(layoutPath, 'utf8');

function count(source, token) {
  return source.split(token).length - 1;
}

test('all six production themes participate in the shared Saffron typography system', () => {
  assert.deepEqual(THEME_IDS, ['classic', 'blush', 'magenta', 'navy', 'plum', 'saffron']);
  assert.equal(THEME_IDS.length * 4, 24, 'six themes x four invitation pages remain covered');

  for (const themeId of THEME_IDS) {
    const theme = THEMES[themeId];
    assert.ok(theme.accent, `${themeId} keeps a theme accent`);
    assert.ok(theme.accentDark, `${themeId} keeps a dark accent`);
    assert.ok(theme.gold, `${themeId} keeps a gold accent`);
    assert.ok(theme.soft, `${themeId} keeps a soft paper colour`);
    assert.ok(theme.ink, `${themeId} keeps an ink colour`);
  }

  assert.match(parityCss, /\.bookApp\[data-invitation-theme\]/);
  assert.match(parityCss, /var\(--theme-accent\)/);
  assert.match(parityCss, /var\(--theme-accent-dark\)/);
  assert.match(parityCss, /var\(--theme-gold\)/);
  assert.match(parityCss, /var\(--theme-ink\)/);
});

test('front cover mirrors the Saffron serif, script-name, hierarchy and theme-aware colours', () => {
  for (const selector of [
    '.dynamicFrontHeading',
    '.dynamicFrontHeading > span',
    '.dynamicFrontHeading > em',
    '.dynamicFrontTagline',
    '.dynamicFrontNames',
    '.dynamicFrontClosing'
  ]) assert.ok(parityCss.includes(selector), `front typography covers ${selector}`);

  assert.match(parityCss, /--invitation-serif:\s*Georgia/);
  assert.match(parityCss, /--invitation-script:[^;]*Brush Script MT/);
  assert.match(parityCss, /\.dynamicFrontHeading > span[\s\S]*?letter-spacing:\s*\.14em/);
  assert.match(parityCss, /\.dynamicFrontNames[\s\S]*?font-family:\s*var\(--invitation-script\)/);
  assert.match(parityCss, /\.dynamicFrontNames b[\s\S]*?color:\s*var\(--theme-gold\)/);
});

test('inside-left, inside-right and back-cover text use the same typography language', () => {
  const requiredSelectors = [
    '.familyBlessingsIntro h2',
    '.familyBlock h3',
    '.familyCoupleNames',
    '.insideRightDynamicTitle',
    '.receptionDetailLabel',
    '.receptionDetailValue',
    '.insideRightDynamicLocationLabel',
    '.heritageBackIntro h2',
    '.heritageBackMessage',
    '.heritageCoupleNames',
    '.heritageJourneyMessage',
    '.heritageAssistance h3'
  ];

  for (const selector of requiredSelectors) {
    assert.ok(parityCss.includes(selector), `typography parity covers ${selector}`);
  }
});

test('Bengali and Nepali retain dedicated Unicode fonts instead of Latin script faces', () => {
  assert.match(parityCss, /\.bookApp\[lang="bn"\][\s\S]*?font-family:\s*var\(--font-bengali\)/);
  assert.match(parityCss, /\.bookApp\[lang="ne"\][\s\S]*?font-family:\s*var\(--font-devanagari\)/);
  assert.match(parityCss, /\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)[\s\S]*?font-style:\s*normal/);
});

test('typography parity does not copy Saffron artwork coordinates into other themes', () => {
  const declarations = parityCss
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\n/)
    .map((line) => line.trim());

  for (const forbidden of ['top:', 'left:', 'right:', 'bottom:', 'inset:', 'transform:', 'width:', 'height:']) {
    assert.equal(
      declarations.some((line) => line.startsWith(forbidden)),
      false,
      `parity layer must not override artwork geometry with ${forbidden}`
    );
  }
});

test('responsive parity protects narrow phones without changing template geometry', () => {
  assert.match(parityCss, /@media \(max-width: 430px\)/);
  assert.match(parityCss, /\.dynamicFrontHeading > span[\s\S]*?font-size:\s*clamp\(/);
  assert.match(parityCss, /\.dynamicFrontNames[\s\S]*?font-size:\s*clamp\(/);
  assert.match(parityCss, /\.receptionDetailLabel[\s\S]*?letter-spacing:\s*\.035em/);
});

test('general Saffron typography loads before page-specific parity layers', () => {
  const parityImport = "import './saffron-typography-parity.css';";
  const insideRightImport = "import './inside-right-saffron-parity.css';";
  const insideLeftImport = "import './inside-left-saffron-parity.css';";
  const frontSeparatorImport = "import './saffron-front-separator.css';";

  assert.ok(layout.includes(parityImport));
  assert.ok(layout.includes(insideRightImport));
  assert.ok(layout.includes(insideLeftImport));
  assert.ok(layout.includes(frontSeparatorImport));
  assert.ok(layout.indexOf(parityImport) > layout.indexOf("import './language-dropdown.css';"));
  assert.ok(layout.indexOf(insideRightImport) > layout.indexOf(parityImport));
  assert.ok(layout.indexOf(insideLeftImport) > layout.indexOf(insideRightImport));
  assert.ok(layout.indexOf(frontSeparatorImport) > layout.indexOf(insideLeftImport));

  const importLines = layout.split('\n').filter((line) => line.startsWith("import './"));
  assert.equal(importLines.at(-4), parityImport);
  assert.equal(importLines.at(-3), insideRightImport);
  assert.equal(importLines.at(-2), insideLeftImport);
  assert.equal(importLines.at(-1), frontSeparatorImport);
});

test('new stylesheet has balanced CSS blocks', () => {
  assert.equal(count(parityCss, '{'), count(parityCss, '}'));
});
