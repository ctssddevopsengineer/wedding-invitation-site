import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const component = fs.readFileSync(new URL('../components/LanguageSwitcher.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/language-dropdown.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('language control uses an anchored in-document listbox instead of the browser-native select popup', () => {
  assert.doesNotMatch(component, /<select\b|<option\b/);
  assert.match(component, /aria-haspopup="listbox"/);
  assert.match(component, /role="listbox"/);
  assert.match(component, /role="option"/);
  assert.match(component, /Object\.entries\(LANGUAGES\)/);
  assert.match(component, /onLanguageChange\(id\)/);
});

test('language dropdown closes safely and supports keyboard navigation', () => {
  assert.match(component, /document\.addEventListener\('pointerdown', handlePointerDown\)/);
  assert.match(component, /event\.key !== 'Escape'/);
  assert.match(component, /event\.key === 'ArrowDown'/);
  assert.match(component, /event\.key === 'ArrowUp'/);
  assert.match(component, /event\.key === 'Home'/);
  assert.match(component, /event\.key === 'End'/);
  assert.match(component, /triggerRef\.current\?\.focus\(\)/);
});

test('language menu is absolutely anchored below the trigger and cannot reflow the page', () => {
  assert.match(css, /\.languageDropdown\s*\{[\s\S]*?position:\s*relative/);
  assert.match(css, /\.languageDropdownMenu\s*\{[\s\S]*?position:\s*absolute[\s\S]*?top:\s*calc\(100% \+ 7px\)[\s\S]*?right:\s*0[\s\S]*?left:\s*auto/);
  assert.match(css, /\.languageDropdownMenu\s*\{[\s\S]*?max-width:\s*calc\(100vw - 24px\)/);
  assert.match(css, /\.languageDropdownTrigger\s*\{[\s\S]*?min-height:\s*44px/);
});

test('language trigger keeps deterministic widths from desktop through compact phones', () => {
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) 176px/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) 164px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) 150px/);
  assert.match(css, /@media \(max-width: 340px\)[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) 136px/);
});

test('language dropdown stylesheet is the final targeted layout override', () => {
  const viewportFixes = layout.indexOf("import './viewport-validation-fixes.css';");
  const blushPolish = layout.indexOf("import './blush-compact-polish.css';");
  const languageDropdown = layout.indexOf("import './language-dropdown.css';");
  assert.ok(viewportFixes >= 0);
  assert.ok(blushPolish > viewportFixes);
  assert.ok(languageDropdown > blushPolish);
});
