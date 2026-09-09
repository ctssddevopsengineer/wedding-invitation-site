// Build first; exercise the real CSS animation at fixed points in time.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { THEME_IDS } from '../lib/theme.mjs';

const root = path.resolve('out');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (basePath && !pathname.startsWith(`${basePath}/`)) { res.writeHead(404).end(); return; }
    pathname = pathname.slice(basePath.length);
    const file = path.resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return; }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
const errors = [];
let samples = 0;
try {
  for (const viewport of [
    { width: 393, height: 852 }, // Reported iPhone 16 viewport.
    { width: 240, height: 320 }, { width: 320, height: 568 },
    { width: 844, height: 390 }, { width: 768, height: 1024 },
    { width: 1366, height: 900 }
  ]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://**', route => route.abort());
    for (const theme of THEME_IDS) {
      await page.goto(`http://127.0.0.1:${server.address().port}${basePath}/?theme=${theme}&lang=en`);
      await page.waitForSelector('main[data-theme-ready="true"]');
      // Hold phase timers while sampling the actual CSS keyframes deterministically.
      await page.clock.install();
      await page.clock.pauseAt(new Date());
      await page.locator('[data-intro-open]').click();
      await page.evaluate(() => {
        const scene = document.querySelector('[data-envelope-scene]');
        const card = scene.querySelector('[aria-hidden="true"][inert]');
        card.dataset.testCard = '';
        // A solid diagnostic fill makes leaked card pixels unambiguous. Keep
        // the real card dimensions, clipping, transforms and envelope layers.
        card.style.background = 'rgb(0, 255, 0)';
        for (const child of card.children) child.style.visibility = 'hidden';
      });
      for (const [phase, time] of [['opening', 0], ['rising', 0], ['rising', 150], ['rising', 500], ['rising', 1000], ['rising', 1500]]) {
        const box = await page.evaluate(({ phase, time }) => {
          document.querySelector('[data-cinematic-intro]').dataset.cinematicIntro = phase;
          const card = document.querySelector('[data-test-card]');
          getComputedStyle(card).transform;
          for (const animation of document.getAnimations()) {
            animation.pause();
            animation.currentTime = animation.effect.target === card ? time : 1000;
          }
          const r = document.querySelector('[data-envelope-scene]').getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        }, { phase, time });
        const { data, info } = await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        let below = 0, above = 0;
        for (let y = 0; y < info.height; y++) {
          for (let x = Math.ceil(box.left); x < Math.min(info.width, box.right); x++) {
            const i = (y * info.width + x) * info.channels;
            if (data[i] < 20 && data[i + 1] > 240 && data[i + 2] < 20) {
              if (y >= Math.ceil(box.bottom)) below++;
              if (y < Math.floor(box.top)) above++;
            }
          }
        }
        const label = `${viewport.width}x${viewport.height}, ${theme}, ${phase} ${time}ms`;
        assert.equal(below, 0, `card leaks below envelope: ${label}`);
        if (phase === 'rising' && time === 1500) assert.ok(above > 0, `rising card must remain visible above envelope: ${label}`);
        samples++;
      }
      await page.clock.resume();
    }
    await page.close();
    console.log(`Verified envelope clipping: ${viewport.width}x${viewport.height}, all themes.`);
  }
  assert.deepEqual(errors, []);
  console.log(`Passed ${samples} animation samples: no bottom leakage, upward reveal preserved.`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
