import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/blush-compact-polish.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Baby Pink compact polish loads after viewport validation fixes', () => {
  const viewportFixes = layout.indexOf("import './viewport-validation-fixes.css';");
  const blushPolish = layout.indexOf("import './blush-compact-polish.css';");
  assert.ok(viewportFixes >= 0, 'viewport validation stylesheet must be loaded');
  assert.ok(blushPolish > viewportFixes, 'Baby Pink polish must be the final targeted override');
});

test('Baby Pink front separators match the compact Inside Left visual scale', () => {
  assert.match(css, /data-invitation-theme="blush"\] \.frontCover \.dynamicFrontRule\s*\{[\s\S]*?display:\s*flex\s*!important/);
  assert.match(css, /\.dynamicFrontRule::before,[\s\S]*?\.dynamicFrontRule::after\s*\{[\s\S]*?content:\s*''[\s\S]*?height:\s*1px/);
  assert.match(css, /\.dynamicFrontRule\s*\{[\s\S]*?width:\s*46%\s*!important/);
  assert.match(css, /\.dynamicFrontNamesRule,[\s\S]*?\.dynamicFrontClosingRule\s*\{[\s\S]*?width:\s*46%\s*!important/);
  assert.match(css, /\.dynamicFrontRule > span\s*\{[\s\S]*?font-size:\s*\.68em/);
  assert.doesNotMatch(css, /width:\s*(?:68|70|72)%\s*!important/, 'front divider must not return to the oversized width');
});

test('Baby Pink front separators stay compact on phone viewports', () => {
  assert.match(
    css,
    /@media \(max-width: 430px\)[\s\S]*?\.dynamicFrontRule,[\s\S]*?\.dynamicFrontNamesRule,[\s\S]*?\.dynamicFrontClosingRule\s*\{[\s\S]*?width:\s*44%\s*!important/
  );
});

test('Baby Pink details reserve safe compact-phone clearance above the location medallion', () => {
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?data-invitation-theme="blush"\] \.receptionDetailsOverlay\s*\{[\s\S]*?top:\s*22\.2%\s*!important[\s\S]*?height:\s*44\.35%\s*!important[\s\S]*?justify-content:\s*space-between/);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*?data-invitation-theme="blush"\] \.receptionDetailsOverlay\s*\{[\s\S]*?height:\s*43\.9%\s*!important/);
  assert.match(css, /data-invitation-theme="blush"\] \.receptionCountdownItem\s*\{[\s\S]*?translateY\(-1\.1cqw\)/);
});

test('Baby Pink compact fix does not move the Location Map medallion or shrink details typography', () => {
  assert.doesNotMatch(css, /exactLocationHotspot\s*\{/);
  assert.doesNotMatch(
    css,
    /(?:receptionDetailsOverlay|receptionDetailLabel|receptionDetailValue|receptionAddressValue|receptionCalendarItem|receptionCountdownItem|insideRightDynamicTitle)[^{]*\{[^}]*font-size\s*:/s,
    'compact Page 3 polish must not reduce reception/detail typography'
  );
  assert.doesNotMatch(css, /insideRightArtwork|coverArtwork\s*\{/);
});
