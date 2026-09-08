// Production-build audit. REPORT_DIR receives the measured matrix and screenshots.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { RESPONSIVE_VIEWPORTS } from '../lib/responsive.mjs';
import { THEME_IDS } from '../lib/theme.mjs';

const root = path.resolve('out');
const reportDir = process.env.REPORT_DIR || '/tmp/wedding-responsive';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
await fs.mkdir(reportDir, { recursive: true });
const viewports = RESPONSIVE_VIEWPORTS.filter(({ width, height }) => !process.env.VIEWPORT_FILTER || process.env.VIEWPORT_FILTER === `${width}x${height}`);
assert.ok(viewports.length, 'viewport filter must match the validation matrix');
const cpuSlowdown = Number(process.env.CPU_SLOWDOWN || 1);
const report = { cpuSlowdown, viewports, renders: [], intros: [], performance: [], issues: [], browserErrors: [] };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (basePath && !pathname.startsWith(`${basePath}/`)) throw new Error('path');
    const relative = pathname.slice(basePath.length);
    const file = path.resolve(root, `.${relative.endsWith('/') ? `${relative}index.html` : relative}`);
    if (!file.startsWith(`${root}${path.sep}`)) throw new Error('path');
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp3': 'audio/mpeg' })[path.extname(file)] || 'application/octet-stream' }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}${basePath}/`;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true, args: ['--mute-audio'] });

async function settled(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.querySelector('.invitePage')?.getAnimations({ subtree: true }).forEach((animation) => animation.finish());
    document.querySelector('.pageViewport')?.getAnimations().forEach((animation) => animation.finish());
    await Promise.all([...document.querySelectorAll('.invitePage img')].map((image) => image.decode().catch(() => {})));
    // Representative names replace unresolved *display text only*; event configuration stays untouched.
    const walk = document.createTreeWalker(document.querySelector('.invitePage'), NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) walk.currentNode.textContent = walk.currentNode.textContent.replace(/\{\{([^}]+)\}\}/g, (_, key) => key.includes('PHONE') ? '+91 90000 00000' : key.includes('ADDRESS') ? '123 Riverside Road, Kolkata, West Bengal' : key.includes('VENUE') ? 'Riverside Reception Hall' : key.includes('GROOM') ? 'Soukarya Datta' : 'Debolina Sharma');
    await new Promise(requestAnimationFrame);
  });
}
async function inspectPage(page, tag) {
  const result = await page.evaluate(() => {
    const issues = [], card = document.querySelector('.invitePage'), box = card.getBoundingClientRect();
    if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('document horizontal overflow');
    const regions = [...card.querySelectorAll('.dynamicFrontCopy,.familyBlessingsContent,.receptionDetailsOverlay,.heritageBackContent')];
    for (const region of regions) {
      const r = region.getBoundingClientRect();
      if (r.left < box.left - 2 || r.right > box.right + 2 || r.top < box.top - 2 || r.bottom > box.bottom + 2) issues.push(`region outside card: ${region.className}`);
      if (region.scrollWidth > region.clientWidth + 2) issues.push(`text clips horizontally: ${region.className}`);
      if (region.scrollHeight > region.clientHeight + 2 && !['auto','scroll'].includes(getComputedStyle(region).overflowY)) issues.push(`unreachable text: ${region.className}`);
    }
    const front = [...card.querySelectorAll('.dynamicFrontCopy > h1,.dynamicFrontCopy > p')];
    for (let i = 1; i < front.length; i++) {
      if (front[i].getBoundingClientRect().top < front[i - 1].getBoundingClientRect().bottom - 1) issues.push('front text blocks overlap');
    }
    const copy = [...card.querySelectorAll('.dynamicFrontTagline,.dynamicFrontClosing,.familyBlock p,.familyBlessingsIntro p,.familyBlessingsClosing,.receptionDetailValue,.heritageBackMessage,.heritageJourneyMessage,.contactCard p,.contactCard a')];
    const minFont = Math.min(...copy.map((node) => parseFloat(getComputedStyle(node).fontSize)));
    if (minFont < 13.99) issues.push(`body text below 14px: ${minFont}`);
    for (const node of document.querySelectorAll('.navArrow,.pageDot,.themeOption,[data-music-control]')) {
      const r = node.getBoundingClientRect();
      if (r.width < 43.99 || r.height < 43.99) issues.push(`small touch target: ${node.className}`);
    }
    for (const label of document.querySelectorAll('.themeOptionName')) {
      if (label.scrollWidth > label.clientWidth + 1 || getComputedStyle(label).whiteSpace === 'nowrap') issues.push('theme name truncated');
    }
    if (getComputedStyle(document.querySelector('.pageDot.active')).backgroundColor !== 'rgba(0, 0, 0, 0)') issues.push('page dot touch target painted as a large circle');
    for (const node of card.querySelectorAll('.dynamicFrontMonogram,.familyMonogramArtwork,.heritageBackMonogram,.insideRightThemeMonogram')) {
      const r = node.getBoundingClientRect();
      // Reception crests have approved optical offsets toward the printed lotus (up to 2.1%).
      const tolerance = node.classList.contains('insideRightThemeMonogram') ? box.width * .025 : 8;
      if (Math.abs((r.left + r.right - box.left - box.right) / 2) > tolerance) issues.push(`off-center monogram: ${node.className}`);
    }
    return { issues, minFont, regions: regions.map((r) => ({ name: r.className, height: r.clientHeight, content: r.scrollHeight })), width: box.width, height: box.height };
  });
  report.renders.push({ ...tag, ...result });
  report.issues.push(...result.issues.map((issue) => ({ ...tag, issue })));
}
async function inspectIntro(page, label) {
  const issues = await page.evaluate(() => {
    const issues = [], root = document.querySelector('[data-cinematic-intro]');
    if (root.scrollWidth > innerWidth + 1) issues.push('intro horizontal overflow');
    for (const node of document.querySelectorAll('[data-intro-control]')) {
      const r = node.getBoundingClientRect();
      if (r.width < 44 || r.height < 44 || r.left < 0 || r.top < 0 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) issues.push('intro control clipped or too small');
    }
    if (root.dataset.cinematicIntro === 'closed') {
      const scene = document.querySelector('[data-envelope-scene]').getBoundingClientRect();
      const seal = document.querySelector('[class*="_seal"]').getBoundingClientRect();
      if (Math.abs((scene.left + scene.right - seal.left - seal.right) / 2) > 1) issues.push('seal not centered');
    }
    if (root.dataset.cinematicIntro === 'together') {
      const caption = document.querySelector('[data-entrance-caption]').getBoundingClientRect();
      const people = [...document.querySelectorAll('[data-character]')].map((n) => n.getBoundingClientRect());
      if (people.some((p) => p.top < caption.bottom + 16 || p.left < -1 || p.right > innerWidth + 1 || p.bottom > innerHeight + 1 || p.height < 70)) issues.push('couple clipped, too small or over caption');
      if (people[0].left >= people[1].left || Math.abs((people[0].left + people[1].right) / 2 - innerWidth / 2) > innerWidth * .025) issues.push('meeting position off center');
      for (const node of document.querySelectorAll('[data-particle-lane]')) if (node.getBoundingClientRect().top < caption.bottom + 23) issues.push('petals cover caption');
    }
    return issues;
  });
  report.intros.push({ label, issues });
  report.issues.push(...issues.map((issue) => ({ label, issue })));
}

