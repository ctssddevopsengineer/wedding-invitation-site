import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { LANGUAGES } from '../lib/locale.mjs';
import { THEME_IDS } from '../lib/theme.mjs';

const introSource = fs.readFileSync(new URL('../components/CinematicIntro.js', import.meta.url), 'utf8');
const bookSource = fs.readFileSync(new URL('../components/InvitationBook.js', import.meta.url), 'utf8');
const introCss = fs.readFileSync(new URL('../components/CinematicIntro.module.css', import.meta.url), 'utf8');

test('envelope intro exposes language and theme selectors before opening', () => {
  assert.match(introSource, /data-intro-preferences/);
  assert.match(introSource, /data-intro-language/);
  assert.match(introSource, /data-intro-theme/);
  assert.match(introSource, /phase === 'closed'/);
  assert.ok(Object.keys(LANGUAGES).length >= 3, 'all configured invitation languages remain selectable');
  assert.ok(THEME_IDS.length >= 6, 'all configured colour themes remain selectable');
});

test('intro preference changes use the same invitation state handlers', () => {
  assert.match(bookSource, /language=\{language\}/);
  assert.match(bookSource, /themeId=\{themeId\}/);
  assert.match(bookSource, /onLanguageChange=\{\(value\) => setLanguage\(resolveLanguage\(value\)\)\}/);
  assert.match(bookSource, /onThemeChange=\{changeTheme\}/);
  assert.match(introSource, /onChange=\{onLanguageChange\}/);
  assert.match(introSource, /onChange=\{onThemeChange\}/);
});

test('opening remains available during initialization and theme preload; keyboard trap includes dropdown triggers', () => {
  assert.match(introSource, /data-intro-open disabled=\{phase !== 'closed'\}/);
  assert.match(introSource, /\[data-intro-control\]:not\(:disabled\)/);
  assert.match(introSource, /busy=\{Boolean\(pendingTheme\)\}/);
});

test('standard controls mount only after the intro to avoid duplicate interactive chrome', () => {
  const postIntroBlocks = bookSource.match(/!introActive && \(/g) ?? [];
  assert.ok(postIntroBlocks.length >= 2, 'top controls and navigation are gated behind intro completion');
  assert.doesNotMatch(bookSource, /className=\{introStyles\.chrome\} inert=\{introActive\}/);
});

test('intro preference panel is responsive on mobile, landscape and short viewports', () => {
  assert.match(introCss, /\.preferences\s*\{/);
  assert.match(introCss, /grid-template-columns:\s*repeat\(2,/);
  assert.match(introCss, /@media \(max-width: 430px\)/);
  assert.match(introCss, /@media \(orientation: landscape\) and \(max-height: 520px\)/);
  assert.match(introCss, /@media \(max-height: 400px\)/);
  assert.match(introCss, /\.preferenceTrigger:focus-visible/);
});
