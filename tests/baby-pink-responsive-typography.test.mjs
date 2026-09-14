import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/blush-responsive-typography.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Baby Pink responsive typography is isolated to blush and starts at 681px', () => {
  assert.match(css, /@media \(min-width:\s*681px\)/);
  assert.match(css, /@media \(min-width:\s*1024px\)/);
  assert.match(css, /data-invitation-theme="blush"/);
  assert.doesNotMatch(css, /data-invitation-theme="(?:classic|magenta|navy|plum|saffron)"/);
});

test('Baby Pink 681px+ typography covers all four pages', () => {
  for (const selector of [
    '.dynamicFrontHeading > span',
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
    assert.ok(css.includes(selector), `Baby Pink responsive typography must cover ${selector}`);
  }
});

test('Baby Pink front has readable laptop typography and deliberate content spacing in every language', () => {
  assert.match(
    css,
    /\.dynamicFrontHeading > span\s*\{[\s\S]*?font-size:\s*clamp\(46px, 7\.8cqw, 68px\)\s*!important/
  );
  assert.match(
    css,
    /\.dynamicFrontHeading > em\s*\{[\s\S]*?font-size:\s*clamp\(30px, 5\.5cqw, 44px\)\s*!important/
  );
  assert.match(
    css,
    /\.dynamicFrontTagline\s*\{[\s\S]*?font-size:\s*clamp\(20px, 2\.8cqw, 26px\)\s*!important/
  );
  assert.match(
    css,
    /\[lang="en"\][\s\S]*?\.dynamicFrontNames\s*\{[\s\S]*?font-size:\s*clamp\(40px, 6\.5cqw, 58px\)\s*!important/
  );
  assert.match(
    css,
    /:is\(\[lang="bn"\], \[lang="ne"\]\)[\s\S]*?\.dynamicFrontNames\s*\{[\s\S]*?font-size:\s*clamp\(38px, 5\.8cqw, 54px\)\s*!important/
  );
  assert.match(
    css,
    /\.dynamicFrontClosing\s*\{[\s\S]*?font-size:\s*clamp\(18px, 2\.2cqw, 23px\)\s*!important/
  );
  assert.match(css, /\.dynamicFrontMonogram\s*\{[\s\S]*?margin-bottom:\s*clamp\(16px, 1\.8cqw, 24px\)/);
  assert.match(css, /\.dynamicFrontRule\s*\{[\s\S]*?margin:\s*clamp\(14px, 1\.8cqw, 22px\) auto/);
});

test('Baby Pink Bengali and Nepali inside-left closing blessing is laptop-readable over artwork', () => {
  assert.match(css, /@media \(min-width:\s*1024px\)/);
  assert.match(
    css,
    /:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="blush"\][\s\S]*?\.familyBlessingsClosing\s*\{[\s\S]*?font-size:\s*clamp\(18px, 1\.8cqw, 24px\)\s*!important/
  );
  assert.match(
    css,
    /\.familyBlessingsClosing\s*\{[\s\S]*?font-weight:\s*700;[\s\S]*?line-height:\s*1\.5;[\s\S]*?text-shadow:/
  );
  assert.match(
    css,
    /color:\s*color-mix\(in srgb, var\(--theme-ink\) 88%, #2b1820 12%\)\s*!important/
  );
});

test('Baby Pink keeps native-script-specific name treatment for Bengali and Nepali', () => {
  assert.match(css, /:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="blush"\][\s\S]*?dynamicFrontNames/);
  assert.match(css, /:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="blush"\][\s\S]*?familyCoupleNames/);
  assert.match(css, /:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="blush"\][\s\S]*?heritageCoupleNames/);
});

test('Baby Pink responsive typography never changes established artwork geometry', () => {
  const declarations = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\n/)
    .map((line) => line.trim());

  for (const forbidden of [
    'top:', 'left:', 'right:', 'bottom:', 'width:', 'height:',
    'max-width:', 'max-height:', 'min-width:', 'min-height:',
    'position:', 'transform:', 'aspect-ratio:', 'object-fit:',
    'padding:', 'overflow:'
  ]) {
    assert.equal(
      declarations.some((line) => line.startsWith(forbidden)),
      false,
      `Baby Pink typography layer must not alter geometry with ${forbidden}`
    );
  }
});

test('Baby Pink responsive typography loads after shared parity layers and before compact scrolling', () => {
  const parity = layout.indexOf("import './front-saffron-parity.css';");
  const classic = layout.indexOf("import './classic-multilingual-laptop.css';");
  const blush = layout.indexOf("import './blush-responsive-typography.css';");
  const compact = layout.indexOf("import './compact-details-scroll.css';");

  assert.ok(parity >= 0);
  assert.ok(classic > parity);
  assert.ok(blush > classic);
  assert.ok(compact > blush);
});
