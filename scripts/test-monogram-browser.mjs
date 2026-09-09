import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve('out');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const screenshots = process.env.SCREENSHOT_DIR;
const captureAllScreenshots = process.env.CAPTURE_ALL_SCREENSHOTS === 'true';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };

let server;
let url = process.env.TEST_URL;
if (!url) {
  server = http.createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (basePath && !pathname.startsWith(`${basePath}/`)) { res.writeHead(404).end(); return; }
      pathname = pathname.slice(basePath.length);
      const file = path.resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
      if (!file.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return; }
      const data = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=3600' }).end(data);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}${basePath}/`;
}

const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {})
});
const errors = [];

try {
  if (screenshots) await fs.mkdir(screenshots, { recursive: true });
  const page = await browser.newPage();
  page.on('pageerror', (error) => errors.push(error.message));

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('main[data-theme-ready="true"]');
    if (await page.locator('[data-intro-skip]').isVisible()) await page.locator('[data-intro-skip]').click();
    await page.waitForSelector('[data-cinematic-intro="complete"]');
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });

    for (const theme of ['classic', 'blush', 'magenta', 'navy', 'plum', 'saffron']) {
      for (const name of ['front', 'family', 'details', 'back']) {
        for (const language of ['en', 'bn', 'ne']) {
          await page.evaluate((search) => { history.pushState({}, '', search); dispatchEvent(new PopStateEvent('popstate')); }, `?theme=${theme}&page=${name}&lang=${language}`);
          await page.waitForSelector(`main[data-theme-ready="true"][data-invitation-theme="${theme}"][lang="${language}"]`);
          await page.waitForSelector(`.bookStage.page-${({ family: 'inside-left', details: 'inside-right' })[name] || name}`);
          await page.evaluate(async () => { await document.fonts.ready; });
          await page.locator('.invitePage img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));

          const count = theme === 'classic' && name === 'details' ? 0 : 1;
          assert.equal(await page.locator('.weddingMonogram > picture > img').count(), count);

          let issues = [];
          if (count) {
            issues = await page.evaluate(() => {
              const image = document.querySelector('.weddingMonogram > picture > img');
              const r = image.getBoundingClientRect();
              const card = document.querySelector('.invitePage').getBoundingClientRect();
              const issues = [];
              if (!image.naturalWidth || !image.currentSrc.endsWith('/images/wedding-monogram.webp')) issues.push('wrong or missing image');
              const axis = document.querySelector('.weddingMonogram--insideRight') ? ({ magenta: .516, navy: .52, plum: .52, saffron: .515 }[document.querySelector('main').dataset.invitationTheme] ?? .5) : .5;
              if (Math.abs((r.left + r.right) / 2 - (card.left + card.width * axis)) > 1) issues.push('off ornament center');
              if (Math.abs(r.width - r.height) > 1) issues.push('distorted');
              if (r.left < card.left || r.right > card.right || r.top < card.top || r.bottom > card.bottom) issues.push('outside card');
              for (const heading of document.querySelectorAll('.invitePage h1,.invitePage h2')) {
                const h = heading.getBoundingClientRect();
                if (r.left < h.right && r.right > h.left && r.top < h.bottom && r.bottom > h.top) issues.push('heading overlap: ' + heading.className);
              }
              return issues;
            });
            if (issues.length) errors.push(`${width}/${theme}/${name}/${language}: ${issues.join(', ')}`);
          }

          if (screenshots && (issues.length || captureAllScreenshots)) {
            const prefix = issues.length ? 'failure-' : '';
            await page.locator('.invitePage').screenshot({ path: path.join(screenshots, `${prefix}${width}-${theme}-${name}-${language}.png`) });
          }
        }
      }
    }
  }

  assert.deepEqual(errors, []);
  console.log('144 theme/page/language/viewport monogram checks passed.');
} finally {
  await browser.close();
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}