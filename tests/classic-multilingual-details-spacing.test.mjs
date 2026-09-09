import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/viewport-validation-fixes.css', import.meta.url), 'utf8');

test('compact Classic Bengali/Nepali details keep the translated closing blessing below the countdown', () => {
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*?\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="classic"\] \.localizedDetailsClosing\s*\{[\s\S]*?top:\s*71\.2%\s*!important;/);
});

test('the compact closing-blessing correction is not applied to English or other themes', () => {
  const match = css.match(/@media \(max-width: 360px\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(match, 'compact phone media query must exist');
  const compactBlock = match[1];
  assert.doesNotMatch(compactBlock, /\[lang="en"\][\s\S]*?localizedDetailsClosing/);
  assert.doesNotMatch(compactBlock, /data-invitation-theme="(?:blush|magenta|navy|plum|saffron)"[\s\S]*?localizedDetailsClosing/);
});
