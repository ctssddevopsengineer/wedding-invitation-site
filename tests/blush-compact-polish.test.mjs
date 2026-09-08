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

test('Baby Pink front separators render symmetric gold lines around the ornament', () => {
  assert.match(css, /data-invitation-theme="blush"\] \.frontCover \.dynamicFrontRule\s*\{[\s\S]*?display:\s*flex\s*!important/);
  assert.match(css, /\.dynamicFrontRule::before,[\s\S]*?\.dynamicFrontRule::after\s*\{[\s\S]*?content:\s*''[\s\S]*?height:\s*1px/);
  assert.match(css, /\.dynamicFrontNamesRule\s*\{[\s\S]*?width:\s*72%\s*!important/);
  assert.match(css, /\.dynamicFrontClosingRule\s*\{[\s\S]*?width:\s*68%\s*!important/);
});

test('Baby Pink details reserve safe compact-phone clearance above the location medallion', () => {
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?data-invitation-theme="blush"\] \.receptionDetailsOverlay\s*\{[\s\S]*?top:\s*22\.2%\s*!important[\s\S]*?height:\s*44\.35%\s*!important[\s\S]*?justify-content:\s*space-between/);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*?data-invitation-theme="blush"\] \.receptionDetailsOverlay\s*\{[\s\S]*?height:\s*43\.9%\s*!important/);
  assert.match(css, /data-invitation-theme="blush"\] \.receptionCountdownItem\s*\{[\s\S]*?translateY\(-1\.1cqw\)/);
});

test('Baby Pink compact fix does not move the Location Map medallion or shrink typography', () => {
  assert.doesNotMatch(css, /exactLocationHotspot\s*\{/);
  assert.doesNotMatch(css, /font-size\s*:/);
  assert.doesNotMatch(css, /insideRightArtwork|coverArtwork\s*\{/);
});
