import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/compact-multilingual-back.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('compact multilingual back-cover guard loads after the general mobile overlap stylesheet', () => {
  assert.match(
    layout,
    /import '\.\/mobile-overlap-fixes\.css';\s*\nimport '\.\/compact-multilingual-back\.css';/
  );
});

test('the guard is limited to very small screens, Classic theme, and Bengali/Nepali only', () => {
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /@media \(max-width: 340px\)/);
  assert.match(css, /\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="classic"\]/);
  assert.doesNotMatch(css, /data-invitation-theme="(?:blush|magenta|navy|plum|saffron)"/);
});

test('compact Classic Bengali/Nepali back cover creates separation without shrinking typography', () => {
  assert.match(css, /\.heritageBackIntro\s*\{[\s\S]*?top:\s*22\.8%\s*!important;[\s\S]*?width:\s*54%\s*!important;/);
  assert.match(css, /\.heritageCoupleNames\s*\{[\s\S]*?top:\s*46\.8%\s*!important;[\s\S]*?width:\s*58%\s*!important;/);
  assert.match(css, /\.heritageNamesRule\s*\{[\s\S]*?top:\s*54\.8%\s*!important;/);
  assert.match(css, /\.heritageJourneyMessage\s*\{[\s\S]*?top:\s*58\.6%\s*!important;/);
  assert.match(css, /\.heritageAssistance\s*\{[\s\S]*?top:\s*70\.7%\s*!important;/);
  assert.doesNotMatch(css, /font-size\s*:/, 'fix must preserve existing readable font floors');
});

test('320-340px band receives extra wrapping room instead of an internal scrollbar', () => {
  assert.match(css, /@media \(max-width: 340px\)[\s\S]*?\.heritageBackIntro\s*\{[\s\S]*?width:\s*57%\s*!important;/);
  assert.match(css, /@media \(max-width: 340px\)[\s\S]*?\.heritageCoupleNames\s*\{[\s\S]*?top:\s*47\.2%\s*!important;/);
  assert.doesNotMatch(css, /overflow(?:-y)?\s*:\s*(?:auto|scroll)/);
});
