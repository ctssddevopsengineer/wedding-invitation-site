import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

const requiredSelectors = [
  '.exactInsideRight',
  '.exactInsideRightArtwork',
  '.receptionDetailsOverlay',
  '.exactLocationHotspot',
  '.locationDetailsPopover'
];

test('Inside Right keeps all critical positioning selectors', () => {
  for (const selector of requiredSelectors) {
    assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Location hotspot and popover are horizontally centered', () => {
  assert.match(css, /\.exactLocationHotspot\s*\{[\s\S]*?left:\s*50%[\s\S]*?transform:\s*translateX\(-50%\)/);
  assert.match(css, /\.locationDetailsPopover\s*\{[\s\S]*?left:\s*50%[\s\S]*?transform:\s*translate\(-50%,\s*8px\)/);
});

test('Location hotspot does not paint a hover square', () => {
  assert.match(css, /\.exactLocationHotspot:hover,[\s\S]*?box-shadow:\s*none/);
});
