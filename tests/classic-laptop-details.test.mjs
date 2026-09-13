import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/classic-multilingual-laptop.css', import.meta.url), 'utf8');
const laptop = css.split('@media (min-width: 1024px) {')[1];

test('Classic reception readability changes stay scoped to laptop typography in every language', () => {
  assert.ok(laptop);
  const selectors = [...laptop.matchAll(/([^{}]+)\{/g)].map(match => match[1].trim());
  assert.equal(selectors.length, 5);
  for (const selector of selectors) {
    assert.ok(selector.startsWith('.bookApp[data-invitation-theme="classic"] .reception'));
    assert.doesNotMatch(selector, /\[lang=/);
  }
  assert.doesNotMatch(laptop, /(?:^|[;{]\s*)(?:top|left|width|height|position|transform|font-family)\s*:/);
});

test('Classic laptop details retain readable minimum sizes despite generic important rules', () => {
  for (const [selector, minimum] of [
    ['receptionDetailLabel', '1rem'], ['receptionDetailValue', '1rem'],
    ['receptionCalendarItem .btn', '.8125rem'],
    ['receptionCountdownItem .countdownUnit strong', '1rem'],
    ['receptionCountdownItem .countdownUnit span', '.75rem']
  ]) {
    const rule = laptop.slice(laptop.indexOf(`.${selector} {`)).split('}')[0];
    assert.ok(rule.includes(`font-size: clamp(${minimum},`));
    assert.match(rule, /font-size:[^;]+!important;/);
  }
});
