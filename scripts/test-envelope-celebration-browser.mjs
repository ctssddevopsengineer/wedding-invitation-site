// Build first. BROWSER_CHANNEL=chrome uses an installed Chrome.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('out');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const screenshots = process.env.SCREENSHOT_DIR;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (basePath && !pathname.startsWith(`${basePath}/`)) { res.writeHead(404).end(); return; }
    pathname = pathname.slice(basePath.length);
    const file = path.resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return; }
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}${basePath}/`;
const errors = [];
let browser;
async function newPage(options = {}) {
  const context = await browser.newContext(options);
  await context.route('https://**', (route) => route.abort());
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  return page;
}
async function ready(page, search = '') {
  await page.goto(`${url}${search}`);
  await page.waitForSelector('main[data-theme-ready="true"]');
}
async function complete(page) {
  await page.waitForSelector('[data-cinematic-intro="complete"]', { timeout: 20000 });
  await page.waitForFunction(() => document.body.style.overflow !== 'hidden');
  assert.equal(await page.locator('.invitePage').count(), 1, 'only one real invitation page is mounted');
  assert.equal(await page.locator('[data-wedding-particles]').count(), 0, 'particles are removed when the intro finishes');
  assert.equal(await page.evaluate(() => document.body.style.overflow), '', 'scroll lock is released');
}
async function capture(page, name) {
  if (screenshots) await page.screenshot({ path: path.join(screenshots, `${name}.png`) });
}

try {
  if (screenshots) await fs.mkdir(screenshots, { recursive: true });
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
  for (const width of [390, 1366]) {
    const page = await newPage({ viewport: { width, height: 844 } });
    await ready(page);
    assert.equal(await page.locator('[data-envelope-celebration]').count(), 0);
    await page.locator('[data-intro-open]').click();
    const field = page.locator('[data-envelope-celebration]');
    await field.waitFor();
    assert.equal(await field.locator('[data-celebration-particle]').count(), width <= 680 ? 106 : 184);
    for (const type of ['firecracker', 'sprinkler', 'ribbon']) assert.ok(await field.locator(`[data-celebration-particle="${type}"]`).count());
    assert.equal(await field.getAttribute('aria-hidden'), 'true');
    assert.equal(await field.evaluate(node => getComputedStyle(node).pointerEvents), 'none');
    const handle = await field.elementHandle();
    await page.waitForSelector('[data-cinematic-intro="rising"]');
    assert.equal(await field.evaluate((node, previous) => node === previous, handle), true, 'phase transition does not restart effects');
    assert.ok(await field.evaluate(node => node.getAnimations({ subtree: true }).length > 0));
    await page.waitForTimeout(2100);
    assert.ok(await field.evaluate(node => [...node.querySelectorAll('[data-celebration-particle]')].some(p => Number(getComputedStyle(p).opacity) > .5)), 'celebration remains visible beyond the old 2.5-second duration');
    await capture(page, `celebration-${width}`);
    await page.waitForSelector('[data-cinematic-intro="scene"]');
    assert.equal(await field.count(), 0, 'effects are removed before the entrance');
    await page.locator('[data-intro-skip]').click();
    await complete(page);
    await page.locator('[data-intro-replay]').click();
    assert.equal(await field.count(), 0);
    await page.locator('[data-intro-open]').click();
    await field.waitFor();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForSelector('[data-envelope-celebration][data-paused="true"]');
    assert.equal(await field.locator('span').first().evaluate(node => getComputedStyle(node).animationPlayState), 'paused');
    await page.locator('[data-intro-skip]').click();
    await complete(page);
    assert.equal(await field.count(), 0, 'skip cleans up effects');
    await page.context().close();
  }
  const page = await newPage({ reducedMotion: 'reduce' });
  await ready(page);
  await page.locator('[data-intro-open]').click();
  await complete(page);
  assert.equal(await page.locator('[data-envelope-celebration]').count(), 0);
  await page.context().close();
  assert.deepEqual(errors, []);
  console.log('Passed desktop/mobile effects, phase continuity, cleanup, replay, hidden-tab suspension and reduced motion.');
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
