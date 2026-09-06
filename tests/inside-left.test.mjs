import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EVENT } from '../lib/event.mjs';

const component = fs.readFileSync(new URL('../components/InsideLeft.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const theme = fs.readFileSync(new URL('../lib/theme.mjs', import.meta.url), 'utf8');

test('inside-left copy is centralized in EVENT constants', () => {
  assert.equal(EVENT.insideLeft.heading, 'With the Blessings of Our Families');
  assert.ok(Array.isArray(EVENT.insideLeft.introLines));
  assert.ok(Array.isArray(EVENT.insideLeft.closingLines));
});

test('InsideLeft reads all person-specific values from EVENT', () => {
  assert.match(component, /EVENT\.groomName/);
  assert.match(component, /EVENT\.brideName/);
  assert.match(component, /EVENT\.families\.groom\.father/);
  assert.match(component, /EVENT\.families\.groom\.mother/);
  assert.match(component, /EVENT\.families\.bride\.father/);
  assert.match(component, /EVENT\.families\.bride\.mother/);
});

test('InsideLeft visibly renders the configured couple names', () => {
  assert.match(component, /className="familyCoupleNames"/);
  assert.match(component, /<span>\{EVENT\.groomName\}<\/span>/);
  assert.match(component, /<span>\{EVENT\.brideName\}<\/span>/);
  assert.match(component, /aria-label=\{EVENT\.couple\}/);
});

test('InsideLeft reads all page copy from EVENT.insideLeft', () => {
  assert.match(component, /EVENT\.insideLeft/);
  assert.match(component, /copy\.heading/);
  assert.match(component, /copy\.introLines/);
  assert.match(component, /copy\.closingLines/);
});

test('InsideLeft uses the approved blank template without parchment text masks', () => {
  assert.match(component, /getThemeAsset\(themeId, 'insideLeft'\)/);
  assert.match(theme, /insideLeft:\s*asset\(`\/themes\/\$\{themeId\}\/inside-left\.png`\)/);
  assert.doesNotMatch(css, /familyDynamicValue/);
  assert.doesNotMatch(css, /parchment mask/i);
});

test('family headings remain highlighted and are not replaced by name overlays', () => {
  assert.match(component, /EVENT\.families\.groom\.heading/);
  assert.match(component, /EVENT\.families\.bride\.heading/);
  assert.match(css, /\.familyBlock h3/);
  assert.match(css, /color:\s*#721b24/);
});

test('exact monogram artwork is included as a dedicated asset', () => {
  assert.match(component, /getThemeAsset\(themeId, 'insideLeftMonogram'\)/);
  assert.match(theme, /insideLeftMonogram:\s*insideLeftMonogram \? asset\(`\/themes\/\$\{themeId\}\/inside-left-monogram\.png`\) : ''/);
});
