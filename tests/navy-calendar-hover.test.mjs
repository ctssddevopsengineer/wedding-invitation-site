import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/mobile-overlap-fixes.css', import.meta.url), 'utf8');
const calendar = fs.readFileSync(new URL('../components/CalendarButtons.js', import.meta.url), 'utf8');

function blockFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `Missing CSS block for ${selector}`);
  return match[1];
}

test('calendar component exposes both Royal Navy hover targets', () => {
  assert.match(calendar, /className="btn btnGold"[\s\S]*?Google Calendar/);
  assert.match(calendar, /className="btn btnGhost"[\s\S]*?Apple \/ Outlook/);
});

test('Royal Navy calendar buttons receive a visible hover and keyboard-focus highlight', () => {
  const hoverSelector = '.bookApp[data-invitation-theme="navy"] .receptionCalendarItem .btn:hover,\n.bookApp[data-invitation-theme="navy"] .receptionCalendarItem .btn:focus-visible';
  const block = blockFor(hoverSelector);

  assert.match(block, /background:\s*linear-gradient\(135deg, #1d4f7e, #092845\)\s*!important/);
  assert.match(block, /border-color:\s*#d6ad55\s*!important/);
  assert.match(block, /color:\s*#fffdf4\s*!important/);
  assert.match(block, /box-shadow:[\s\S]*?rgba\(214, 173, 85, \.34\)[\s\S]*?rgba\(7, 28, 50, \.28\)/);
  assert.match(block, /transform:\s*translateY\(-1px\)/);
});

test('Royal Navy hover treatment changes only interaction styling, not button geometry', () => {
  const hoverSelector = '.bookApp[data-invitation-theme="navy"] .receptionCalendarItem .btn:hover,\n.bookApp[data-invitation-theme="navy"] .receptionCalendarItem .btn:focus-visible';
  const block = blockFor(hoverSelector);

  for (const property of ['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding', 'position']) {
    assert.doesNotMatch(block, new RegExp(`(^|[;\\s])${property}\\s*:`, 'm'));
  }
});
