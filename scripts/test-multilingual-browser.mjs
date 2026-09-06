// Build first. Run with BROWSER_CHANNEL=chrome to use an installed Chrome.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { translate } from '../lib/locale.mjs';

const root = path.resolve('out');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const screenshots = process.env.SCREENSHOT_DIR;
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
  for (const width of (process.env.BROWSER_WIDTHS || '320,375,768,1280').split(',').map(Number)) {
    const context = await browser.newContext({ viewport: { width, height: 1100 } });
    // The existing QR service is external; only first-party requests are needed.
    await context.route('https://**', (route) => route.abort());
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url);
    await page.waitForSelector('main[data-theme-ready="true"]');
    for (const theme of (process.env.BROWSER_THEMES || 'classic,blush,magenta,navy,plum,saffron').split(',')) {
      for (const language of ['en', 'bn', 'ne']) {
        for (const pageName of ['front', 'family', 'details', 'back']) {
          await page.evaluate((search) => { history.pushState({}, '', search); dispatchEvent(new PopStateEvent('popstate')); }, `?theme=${theme}&page=${pageName}&lang=${language}`);
          await page.waitForSelector(`main[data-theme-ready="true"][data-invitation-theme="${theme}"][lang="${language}"]`);
          await page.evaluate(() => document.fonts.ready);
          await page.locator('.invitePage img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
          assert.equal(await page.locator('html').getAttribute('lang'), language);
          assert.equal(await page.locator('#invitation-language').inputValue(), language);
          const issues = await page.evaluate(() => {
            const issues = [];
            if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('horizontal page overflow');
            const card = document.querySelector('.invitePage').getBoundingClientRect();
            for (const node of document.querySelectorAll('.invitePage h1,.invitePage h2,.familyBlock,.heritageAssistance,.receptionDetailsOverlay')) {
              const box = node.getBoundingClientRect();
              if (box.width && (box.left < card.left - 2 || box.right > card.right + 2 || box.bottom > card.bottom + 2)) issues.push(node.className || node.tagName);
            }
            for (const image of document.querySelectorAll('.invitePage picture img')) {
              if (!image.currentSrc.endsWith('.webp') || !image.naturalWidth) issues.push('artwork not optimized/loaded');
            }
            // New typography guards apply to translations; approved English geometry is preserved.
            for (const [first, second] of [['.heritageBackIntro', '.heritageCoupleNames'], ['.dynamicFrontNames', '.dynamicFrontClosing']]) {
              const a = document.querySelector(first)?.getBoundingClientRect();
              const b = document.querySelector(second)?.getBoundingClientRect();
              if (document.documentElement.lang !== 'en' && a?.width && b?.width && a.bottom > b.top + 2) issues.push(`overlap: ${first}/${second}`);
            }
            return issues;
          });
          if (issues.length && screenshots) await page.locator('.pageViewport').screenshot({ path: `${screenshots}/failure-${width}-${theme}-${language}-${pageName}.png` });
          assert.deepEqual(issues, [], `${width}/${theme}/${language}/${pageName}`);
          if (pageName === 'details' && language !== 'en') {
            const dateText = await page.locator('.receptionDetailValue').first().innerText();
            assert.match(dateText, language === 'bn' ? /[০-৯]/ : /[०-९]/);
            assert.doesNotMatch(dateText, /Sunday|February|January|Monday/);
          }
          if (pageName === 'front') assert.equal(await page.locator('.openButton span').first().innerText(), translate(language, 'Open Invitation'));
          if (pageName === 'family') assert.equal(await page.locator('#family-blessings-title').innerText(), translate(language, 'With the Blessings of Our Families'));
          if (screenshots && language !== 'en') await page.locator('.pageViewport').screenshot({ path: `${screenshots}/${width}-${theme}-${language}-${pageName}.png` });
          checked++;
          if (checked % 72 === 0) console.log(`Verified ${checked} card renders.`);
        }
      }
    }
    await page.goto(`${url}?theme=blush&page=details&lang=bn`);
    await page.waitForSelector('main[lang="bn"]');
    await page.selectOption('#invitation-language', 'ne');
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
  await fallbackPage.selectOption('#invitation-language', 'ne');
  await fallbackPage.waitForURL(/lang=ne/);
  assert.equal(new URL(fallbackPage.url()).searchParams.get('page'), 'location');
  assert.equal(await fallbackPage.locator('.exactLocationHotspot').getAttribute('aria-expanded'), 'true');
  await fallbackPage.keyboard.press('Escape');
  assert.equal(await fallbackPage.locator('.exactLocationHotspot').getAttribute('aria-expanded'), 'false');
  await fallbackContext.close();
  assert.deepEqual(errors, []);
  cachedSwitchTimes.sort((a, b) => a - b);
  console.log(`Cached theme selection median: ${cachedSwitchTimes[Math.floor(cachedSwitchTimes.length / 2)].toFixed(1)} ms (local Chrome; excludes the existing decorative transition).`);
  console.log(`Passed ${checked} theme/page/language/viewport renders, persistence, copy/QR links, browser history, rapid theme switching, blocked storage, image fallback and location state; no browser errors.`);
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
