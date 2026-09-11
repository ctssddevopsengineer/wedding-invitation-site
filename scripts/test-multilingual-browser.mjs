// Build first. Use BROWSER_ENGINE=chromium|firefox|webkit and optional BROWSER_CHANNEL=chrome|msedge.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { resolveBrowserTarget } from '../lib/browser-regression.mjs';
import { translate } from '../lib/locale.mjs';
import { RESPONSIVE_VALIDATION_VIEWPORTS } from '../lib/responsive.mjs';

const root = path.resolve('out');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const screenshots = process.env.SCREENSHOT_DIR;
const captureAllScreenshots = process.env.CAPTURE_ALL_SCREENSHOTS === 'true';
const maxFailureScreenshots = Math.max(0, Number.parseInt(process.env.MAX_FAILURE_SCREENSHOTS || '50', 10) || 0);
const validationViewports = process.env.BROWSER_VIEWPORTS
  ? process.env.BROWSER_VIEWPORTS.split(',').map(size => {
    const [width, height] = size.split('x').map(Number);
    if (!(width > 0 && height > 0)) throw new Error(`Invalid viewport: ${size}`);
    return { width, height };
  })
  : process.env.BROWSER_WIDTHS
    ? process.env.BROWSER_WIDTHS.split(',').map(Number).map(width => ({ width, height: 1100 }))
    : RESPONSIVE_VALIDATION_VIEWPORTS;
const browserTarget = resolveBrowserTarget();
const mobile = process.env.BROWSER_MOBILE === 'true';
const colorScheme = process.env.BROWSER_COLOR_SCHEME || 'light';
if (mobile && browserTarget.engine === 'firefox') throw new Error('Playwright mobile emulation requires Chromium or WebKit.');
const browserTypes = { chromium, firefox, webkit };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (basePath && !pathname.startsWith(basePath + '/')) { res.writeHead(404).end(); return; }
    pathname = pathname.slice(basePath.length);
    const file = path.resolve(root, `.${pathname.endsWith('/') ? pathname + 'index.html' : pathname}`);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=3600' }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}${basePath}/`;
