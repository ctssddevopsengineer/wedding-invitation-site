import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();
const cssPath = path.join(ROOT, 'app', 'saffron-front-separator.css');
const layoutPath = path.join(ROOT, 'app', 'layout.js');
const frontCoverPath = path.join(ROOT, 'components', 'FrontCover.js');

const css = fs.readFileSync(cssPath, 'utf8');
const layout = fs.readFileSync(layoutPath, 'utf8');
const frontCover = fs.readFileSync(frontCoverPath, 'utf8');

function count(source, token) {
  return source.split(token).length - 1;
}

test('FrontCover renders the decorative rule between heading and cultural tagline', () => {
  const headingIndex = frontCover.indexOf('className="dynamicFrontHeading"');
  const firstRuleIndex = frontCover.indexOf('className="dynamicFrontRule"');
  const taglineIndex = frontCover.indexOf('className="dynamicFrontTagline"');

  assert.ok(headingIndex >= 0, 'front heading exists');
  assert.ok(firstRuleIndex > headingIndex, 'first decorative rule follows the heading');
  assert.ok(taglineIndex > firstRuleIndex, 'cultural tagline follows the decorative rule');
  assert.match(frontCover, /dynamicFrontRule[^\n]*aria-hidden="true"[^>]*><span>✥<\/span>/);
});

test('separator styling is isolated to Saffron Gold and only targets the heading-to-tagline rule', () => {
  const target = '.bookApp[data-invitation-theme="saffron"] .frontCover .dynamicFrontRule:not(.dynamicFrontNamesRule):not(.dynamicFrontClosingRule)';

  assert.ok(css.includes(target));
  assert.ok(css.includes('var(--theme-gold)'));
  assert.ok(css.includes('var(--theme-soft)'));
  assert.match(css, /top:\s*33\.55%/);
  assert.match(css, /width:\s*34%/);
  assert.match(css, /linear-gradient\(/);
  assert.match(css, /\.dynamicFrontTagline[\s\S]*?top:\s*35\.85%/);

  assert.equal(
    css.includes('.bookApp[data-invitation-theme="classic"]'),
    false,
    'separator enhancement must not alter another theme'
  );
});

test('existing couple-name and closing separators remain independently addressed', () => {
  assert.match(frontCover, /dynamicFrontRule dynamicFrontNamesRule/);
  assert.match(frontCover, /dynamicFrontRule dynamicFrontClosingRule/);
  assert.match(css, /:not\(\.dynamicFrontNamesRule\):not\(\.dynamicFrontClosingRule\)/);
});

test('separator spacing is hardened for tablet, phone, narrow phone and short landscape', () => {
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /@media \(orientation: landscape\) and \(max-height: 520px\)/);

  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?top:\s*33\.72%[\s\S]*?width:\s*37%/);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*?width:\s*39%/);
});

test('Bengali and Nepali receive extra vertical clearance around the separator', () => {
  assert.match(
    css,
    /\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="saffron"\][\s\S]*?dynamicFrontRule[\s\S]*?top:\s*34\.0%/
  );
  assert.match(
    css,
    /\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="saffron"\][\s\S]*?dynamicFrontTagline[\s\S]*?top:\s*36\.45%/
  );
});

test('front separator stylesheet is loaded last and contains balanced CSS blocks', () => {
  const separatorImport = "import './saffron-front-separator.css';";
  assert.ok(layout.includes(separatorImport));

  const importLines = layout.split('\n').filter((line) => line.startsWith("import './"));
  assert.equal(importLines.at(-1), separatorImport);
  assert.equal(count(css, '{'), count(css, '}'));
});
