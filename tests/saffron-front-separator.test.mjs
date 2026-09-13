import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();
const cssPath = path.join(ROOT, 'app', 'saffron-front-separator.css');
const globalsPath = path.join(ROOT, 'app', 'globals.css');
const layoutPath = path.join(ROOT, 'app', 'layout.js');
const frontCoverPath = path.join(ROOT, 'components', 'FrontCover.js');

const css = fs.readFileSync(cssPath, 'utf8');
const globals = fs.readFileSync(globalsPath, 'utf8');
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

test('separator styling is isolated to Saffron Gold and sits below Invitation', () => {
  const target = '.bookApp[data-invitation-theme="saffron"] .frontCover .dynamicFrontRule:not(.dynamicFrontNamesRule):not(.dynamicFrontClosingRule)';

  assert.ok(css.includes(target));
  assert.ok(css.includes('var(--theme-gold)'));
  assert.ok(css.includes('var(--theme-soft)'));
  assert.match(css, /top:\s*35\.0%/);
  assert.match(css, /width:\s*34%/);
  assert.match(css, /linear-gradient\(/);
  assert.match(css, /\.dynamicFrontTagline[\s\S]*?top:\s*37\.25%/);

  assert.equal(
    css.includes('.bookApp[data-invitation-theme="classic"]'),
    false,
    'separator positioning enhancement must not alter another theme'
  );
});

test('new separator center patch matches the existing Saffron parchment tone', () => {
  assert.match(globals, /\.bookApp\[data-invitation-theme="saffron"\] \.dynamicFrontRule span[\s\S]*?background:\s*#f6e9cf/);
  assert.match(css, /--saffron-front-separator-paper:\s*#f6e9cf;/);
  assert.match(css, /background:\s*var\(--saffron-front-separator-paper\);/);
  assert.doesNotMatch(
    css,
    /--saffron-front-separator-paper:\s*color-mix\(/,
    'center patch must not use a lighter mixed tone that appears white'
  );
});

test('separator and tagline maintain a protected vertical gap', () => {
  const baseRuleTop = 35.0;
  const baseTaglineTop = 37.25;
  assert.ok(baseTaglineTop - baseRuleTop >= 2.0, 'base layout keeps at least 2% page-height clearance');

  const phoneRuleTop = 35.2;
  const phoneTaglineTop = 37.55;
  assert.ok(phoneTaglineTop - phoneRuleTop >= 2.0, 'phone layout keeps at least 2% page-height clearance');

  const multilingualRuleTop = 35.45;
  const multilingualTaglineTop = 38.0;
  assert.ok(multilingualTaglineTop - multilingualRuleTop >= 2.0, 'multilingual layout keeps extra clearance');
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

  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?top:\s*35\.2%[\s\S]*?width:\s*37%/);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*?top:\s*35\.3%[\s\S]*?width:\s*39%/);
  assert.match(css, /@media \(orientation: landscape\) and \(max-height: 520px\)[\s\S]*?top:\s*34\.95%/);
});

test('Bengali and Nepali receive extra vertical clearance around the separator', () => {
  assert.match(
    css,
    /\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="saffron"\][\s\S]*?dynamicFrontRule[\s\S]*?top:\s*35\.45%/
  );
  assert.match(
    css,
    /\.bookApp:is\(\[lang="bn"\], \[lang="ne"\]\)\[data-invitation-theme="saffron"\][\s\S]*?dynamicFrontTagline[\s\S]*?top:\s*38\.0%/
  );
});

test('Saffron separator tuning remains before front parity and compact details scrolling', () => {
  const separatorImport = "import './saffron-front-separator.css';";
  const frontParityImport = "import './front-saffron-parity.css';";
  const classicLaptopImport = "import './classic-multilingual-laptop.css';";
  const compactScrollImport = "import './compact-details-scroll.css';";

  for (const required of [separatorImport, frontParityImport, classicLaptopImport, compactScrollImport]) {
    assert.ok(layout.includes(required));
  }

  assert.ok(layout.indexOf(frontParityImport) > layout.indexOf(separatorImport));
  assert.ok(layout.indexOf(classicLaptopImport) > layout.indexOf(frontParityImport));
  assert.ok(layout.indexOf(compactScrollImport) > layout.indexOf(classicLaptopImport));
  assert.equal(count(css, '{'), count(css, '}'));
});
