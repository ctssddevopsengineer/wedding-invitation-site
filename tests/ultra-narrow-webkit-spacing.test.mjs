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

test('240px gives Classic Bengali/Nepali closing copy dedicated painted-countdown clearance', () => {
  const block = ultraNarrowBlock();
  assert.match(block, /\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="classic"\] \.localizedDetailsClosing\s*\{[\s\S]*?top:\s*72\.8%\s*!important/);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*?data-invitation-theme="classic"[^{}]*\.localizedDetailsClosing\s*\{\s*top:\s*73\.4%\s*!important/);
  assert.doesNotMatch(block, /data-invitation-theme="(?:blush|magenta|navy|plum|saffron)"[^{}]*\.localizedDetailsClosing/);
});

test('240px compacts only the Classic Bengali/Nepali painted countdown cards', () => {
  const block = ultraNarrowBlock();
  const prefix = '\\.bookApp:is\\(\\[lang="bn"\\], \\[lang="ne"\\]\\)\\[data-invitation-theme="classic"\\] \\.receptionCountdownItem';
  assert.match(block, new RegExp(`${prefix} \\.countdown\\s*\\{[\\s\\S]*?gap:\\s*\\.08rem\\s*!important`));
  assert.match(block, new RegExp(`${prefix} \\.countdownUnit\\s*\\{[\\s\\S]*?padding:\\s*\\.08rem \\.03rem\\s*!important`));
  assert.match(block, new RegExp(`${prefix} \\.countdownUnit strong\\s*\\{[\\s\\S]*?font-size:\\s*7px\\s*!important[\\s\\S]*?line-height:\\s*1\\s*!important`));
  assert.match(block, new RegExp(`${prefix} \\.countdownUnit span\\s*\\{[\\s\\S]*?font-size:\\s*5px\\s*!important[\\s\\S]*?line-height:\\s*1\\s*!important`));
  assert.doesNotMatch(block, /data-invitation-theme="(?:blush|magenta|navy|plum|saffron)"[^{}]*\.receptionCountdownItem \.countdownUnit/);
});

test('240px WebKit spacing separates Saffron English tagline and couple names', () => {
  const block = ultraNarrowBlock();
  assert.match(block, /\.bookApp\[lang="en"\]\[data-invitation-theme="saffron"\] \.frontCover \.dynamicFrontNames\s*\{[\s\S]*?top:\s*44\.3%\s*!important/);
});