try {
  for (const viewport of viewports) {
    const label = `${viewport.width}x${viewport.height}`;
    const context = await browser.newContext({ viewport, hasTouch: true, deviceScaleFactor: viewport.width === 412 && viewport.height === 892 ? 2.625 : 1 });
    await context.addInitScript(() => {
      sessionStorage.setItem('sd-invitation-music-muted-v1', 'true');
      window.auditTasks = [];
      new PerformanceObserver((list) => window.auditTasks.push(...list.getEntries().map((e) => e.duration))).observe({ type: 'longtask', buffered: true });
    });
    const page = await context.newPage();
    if (cpuSlowdown > 1) {
      const profile = await context.newCDPSession(page);
      await profile.send('Emulation.setCPUThrottlingRate', { rate: cpuSlowdown });
    }
    page.on('pageerror', (e) => report.browserErrors.push(e.message));
    await page.goto(url);
    await page.waitForSelector('[data-intro-open]:not(:disabled)');
    await inspectIntro(page, `${label}/closed`);
    await page.locator('[data-intro-open]').tap();
    await page.waitForSelector('[data-cinematic-intro="rising"]');
    await page.waitForTimeout(1100);
    const rise = await page.locator('.pageViewport').boundingBox();
    if (rise.x < 0 || rise.y < 0 || rise.x + rise.width > viewport.width) report.issues.push({ label, issue: 'rising card outside viewport' });
    await page.waitForSelector('[data-cinematic-intro="walking"]');
    const frames = await page.evaluate(() => new Promise((resolve) => {
      const samples = []; let previous;
      const frame = (now) => { if (previous) samples.push(now - previous); previous = now; if (samples.length === 45) resolve(samples); else requestAnimationFrame(frame); };
      requestAnimationFrame(frame);
    }));
    await page.waitForSelector('[data-cinematic-intro="together"]');
    await page.waitForTimeout(100);
    await inspectIntro(page, `${label}/meeting`);
    if ([360,412,820,1920].includes(viewport.width)) await page.screenshot({ path: path.join(reportDir, `${label}-meeting.png`) });
    await page.waitForSelector('[data-cinematic-intro="complete"]');
    const resources = await page.evaluate(() => ({ tasks: window.auditTasks, assets: performance.getEntriesByType('resource').map((r) => ({ name: new URL(r.name).pathname, bytes: r.transferSize })) }));
    if (resources.assets.some(({ name }) => /\/themes\/(?!classic\/)[^/]+\/(?!thumbnail\.)/.test(name))) report.issues.push({ label, issue: 'unused theme artwork downloaded before selection' });
    frames.sort((a,b) => a-b);
    report.performance.push({ label, medianFrameMs: frames[22], p95FrameMs: frames[42], ...resources });
    // All six themes, all four pages, all supported languages at every size.
    for (const theme of THEME_IDS) for (const language of ['en','bn','ne']) for (const section of ['front','family','details','back']) {
      await page.evaluate((search) => { history.pushState({}, '', search); dispatchEvent(new PopStateEvent('popstate')); }, `?theme=${theme}&page=${section}&lang=${language}`);
      await page.waitForSelector(`main[data-invitation-theme="${theme}"][lang="${language}"] .page-${section === 'family' ? 'inside-left' : section === 'details' ? 'inside-right' : section}`);
      await settled(page);
      await inspectPage(page, { label, theme, language, section });
      if (viewport.width === 360 && viewport.height === 640 && language === 'en' && ['classic','navy'].includes(theme)) await page.locator('.invitePage').screenshot({ path: path.join(reportDir, `${label}-${theme}-${section}.png`) });
    }
    // Actual tap navigation, theme selection, music toggle and diagonal vertical scrolling.
    await page.selectOption('#invitation-language', 'en');
    await page.locator('.pageDot').first().tap();
    await page.waitForSelector('.frontCover');
    await page.locator('.themeOption').first().tap();
    await page.waitForSelector('main[data-invitation-theme="classic"]');
    await page.locator('.pageDot').nth(1).tap();
    await page.waitForSelector('.familyBlessingsTemplate');
    const region = page.locator('.familyBlessingsContent');
    await region.evaluate((node) => {
      node.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, changedTouches: [new Touch({ identifier: 1, target: node, clientX: 180, clientY: 300 })] }));
      node.dispatchEvent(new TouchEvent('touchend', { bubbles: true, changedTouches: [new Touch({ identifier: 1, target: node, clientX: 110, clientY: 130 })] }));
    });
    await region.scrollIntoViewIfNeeded();
    const scrollable = await region.evaluate((node) => node.scrollHeight > node.clientHeight + 2);
    if (scrollable) {
      const bounds = await region.boundingBox();
      const cdp = await context.newCDPSession(page);
      const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height * .8;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let step = 1; step <= 8; step++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - bounds.height * .06 * step }] });
        await page.waitForTimeout(20);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(150);
      if (await region.evaluate((node) => node.scrollTop) <= 0) report.issues.push({ label, issue: 'touch cannot scroll readable content' });
      await cdp.detach();
    }
    if (await page.locator('.familyBlessingsTemplate').count() !== 1) report.issues.push({ label, issue: 'vertical scroll triggered page swipe' });
    await page.locator('[data-music-control]').tap();
    await page.waitForSelector('[data-music-state="playing"]');
    await page.locator('[data-music-control]').tap();
    await page.waitForSelector('[data-music-muted="true"]');
    await page.locator('[data-intro-replay]').tap();
    await page.waitForSelector('[data-cinematic-intro="closed"]');
    await page.setViewportSize({ width: viewport.height, height: viewport.width });
    await inspectIntro(page, `${label}/rotated-closed`);
    await page.locator('[data-intro-open]').tap();
    await page.waitForSelector('[data-cinematic-intro="walking"]');
    await page.evaluate(() => { window.walkAnimation = document.querySelector('[data-character]').getAnimations()[0]; });
    await page.setViewportSize(viewport);
    assert.equal(await page.evaluate(() => window.walkAnimation === document.querySelector('[data-character]').getAnimations()[0]), true, 'rotation retains animation timeline');
    await page.locator('[data-intro-skip]').tap();
    await page.waitForSelector('[data-cinematic-intro="complete"]');
    console.log(`Verified ${label}: intro, 72 card renders, orientation, touch and music. Issues so far: ${report.issues.length}`);
    await fs.writeFile(path.join(reportDir, 'report.json'), JSON.stringify(report, null, 2));
    await context.close();
  }
} finally {
  await fs.writeFile(path.join(reportDir, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
console.log(`Report: ${reportDir}; ${report.renders.length} card renders, ${report.intros.length} intro checks.`);
assert.deepEqual(report.browserErrors, []);
assert.deepEqual(report.issues, []);
