import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/viewport-validation-fixes.css', import.meta.url), 'utf8');

function ultraNarrowBlock() {
  const matches = [...css.matchAll(/@media \(max-width: 319px\) \{([\s\S]*?)\n\}/g)];
  return matches.map((match) => match[1]).join('\n');
}

test('240px WebKit spacing keeps Bengali family names below the blessing copy', () => {
  const block = ultraNarrowBlock();
  assert.match(block, /\.bookApp\[lang="bn"\] \.familyCoupleNames\s*\{[\s\S]*?top:\s*47%\s*!important/);
});

test('240px WebKit spacing gives Deep Red translated closing copy extra countdown clearance', () => {
  const block = ultraNarrowBlock();
  assert.match(block, /\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="classic"\] \.localizedDetailsClosing\s*\{[\s\S]*?top:\s*77\.2%\s*!important/);
});

test('240px WebKit spacing separates Saffron English tagline and couple names', () => {
  const block = ultraNarrowBlock();
  assert.match(block, /\.bookApp\[lang="en"\]\[data-invitation-theme="saffron"\] \.frontCover \.dynamicFrontNames\s*\{[\s\S]*?top:\s*44\.3%\s*!important/);
});
