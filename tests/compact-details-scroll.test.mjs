import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/compact-details-scroll.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');
const responsive = fs.readFileSync(new URL('../lib/responsive.mjs', import.meta.url), 'utf8');
const browserRegression = fs.readFileSync(new URL('../scripts/test-multilingual-browser.mjs', import.meta.url), 'utf8');
const front = fs.readFileSync(new URL('../components/FrontCover.js', import.meta.url), 'utf8');
const insideLeft = fs.readFileSync(new URL('../components/InsideLeft.js', import.meta.url), 'utf8');
const insideRight = fs.readFileSync(new URL('../components/InsideRight.js', import.meta.url), 'utf8');
const back = fs.readFileSync(new URL('../components/BackCover.js', import.meta.url), 'utf8');
const compactHook = fs.readFileSync(new URL('../components/useCompactScrollHint.js', import.meta.url), 'utf8');
const compactHint = fs.readFileSync(new URL('../components/CompactScrollHint.js', import.meta.url), 'utf8');
const translations = fs.readFileSync(new URL('../lib/translations.mjs', import.meta.url), 'utf8');

test('compact parchment scrolling covers all four pages strictly below 375px', () => {
  assert.match(css, /@media \(max-width: 374px\)/);
  assert.doesNotMatch(css, /@media \(max-width: 375px\)/);
  for (const selector of [
    '.bookStage.page-front .dynamicFrontCopy',
    '.bookStage.page-inside-left .familyBlessingsContent',
    '.bookStage.page-inside-right .receptionDetailsOverlay',
    '.bookStage.page-back .heritageBackContent'
  ]) assert.ok(css.includes(selector), `compact scrolling covers ${selector}`);
});

test('compact details scrollport allows only vertical scrolling and contains overscroll', () => {
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /overscroll-behavior-y:\s*contain/);
  assert.match(css, /-webkit-overflow-scrolling:\s*touch/);
  assert.match(css, /box-sizing:\s*border-box/);
});

test('compact page content stacks naturally instead of retaining overlap-prone absolute coordinates', () => {
  assert.match(css, /page-front[\s\S]*?dynamicFrontCopy > :is\([\s\S]*?position:\s*static\s*!important/);
  assert.match(css, /page-inside-left[\s\S]*?familyBlessingsContent > :is\([\s\S]*?position:\s*static\s*!important/);
  assert.match(css, /page-back[\s\S]*?heritageBackContent > :is\([\s\S]*?position:\s*static\s*!important/);
  assert.match(css, /receptionDetailsOverlay > \.receptionDetailItem[\s\S]*?flex:\s*0 0 auto/);
});

test('compact scroll CSS is loaded after existing responsive/theme overrides', () => {
  const featureImport = layout.indexOf("import './compact-details-scroll.css';");
  const viewportImport = layout.indexOf("import './viewport-validation-fixes.css';");
  const themeImport = layout.indexOf("import './front-saffron-parity.css';");
  assert.ok(featureImport > viewportImport);
  assert.ok(featureImport > themeImport);
});

test('responsive matrix covers both sides of the 375px boundary', () => {
  assert.match(responsive, /374x812/);
  assert.match(responsive, /375x812/);
});

test('browser regression validates scroll behavior, reachability and horizontal safety', () => {
  assert.match(browserRegression, /if \(width < 375\)/);
  assert.match(browserRegression, /scrollState\.overflowY, 'auto'/);
  assert.match(browserRegression, /scrollState\.overflowX, 'hidden'/);
  assert.match(browserRegression, /Array\(6\)\.fill\(/);
  assert.match(browserRegression, /stress\.overflow > 0/);
  assert.match(browserRegression, /stress\.reachedBottom/);
  assert.match(browserRegression, /stress\.horizontalOverflow <= 1/);
  assert.match(browserRegression, /width === 375/);
});

test('shared scroll hint is overflow-aware, dismisses at the bottom and is inert outside compact mode', () => {
  assert.match(compactHook, /scroller\.scrollHeight > scroller\.clientHeight \+ 1/);
  assert.match(compactHook, /scroller\.scrollTop \+ scroller\.clientHeight >= scroller\.scrollHeight - 2/);
  assert.match(compactHook, /dataset\.compactOverflow/);
  assert.match(compactHint, /className="compactScrollHint"/);
  assert.match(compactHint, /data-visible=\{visible \? 'true' : 'false'\}/);
  assert.match(css, /\.compactScrollHint\s*\{\s*display:\s*none/);
  assert.match(css, /@media \(max-width: 374px\)[\s\S]*?compactScrollHint[\s\S]*?display:\s*inline-flex/);
  assert.match(css, /compactScrollHint\[data-visible="true"\][\s\S]*?opacity:\s*1/);
  assert.match(browserRegression, /dataset\.visible === 'true'/);
  assert.match(browserRegression, /dataset\.visible === 'false'/);
  assert.match(browserRegression, /375px\/\$\{pageName\} must never show compact scroll guidance/);
});

test('all four pages expose the shared localized scroll guidance', () => {
  for (const source of [front, insideLeft, insideRight, back]) {
    assert.match(source, /data-compact-scroll-region=/);
    assert.match(source, /CompactScrollHint/);
    assert.match(source, /t\("Scroll for more"\)/);
  }
  assert.match(translations, /"Scroll for more":\s*"আরও দেখতে স্ক্রল করুন"/);
  assert.match(translations, /"Scroll for more":\s*"थप हेर्न स्क्रोल गर्नुहोस्"/);
});

test('clipped compact geometry is excluded from card-boundary false positives without hiding semantic overlap checks', () => {
  assert.match(browserRegression, /const compactScroller = innerWidth < 375/);
  assert.match(browserRegression, /compactScroller\.contains\(node\)/);
  assert.match(browserRegression, /compactScroller\.contains\(a\.element\)/);
  assert.match(browserRegression, /compactScroller\?\.matches\('\.receptionDetailsOverlay'\)/);
  assert.match(browserRegression, /stressSelector/);
  assert.match(browserRegression, /front: '\.dynamicFrontClosing'/);
  assert.match(browserRegression, /family: '\.familyBlessingsClosing'/);
  assert.match(browserRegression, /details: '\.receptionAddressValue'/);
  assert.match(browserRegression, /back: '\.heritageJourneyMessage'/);
});
