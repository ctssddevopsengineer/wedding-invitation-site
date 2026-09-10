import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/viewport-validation-fixes.css', import.meta.url), 'utf8');

const compactClassicClosingRule = /@media \(max-width: 360px\)[\s\S]*?\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="classic"\] \.localizedDetailsClosing\s*\{\s*top:\s*73\.4%\s*!important;\s*\}/;

test('compact Classic Bengali/Nepali details keep the translated closing blessing below the countdown', () => {
  assert.match(css, compactClassicClosingRule);
});

test('the closing-blessing correction stays narrowly scoped to Classic Bengali/Nepali', () => {
  assert.doesNotMatch(css, /\[lang="en"\][^{}]*\.localizedDetailsClosing\s*\{[^{}]*top:\s*73\.4%/);
  assert.doesNotMatch(css, /data-invitation-theme="(?:blush|magenta|navy|plum|saffron)"[^{}]*\.localizedDetailsClosing\s*\{[^{}]*top:\s*73\.4%/);
});
