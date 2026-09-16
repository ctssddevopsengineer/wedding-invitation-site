import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/classic-multilingual-laptop.css', import.meta.url), 'utf8');

function ruleFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(escaped + '\\s*\\{([\\s\\S]*?)\\}'));
  assert.ok(match, `missing rule for ${selector}`);
  return match[1];
}

test('Classic reception readability changes stay scoped to laptop typography in every language', () => {
  assert.match(css, /@media \(min-width:\s*1024px\)/);

  const selectors = [
    '.bookApp[data-invitation-theme="classic"] .receptionDetailLabel',
    '.bookApp[data-invitation-theme="classic"] .receptionDetailValue',
    '.bookApp[data-invitation-theme="classic"] .receptionCalendarItem .btn',
    '.bookApp[data-invitation-theme="classic"] .receptionCountdownItem .countdownUnit strong',
    '.bookApp[data-invitation-theme="classic"] .receptionCountdownItem .countdownUnit span'
  ];

  for (const selector of selectors) {
    assert.ok(css.includes(`${selector} {`), `missing Classic laptop details selector: ${selector}`);
    assert.doesNotMatch(selector, /\[lang=/);
  }

  // The reception-details rules themselves remain typography-only even though
  // the shared Classic laptop stylesheet now also contains front/back sections.
  for (const selector of selectors) {
    const rule = ruleFor(selector);
    assert.doesNotMatch(rule, /(?:^|[;{]\s*)(?:top|left|right|bottom|width|height|position|transform|font-family)\s*:/);
  }
});

test('Classic laptop details retain readable minimum sizes despite generic important rules', () => {
  for (const [selector, minimum] of [
    ['.bookApp[data-invitation-theme="classic"] .receptionDetailLabel', '1rem'],
    ['.bookApp[data-invitation-theme="classic"] .receptionDetailValue', '1rem'],
    ['.bookApp[data-invitation-theme="classic"] .receptionCalendarItem .btn', '.8125rem'],
    ['.bookApp[data-invitation-theme="classic"] .receptionCountdownItem .countdownUnit strong', '1rem'],
    ['.bookApp[data-invitation-theme="classic"] .receptionCountdownItem .countdownUnit span', '.75rem']
  ]) {
    const rule = ruleFor(selector);
    assert.ok(
      rule.includes(`font-size: clamp(${minimum},`),
      `${selector} must preserve its readable minimum of ${minimum}`
    );
    assert.match(rule, /font-size:[^;]+!important;/);
  }
});
