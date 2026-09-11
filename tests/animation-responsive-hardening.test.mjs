import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const introCss = fs.readFileSync(new URL('../components/CinematicIntro.module.css', import.meta.url), 'utf8');
const entranceCss = fs.readFileSync(new URL('../components/WeddingEntrance.module.css', import.meta.url), 'utf8');
const musicCss = fs.readFileSync(new URL('../components/MusicControl.module.css', import.meta.url), 'utf8');

test('cinematic intro is width-safe and keeps the seal centered', () => {
  assert.doesNotMatch(introCss, /min-width:\s*320px/);
  assert.match(introCss, /overflow-x:\s*hidden/);
  assert.match(introCss, /\.seal\s*\{[\s\S]*?left:\s*50%[\s\S]*?translate3d\(-50%,\s*-50%,\s*0\)/);
  assert.match(introCss, /max-width:\s*calc\(100vw\s*-\s*40px\)/);
});

test('intro text keeps readable floors and transparent text surfaces', () => {
  assert.match(introCss, /\.eyebrow\s*\{[^}]*font-size:\s*clamp\(\.75rem,/s);
  assert.match(introCss, /\.heading \.names\s*\{[^}]*font-size:\s*clamp\(\.95rem,/s);
  assert.match(introCss, /\.hint\s*\{[^}]*font-size:\s*\.8rem/s);
  assert.match(introCss, /\.open, \.skip, \.replay\s*\{[\s\S]*?background:\s*transparent/);
});

test('couple scene has explicit phone and landscape hardening without tiny caption text', () => {
  assert.match(entranceCss, /@media \(max-width:\s*680px\)/);
  assert.match(entranceCss, /@media \(max-width:\s*430px\)/);
  assert.match(entranceCss, /@media \(orientation:\s*landscape\) and \(max-height:\s*430px\)/);
  assert.match(entranceCss, /\.caption p\s*\{[^}]*font-size:\s*clamp\(\.75rem,/s);
  assert.match(entranceCss, /will-change:\s*transform,\s*opacity/);
});

test('watch-class couple scene stays below the measured caption', () => {
  assert.match(entranceCss, /@media \(max-width:\s*200px\) and \(max-height:\s*260px\)/);
  assert.match(entranceCss, /top:\s*calc\(var\(--caption-bottom,\s*118px\) \+ 10px\)/);
  assert.match(entranceCss, /\.person\s*\{[\s\S]*?width:\s*auto[\s\S]*?aspect-ratio:\s*2 \/ 3/);
  assert.match(entranceCss, /\.groom\s*\{[\s\S]*?right:\s*calc\(50% - 3px\)[\s\S]*?aspect-ratio:\s*7 \/ 10/);
  assert.match(entranceCss, /\.bride\s*\{[\s\S]*?left:\s*calc\(50% - 3px\)[\s\S]*?aspect-ratio:\s*2 \/ 3/);
});

test('watch-class closed intro fits controls without horizontal overflow', () => {
  assert.match(introCss, /@media \(max-width:\s*200px\) and \(max-height:\s*260px\)/);
  assert.match(introCss, /padding:\s*52px 6px 6px/);
  assert.match(introCss, /overlay\[data-cinematic-intro='closed'\] \.heading[\s\S]*?display:\s*none/);
  assert.match(introCss, /\.preferences[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(introCss, /\.preferenceTrigger[\s\S]*?min-height:\s*44px/);
  assert.match(introCss, /\.open[\s\S]*?min-height:\s*44px/);
  assert.match(musicCss, /@media \(max-width:\s*200px\) and \(max-height:\s*260px\)[\s\S]*?left:\s*max\(6px/);
});

test('music control stays clear of the page navigation without changing page dots', () => {
  assert.match(musicCss, /bottom:\s*max\(86px,/);
  assert.match(musicCss, /background:\s*transparent/);
  assert.match(musicCss, /min-height:\s*44px/);
});
