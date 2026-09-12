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

test('compact page scrollports allow only vertical scrolling and contain overscroll', () => {
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

test('compact front preserves theme-specific crest and ornament safe zones', () => {
  assert.match(css, /--compact-front-safe-top, 25%/);
  assert.match(css, /data-invitation-theme="classic"[\s\S]*?--compact-front-safe-top:\s*25%/);
  assert.match(css, /data-invitation-theme="blush"[\s\S]*?--compact-front-safe-top:\s*25%/);
  assert.match(css, /data-invitation-theme="magenta"[\s\S]*?--compact-front-safe-top:\s*25%/);
  assert.match(css, /data-invitation-theme="saffron"[\s\S]*?--compact-front-safe-top:\s*26%/);
  assert.match(css, /data-invitation-theme="navy"[\s\S]*?data-invitation-theme="plum"[\s\S]*?--compact-front-safe-top:\s*32%/);
  assert.match(css, /\.weddingMonogramSpacer[\s\S]*?display:\s*none\s*!important/);
  assert.match(browserRegression, /front heading enters crest\/ornament safe zone/);
  assert.match(browserRegression, /navy:\s*0\.31/);
  assert.match(browserRegression, /saffron:\s*0\.25/);
});

test('compact front keeps all three ornaments attached to their separators', () => {
  assert.match(css, /page-front \.dynamicFrontRule\s*\{[\s\S]*?display:\s*flex\s*!important[\s\S]*?align-items:\s*center[\s\S]*?justify-content:\s*center/);
  assert.match(css, /page-front \.dynamicFrontRule > span\s*\{[\s\S]*?position:\s*static\s*!important[\s\S]*?transform:\s*none\s*!important/);
  assert.match(browserRegression, /front must render exactly three intended separators/);
  assert.match(browserRegression, /compact front ornament must stay attached to its separator/);
  assert.match(browserRegression, /front separator \$\{index \+ 1\} ornament must remain horizontally centred/);
});

test('Saffron inside-right uses readable natural spacing below 375px', () => {
  assert.match(css, /data-invitation-theme="saffron"[\s\S]*?page-inside-right \.receptionDetailsOverlay[\s\S]*?gap:\s*\.32rem\s*!important/);
  assert.match(css, /data-invitation-theme="saffron"[\s\S]*?receptionDetailLabel[\s\S]*?margin-bottom:\s*\.16rem/);
  assert.match(css, /data-invitation-theme="saffron"[\s\S]*?receptionDetailDivider[\s\S]*?width:\s*38%[\s\S]*?margin-block:\s*\.02rem\s*!important/);
  assert.match(css, /data-invitation-theme="saffron"[\s\S]*?receptionCalendarItem \.actionRow,[\s\S]*?receptionCountdownItem \.countdown[\s\S]*?margin-top:\s*\.22rem/);
  assert.match(browserRegression, /details must keep readable vertical rhythm/);
  assert.match(browserRegression, /detail groups must remain visibly separated/);
  assert.match(browserRegression, /labels need breathing room above values/);
});

test('Baby Pink inside-right uses readable natural spacing below 375px', () => {
  assert.match(css, /data-invitation-theme="blush"[\s\S]*?page-inside-right \.receptionDetailsOverlay[\s\S]*?gap:\s*\.34rem\s*!important/);
  assert.match(css, /data-invitation-theme="blush"[\s\S]*?receptionDetailLabel[\s\S]*?margin-bottom:\s*\.18rem/);
  assert.match(css, /data-invitation-theme="blush"[\s\S]*?receptionDetailDivider[\s\S]*?width:\s*40%[\s\S]*?margin-block:\s*\.03rem\s*!important/);
  assert.match(css, /data-invitation-theme="blush"[\s\S]*?receptionCalendarItem \.actionRow,[\s\S]*?receptionCountdownItem \.countdown[\s\S]*?margin-top:\s*\.24rem/);
  assert.match(browserRegression, /\['saffron', 'blush'\]\.includes\(theme\)/);
  assert.match(browserRegression, /details must keep readable vertical rhythm/);
  assert.match(browserRegression, /detail groups must remain visibly separated/);
  assert.match(browserRegression, /labels need breathing room above values/);
});

test('compact inside-left preserves the crest and bell artwork safe zone', () => {
  assert.match(css, /page-inside-left \.familyBlessingsContent[\s\S]*?inset:\s*28% 8% 5%\s*!important/);
  assert.match(browserRegression, /inside-left heading enters crest\/bell safe zone/);
  assert.match(browserRegression, /card\.height \* 0\.27/);
});

test('responsive matrix covers both sides of the 375px boundary', () => {
  assert.match(responsive, /374x812/);
  assert.match(responsive, /375x812/);
});

test('browser regression validates scroll behavior, reachability and horizontal safety', () => {
  assert.match(browserRegression, /if \(width < 375\)/);
  assert.match(browserRegression, /scrollState\.overflowY, 'auto'/);
  assert.match(browserRegression, /scrollState\.overflowX, 'hidden'/);
  assert.match(browserRegression, /Array\(8\)\.fill\(/);
  assert.match(browserRegression, /compactScrollStressSpacer/);
  assert.match(browserRegression, /scroller\.clientHeight \+ 160/);
  assert.match(browserRegression, /dataset\.compactOverflow === 'true'/);
  assert.match(browserRegression, /timeout:\s*5000/);
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

test('localized closing copy uses semantic line boxes instead of cross-engine glyph ranges', () => {
  assert.match(browserRegression, /\.dynamicFrontClosing/);
  assert.match(browserRegression, /\.familyBlessingsClosing/);
  assert.match(browserRegression, /getBoundingClientRect\(\)/);
  assert.match(browserRegression, /overlap: \$\{selector\} line/);
  assert.match(browserRegression, /semanticZones = '[^']*\.dynamicFrontClosing[^']*\.familyBlessingsClosing/);
});
test('clipped compact geometry is excluded from card-boundary false positives without hiding semantic overlap checks', () => {
  assert.match(browserRegression, /const compactScroller = innerWidth < 375/);
  assert.match(browserRegression, /compactScroller\.contains\(node\)/);
  assert.match(browserRegression, /compactScroller\.contains\(a\.element\)/);
  assert.match(browserRegression, /compactScroller && compactScroller\.matches\('\.receptionDetailsOverlay'\)/);
  assert.match(browserRegression, /stressSelector/);
  assert.match(browserRegression, /front: '\.dynamicFrontClosing'/);
  assert.match(browserRegression, /family: '\.familyBlessingsClosing'/);
  assert.match(browserRegression, /details: '\.receptionAddressValue'/);
  assert.match(browserRegression, /back: '\.heritageJourneyMessage'/);
});
