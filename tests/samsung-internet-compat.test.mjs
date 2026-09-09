import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/samsung-internet-compat.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Samsung compatibility layer is loaded after the authored invitation styles', () => {
  assert.match(layout, /import '\.\/front-saffron-parity\.css';\s*\nimport '\.\/samsung-internet-compat\.css';/);
});

test('mobile browsers cannot auto-resize the invitation typography', () => {
  assert.match(css, /-webkit-text-size-adjust:\s*100%/);
  assert.match(css, /text-size-adjust:\s*100%/);
});

test('invitation artwork stays in its authored light color scheme', () => {
  assert.match(css, /\.invitePage\s*\{[\s\S]*?color-scheme:\s*only light;/);
});

test('Samsung WebKit text fill follows the authored theme color', () => {
  assert.match(css, /\.invitePage :is\([\s\S]*?\.dynamicFrontHeading[\s\S]*?\.familyBlessingsIntro[\s\S]*?\.receptionDetailValue[\s\S]*?\.heritageBackIntro[\s\S]*?\)\s*\{[\s\S]*?-webkit-text-fill-color:\s*currentColor;/);
});

test('older Samsung Internet versions receive non-cqw typography fallbacks', () => {
  assert.match(css, /@supports not \(font-size:\s*1cqw\)/);
  for (const selector of [
    '.dynamicFrontHeading > span',
    '.dynamicFrontNames',
    '.familyCoupleNames',
    '.receptionDetailValue',
    '.heritageCoupleNames'
  ]) {
    assert.ok(css.includes(selector), `missing fallback for ${selector}`);
  }
});
