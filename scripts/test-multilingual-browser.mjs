// Build first. Run with BROWSER_CHANNEL=chrome to use an installed Chrome.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { translate } from '../lib/locale.mjs';
import { RESPONSIVE_VALIDATION_VIEWPORTS } from '../lib/responsive.mjs';
import { EVENT } from '../lib/event.mjs';

const root = path.resolve('out');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const screenshots = process.env.SCREENSHOT_DIR;
const validationViewports = process.env.BROWSER_WIDTHS ? process.env.BROWSER_WIDTHS.split(',').map(Number).map(width => ({ width, height: 1100 })) : RESPONSIVE_VALIDATION_VIEWPORTS;
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
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
  const errors = [];
  let checked = 0;
  const cachedSwitchTimes = [];
  if (screenshots) await fs.mkdir(screenshots, { recursive: true });
  for (const { width, height } of validationViewports) {
    const context = await browser.newContext({ viewport: { width, height } });
    // The existing QR service is external; only first-party requests are needed.
    await context.route('https://**', (route) => route.abort());
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url);
    await page.waitForSelector('main[data-theme-ready="true"]');
    await page.locator('[data-intro-skip]').click();
    await page.waitForSelector('[data-cinematic-intro="complete"]');
    await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
    for (const theme of (process.env.BROWSER_THEMES || 'classic,blush,magenta,navy,plum,saffron').split(',')) {
      for (const language of ['en', 'bn', 'ne']) {
        for (const pageName of ['front', 'family', 'details', 'back']) {
          await page.evaluate((search) => { history.pushState({}, '', search); dispatchEvent(new PopStateEvent('popstate')); }, `?theme=${theme}&page=${pageName}&lang=${language}`);
          await page.waitForSelector(`main[data-theme-ready="true"][data-invitation-theme="${theme}"][lang="${language}"]`);
          await page.waitForSelector(`.bookStage.page-${({ family: 'inside-left', details: 'inside-right' })[pageName] || pageName}`);
          await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))); });
          await page.locator('.invitePage img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
          assert.equal(await page.locator('html').getAttribute('lang'), language);
          assert.equal(await page.locator('#invitation-language-value').getAttribute('lang'), language);
          const issues = await page.evaluate(() => {
            const issues = [];
            if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('horizontal page overflow: ' + [...document.querySelectorAll('body *')].filter(n => n.getBoundingClientRect().right > innerWidth + 2).slice(0, 5).map(n => n.className).join('/'));
            const card = document.querySelector('.invitePage').getBoundingClientRect();
            for (const node of document.querySelectorAll('.invitePage h1,.invitePage h2,.familyBlock,.heritageAssistance,.receptionDetailsOverlay')) {
              const box = node.getBoundingClientRect();
              if (box.width && (box.left < card.left - 2 || box.right > card.right + 2 || box.bottom > card.bottom + 2)) issues.push(node.className || node.tagName);
            }
            for (const image of document.querySelectorAll('.invitePage picture img')) {
              // Every approved template has a same-geometry WebP companion.
              const expected = /(?:\/themes\/|\/images\/wedding-monogram\.png$)/.test(image.src) ? image.src.replace(/\.(?:png|jpe?g)$/, '.webp') : image.src;
              if (image.currentSrc !== expected || !image.naturalWidth) issues.push('artwork not optimized/loaded');
            }
            // New typography guards apply to translations; approved English geometry is preserved.
            for (const [first, second] of [['.heritageBackIntro', '.heritageCoupleNames'], ['.dynamicFrontNames', '.dynamicFrontClosing']]) {
              const a = document.querySelector(first)?.getBoundingClientRect();
              const b = document.querySelector(second)?.getBoundingClientRect();
              if (a?.width && b?.width && a.bottom > b.top + 2) issues.push(`overlap: ${first}/${second}`);
            }
            // Compare rendered text fragments, rather than overlapping parent boxes.
            const walker = document.createTreeWalker(document.querySelector('.invitePage'), NodeFilter.SHOW_TEXT);
            const fragments = [];
            while (walker.nextNode()) {
              const node = walker.currentNode;
              if (!node.textContent.trim() || node.parentElement.closest('[aria-hidden="true"], .srOnly')) continue;
              const style = getComputedStyle(node.parentElement);
              if (style.visibility === 'hidden' || style.display === 'none') continue;
              const range = document.createRange(); range.selectNodeContents(node);
              for (const rect of range.getClientRects()) {
                if (rect.width && rect.height) fragments.push({ rect, node, label: (node.parentElement.className || node.parentElement.tagName) + ':' + node.textContent.trim().slice(0, 35) });
              }
            }
            for (let i = 0; i < fragments.length; i++) {
              const a = fragments[i];
              if (a.rect.left < card.left - 2 || a.rect.right > card.right + 2 || a.rect.bottom > card.bottom + 2) issues.push(`text outside card: ${a.label}`);
              for (const b of fragments.slice(i + 1)) {
                if (a.node === b.node) continue;
                const overlapX = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
                const overlapY = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
                if (overlapX > 2 && overlapY > Math.min(a.rect.height, b.rect.height) * .25) issues.push(`text collision: ${a.label}/${b.label}`);
              }
            }
            return issues;
          });
          if (issues.length && screenshots) await page.locator('.pageViewport').screenshot({ path: `${screenshots}/failure-${width}x${height}-${theme}-${language}-${pageName}.png` });
          if (issues.length) errors.push(`${width}x${height}/${theme}/${language}/${pageName}: ${issues.join(', ')}`);
          if (pageName === 'details' && language !== 'en') {
            const dateText = await page.locator('.receptionDetailValue').first().innerText();
            if (Number.isFinite(EVENT.start.getTime())) {
              assert.match(dateText, language === 'bn' ? /[০-৯]/ : /[०-९]/);
            } else {
              assert.equal(dateText, translate(language, 'Reception date will be announced soon.'));
            }
            assert.doesNotMatch(dateText, /Sunday|February|January|Monday/);
          }
          if (pageName === 'front') assert.equal(await page.locator('.openButton span').first().innerText(), translate(language, 'Open Invitation'));
          if (pageName === 'family') assert.equal(await page.locator('#family-blessings-title').innerText(), translate(language, 'With the Blessings of Our Families'));
          if (screenshots && language !== 'en') await page.locator('.pageViewport').screenshot({ path: `${screenshots}/${width}x${height}-${theme}-${language}-${pageName}.png` });
          checked++;
          if (checked % 72 === 0) console.log(`Checked ${checked} card renders; ${errors.length} issues recorded.`);
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
    if (process.env.REPORT_PATH) await fs.writeFile(process.env.REPORT_PATH, JSON.stringify({ checked, viewports: validationViewports, errors }, null, 2));
    await context.close();
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
  if (process.env.REPORT_PATH) await fs.writeFile(process.env.REPORT_PATH, JSON.stringify({ checked, viewports: validationViewports, errors }, null, 2));
  assert.deepEqual(errors, []);
  cachedSwitchTimes.sort((a, b) => a - b);
  console.log(`Cached theme selection median: ${cachedSwitchTimes[Math.floor(cachedSwitchTimes.length / 2)].toFixed(1)} ms (local Chrome; excludes the existing decorative transition).`);
  console.log(`Passed ${checked} theme/page/language/viewport renders, persistence, copy/QR links, browser history, rapid theme switching, blocked storage, image fallback and location state; no browser errors.`);
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
