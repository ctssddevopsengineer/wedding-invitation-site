import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { CRITICAL_VISUAL_VIEWPORTS, VISUAL_REGRESSION_CASES } from '../lib/visual-regression.mjs';

const root = path.resolve('out');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const baselinePath = path.resolve(process.env.VISUAL_BASELINE_PATH || 'tests/visual-baselines.json');
const outputDir = path.resolve(process.env.VISUAL_OUTPUT_DIR || 'artifacts/visual');
const updateBaselines = process.env.VISUAL_UPDATE_BASELINES === 'true';
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf'
};

async function normalizedPixelHash(png) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  // Keep pixel-level sensitivity while absorbing tiny hosted-runner anti-aliasing noise.
  for (let i = 0; i < data.length; i++) data[i] &= 0xfc;
  return {
    hash: crypto.createHash('sha256').update(data).digest('hex'),
    width: info.width,
    height: info.height
  };
}

async function readBaselines() {
  if (updateBaselines) return { version: 1, cases: {} };
  try {
    return JSON.parse(await fs.readFile(baselinePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Visual baseline manifest is missing: ${baselinePath}. Generate and review baselines before compare mode.`);
    }
    throw error;
  }
}

async function waitForStableArtwork(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(async (image) => {
      if (!image.complete) {
        await new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        });
      }
      try { await image.decode(); } catch {}
    }));
  });
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.join(outputDir, 'failures'), { recursive: true });

const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (basePath && !pathname.startsWith(`${basePath}/`)) { res.writeHead(404).end(); return; }
    pathname = pathname.slice(basePath.length);
    const file = path.resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return; }
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(data);
  } catch {
    res.writeHead(404).end();
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}${basePath}/`;
const browser = await chromium.launch({ headless: true });
const baseline = await readBaselines();
const generated = { version: 1, normalization: 'rgb-6bit-sha256', cases: {} };
const failures = [];

try {
  for (const viewport of CRITICAL_VISUAL_VIEWPORTS) {
    const cases = VISUAL_REGRESSION_CASES.filter((item) => item.viewport.name === viewport.name);
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: 'reduce',
      colorScheme: 'light'
    });
    await context.route('https://**', (route) => route.abort());
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('main[data-theme-ready="true"]');
      const skip = page.locator('[data-intro-skip]');
      if (await skip.isVisible().catch(() => false)) await skip.click();
      await page.waitForSelector('[data-cinematic-intro="complete"]');
      await page.addStyleTag({ content: `
        *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
        .countdown strong { visibility: hidden !important; }
      ` });

      for (const visualCase of cases) {
        const { id, theme, page: pageName, language } = visualCase;
        await page.evaluate((search) => {
          history.pushState({}, '', search);
          dispatchEvent(new PopStateEvent('popstate'));
        }, `?theme=${theme}&page=${pageName}&lang=${language}`);
        await page.waitForSelector(`main[data-theme-ready="true"][data-invitation-theme="${theme}"][lang="${language}"]`);
        await page.waitForSelector(`.bookStage.page-${({ family: 'inside-left', details: 'inside-right' })[pageName] || pageName}`);
        await waitForStableArtwork(page);

        const locator = page.locator('.invitePage');
        const png = await locator.screenshot({ animations: 'disabled' });
        const digest = await normalizedPixelHash(png);
        generated.cases[id] = {
          viewport: `${viewport.width}x${viewport.height}`,
          theme,
          page: pageName,
          language,
          width: digest.width,
          height: digest.height,
          hash: digest.hash
        };

        if (updateBaselines) {
          await fs.writeFile(path.join(outputDir, `${id}.png`), png);
        } else {
          const expected = baseline.cases?.[id];
          const mismatch = !expected || expected.hash !== digest.hash || expected.width !== digest.width || expected.height !== digest.height;
          if (mismatch) {
            failures.push(expected
              ? `${id}: visual pixels changed (expected ${expected.hash}, actual ${digest.hash})`
              : `${id}: missing approved baseline`);
            await fs.writeFile(path.join(outputDir, 'failures', `${id}.png`), png);
          }
        }
      }
    } finally {
      await context.close();
    }
  }

  await fs.writeFile(path.join(outputDir, 'visual-regression-report.json'), JSON.stringify({
    mode: updateBaselines ? 'record' : 'compare',
    checked: VISUAL_REGRESSION_CASES.length,
    failures,
    generated
  }, null, 2));

  if (updateBaselines) {
    await fs.writeFile(path.join(outputDir, 'visual-baselines.generated.json'), JSON.stringify(generated, null, 2));
    console.log(`Recorded ${VISUAL_REGRESSION_CASES.length} deterministic visual baselines for review.`);
  } else {
    assert.deepEqual(failures, []);
    console.log(`Passed ${VISUAL_REGRESSION_CASES.length} pixel-level visual regression checks.`);
  }
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
