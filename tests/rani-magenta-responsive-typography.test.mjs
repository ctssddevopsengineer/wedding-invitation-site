import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/rani-magenta-responsive-typography.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Rani Magenta responsive typography is theme-scoped and begins at 681px', () => {
  assert.match(css, /@media \(min-width:\s*681px\)/);
  assert.match(css, /@media \(min-width:\s*1024px\)/);
  assert.match(css, /data-invitation-theme="magenta"/);
  assert.doesNotMatch(css, /data-invitation-theme="(?:classic|blush|navy|plum|saffron)"/);
});

test('Rani Magenta 681px+ typography covers all four invitation pages', () => {
  for (const selector of [
    '.dynamicFrontHeading > span',
    '.dynamicFrontHeading > em',
    '.dynamicFrontTagline',
    '.dynamicFrontNames',
    '.dynamicFrontClosing',
    '.familyBlessingsIntro h2',
    '.familyBlessingsIntro p',
    '.familyCoupleNames',
    '.familyBlock h3',
    '.familyBlock p',
    '.familyBlessingsClosing',
    '.insideRightDynamicTitle',
    '.receptionDetailLabel',
    '.receptionDetailValue',
    '.receptionAddressValue',
    '.receptionCalendarItem .btn',
    '.receptionCountdownItem .countdownUnit strong',
    '.receptionCountdownItem .countdownUnit span',
    '.heritageBackIntro h2',
    '.heritageBackMessage',
    '.heritageCoupleNames',
    '.heritageJourneyMessage',
    '.heritageAssistance > h3',
    '.heritageAssistance .contactCard .eyebrow'
  ]) {
    assert.ok(css.includes(selector), `Rani Magenta responsive typography must cover ${selector}`);
  }
});

test('Rani Magenta back page has a tablet-specific typography fit without moving artwork zones', () => {
  assert.match(css, /@media \(min-width:\s*681px\) and \(max-width:\s*1023px\)/);
  assert.match(
    css,
    /\.heritageBackIntro h2\s*\{[\s\S]*?font-size:\s*clamp\(18px, 2\.55cqw, 28px\)\s*!important/
  );
  assert.match(
    css,
    /\[lang="en"\][\s\S]*?\.heritageCoupleNames\s*\{[\s\S]*?font-size:\s*clamp\(22px, 3\.55cqw, 34px\)\s*!important/
  );
  assert.match(
    css,
    /:is\(\[lang="bn"\], \[lang="ne"\]\)[\s\S]*?\.heritageCoupleNames\s*\{[\s\S]*?font-size:\s*clamp\(20px, 3\.2cqw, 31px\)\s*!important/
  );
});

test('Rani Magenta English back cover keeps a conservative cross-platform desktop fit', () => {
  assert.match(
    css,
    /@media \(min-width:\s*1024px\)[\s\S]*?\.heritageBackIntro h2\s*\{[\s\S]*?font-size:\s*clamp\(24px, 2\.85cqw, 36px\)\s*!important/
  );
  assert.match(
    css,
    /@media \(min-width:\s*1024px\)[\s\S]*?\.heritageBackMessage\s*\{[\s\S]*?font-size:\s*clamp\(14px, 1\.5cqw, 19px\)\s*!important/
  );
  assert.match(
    css,
    /@media \(min-width:\s*1024px\)[\s\S]*?\[lang="en"\][\s\S]*?\.heritageCoupleNames\s*\{[\s\S]*?font-size:\s*clamp\(28px, 3\.95cqw, 48px\)\s*!important[\s\S]*?line-height:\s*1;/
  );
});

test('Rani Magenta keeps native-script-specific name treatment for Bengali and Nepali', () => {
  assert.match(css, /:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="magenta"\][\s\S]*?dynamicFrontNames/);
  assert.match(css, /:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="magenta"\][\s\S]*?familyCoupleNames/);
  assert.match(css, /:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="magenta"\][\s\S]*?heritageCoupleNames/);
});

test('Rani Magenta typography layer never changes established artwork geometry', () => {
  const declarations = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\n/)
    .map((line) => line.trim());

  for (const forbidden of [
    'top:', 'left:', 'right:', 'bottom:', 'width:', 'height:',
    'max-width:', 'max-height:', 'min-width:', 'min-height:',
    'position:', 'transform:', 'aspect-ratio:', 'object-fit:',
    'margin:', 'padding:', 'overflow:'
  ]) {
    assert.equal(
      declarations.some((line) => line.startsWith(forbidden)),
      false,
      `Rani Magenta typography layer must not alter geometry with ${forbidden}`
    );
  }
});

test('Rani Magenta typography loads after earlier shared theme layers and before compact scrolling', () => {
  const blush = layout.indexOf("import './blush-responsive-typography.css';");
  const magenta = layout.indexOf("import './rani-magenta-responsive-typography.css';");
  const compact = layout.indexOf("import './compact-details-scroll.css';");

  assert.ok(blush >= 0);
  assert.ok(magenta > blush);
  assert.ok(compact > magenta);
});
