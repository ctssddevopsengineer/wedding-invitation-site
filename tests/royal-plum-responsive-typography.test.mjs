import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/royal-plum-responsive-typography.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Royal Plum responsive typography is theme-scoped from 681px upward', () => {
  assert.match(css, /@media \(min-width:\s*681px\)/);
  assert.match(css, /@media \(min-width:\s*1024px\)/);
  assert.match(css, /data-invitation-theme="plum"/);
  assert.doesNotMatch(css, /data-invitation-theme="(?:classic|blush|magenta|plum|saffron)"/);
});

test('Royal Plum responsive typography covers all four pages', () => {
  for (const selector of [
    '.dynamicFrontHeading > span','.dynamicFrontHeading > em','.dynamicFrontTagline','.dynamicFrontNames','.dynamicFrontClosing',
    '.familyBlessingsIntro h2','.familyBlessingsIntro p','.familyCoupleNames','.familyBlock h3','.familyBlock p','.familyBlessingsClosing',
    '.insideRightDynamicTitle','.receptionDetailLabel','.receptionDetailValue','.receptionAddressValue',
    '.receptionCalendarItem .btn','.receptionCountdownItem .countdownUnit strong','.receptionCountdownItem .countdownUnit span',
    '.heritageBackIntro h2','.heritageBackMessage','.heritageCoupleNames','.heritageJourneyMessage',
    '.heritageAssistance > h3','.heritageAssistance .contactCard .eyebrow'
  ]) assert.ok(css.includes(selector), `missing Royal Plum selector ${selector}`);
});

test('Royal Plum back page has a tablet-specific fit without moving artwork', () => {
  assert.match(css, /@media \(min-width:\s*681px\) and \(max-width:\s*1023px\)/);
  assert.match(css, /\.heritageBackIntro h2\s*\{[\s\S]*?font-size:\s*clamp\(18px, 2\.45cqw, 27px\)\s*!important/);
  assert.match(css, /\[lang="en"\][\s\S]*?\.heritageCoupleNames\s*\{[\s\S]*?font-size:\s*clamp\(22px, 3\.45cqw, 33px\)\s*!important/);
  assert.match(css, /:is\(\[lang="bn"\], \[lang="ne"\]\)[\s\S]*?\.heritageCoupleNames\s*\{[\s\S]*?font-size:\s*clamp\(20px, 3\.1cqw, 30px\)\s*!important/);
});

test('Royal Plum native-script names have dedicated Bengali/Nepali treatment', () => {
  assert.match(css, /:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="plum"\][\s\S]*?dynamicFrontNames/);
  assert.match(css, /:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="plum"\][\s\S]*?familyCoupleNames/);
  assert.match(css, /:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="plum"\][\s\S]*?heritageCoupleNames/);
});

test('Royal Plum typography layer does not alter artwork geometry', () => {
  const declarations = css.replace(/\/\*[\s\S]*?\*\//g,'').split(/\n/).map(line=>line.trim());
  for (const forbidden of ['top:','left:','right:','bottom:','width:','height:','max-width:','max-height:','min-width:','min-height:','position:','transform:','aspect-ratio:','object-fit:','margin:','padding:','overflow:']) {
    assert.equal(declarations.some(line=>line.startsWith(forbidden)),false,`Royal Plum typography must not use ${forbidden}`);
  }
});

test('Royal Plum typography loads after prior theme layers and before compact scrolling', () => {
  const magenta=layout.indexOf("import './rani-magenta-responsive-typography.css';");
  const navy=layout.indexOf("import './royal-plum-responsive-typography.css';");
  const compact=layout.indexOf("import './compact-details-scroll.css';");
  assert.ok(magenta>=0 && navy>magenta && compact>navy);
});
