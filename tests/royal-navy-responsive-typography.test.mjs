import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/royal-navy-responsive-typography.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');

test('Royal Navy responsive typography is theme-scoped from 681px upward', () => {
  assert.match(css, /@media \(min-width:\s*681px\)/);
  assert.match(css, /@media \(min-width:\s*1024px\)/);
  assert.match(css, /data-invitation-theme="navy"/);
  assert.doesNotMatch(css, /data-invitation-theme="(?:classic|blush|magenta|plum|saffron)"/);
});

test('Royal Navy responsive typography covers all four pages', () => {
  for (const selector of [
    '.dynamicFrontHeading > span','.dynamicFrontHeading > em','.dynamicFrontTagline','.dynamicFrontNames','.dynamicFrontClosing',
    '.familyBlessingsIntro h2','.familyBlessingsIntro p','.familyCoupleNames','.familyBlock h3','.familyBlock p','.familyBlessingsClosing',
    '.insideRightDynamicTitle','.receptionDetailLabel','.receptionDetailValue','.receptionAddressValue',
    '.receptionCalendarItem .btn','.receptionCountdownItem .countdownUnit strong','.receptionCountdownItem .countdownUnit span',
    '.heritageBackIntro h2','.heritageBackMessage','.heritageCoupleNames','.heritageJourneyMessage',
    '.heritageAssistance > h3','.heritageAssistance .contactCard .eyebrow'
  ]) assert.ok(css.includes(selector), `missing Royal Navy selector ${selector}`);
});

test('Royal Navy native-script names have dedicated Bengali/Nepali treatment', () => {
  assert.match(css, /:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="navy"\][\s\S]*?dynamicFrontNames/);
  assert.match(css, /:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="navy"\][\s\S]*?familyCoupleNames/);
  assert.match(css, /:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="navy"\][\s\S]*?heritageCoupleNames/);
});

test('Royal Navy typography layer does not alter artwork geometry', () => {
  const declarations = css.replace(/\/\*[\s\S]*?\*\//g,'').split(/\n/).map(line=>line.trim());
  for (const forbidden of ['top:','left:','right:','bottom:','width:','height:','max-width:','max-height:','min-width:','min-height:','position:','transform:','aspect-ratio:','object-fit:','margin:','padding:','overflow:']) {
    assert.equal(declarations.some(line=>line.startsWith(forbidden)),false,`Royal Navy typography must not use ${forbidden}`);
  }
});

test('Royal Navy typography loads after prior theme layers and before compact scrolling', () => {
  const magenta=layout.indexOf("import './rani-magenta-responsive-typography.css';");
  const navy=layout.indexOf("import './royal-navy-responsive-typography.css';");
  const compact=layout.indexOf("import './compact-details-scroll.css';");
  assert.ok(magenta>=0 && navy>magenta && compact>navy);
});
