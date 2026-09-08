import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { THEME_IDS, THEMES } from '../lib/theme.mjs';

const ROOT = process.cwd();
const cssPath = path.join(ROOT, 'app', 'front-saffron-parity.css');
const layoutPath = path.join(ROOT, 'app', 'layout.js');
const frontCoverPath = path.join(ROOT, 'components', 'FrontCover.js');

const css = fs.readFileSync(cssPath, 'utf8');
const layout = fs.readFileSync(layoutPath, 'utf8');
const frontCover = fs.readFileSync(frontCoverPath, 'utf8');

function count(source, token) {
  return source.split(token).length - 1;
}

test('all six themes keep native palette tokens while sharing Saffron front styling', () => {
  assert.deepEqual(THEME_IDS, ['classic', 'blush', 'magenta', 'navy', 'plum', 'saffron']);

  for (const themeId of THEME_IDS) {
    const theme = THEMES[themeId];
    for (const token of ['accent', 'accentDark', 'gold', 'soft', 'ink']) {
      assert.ok(theme[token], `${themeId} keeps ${token}`);
    }
  }

  for (const token of [
    'var(--theme-accent)',
    'var(--theme-gold)',
    'var(--theme-soft)',
    'var(--theme-ink)'
  ]) assert.ok(css.includes(token), `front parity uses ${token}`);
});

test('Saffron front hierarchy covers heading, separators, tagline, names and closing copy', () => {
  const selectors = [
    '.dynamicFrontHeading',
    '.dynamicFrontHeading > span',
    '.dynamicFrontHeading > em',
    '.dynamicFrontRule',
    '.dynamicFrontRule span',
    '.dynamicFrontNamesRule',
    '.dynamicFrontClosingRule',
    '.dynamicFrontTagline',
    '.dynamicFrontNames',
    '.dynamicFrontNames b',
    '.dynamicFrontClosing'
  ];

  for (const selector of selectors) {
    assert.ok(css.includes(selector), `front parity covers ${selector}`);
  }

  assert.match(css, /\.dynamicFrontHeading > span[\s\S]*?letter-spacing:\s*\.14em/);
  assert.match(css, /\.dynamicFrontHeading > em[\s\S]*?font-weight:\s*600/);
  assert.match(css, /\.dynamicFrontRule[\s\S]*?linear-gradient\(/);
  assert.match(css, /\.dynamicFrontNamesRule[\s\S]*?width:\s*28%/);
  assert.match(css, /\.dynamicFrontClosingRule[\s\S]*?width:\s*25%/);
  assert.match(css, /\.dynamicFrontNames[\s\S]*?var\(--invitation-script\)/);
});

test('separator parchment and ornament colors remain theme-native', () => {
  assert.match(css, /--front-parity-paper:\s*color-mix\(in srgb, var\(--theme-soft\)/);
  assert.match(css, /--front-parity-gold:\s*color-mix\(in srgb, var\(--theme-gold\)/);
  assert.match(css, /--front-parity-gold-soft:/);
  assert.match(css, /data-invitation-theme="saffron"[\s\S]*?--front-parity-paper:\s*#f6e9cf/);
  assert.match(css, /\.dynamicFrontRule span[\s\S]*?background:\s*var\(--front-parity-paper\)/);
});

test('Bengali and Nepali keep dedicated Unicode fonts and readable line height', () => {
  assert.match(css, /\.bookApp\[lang="bn"\][\s\S]*?font-family:\s*var\(--font-bengali\)/);
  assert.match(css, /\.bookApp\[lang="ne"\][\s\S]*?font-family:\s*var\(--font-devanagari\)/);
  assert.match(css, /\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)[\s\S]*?\.dynamicFrontHeading > span[\s\S]*?letter-spacing:\s*0/);
  assert.match(css, /\.dynamicFrontTagline,[\s\S]*?\.dynamicFrontClosing[\s\S]*?line-height:\s*1\.46/);
});

test('responsive safeguards cover tablet, phone, narrow phone and short landscape', () => {
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /@media \(orientation: landscape\) and \(max-height: 520px\)/);

  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?\.dynamicFrontRule \{ width:\s*37%/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?\.dynamicFrontNamesRule \{ width:\s*31%/);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*?\.dynamicFrontRule \{ width:\s*39%/);
});

test('shared front parity preserves artwork-specific vertical geometry', () => {
  const declarations = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\n/)
    .map((line) => line.trim());

  for (const forbidden of ['top:', 'left:', 'right:', 'bottom:', 'inset:', 'transform:', 'position:', 'height:']) {
    assert.equal(
      declarations.some((line) => line.startsWith(forbidden)),
      false,
      `front parity must not overwrite artwork placement with ${forbidden}`
    );
  }
});

test('FrontCover exposes the complete Saffron-style semantic sequence', () => {
  const sequence = [
    'className="dynamicFrontHeading"',
    'className="dynamicFrontRule"',
    'className="dynamicFrontTagline"',
    'className="dynamicFrontRule dynamicFrontNamesRule"',
    'className="dynamicFrontNames"',
    'className="dynamicFrontRule dynamicFrontClosingRule"',
    'className="dynamicFrontClosing"'
  ];

  let previous = -1;
  for (const token of sequence) {
    const current = frontCover.indexOf(token, previous + 1);
    assert.ok(current > previous, `${token} follows the previous front element`);
    previous = current;
  }
});

test('front parity is the final visual layer and CSS blocks are balanced', () => {
  const saffronSeparatorImport = "import './saffron-front-separator.css';";
  const parityImport = "import './front-saffron-parity.css';";

  assert.ok(layout.includes(saffronSeparatorImport));
  assert.ok(layout.includes(parityImport));
  assert.ok(layout.indexOf(parityImport) > layout.indexOf(saffronSeparatorImport));

  const importLines = layout.split('\n').filter((line) => line.startsWith("import './"));
  assert.equal(importLines.at(-1), parityImport);
  assert.equal(count(css, '{'), count(css, '}'));
});
