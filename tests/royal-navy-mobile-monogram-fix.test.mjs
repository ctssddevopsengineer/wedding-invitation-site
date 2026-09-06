import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/royal-navy-mobile-monogram-fix.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Royal Navy mobile monogram clearance stylesheet loads after overlap fixes', () => {
  assert.match(
    layout,
    /import '\.\/mobile-overlap-fixes\.css';\s*\nimport '\.\/royal-navy-mobile-monogram-fix\.css';/
  );
});

test('Royal Navy mobile inside-right monogram stays centred and clears the flower', () => {
  assert.match(
    css,
    /@media \(max-width: 680px\)[\s\S]*?data-invitation-theme="navy"\] \.insideRightThemeMonogram\s*\{[\s\S]*?left:\s*50%\s*!important[\s\S]*?top:\s*4\.35%\s*!important[\s\S]*?width:\s*15\.4%\s*!important[\s\S]*?max-height:\s*7\.0%\s*!important[\s\S]*?transform:\s*translateX\(-50%\)\s*!important/
  );
});

test('Royal Navy Samsung A55-class monogram keeps extra flower clearance', () => {
  assert.match(
    css,
    /@media \(min-width: 361px\) and \(max-width: 430px\)[\s\S]*?data-invitation-theme="navy"\] \.insideRightThemeMonogram\s*\{[\s\S]*?top:\s*4\.45%\s*!important[\s\S]*?width:\s*15\.6%\s*!important/
  );
});

test('Royal Navy narrow-phone monogram remains centred below the flower', () => {
  assert.match(
    css,
    /@media \(max-width: 360px\)[\s\S]*?data-invitation-theme="navy"\] \.insideRightThemeMonogram\s*\{[\s\S]*?top:\s*4\.5%\s*!important[\s\S]*?width:\s*15\.8%\s*!important/
  );
});
