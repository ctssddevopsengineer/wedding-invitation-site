import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/saffron-location-magnifier.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Saffron location magnifier covers the full circular medallion', () => {
  assert.match(css, /data-invitation-theme="saffron"\] \.exactLocationHotspot::before\s*\{[\s\S]*?width:\s*100%/);
  assert.match(css, /data-invitation-theme="saffron"\] \.exactLocationHotspot::before\s*\{[\s\S]*?aspect-ratio:\s*1/);
  assert.match(css, /data-invitation-theme="saffron"\] \.exactLocationHotspot::before\s*\{[\s\S]*?border-radius:\s*50%/);
  assert.match(css, /transform:\s*translate\(-50%,\s*-50%\) scale\(1\)/);
  assert.doesNotMatch(css, /width:\s*72%/);
  assert.doesNotMatch(css, /scale\(\.9\)/);
});

test('Saffron hover, keyboard focus and pinned location keep full medallion coverage', () => {
  assert.match(css, /\.exactLocationHotspot:hover::before,[\s\S]*?\.exactLocationHotspot:focus-visible::before,[\s\S]*?\.exactLocationHotspot\[aria-expanded="true"\]::before/);
  assert.match(css, /scale\(1\.02\)/);
});

test('magnifier fix is Saffron-only and does not move the hotspot geometry', () => {
  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  assert.ok(blocks.length >= 2);
  for (const [, selector, declarations] of blocks) {
    assert.match(selector, /data-invitation-theme="saffron"/);
    assert.doesNotMatch(selector, /classic|blush|magenta|navy|plum/);
    for (const forbidden of ['position:', 'z-index:', 'bottom:']) {
      assert.equal(declarations.includes(forbidden), false, `${forbidden} must not move the existing hotspot`);
    }
  }
});

test('Saffron magnifier override loads after shared inside-right styling', () => {
  const parity = layout.indexOf("import './inside-right-saffron-parity.css';");
  const magnifier = layout.indexOf("import './saffron-location-magnifier.css';");
  const compact = layout.indexOf("import './compact-details-scroll.css';");
  assert.ok(parity >= 0 && magnifier > parity && compact > magnifier);
});
