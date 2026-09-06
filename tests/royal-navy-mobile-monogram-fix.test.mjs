import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/royal-navy-mobile-monogram-fix.css', import.meta.url), 'utf8');
const globals = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Royal Navy mobile monogram override loads after overlap fixes', () => {
  assert.match(layout, /import '\.\/mobile-overlap-fixes\.css';\s*\nimport '\.\/royal-navy-mobile-monogram-fix\.css';/);
});

test('Royal Navy desktop monogram uses the approved exact-centre geometry', () => {
  assert.match(
    globals,
    /data-invitation-theme="navy"\] \.insideRightThemeMonogram\s*\{[\s\S]*?top:\s*1\.85%[\s\S]*?left:\s*50%[\s\S]*?width:\s*13\.6%[\s\S]*?transform:\s*translateX\(-50%\)/
  );
});

test('Royal Navy mobile copies desktop horizontal geometry and changes only vertical placement', () => {
  assert.match(
    css,
    /@media \(max-width: 680px\)[\s\S]*?data-invitation-theme="navy"\] \.insideRightThemeMonogram\s*\{[\s\S]*?left:\s*50%\s*!important[\s\S]*?right:\s*auto\s*!important[\s\S]*?top:\s*4\.35%\s*!important[\s\S]*?width:\s*13\.6%\s*!important[\s\S]*?transform:\s*translateX\(-50%\)\s*!important/
  );
  assert.doesNotMatch(css, /translateX\(calc\(-50%/);
});

test('Royal Navy Samsung A55-class override changes only top and keeps desktop width', () => {
  const match = css.match(/@media \(min-width: 361px\) and \(max-width: 430px\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(match, 'expected Samsung A55-class media query');
  assert.match(match[1], /top:\s*4\.45%\s*!important/);
  assert.doesNotMatch(match[1], /width\s*:/);
  assert.doesNotMatch(match[1], /left\s*:/);
  assert.doesNotMatch(match[1], /transform\s*:/);
});

test('Royal Navy narrow-phone override changes only top and keeps desktop width', () => {
  const match = css.match(/@media \(max-width: 360px\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(match, 'expected narrow-phone media query');
  assert.match(match[1], /top:\s*4\.5%\s*!important/);
  assert.doesNotMatch(match[1], /width\s*:/);
  assert.doesNotMatch(match[1], /left\s*:/);
  assert.doesNotMatch(match[1], /transform\s*:/);
});
