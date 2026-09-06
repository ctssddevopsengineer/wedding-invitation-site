import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/mobile-overlap-fixes.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

function blockFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `Missing CSS block for ${selector}`);
  return match[1];
}

test('mobile overlap stylesheet loads after typography hardening', () => {
  assert.match(
    layout,
    /import '\.\/device-hardening\.css';\s*\nimport '\.\/mobile-overlap-fixes\.css';/
  );
});

test('Saffron Gold applies optical centering and stronger contrast on every viewport', () => {
  assert.match(
    css,
    /\.bookApp\[data-invitation-theme="saffron"\] :is\(\.insideRightThemeMonogram\)\s*\{[\s\S]*?left:\s*51\.5%\s*!important[\s\S]*?right:\s*auto\s*!important[\s\S]*?transform:\s*translateX\(-50%\)\s*!important[\s\S]*?filter:\s*contrast\(1\.32\) saturate\(1\.12\) drop-shadow\(0 0 \.9px rgba\(63, 34, 8, \.68\)\)/
  );

  const allViewportRule = css.match(/\.bookApp\[data-invitation-theme="saffron"\] :is\(\.insideRightThemeMonogram\)\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  for (const property of ['width', 'height', 'top', 'bottom', 'margin', 'padding', 'object-fit']) {
    assert.doesNotMatch(allViewportRule, new RegExp(`(^|[;\\s])${property}\\s*:`, 'm'));
  }
});

test('Saffron Gold lowers only the reception-details overlay without resizing it', () => {
  const allViewportDetails = css.match(/\.bookApp\[data-invitation-theme="saffron"\] :is\(\.receptionDetailsOverlay\)\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  assert.match(allViewportDetails, /transform:\s*translateY\(\.8cqw\)/);
  for (const property of ['width', 'height', 'left', 'right', 'top', 'bottom', 'margin', 'padding']) {
    assert.doesNotMatch(allViewportDetails, new RegExp(`(^|[;\\s])${property}\\s*:`, 'm'));
  }
});

test('Baby Pink front uses a non-colliding three-part couple-name layout on phones', () => {
  const block = blockFor('.bookApp[data-invitation-theme="blush"] .dynamicFrontNames');
  assert.match(block, /display:\s*grid\s*!important/);
  assert.match(block, /grid-template-columns:\s*max-content auto max-content/);
  assert.match(block, /justify-content:\s*center/);
  assert.match(block, /white-space:\s*nowrap/);
  assert.match(block, /font-size:\s*clamp\(/);
});

test('Royal Plum page-3 monogram is locked to the exact horizontal centre on mobile', () => {
  const block = blockFor('.bookApp[data-invitation-theme="plum"] .insideRightThemeMonogram');
  assert.match(block, /left:\s*50%\s*!important/);
  assert.match(block, /right:\s*auto\s*!important/);
  assert.match(block, /transform:\s*translateX\(-50%\)\s*!important/);
  assert.match(block, /object-position:\s*center/);
});

test('Royal Plum page-3 location label is centred inside the medallion on mobile', () => {
  const block = blockFor('.bookApp[data-invitation-theme="plum"] .insideRightDynamicLocationLabel');
  assert.match(block, /left:\s*50%\s*!important/);
  assert.match(block, /right:\s*auto\s*!important/);
  assert.match(block, /transform:\s*translateX\(-50%\)\s*!important/);
  assert.match(block, /text-align:\s*center/);
  assert.match(block, /justify-content:\s*center/);
  assert.match(block, /align-items:\s*center/);
});

test('Saffron Gold visually centres the ampersand while keeping mobile title/details protected', () => {
  const monogram = blockFor('.bookApp[data-invitation-theme="saffron"] .insideRightThemeMonogram');
  const title = blockFor('.bookApp[data-invitation-theme="saffron"] .insideRightDynamicTitle');
  const details = blockFor('.bookApp[data-invitation-theme="saffron"] .receptionDetailsOverlay');

  assert.match(monogram, /top:\s*5\.55%\s*!important/);
  assert.match(monogram, /left:\s*51\.5%\s*!important/);
  assert.match(monogram, /right:\s*auto\s*!important/);
  assert.match(monogram, /transform:\s*translateX\(-50%\)\s*!important/);
  assert.match(title, /top:\s*14\.65%\s*!important/);
  assert.match(title, /font-size:\s*clamp\(\.96rem, 4\.2cqw, 1\.95rem\)/);
  assert.match(details, /top:\s*23\.55%\s*!important/);
  assert.match(details, /height:\s*46\.6%\s*!important/);
  assert.match(details, /justify-content:\s*space-between/);
});

test('Royal Navy page-3 monogram clears the top flower and stays centred on mobile', () => {
  const block = blockFor('.bookApp[data-invitation-theme="navy"] .insideRightThemeMonogram');
  assert.match(block, /top:\s*5\.1%\s*!important/);
  assert.match(block, /left:\s*50%\s*!important/);
  assert.match(block, /right:\s*auto\s*!important/);
  assert.match(block, /transform:\s*translateX\(-50%\)\s*!important/);
});

test('Deep Red countdown receives its own protected mobile vertical space', () => {
  const details = blockFor('.bookApp[data-invitation-theme="classic"] .receptionDetailsOverlay');
  const countdown = blockFor('.bookApp[data-invitation-theme="classic"] .receptionCountdownItem');

  assert.match(details, /height:\s*44\.35%\s*!important/);
  assert.match(details, /justify-content:\s*space-between/);
  assert.match(countdown, /translateY\(-\.55cqw\)/);
});

test('Samsung A55-class width band has dedicated compact-phone safeguards', () => {
  assert.match(css, /@media \(min-width: 361px\) and \(max-width: 430px\)/);
  assert.match(css, /data-invitation-theme="blush"\][\s\S]*?font-size:\s*clamp\(\.84rem, 3\.55cqw, 1\.45rem\)/);
  assert.match(css, /data-invitation-theme="saffron"\][\s\S]*?left:\s*51\.5%\s*!important/);
  assert.match(css, /data-invitation-theme="saffron"\][\s\S]*?top:\s*5\.75%\s*!important/);
  assert.match(css, /data-invitation-theme="saffron"\][\s\S]*?top:\s*14\.8%\s*!important/);
  assert.match(css, /data-invitation-theme="saffron"\][\s\S]*?transform:\s*translateY\(\.8cqw\)/);
  assert.match(css, /data-invitation-theme="navy"\][\s\S]*?top:\s*5\.3%\s*!important/);
  assert.match(css, /data-invitation-theme="classic"\][\s\S]*?top:\s*22\.05%\s*!important/);
});