const animationFreezeCss = '*, *::before, *::after { animation: none !important; transition: none !important; }';
let browser;
const launchBrowser = () => browserTypes[browserTarget.engine].launch({
  headless: true,
  ...(browserTarget.channel ? { channel: browserTarget.channel } : {})
});
try {
  browser = await launchBrowser();
  const errors = [];
  let checked = 0;
  let failureScreenshots = 0;
  const cachedSwitchTimes = [];
  if (screenshots) await fs.mkdir(screenshots, { recursive: true });
  console.log(`Running full responsive regression on ${browserTarget.label}.`);
  for (const { width, height } of validationViewports) {
    const context = await browser.newContext({
      viewport: { width, height },
      colorScheme,
      ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2.625 } : {})
    });
    // The existing QR service is external; only first-party requests are needed.
    await context.route('https://**', (route) => route.abort());
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url);
    await page.waitForSelector('main[data-theme-ready="true"]');
    await page.locator('[data-intro-skip]').click();
    await page.waitForSelector('[data-cinematic-intro="complete"]');
    await page.addStyleTag({ content: animationFreezeCss });
    if (mobile) {
      // A desktop context with a narrow viewport cannot detect missing mobile
      // viewport metadata: a real mobile context falls back to ~980 CSS pixels.
      assert.equal(await page.evaluate(() => innerWidth), width, 'Mobile layout must use the device width');
      assert.equal(await page.locator('meta[name="viewport"]').count(), 1);
      assert.doesNotMatch(await page.locator('meta[name="viewport"]').getAttribute('content'), /user-scalable=no|maximum-scale=1/);
      assert.equal(await page.locator('meta[name="color-scheme"]').getAttribute('content'), 'only light');
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'light only');
    }

    // WebKit intentionally rate-limits History API mutations. The app itself may also update
    // history after a synthetic popstate, so periodically start a fresh document before Safari's
    // 100-history-operations-per-10-seconds safety limit can be reached. This preserves the full
    // rendered matrix without weakening assertions or sleeping thousands of times.
    let webkitHistoryOps = 0;
    const navigateMatrixState = async (theme, pageName, language) => {
      const search = `?theme=${theme}&page=${pageName}&lang=${language}`;
      if (browserTarget.engine === 'webkit' && webkitHistoryOps >= 32) {
        await page.goto(`${url}${search}`);
        await page.waitForSelector(`main[data-theme-ready="true"][data-invitation-theme="${theme}"][lang="${language}"]`);
        const introComplete = page.locator('[data-cinematic-intro="complete"]');
        if (await introComplete.count() === 0) {
          const skip = page.locator('[data-intro-skip]');
          if (await skip.count()) await skip.click();
          await page.waitForSelector('[data-cinematic-intro="complete"]');
        }
        await page.addStyleTag({ content: animationFreezeCss });
        webkitHistoryOps = 0;
        return;
      }
      await page.evaluate((nextSearch) => {
        history.pushState({}, '', nextSearch);
        dispatchEvent(new PopStateEvent('popstate'));
      }, search);
      webkitHistoryOps++;
    };

    for (const theme of (process.env.BROWSER_THEMES || 'classic,blush,magenta,navy,plum,saffron').split(',')) {
      for (const language of ['en', 'bn', 'ne']) {
        for (const pageName of ['front', 'family', 'details', 'back']) {
          await navigateMatrixState(theme, pageName, language);
          await page.waitForSelector(`main[data-theme-ready="true"][data-invitation-theme="${theme}"][lang="${language}"]`);
          await page.waitForSelector(`.bookStage.page-${({ family: 'inside-left', details: 'inside-right' })[pageName] || pageName}`);
          await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))); });
          await page.locator('.invitePage img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
          assert.equal(await page.locator('html').getAttribute('lang'), language);
          assert.equal(await page.locator('#invitation-language-value').getAttribute('lang'), language);
          const issues = await page.evaluate(() => {
            const issues = [];
            const compactScroller = innerWidth < 375 && document.querySelector('[data-compact-scroll-region]');
            if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('horizontal page overflow: ' + [...document.querySelectorAll('body *')].filter(n => n.getBoundingClientRect().right > innerWidth + 2).slice(0, 5).map(n => n.className).join('/'));
            const card = document.querySelector('.invitePage').getBoundingClientRect();
            if (innerWidth < 375 && document.querySelector('.bookStage.page-front')) {
              const heading = document.querySelector('.dynamicFrontHeading')?.getBoundingClientRect();
              const theme = document.querySelector('main[data-invitation-theme]')?.dataset.invitationTheme;
              const minimumSafeRatio = ({ navy: 0.31, plum: 0.31, saffron: 0.25, classic: 0.24, blush: 0.24, magenta: 0.24 })[theme] ?? 0.24;
              const minimumSafeTop = card.top + card.height * minimumSafeRatio;
              if (heading?.height && heading.top < minimumSafeTop - 2) {
                issues.push('front heading enters crest/ornament safe zone');
              }
            }
            if (innerWidth < 375 && document.querySelector('.bookStage.page-inside-left')) {
              const heading = document.querySelector('#family-blessings-title')?.getBoundingClientRect();
              const minimumSafeTop = card.top + card.height * 0.27;
              if (heading?.height && heading.top < minimumSafeTop - 2) {
                issues.push('inside-left heading enters crest/bell safe zone');
              }
            }
            for (const node of document.querySelectorAll('.invitePage h1,.invitePage h2,.familyBlock,.heritageAssistance,.receptionDetailsOverlay')) {
              const box = node.getBoundingClientRect();
              const insideCompactScroller = compactScroller && compactScroller.contains(node);
              if (!insideCompactScroller && box.width && (box.left < card.left - 2 || box.right > card.right + 2 || box.bottom > card.bottom + 2)) issues.push(node.className || node.tagName);
            }
            for (const image of document.querySelectorAll('.invitePage picture img')) {
              // Every approved template has a same-geometry WebP companion.
              const expected = /(?:\/themes\/|\/images\/wedding-monogram\.png$)/.test(image.src) ? image.src.replace(/\.(?:png|jpe?g)$/, '.webp') : image.src;
              if (image.currentSrc !== expected || !image.naturalWidth) issues.push('artwork not optimized/loaded');
            }

            // Validate important layout zones using the boxes of visible semantic content. A flex
            // item can reserve more layout height than its painted children on a particular engine;
            // that allocation is not a visual collision. Below 375px the reception overlay is a
            // clipping scroll container, so off-screen countdown geometry must not be compared to
            // the independently positioned translated closing copy outside that scrollport.
            for (const [first, second] of [
              ['.heritageBackIntro', '.heritageCoupleNames'],
              ['.heritageCoupleNames', '.heritageJourneyMessage'],
              ['.heritageJourneyMessage', '.heritageAssistance'],
              ['.dynamicFrontHeading > span', '.dynamicFrontHeading > em'],
              ['.dynamicFrontTagline', '.dynamicFrontNames'],
              ['.dynamicFrontNames', '.dynamicFrontClosing'],
              ['.receptionCountdownItem .countdown', '.localizedDetailsClosing']
            ]) {
              if (compactScroller && compactScroller.matches('.receptionDetailsOverlay') && first === '.receptionCountdownItem .countdown' && second === '.localizedDetailsClosing') continue;
              const a = document.querySelector(first)?.getBoundingClientRect();
              const b = document.querySelector(second)?.getBoundingClientRect();
              if (a?.width && b?.width && a.bottom > b.top + 2) issues.push(`overlap: ${first}/${second}`);
            }

            // Back-cover copy uses deliberate stacked semantic blocks. Firefox on macOS reports
            // taller glyph-range rectangles for Bengali/Devanagari, so compare those blocks by
            // their actual element boxes rather than by font-engine-specific text ranges.
            const journeyLines = [...document.querySelectorAll('.heritageJourneyMessage > span')];
            for (let index = 0; index < journeyLines.length - 1; index++) {
              const a = journeyLines[index].getBoundingClientRect();
              const b = journeyLines[index + 1].getBoundingClientRect();
              if (a.width && b.width && a.bottom > b.top + 2) issues.push('overlap: .heritageJourneyMessage lines');
            }
            const assistanceHeading = document.querySelector('.heritageAssistance > h3')?.getBoundingClientRect();
            const contactGrid = document.querySelector('.heritageAssistance .contactGrid')?.getBoundingClientRect();
            if (assistanceHeading?.width && contactGrid?.width && assistanceHeading.bottom > contactGrid.top + 2) issues.push('overlap: .heritageAssistance heading/.contactGrid');
            for (const contactCard of document.querySelectorAll('.heritageAssistance .contactCard')) {
              const label = contactCard.querySelector('.label')?.getBoundingClientRect();
              const name = contactCard.querySelector('h3')?.getBoundingClientRect();
              const phone = contactCard.querySelector('a,.muted')?.getBoundingClientRect();
              if (label?.width && name?.width && label.bottom > name.top + 2) issues.push('overlap: .contactCard .label/h3');
              if (name?.width && phone?.width && name.bottom > phone.top + 2) issues.push('overlap: .contactCard h3/phone');
            }

            for (const item of document.querySelectorAll('.receptionDetailItem')) {
              const label = item.querySelector('.receptionDetailLabel')?.getBoundingClientRect();
              const value = item.querySelector('.receptionDetailValue')?.getBoundingClientRect();
              if (label?.width && value?.width && label.bottom > value.top + 1) issues.push('overlap: .receptionDetailLabel/.receptionDetailValue');
            }

            // Compare rendered text fragments for the rest of the card. Semantic zones above are
            // intentionally excluded because their element boxes are the cross-engine source of
            // truth; raw glyph-range metrics differ between Linux, Windows and macOS. Content
            // below a compact scrollport is intentionally clipped and reachable by scrolling, so
            // its off-screen range geometry is not a card-boundary violation.
            const semanticZones = '.dynamicFrontHeading,.dynamicFrontTagline,.dynamicFrontNames,.heritageBackIntro,.heritageCoupleNames,.heritageJourneyMessage,.heritageAssistance,.receptionDetailsOverlay,.localizedDetailsClosing';
            const walker = document.createTreeWalker(document.querySelector('.invitePage'), NodeFilter.SHOW_TEXT);
            const fragments = [];
            while (walker.nextNode()) {
              const node = walker.currentNode;
              if (!node.textContent.trim() || node.parentElement.closest('[aria-hidden="true"], .srOnly')) continue;
              const style = getComputedStyle(node.parentElement);
              if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue;
              const range = document.createRange(); range.selectNodeContents(node);
              for (const rect of range.getClientRects()) {
                if (rect.width && rect.height) fragments.push({ rect, node, element: node.parentElement, label: (node.parentElement.className || node.parentElement.tagName) + ':' + node.textContent.trim().slice(0, 35) });
              }
            }
            for (let i = 0; i < fragments.length; i++) {
              const a = fragments[i];
              const insideCompactScroller = compactScroller && compactScroller.contains(a.element);
              if (!insideCompactScroller && (a.rect.left < card.left - 2 || a.rect.right > card.right + 2 || a.rect.bottom > card.bottom + 2)) issues.push(`text outside card: ${a.label}`);
              for (const b of fragments.slice(i + 1)) {
                if (a.node === b.node) continue;
                if (a.element.closest(semanticZones) || b.element.closest(semanticZones)) continue;
                const overlapX = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
                const overlapY = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
                if (overlapX > 2 && overlapY > Math.min(a.rect.height, b.rect.height) * .25) issues.push(`text collision: ${a.label}/${b.label}`);
              }
            }
            return [...new Set(issues)];
          });
          if (issues.length && screenshots && failureScreenshots < maxFailureScreenshots) {
            await page.locator('.pageViewport').screenshot({ path: `${screenshots}/failure-${width}x${height}-${theme}-${language}-${pageName}.png` });
            failureScreenshots++;
          }
          if (issues.length) errors.push(`${width}x${height}/${theme}/${language}/${pageName}: ${issues.join(', ')}`);
          if (width <= 200 && pageName === 'front') {
            const frontFooter = await page.evaluate(() => {
              const scroller = document.querySelector('[data-compact-scroll-region="front"]')?.getBoundingClientRect();
              const button = document.querySelector('.frontCover .openButton')?.getBoundingClientRect();
              return scroller && button ? {
                clear: scroller.bottom <= button.top - 2,
                scrollerBottom: scroller.bottom,
                buttonTop: button.top
              } : null;
            });
            assert.ok(frontFooter, `${width}px front page must expose compact copy and Open Invitation control`);
            assert.equal(frontFooter.clear, true, `${width}px compact front copy must stay above Open Invitation`);
          }

          if (width <= 340) {
            const navLayout = await page.evaluate(() => {
              const previous = document.querySelector('.bookNav .navArrow:first-child')?.getBoundingClientRect();
              const next = document.querySelector('.bookNav .navArrow:last-child')?.getBoundingClientRect();
              const dots = document.querySelector('.bookNav .pageDots')?.getBoundingClientRect();
              const dotRects = [...document.querySelectorAll('.bookNav .pageDot')].map((node) => node.getBoundingClientRect());
              const intersects = (a, b) => Boolean(a && b && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1);
              return {
                previousDotsOverlap: intersects(previous, dots),
                nextDotsOverlap: intersects(next, dots),
                dotArrowOverlap: dotRects.some((dot) => intersects(dot, previous) || intersects(dot, next)),
                dotsInsideViewport: dots ? dots.left >= -1 && dots.right <= innerWidth + 1 : false,
                previousSize: previous ? { width: previous.width, height: previous.height } : null,
                nextSize: next ? { width: next.width, height: next.height } : null
              };
            });
            assert.equal(navLayout.previousDotsOverlap, false, `${width}px previous arrow must not overlap page dots`);
            assert.equal(navLayout.nextDotsOverlap, false, `${width}px next arrow must not overlap page dots`);
            assert.equal(navLayout.dotArrowOverlap, false, `${width}px page-dot touch targets must not overlap navigation arrows`);
            assert.equal(navLayout.dotsInsideViewport, true, `${width}px page dots must remain inside the wearable viewport`);
            assert.ok(navLayout.previousSize?.width >= 44 && navLayout.previousSize?.height >= 44, `${width}px previous arrow keeps a 44px touch target`);
            assert.ok(navLayout.nextSize?.width >= 44 && navLayout.nextSize?.height >= 44, `${width}px next arrow keeps a 44px touch target`);
          }


          {
            const scrollState = await page.evaluate(() => {
              const scroller = document.querySelector('[data-compact-scroll-region]');
              assertScroller(scroller);
              const style = getComputedStyle(scroller);
              const initialScrollTop = scroller.scrollTop;
              scroller.scrollTop = scroller.scrollHeight;
              const maxScrollTop = scroller.scrollTop;
              scroller.scrollTop = initialScrollTop;
              return {
                region: scroller.dataset.compactScrollRegion,
                overflowY: style.overflowY,
                overflowX: style.overflowX,
                overscrollBehaviorY: style.overscrollBehaviorY,
                clientHeight: scroller.clientHeight,
                scrollHeight: scroller.scrollHeight,
                clientWidth: scroller.clientWidth,
                scrollWidth: scroller.scrollWidth,
                maxScrollTop
              };

              function assertScroller(node) {
                if (!node) throw new Error('Active invitation page has no compact scroll region');
              }
            });

            assert.equal(
              scrollState.region,
              ({ front: 'front', family: 'inside-left', details: 'inside-right', back: 'back' })[pageName],
              `${pageName} exposes the expected compact scroll region`
            );

            if (width < 375) {
              assert.equal(scrollState.overflowY, 'auto', `${width}px/${pageName} must enable vertical parchment scrolling`);
              assert.equal(scrollState.overflowX, 'hidden', `${width}px/${pageName} must never scroll horizontally`);
              assert.equal(scrollState.overscrollBehaviorY, 'contain', `${width}px/${pageName} scrolling must not chain into the page`);
              assert.ok(scrollState.scrollWidth <= scrollState.clientWidth + 1, `${width}px/${pageName} scrollport has horizontal overflow`);

              // Stress representative compact widths across every theme/language/page state.
              // Normal content may fit and should not show a false hint; the stress fixture
              // deliberately proves overflow, reachability and hint dismissal.
              if ([320, 360, 374].includes(width)) {
                const stressSelector = ({
                  front: '.dynamicFrontClosing',
                  family: '.familyBlessingsClosing',
                  details: '.receptionAddressValue',
                  back: '.heritageJourneyMessage'
                })[pageName];

                const originalHtml = await page.locator(stressSelector).evaluate((node) => node.innerHTML);
                await page.evaluate(({ selector }) => {
                  const scroller = document.querySelector('[data-compact-scroll-region]');
                  const target = document.querySelector(selector);
                  target.textContent = Array(8).fill('Long multilingual invitation content for compact parchment scrolling and overlap regression validation.').join(' ');

                  // Text wrapping varies legitimately by theme, script and browser engine. Add a
                  // deterministic temporary block after the stressed content so every compact page
                  // is guaranteed to exercise real vertical overflow and the overflow-aware hint.
                  const spacer = document.createElement('div');
                  spacer.dataset.compactScrollStressSpacer = 'true';
                  spacer.setAttribute('aria-hidden', 'true');
                  spacer.style.height = `${scroller.clientHeight + 160}px`;
                  spacer.style.width = '1px';
                  spacer.style.flex = '0 0 auto';
                  spacer.style.pointerEvents = 'none';
                  scroller.appendChild(spacer);

                  scroller.scrollTop = 0;
                  window.dispatchEvent(new Event('resize'));
                }, { selector: stressSelector });

                await page.waitForFunction(
                  () => {
                    const scroller = document.querySelector('[data-compact-scroll-region]');
                    const hint = document.querySelector('.compactScrollHint');
                    return scroller?.dataset.compactOverflow === 'true' && hint?.dataset.visible === 'true';
                  },
                  null,
                  { timeout: 5000 }
                );

                const stress = await page.evaluate(() => {
                  const scroller = document.querySelector('[data-compact-scroll-region]');
                  const hint = document.querySelector('.compactScrollHint');
                  const overflow = scroller.scrollHeight - scroller.clientHeight;
                  const horizontalOverflow = scroller.scrollWidth - scroller.clientWidth;
                  const hintText = hint?.textContent?.replace(/\s+/g, ' ').trim() || '';
                  scroller.scrollTop = scroller.scrollHeight;
                  scroller.dispatchEvent(new Event('scroll'));
                  const reachedBottom = scroller.scrollTop > 0;
                  return { overflow, horizontalOverflow, reachedBottom, hintText };
                });

                assert.ok(stress.overflow > 0, `${width}px/${pageName} long content must produce vertical scroll overflow`);
                assert.ok(stress.reachedBottom, `${width}px/${pageName} content must be reachable by scrolling`);
                assert.ok(stress.horizontalOverflow <= 1, `${width}px/${pageName} long content must not create horizontal scrolling`);
                assert.ok(stress.hintText.length > 1, `${width}px/${pageName} overflow hint must expose localized guidance`);

                await page.waitForFunction(
                  () => document.querySelector('.compactScrollHint')?.dataset.visible === 'false',
                  null,
                  { timeout: 5000 }
                );
                await page.locator(stressSelector).evaluate((node, html) => { node.innerHTML = html; }, originalHtml);
                await page.evaluate(() => {
                  const scroller = document.querySelector('[data-compact-scroll-region]');
                  scroller.querySelector('[data-compact-scroll-stress-spacer]')?.remove();
                  scroller.scrollTop = 0;
                  window.dispatchEvent(new Event('resize'));
                });
              }
            } else if (width === 375) {
              assert.notEqual(scrollState.overflowY, 'auto', `375px/${pageName} must retain the fixed-layout boundary`);
              assert.equal(
                await page.locator('.compactScrollHint').evaluate((node) => getComputedStyle(node).display),
                'none',
                `375px/${pageName} must never show compact scroll guidance`
              );
            }
          }

          if (pageName === 'details' && language !== 'en') {
            // Browser regression validates the already-rendered static artifact. A production-style
            // build has a concrete reception date, so assert localized numerals directly instead
            // of consulting the fresh checkout's placeholder event configuration.
            const dateText = await page.locator('.receptionDetailValue').first().innerText();
            assert.match(dateText, language === 'bn' ? /[০-৯]/ : /[०-९]/);
            assert.doesNotMatch(dateText, /Sunday|February|January|Monday/);
          }
          if (pageName === 'front') assert.equal(await page.locator('.openButton span').first().innerText(), translate(language, 'Open Invitation'));
          if (pageName === 'family') assert.equal(await page.locator('#family-blessings-title').innerText(), translate(language, 'With the Blessings of Our Families'));
          if (captureAllScreenshots && screenshots) await page.locator('.pageViewport').screenshot({ path: `${screenshots}/${width}x${height}-${theme}-${language}-${pageName}.png` });
          checked++;
          if (checked % 72 === 0) console.log(`Checked ${checked} card renders on ${browserTarget.label}; ${errors.length} issues recorded.`);
        }
      }
    }
    await page.goto(`${url}?theme=blush&page=details&lang=bn`);
    await page.waitForSelector('main[lang="bn"]');
    await page.locator('.languageDropdownTrigger').click();
    await page.locator('[role="option"][lang="ne"]').click();
    await page.waitForURL(/lang=ne/);
    assert.match(page.url(), /theme=blush/); assert.match(page.url(), /page=details/);
    await page.reload(); await page.waitForSelector('main[lang="ne"]');
    await page.goto(url); await page.waitForSelector('main[lang="ne"]');
    // QR/NFC must retain language and intentionally point at the front cover.
    await page.locator('.qrNfcSummary').click();
    const entry = new URL(await page.locator('.entryUrlPreview').innerText());
    assert.equal(entry.searchParams.get('lang'), 'ne'); assert.equal(entry.searchParams.get('page'), 'front');
    // Copy must include language immediately after changing it, independent of URL effects.
    await page.evaluate(() => { window.copiedInvitation = ''; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.copiedInvitation = value; } } }); });
    await page.locator('.smartSharePanel .experienceButton').nth(1).click();
    assert.equal(new URL(await page.evaluate(() => window.copiedInvitation)).searchParams.get('lang'), 'ne');
    // Browser history updates all three state dimensions together.
    await page.evaluate(() => { history.pushState({}, '', '?theme=plum&page=family&lang=bn'); dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForSelector('main[data-invitation-theme="plum"][lang="bn"] .familyBlessingsTemplate');
    // Rapid successive selections must settle on the last request.
    await page.locator('.themeOption').nth(2).dispatchEvent('click');
    await page.locator('.themeOption').nth(3).dispatchEvent('click');
    await page.locator('.themeOption').nth(5).dispatchEvent('click');
    await page.waitForSelector('main[data-invitation-theme="saffron"][aria-busy="false"]');
    for (let round = 0; round < 2; round++) {
      for (const [index, theme] of ['classic', 'blush', 'magenta', 'navy', 'plum', 'saffron'].entries()) {
        const elapsed = await page.evaluate(({ index, theme }) => new Promise((resolve, reject) => {
          const main = document.querySelector('main');
          if (main.dataset.invitationTheme === theme) { resolve(0); return; }
          const start = performance.now();
          const timer = setTimeout(() => { observer.disconnect(); reject(new Error('Theme selection stalled')); }, 15000);
          const observer = new MutationObserver(() => {
            if (main.dataset.invitationTheme === theme && main.getAttribute('aria-busy') === 'false') {
              clearTimeout(timer); observer.disconnect(); resolve(performance.now() - start);
            }
          });
          observer.observe(main, { attributes: true });
          document.querySelectorAll('.themeOption')[index].click();
        }), { index, theme });
        if (round === 1) cachedSwitchTimes.push(elapsed);
      }
    }
    if (process.env.REPORT_PATH) await fs.writeFile(process.env.REPORT_PATH, JSON.stringify({ browser: browserTarget, checked, viewports: validationViewports, failureScreenshots, errors }, null, 2));
    if (browserTarget.engine === 'webkit') {
      // macOS WebKit can segfault tearing down successive contexts in one
      // long-lived process. Finish each fully checked viewport by retiring the
      // process, then start fresh. Assertions and browser errors still fail.
      await browser.close();
      browser = await launchBrowser();
    } else {
      await context.close();
    }
  }
  const fallbackContext = await browser.newContext();
  await fallbackContext.route('https://**', (route) => route.abort());
  await fallbackContext.route('**/*.webp', (route) => route.abort());
  await fallbackContext.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
  });
  const fallbackPage = await fallbackContext.newPage();
  fallbackPage.on('pageerror', (error) => errors.push(error.message));
  await fallbackPage.goto(`${url}?theme=blush&page=details&lang=bn`);
  await fallbackPage.waitForSelector('main[lang="bn"][data-theme-ready="true"]');
  await fallbackPage.waitForFunction(() => [...document.querySelectorAll('.invitePage picture img')].every((image) => image.complete && image.naturalWidth && image.currentSrc.endsWith('.png')));
  await fallbackPage.locator('.exactLocationHotspot').click();
  await fallbackPage.locator('.languageDropdownTrigger').click();
  await fallbackPage.locator('[role="option"][lang="ne"]').click();
  await fallbackPage.waitForURL(/lang=ne/);
  assert.equal(new URL(fallbackPage.url()).searchParams.get('page'), 'location');
  assert.equal(await fallbackPage.locator('.exactLocationHotspot').getAttribute('aria-expanded'), 'true');
  await fallbackPage.keyboard.press('Escape');
  assert.equal(await fallbackPage.locator('.exactLocationHotspot').getAttribute('aria-expanded'), 'false');
  await fallbackContext.close();
  if (process.env.REPORT_PATH) await fs.writeFile(process.env.REPORT_PATH, JSON.stringify({ browser: browserTarget, checked, viewports: validationViewports, failureScreenshots, errors }, null, 2));
  assert.deepEqual(errors, []);
  cachedSwitchTimes.sort((a, b) => a - b);
  console.log(`Cached theme selection median: ${cachedSwitchTimes[Math.floor(cachedSwitchTimes.length / 2)].toFixed(1)} ms (${browserTarget.label}; excludes the existing decorative transition).`);
  console.log(`Passed ${checked} theme/page/language/viewport renders on ${browserTarget.label}, persistence, copy/QR links, browser history, rapid theme switching, blocked storage, image fallback and location state; no browser errors.`);
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
