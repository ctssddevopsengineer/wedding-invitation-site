import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/compact-details-scroll.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');
const responsive = fs.readFileSync(new URL('../lib/responsive.mjs', import.meta.url), 'utf8');
const browserRegression = fs.readFileSync(new URL('../scripts/test-multilingual-browser.mjs', import.meta.url), 'utf8');
const insideRight = fs.readFileSync(new URL('../components/InsideRight.js', import.meta.url), 'utf8');
const translations = fs.readFileSync(new URL('../lib/translations.mjs', import.meta.url), 'utf8');

test('compact inside-right scrolling is scoped strictly below 375px', () => {
  assert.match(css, /@media \(max-width: 374px\)/);
  assert.doesNotMatch(css, /@media \(max-width: 375px\)/);
  assert.match(css, /\.bookStage\.page-inside-right \.receptionDetailsOverlay\s*\{/);
  assert.doesNotMatch(css, /\.bookStage\.page-(?:front|inside-left|back) \.receptionDetailsOverlay/);
});

test('compact details scrollport allows only vertical scrolling and contains overscroll', () => {
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /overscroll-behavior-y:\s*contain/);
  assert.match(css, /-webkit-overflow-scrolling:\s*touch/);
  assert.match(css, /box-sizing:\s*border-box/);
});

test('compact details children cannot flex-shrink into overlapping text', () => {
  assert.match(css, /\.receptionDetailsOverlay > \.receptionDetailItem[\s\S]*?\.receptionDetailsOverlay > \.receptionDetailDivider[\s\S]*?flex:\s*0 0 auto/);
  assert.match(css, /justify-content:\s*flex-start\s*!important/);
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

test('scroll hint is overflow-aware, dismisses at the bottom and is inert outside compact mode', () => {
  assert.match(insideRight, /detailsScrollRef/);
  assert.match(insideRight, /overlay\.scrollHeight > overlay\.clientHeight \+ 1/);
  assert.match(insideRight, /overlay\.scrollTop \+ overlay\.clientHeight >= overlay\.scrollHeight - 2/);
  assert.match(insideRight, /className="compactScrollHint"/);
  assert.match(insideRight, /data-visible=\{showScrollHint \? 'true' : 'false'\}/);
  assert.match(css, /\.compactScrollHint\s*\{\s*display:\s*none/);
  assert.match(css, /@media \(max-width: 374px\)[\s\S]*?\.compactScrollHint[\s\S]*?display:\s*inline-flex/);
  assert.match(css, /\.compactScrollHint\[data-visible="true"\][\s\S]*?opacity:\s*1/);
  assert.match(browserRegression, /dataset\.visible === 'true'/);
  assert.match(browserRegression, /dataset\.visible === 'false'/);
  assert.match(browserRegression, /375px must never show compact scroll guidance/);
});

test('scroll guidance is localized in Bengali and Nepali', () => {
  assert.match(insideRight, /t\("Scroll for more"\)/);
  assert.match(translations, /"Scroll for more":\s*"আরও দেখতে স্ক্রল করুন"/);
  assert.match(translations, /"Scroll for more":\s*"थप हेर्न स्क्रोल गर्नुहोस्"/);
});

test('clipped compact details geometry is not misreported as overlap with outside parchment copy', () => {
  assert.match(browserRegression, /compactDetailsScroller && first === '\.receptionCountdownItem \.countdown' && second === '\.localizedDetailsClosing'/);
  assert.match(browserRegression, /insideCompactDetailsScroller/);
  assert.match(browserRegression, /!insideCompactDetailsScroller &&/);
});
