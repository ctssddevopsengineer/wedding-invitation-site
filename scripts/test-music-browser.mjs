// Build first. Uses real MP3 decoding and Web Audio, with hardware output muted.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { THEME_IDS, THEMES } from '../lib/theme.mjs';
import { MUSIC_STORAGE_KEY } from '../lib/music.mjs';

const root = path.resolve('out');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (basePath && !pathname.startsWith(`${basePath}/`)) { res.writeHead(404).end(); return; }
    const relative = pathname.slice(basePath.length);
    const file = path.resolve(root, `.${relative.endsWith('/') ? `${relative}index.html` : relative}`);
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
  await context.addInitScript(() => {
    const NativeContext = window.AudioContext;
    window.musicTest = { contexts: [], sources: [], gains: [] };
    window.AudioContext = class extends NativeContext {
      constructor(...args) { super(...args); window.musicTest.contexts.push(this); }
      createBufferSource() {
        const source = super.createBufferSource();
        window.musicTest.sources.push(source);
        return source;
      }
      createGain() {
        const gain = super.createGain();
        window.musicTest.gains.push(gain);
        return gain;
      }
    };
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  return page;
}
async function ready(page, search = '') {
  await page.goto(`${url}${search}`);
  await page.waitForSelector('[data-music-control]:not(:disabled)');
  await page.waitForSelector('main[data-theme-ready="true"]');
}
const playing = (page) => page.waitForSelector('[data-music-state="playing"]');
const countSources = (page) => page.evaluate(() => window.musicTest.sources.length);
async function changeTheme(page, id) {
  await page.getByRole('radio', { name: `Use ${THEMES[id].shortLabel} theme`, exact: true }).click();
  await page.waitForSelector(`main[data-invitation-theme="${id}"]`);
}

try {
  browser = await chromium.launch({ headless: true, args: ['--mute-audio', '--autoplay-policy=user-gesture-required'], ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
  const page = await newPage();
  const requests = [];
  page.on('request', (request) => { if (request.url().endsWith('.mp3')) requests.push(request.url()); });
  await ready(page);
  await page.waitForTimeout(300);
  assert.deepEqual(requests, []);
  assert.equal(await page.evaluate(() => window.musicTest.contexts.length), 0);
  // The music button participates in the intro's keyboard focus trap.
  await page.locator('[data-intro-open]').focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('[data-music-control]').evaluate((node) => node === document.activeElement), true);
  await page.locator('[data-intro-open]').click();
  await playing(page);
  assert.ok(requests[0].endsWith('/audio/intro.mp3'));
  assert.equal(await page.evaluate(() => window.musicTest.sources[0].loop), true);
  await page.waitForFunction(() => window.musicTest.gains[0].gain.value > .3);
  await page.waitForSelector('[data-cinematic-intro="complete"]', { timeout: 16000 });
  await page.waitForFunction(() => window.musicTest.sources.length === 2);
  await playing(page);
  assert.ok(requests[1].endsWith('/audio/classic.mp3'));
  await page.waitForTimeout(1000);
  await page.evaluate(() => { window.themeSource = window.musicTest.sources.at(-1); });
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next page', exact: true }).click();
  assert.equal(await countSources(page), 2, 'page switches keep the playing source');
  await page.locator('[data-music-control]').click();
  await page.waitForFunction(() => window.musicTest.contexts[0].state === 'suspended');
  const pausedAt = await page.evaluate(() => window.musicTest.contexts[0].currentTime);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => window.musicTest.contexts[0].currentTime), pausedAt);
  assert.equal(await page.evaluate((key) => sessionStorage.getItem(key), MUSIC_STORAGE_KEY), 'true');
  await page.locator('[data-music-control]').click();
  await playing(page);
  assert.equal(await page.evaluate(() => window.themeSource === window.musicTest.sources.at(-1)), true);

  // Real decoded audio for every configured theme, with one context throughout.
  for (const id of THEME_IDS.slice(1)) {
    const count = await countSources(page);
    await changeTheme(page, id);
    await page.waitForFunction((before) => window.musicTest.sources.length === before + 1, count);
    await playing(page);
    assert.ok(requests.at(-1).endsWith(`/audio/${id}.mp3`));
  }
  assert.equal(await page.evaluate(() => window.musicTest.contexts.length), 1);
  assert.equal(new Set(requests).size, 7, 'only the seven configured tracks were fetched');

  // Render across a real loop boundary offline: no restart, silent gap or lost channel.
  const seam = await page.evaluate(async () => {
    const buffer = window.musicTest.sources.at(-1).buffer;
    const offline = new OfflineAudioContext(buffer.numberOfChannels, buffer.length + 512, buffer.sampleRate);
    const source = offline.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    const actual = rendered.getChannelData(0);
    const original = buffer.getChannelData(0);
    return { wraps: actual.slice(buffer.length).every((value, i) => Math.abs(value - original[i]) < 1e-5), channels: rendered.numberOfChannels, signal: original.some((sample) => Math.abs(sample) > .001) };
  });
  assert.equal(seam.wraps, true);
  assert.ok(seam.signal && seam.channels >= 1);

  const sources = await countSources(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(() => window.musicTest.contexts[0].state === 'suspended');
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await playing(page);
  assert.equal(await countSources(page), sources);
  await page.locator('[data-music-control]').click();
  await page.reload();
  await page.waitForSelector('[data-music-muted="true"]');
  assert.equal(await page.evaluate(() => window.musicTest.contexts.length), 0, 'reload restores mute but never playback authorization');
  await page.locator('[data-music-control]').click();
  await playing(page);
  await page.context().close();
  console.log('Verified gesture gating, intro/theme crossfade, all seven MP3s, page continuity, mute persistence, loop rendering and visibility resume.');

  const direct = await newPage({ viewport: { width: 320, height: 480 }, hasTouch: true });
  await ready(direct, '?page=details&theme=navy');
  assert.equal(await direct.evaluate(() => window.musicTest.contexts.length), 0);
  await direct.locator('[data-music-control]').tap();
  await playing(direct);
  const box = await direct.locator('[data-music-control]').boundingBox();
  assert.ok(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= 320 && box.y + box.height <= 480);
  if (process.env.SCREENSHOT_DIR) {
    await fs.mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
    await direct.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'music-mobile.png') });
  }
  await direct.context().close();

  const failure = await newPage();
  await failure.route('**/*.mp3', (route) => route.fulfill({ status: 404, body: '' }));
  await ready(failure, '?page=family');
  await failure.locator('[data-music-control]').click();
  await failure.waitForSelector('[data-music-state="error"]');
  await failure.getByRole('button', { name: 'Next page', exact: true }).click();
  await failure.unroute('**/*.mp3');
  await failure.locator('[data-music-control]').click();
  await playing(failure);
  await failure.context().close();

  const rapid = await newPage();
  let release;
  await rapid.route('**/audio/classic.mp3', (route) => { release = () => route.continue(); });
  await ready(rapid, '?page=family');
  await rapid.locator('[data-music-control]').click();
  await rapid.waitForTimeout(100);
  await changeTheme(rapid, 'navy');
  await playing(rapid);
  await release?.().catch(() => {});
  await rapid.waitForTimeout(200);
  assert.equal(await countSources(rapid), 1, 'late superseded download cannot start');
  await rapid.context().close();

  const reduced = await newPage({ reducedMotion: 'reduce' });
  await reduced.context().addInitScript((key) => sessionStorage.setItem(key, 'true'), MUSIC_STORAGE_KEY);
  const mutedRequests = [];
  reduced.on('request', (request) => { if (request.url().endsWith('.mp3')) mutedRequests.push(request.url()); });
  await ready(reduced);
  await reduced.locator('[data-intro-open]').click();
  await reduced.waitForSelector('[data-cinematic-intro="complete"]');
  assert.deepEqual(mutedRequests, []);
  await reduced.context().close();
  assert.deepEqual(errors, []);
  console.log('Passed touch/control geometry, silent deep links, failed-track recovery, stale-download cancellation and remembered mute with reduced motion; no browser errors.');
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
