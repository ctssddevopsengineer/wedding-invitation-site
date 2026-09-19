import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/viewport-validation-fixes.css', import.meta.url), 'utf8');
const languages = fs.readFileSync(new URL('../app/languages.css', import.meta.url), 'utf8');

test('Classic translated closing stays anchored over the printed English at every width', () => {
  assert.match(languages, /\.localizedDetailsClosing\s*\{[^}]*top:\s*68%/);
  assert.doesNotMatch(css, /\.localizedDetailsClosing\s*\{[^}]*top:/);
});
