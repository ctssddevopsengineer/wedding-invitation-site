import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const css = fs.readFileSync(new URL('../app/royal-navy-mobile-monogram-fix.css', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../app/layout.js', import.meta.url), 'utf8');
const monogramPath = fileURLToPath(new URL('../public/themes/navy/inside-right-monogram.png', import.meta.url));
const insideRightPath = fileURLToPath(new URL('../public/themes/navy/inside-right.png', import.meta.url));

test('Royal Navy mobile monogram clearance stylesheet loads after overlap fixes', () => {
  assert.match(layout, /import '\.\/mobile-overlap-fixes\.css';\s*\nimport '\.\/royal-navy-mobile-monogram-fix\.css';/);
});

test('Royal Navy mobile inside-right monogram uses a measured parchment-centre correction and clears the flower', () => {
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*?data-invitation-theme="navy"\] \.insideRightThemeMonogram\s*\{[\s\S]*?left:\s*50%\s*!important[\s\S]*?top:\s*4\.35%\s*!important[\s\S]*?width:\s*15\.4%\s*!important[\s\S]*?max-height:\s*7\.0%\s*!important[\s\S]*?transform:\s*translateX\(calc\(-50% \+ \.35cqw\)\)\s*!important/);
});

test('Royal Navy Samsung A55-class monogram keeps extra flower clearance', () => {
  assert.match(css, /@media \(min-width: 361px\) and \(max-width: 430px\)[\s\S]*?data-invitation-theme="navy"\] \.insideRightThemeMonogram\s*\{[\s\S]*?top:\s*4\.45%\s*!important[\s\S]*?width:\s*15\.6%\s*!important/);
});

test('Royal Navy narrow-phone monogram remains centred below the flower', () => {
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*?data-invitation-theme="navy"\] \.insideRightThemeMonogram\s*\{[\s\S]*?top:\s*4\.5%\s*!important[\s\S]*?width:\s*15\.8%\s*!important/);
});

test('Royal Navy monogram artwork itself is optically centred', async () => {
  const metadata = await sharp(monogramPath).metadata();
  const { info } = await sharp(monogramPath).trim({ threshold: 10 }).png().toBuffer({ resolveWithObject: true });
  const imageCenter = metadata.width / 2;
  const visibleCenter = -(info.trimOffsetLeft ?? 0) + info.width / 2;
  const offset = visibleCenter - imageCenter;
  assert.ok(Math.abs(offset) <= 2, `monogram artwork itself should be optically centred; offset=${offset}`);
});

test('Royal Navy mobile X correction matches the measured parchment visual centre', async () => {
  const { data, info } = await sharp(insideRightPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let sumX = 0;
  let count = 0;
  const yStart = Math.floor(info.height * 0.08);
  const yEnd = Math.floor(info.height * 0.72);
  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * info.channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (luminance >= 185 && r >= g - 15 && g >= b - 30) {
        sumX += x;
        count += 1;
      }
    }
  }
  assert.ok(count > 1000, 'expected enough light parchment pixels to measure its visual centre');
  const weightedCenter = sumX / count;
  const pageCenter = (info.width - 1) / 2;
  const measuredOffsetPx = weightedCenter - pageCenter;
  const cssCorrectionPx = info.width * 0.0035;
  assert.ok(measuredOffsetPx > 0, `parchment visual centre should sit right of page centre; offset=${measuredOffsetPx}`);
  assert.ok(Math.abs(cssCorrectionPx - measuredOffsetPx) <= 1, `CSS correction ${cssCorrectionPx.toFixed(2)}px should closely match measured parchment offset ${measuredOffsetPx.toFixed(2)}px`);
});
