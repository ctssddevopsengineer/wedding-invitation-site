// Build first. BROWSER_CHANNEL=chrome uses an installed Chrome.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { THEME_IDS } from '../lib/theme.mjs';
import { translate } from '../lib/locale.mjs';

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
  await page.waitForSelector('[data-cinematic-intro="complete"]', { timeout: 16000 });
  await page.waitForFunction(() => document.body.style.overflow !== 'hidden');
  assert.equal(await page.locator('.invitePage').count(), 1, 'only one real invitation page is mounted');
  assert.equal(await page.locator('[data-wedding-particles]').count(), 0, 'particles are removed when the intro finishes');
  assert.equal(await page.evaluate(() => document.body.style.overflow), '', 'scroll lock is released');
}
async function capture(page, name) {
  if (screenshots) await page.screenshot({ path: path.join(screenshots, `${name}.png`) });
}

async function checkCoupleSpace(page) {
  const issues = await page.evaluate(() => {
    const issues = [];
    const caption = document.querySelector('[data-entrance-caption]').getBoundingClientRect();
    const figures = [...document.querySelectorAll('[data-character]')].map((node) => node.getBoundingClientRect());
    if (figures.some((box) => box.top < caption.bottom + 8)) issues.push('characters cover scene text');
    if (figures.some((box) => box.left < 0 || box.right > innerWidth || box.bottom > innerHeight)) issues.push('settled characters outside viewport');
    if (figures[0].left >= figures[1].left) issues.push('characters switched sides');
    if (getComputedStyle(document.querySelector('[data-envelope-scene]')).opacity !== '0') issues.push('invitation text visible behind characters');
    return issues;
  });
  assert.deepEqual(issues, []);
}

async function checkParticles(page) {
  await page.locator('[data-wedding-particles]').waitFor();
  const result = await page.evaluate(() => {
    const field = document.querySelector('[data-wedding-particles]');
    const caption = document.querySelector('[data-entrance-caption]').getBoundingClientRect();
    const compact = innerWidth <= 680;
    const issues = [];
    if (field.querySelectorAll('[data-particle]').length !== (compact ? 8 : 20)) issues.push('particle count exceeds device budget');
    if (field.querySelectorAll('*').length > 80) issues.push('particle DOM exceeds budget');
    if (field.querySelector('img,canvas')) issues.push('unexpected asset or canvas overhead');
    if (getComputedStyle(field).pointerEvents !== 'none') issues.push('particles intercept interaction');
    for (const lane of field.querySelectorAll('[data-particle-lane]')) {
      const box = lane.getBoundingClientRect();
      if (box.top < caption.bottom + 23) issues.push('particles can cross caption text');
      if (getComputedStyle(lane).overflow !== 'hidden') issues.push('particles can escape side lanes');
      if (lane.dataset.particleLane === 'left' && box.right > innerWidth * (compact ? .1 : .16) + 1) issues.push('left lane intrudes into center');
      if (lane.dataset.particleLane === 'right' && box.left < innerWidth * (compact ? .9 : .84) - 1) issues.push('right lane intrudes into center');
    }
    const animations = field.getAnimations({ subtree: true });
    if (!animations.length) issues.push('no decorative animation');
    for (const animation of animations) for (const frame of animation.effect.getKeyframes()) {
      if (Object.keys(frame).some((key) => !['offset', 'computedOffset', 'easing', 'composite', 'transform', 'opacity'].includes(key))) issues.push('non-compositor animation property');
    }
    return issues;
  });
  assert.deepEqual(result, []);
}

async function checkParticleSuspension(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForSelector('[data-wedding-particles][data-paused="true"]', { state: 'attached' });
  await page.locator('[data-wedding-particles]').evaluate((node) => Promise.all(node.getAnimations({ subtree: true }).map((animation) => animation.ready)));
  const sample = () => page.locator('[data-wedding-particles]').evaluate((node) => node.getAnimations({ subtree: true }).map((animation) => ({ time: animation.currentTime, state: animation.playState })));
  const before = await sample();
  assert.ok(before.every((animation) => animation.state === 'paused'));
  await page.waitForTimeout(150);
  assert.deepEqual(await sample(), before, 'hidden-tab particle timelines stop advancing');
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForSelector('[data-wedding-particles][data-paused="false"]');
}

async function sampleParticleFrameTimes(page) {
  const results = await page.evaluate(async () => {
    const field = document.querySelector('[data-wedding-particles]');
    async function sample(hidden) {
      field.style.display = hidden ? 'none' : '';
      const intervals = [];
      let previous;
      await new Promise((resolve) => {
        function frame(time) {
          if (previous !== undefined) intervals.push(time - previous);
          previous = time;
          if (intervals.length >= 45) resolve(); else requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
      intervals.sort((a, b) => a - b);
      return { median: intervals[22], p95: intervals[42] };
    }
    const without = await sample(true), withParticles = await sample(false);
    return { without, withParticles };
  });
  console.log(`Local Chrome frame intervals, particles hidden/visible (ms): ${JSON.stringify(results)}.`);
}

try {
  if (screenshots) await fs.mkdir(screenshots, { recursive: true });
  browser = await chromium.launch({ headless: true, args: ['--mute-audio'], ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });

  // A cold visitor can queue opening before hydration, and theme downloads
  // must not disable the primary action after hydration either.
  const cold = await newPage({ reducedMotion: 'reduce' });
  const scriptsHeld = [];
  await cold.route('**/*.js', route => { scriptsHeld.push(route); });
  await cold.goto(url, { waitUntil: 'domcontentloaded' });
  assert.equal(await cold.locator('[data-intro-open]').isDisabled(), false, 'server-rendered opening action is enabled');
  await Promise.all(scriptsHeld.map(route => route.continue()));
  await cold.unroute('**/*.js');
  await cold.waitForSelector('main[data-theme-ready="true"]');
  const artworkHeld = [];
  await cold.route('**/themes/navy/**', route => { artworkHeld.push(route); });
  await cold.locator('[data-intro-theme]').click();
  await cold.getByRole('option', { name: 'Royal Navy', exact: true }).click();
  await cold.waitForSelector('[data-intro-theme][aria-busy="true"]');
  assert.equal(await cold.locator('[data-intro-open]').isDisabled(), false, 'pending artwork does not block opening');
  await cold.locator('[data-intro-open]').click();
  await complete(cold);
  await Promise.all(artworkHeld.map(route => route.continue()));
  await cold.unroute('**/themes/navy/**');
  await cold.waitForSelector('main[data-invitation-theme="navy"]');
  await cold.context().close();

  // Menus stay attached to their fields at desktop and phone sizes.
  for (const viewport of [{ width: 390, height: 844 }, { width: 240, height: 320 }, { width: 1366, height: 900 }]) {
    const page = await newPage({ viewport });
    await ready(page, '?lang=en');
    for (const selector of ['[data-intro-language]', '[data-intro-theme]']) {
      const trigger = page.locator(selector);
      await trigger.click();
      const menu = page.getByRole('listbox');
      const fieldBox = await trigger.boundingBox();
      const menuBox = await menu.boundingBox();
      assert.ok(Math.abs(fieldBox.x - menuBox.x) < 2, 'menu aligns with field');
      assert.ok(Math.min(Math.abs(menuBox.y - fieldBox.y - fieldBox.height), Math.abs(fieldBox.y - menuBox.y - menuBox.height)) < 8, 'menu stays next to field');
      assert.ok(menuBox.y >= 0 && menuBox.y + menuBox.height <= viewport.height, 'menu stays within viewport');
      await page.keyboard.press('ArrowDown');
      assert.equal(await page.locator(':focus').getAttribute('role'), 'option');
      await page.keyboard.press('Escape');
      assert.equal(await menu.count(), 0);
      assert.equal(await page.locator('[data-cinematic-intro="closed"]').count(), 1, 'Escape does not skip the intro');
      await trigger.click();
      await page.keyboard.press('Tab');
      assert.equal(await menu.count(), 0);
      const next = selector.includes('language') ? '[data-intro-theme]' : '[data-intro-open]';
      assert.equal(await page.locator(next).evaluate(node => node === document.activeElement), true);
    }
    await page.locator('[data-intro-language]').click();
    await page.getByRole('option', { name: 'বাংলা', exact: true }).click();
    await page.waitForFunction(() => document.documentElement.lang === 'bn');
    await page.context().close();
  }

  // Full sequence for every theme: the exact same FrontCover DOM node survives.
  for (const theme of THEME_IDS) {
    const page = await newPage({ viewport: { width: 1366, height: 900 } });
    await ready(page, `?theme=${theme}&lang=en&guest=family#invite`);
    await page.locator('[data-intro-open]').waitFor();
    assert.equal(await page.locator('[role="dialog"]').count(), 1);
    assert.equal(await page.locator('.frontCover').count(), 1);
    await page.locator('.frontCover img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
    await page.evaluate(() => { window.originalFrontCover = document.querySelector('.frontCover'); });
    assert.equal(await page.locator('[data-intro-open]').evaluate((node) => node === document.activeElement), true);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('[data-intro-theme]').evaluate((node) => node === document.activeElement), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('[data-intro-open]').evaluate((node) => node === document.activeElement), true);
    await page.keyboard.press('End');
    await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' })));
    assert.equal(new URL(page.url()).searchParams.get('page'), 'front');
    if (theme === 'classic') await capture(page, 'desktop-closed');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-cinematic-intro="opening"]');
    await page.waitForSelector('[data-cinematic-intro="rising"]');
    const startTop = await page.locator('.frontCover').evaluate((node) => node.getBoundingClientRect().top);
    await page.waitForFunction((start) => document.querySelector('.frontCover').getBoundingClientRect().top < start - 40, startTop);
    if (theme === 'classic') await capture(page, 'desktop-rising');
    await page.waitForSelector('[data-cinematic-intro="walking"]');
    assert.equal(await page.locator('[data-wedding-particles]').count(), 0, 'petals wait until the couple meets');
    await page.evaluate(() => { window.walkAnimations = [...document.querySelectorAll('[data-character]')].map((node) => node.getAnimations()[0]); });
    assert.equal(await page.locator('[data-wedding-scene]').getAttribute('data-characters'), 'ready');
    const startPositions = await page.locator('[data-character]').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().left));
    await page.waitForFunction(([left, right]) => {
      const nodes = document.querySelectorAll('[data-character]');
      return nodes[0].getBoundingClientRect().left > left + 50 && nodes[1].getBoundingClientRect().left < right - 50;
    }, startPositions);
    if (theme === 'classic') await capture(page, 'desktop-walking');
    await page.waitForSelector('[data-cinematic-intro="together"]');
    await page.evaluate(() => Promise.all(window.walkAnimations.map((animation) => animation.finished)));
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('[data-character]')].every((node, index) => node.getAnimations()[0] === window.walkAnimations[index])), true, 'walking animations are retained at the meeting, not restarted');
    await checkParticles(page);
    const particleField = await page.locator('[data-wedding-particles]').elementHandle();
    assert.ok(particleField, 'particle field exists when the couple meets');
    const particlesSurviveReveal = page.waitForFunction(
      (field) => document.querySelector('[data-cinematic-intro="revealing"]') && field === document.querySelector('[data-wedding-particles]'),
      particleField,
      { timeout: 5000 }
    );
    await checkCoupleSpace(page);
    const stopped = await page.locator('[data-character]').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().left));
    await page.waitForTimeout(350);
    assert.deepEqual(await page.locator('[data-character]').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().left)), stopped, 'the couple stops for the pause');
    if (theme === 'classic') {
      await checkParticleSuspension(page);
      await sampleParticleFrameTimes(page);
    }
    if (theme === 'classic') await capture(page, 'desktop-together');
    await particlesSurviveReveal;
    await complete(page);
    assert.equal(await page.evaluate(() => window.originalFrontCover === document.querySelector('.frontCover')), true, 'FrontCover must not be cloned or remounted');
    assert.equal(await page.locator('.bookStage').evaluate((node) => node === document.activeElement), true);
    assert.equal(new URL(page.url()).searchParams.get('guest'), 'family');
    assert.equal(new URL(page.url()).hash, '#invite');
    assert.equal(await page.locator('audio,video').count(), 0);
    if (theme === 'classic') await capture(page, 'desktop-revealed');
    await page.locator('.frontCover .openButton').click();
    await page.locator('.familyBlessingsTemplate').waitFor();
    await page.getByRole('button', { name: 'Next page', exact: true }).click();
    await page.locator('.exactInsideRight').waitFor();
    await page.getByRole('button', { name: 'Next page', exact: true }).click();
    await page.locator('.heritageBackCover').waitFor();
    await page.locator('[data-intro-replay]').click();
    await page.waitForSelector('[data-cinematic-intro="closed"]');
    assert.equal(new URL(page.url()).searchParams.get('page'), 'front');
    await page.locator('[data-intro-skip]').click();
    await complete(page);
    await page.reload();
    await complete(page);
    assert.equal(await page.locator('[data-intro-open]').count(), 0, 'session completion avoids forced repeat intros');
    await page.context().close();
    console.log(`Verified full opening, single FrontCover, navigation and replay: ${theme}.`);
  }

  // Touch, short landscape screens and every theme at each device size.
  for (const [width, height] of [[240, 320], [640, 360], [320, 480], [320, 568], [390, 844], [768, 1024], [1366, 768], [1920, 1080], [844, 390]]) {
    for (const theme of THEME_IDS) {
      const page = await newPage({ viewport: { width, height }, hasTouch: true });
      const sceneRequests = [];
      page.on('request', (request) => { if (request.url().includes('/intro/wedding-scene')) sceneRequests.push(request.url()); });
      await ready(page, `?theme=${theme}`);
      const issues = await page.evaluate(() => {
        const issues = [];
        const dialog = document.querySelector('[data-cinematic-intro="closed"]');
        if (dialog.scrollWidth > innerWidth + 1) issues.push('horizontal intro overflow');
        for (const button of dialog.querySelectorAll('[data-intro-control]')) {
          const box = button.getBoundingClientRect();
          if (box.x < 0 || box.y < 0 || box.right > innerWidth || box.bottom > innerHeight || box.height < 44) issues.push('inaccessible control');
        }
        return issues;
      });
      assert.deepEqual(issues, [], `${width}x${height}/${theme}`);
      if (theme === 'classic') await capture(page, `closed-${width}x${height}`);
      await page.locator('[data-intro-open]').tap();
      await page.waitForSelector('[data-cinematic-intro="opening"]');
      if (theme === 'classic') {
        await page.waitForSelector('[data-cinematic-intro="walking"]');
        assert.equal(await page.locator('[data-wedding-particles]').count(), 0);
        const distance = await page.locator('[data-character="bride"]').evaluate((node) => Math.abs(new DOMMatrixReadOnly(getComputedStyle(node).transform).m41));
        assert.ok(distance < (width <= 680 ? 70 : 400), 'phone walking distance is automatically shortened');
        await page.waitForSelector('[data-cinematic-intro="together"]');
        await checkParticles(page);
        assert.ok(sceneRequests.some((request) => request.endsWith(width <= 680 ? '/wedding-scene-mobile.webp' : '/wedding-scene.webp')));
        if (width <= 680) assert.equal(sceneRequests.some((request) => request.endsWith('/wedding-scene.webp')), false, 'phones do not download the desktop backdrop');
        await checkCoupleSpace(page);
        await capture(page, `together-${width}x${height}`);
      }
      await page.locator('[data-intro-skip]').tap();
      await complete(page);
      await page.context().close();
    }
    console.log(`Verified six themes and touch/skip controls: ${width}x${height}.`);
  }

  const page = await newPage();
  // Skip works at each phase; cancelled timers cannot advance a fresh replay.
  for (const phase of ['closed', 'opening', 'rising', 'scene', 'walking', 'together', 'revealing']) {
    await ready(page);
    if (!(await page.locator('[data-intro-open]').count())) await page.locator('[data-intro-replay]').click();
    if (phase !== 'closed') await page.locator('[data-intro-open]').click();
    await page.waitForSelector(`[data-cinematic-intro="${phase}"]`);
    await page.locator('[data-intro-skip]').click();
    await complete(page);
  }
  await page.locator('[data-intro-replay]').click();
  await page.waitForTimeout(3200);
  assert.equal(await page.locator('[data-cinematic-intro="closed"]').count(), 1);
  await page.keyboard.press('Escape');
  await complete(page);
  // History navigation dismisses the overlay and honors the target immediately.
  await page.locator('[data-intro-replay]').click();
  await page.evaluate(() => { history.pushState({}, '', '?theme=navy&page=location&lang=bn'); dispatchEvent(new PopStateEvent('popstate')); });
  await complete(page);
  assert.equal(await page.locator('.exactLocationHotspot').getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('main').getAttribute('data-invitation-theme'), 'navy');
  await page.context().close();

  for (const language of ['en', 'bn', 'ne']) {
    const page = await newPage({ reducedMotion: 'reduce' });
    const requests = [];
    page.on('request', (request) => { if (request.url().includes('/intro/')) requests.push(request.url()); });
    await ready(page, `?theme=plum&lang=${language}`);
    assert.equal((await page.locator('[data-intro-open]').innerText()).replace(/\s+/g, ' '), `${translate(language, 'Open Invitation')} →`);
    const started = Date.now();
    await page.locator('[data-intro-open]').click();
    await complete(page);
    assert.ok(Date.now() - started < 1500, 'reduced motion bypasses all choreography');
    assert.deepEqual(requests, [], 'reduced motion does not download decorative character assets');
    await page.context().close();
  }

  const fallback = await newPage();
  await fallback.context().addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
  });
  await fallback.route('**/themes/**', (route) => route.abort());
  await ready(fallback, '?theme=saffron');
  await fallback.locator('[data-intro-open]').click();
  await complete(fallback); // Artwork failure cannot strand the user.
  await fallback.locator('[data-intro-replay]').click();
  await fallback.locator('[data-intro-open]').click();
  await fallback.emulateMedia({ reducedMotion: 'reduce' });
  await complete(fallback);
  await fallback.context().close();

  for (const asset of ['groom', 'bride']) {
    const page = await newPage();
    await page.route(`**/intro/${asset}.webp`, (route) => route.abort());
    await ready(page);
    await page.locator('[data-intro-open]').click();
    await page.waitForSelector('[data-cinematic-intro="complete"]', { timeout: 6500 });
    await complete(page);
    await page.locator('.frontCover .openButton').click();
    await page.locator('.familyBlessingsTemplate').waitFor();
    await page.context().close();
  }
  const slow = await newPage();
  const held = [];
  await slow.route('**/intro/bride.webp', (route) => { held.push(route); });
  await ready(slow);
  await slow.locator('[data-intro-open]').click();
  await slow.waitForSelector('[data-cinematic-intro="complete"]', { timeout: 6500 });
  await complete(slow);
  await Promise.all(held.map((route) => route.abort().catch(() => {})));
  await slow.context().close();

  const backgroundFallback = await newPage();
  await backgroundFallback.route('**/intro/wedding-scene.webp', (route) => route.abort());
  await ready(backgroundFallback);
  await backgroundFallback.locator('[data-intro-open]').click();
  await backgroundFallback.waitForSelector('[data-cinematic-intro="walking"]');
  assert.equal(await backgroundFallback.locator('[data-wedding-scene]').getAttribute('data-characters'), 'ready');
  await backgroundFallback.emulateMedia({ reducedMotion: 'reduce' });
  await complete(backgroundFallback);
  await backgroundFallback.context().close();

  const resizing = await newPage({ viewport: { width: 1366, height: 900 } });
  await ready(resizing);
  await resizing.locator('[data-intro-open]').click();
  await resizing.waitForSelector('[data-cinematic-intro="together"]');
  await checkParticles(resizing);
  await resizing.setViewportSize({ width: 390, height: 844 });
  await resizing.waitForSelector('[data-wedding-particles][data-compact="true"]');
  await checkParticles(resizing);
  await resizing.locator('[data-entrance-caption] h2').evaluate((node) => { node.textContent = 'One beautiful journey. Together with our families, we warmly welcome you.'; });
  await resizing.waitForFunction(() => document.querySelector('[data-particle-lane]').getBoundingClientRect().top >= document.querySelector('[data-entrance-caption]').getBoundingClientRect().bottom + 23);
  await checkParticles(resizing);
  await resizing.emulateMedia({ reducedMotion: 'reduce' });
  await complete(resizing);
  await resizing.context().close();

  for (const language of ['bn', 'ne']) {
    const page = await newPage({ viewport: { width: 320, height: 480 } });
    await ready(page, `?lang=${language}`);
    await page.locator('[data-intro-open]').click();
    await page.waitForSelector('[data-cinematic-intro="together"]');
    await checkParticles(page);
    await checkCoupleSpace(page);
    await capture(page, `together-320x480-${language}`);
    await complete(page);
    await page.context().close();
  }

  for (const target of ['family', 'details', 'location', 'back']) {
    const page = await newPage();
    await ready(page, `?theme=blush&page=${target}&lang=bn`);
    await complete(page);
    assert.equal(new URL(page.url()).searchParams.get('page'), target);
    assert.equal(await page.locator('[data-intro-open]').count(), 0);
    await page.context().close();
  }
  assert.deepEqual(errors, []);
  console.log('Passed six full theme sequences, 54 responsive envelope combinations, seven responsive walking scenes, keyboard/touch, skip/replay, deep links, reduced motion, missing/late assets, particle density/center clearance, resize/text reflow, hidden-tab suspension and cleanup; no browser errors.');
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
