import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { normalizeBasePath, withBasePath } from '../lib/public-path.mjs';

test('base path normalization supports root hosting and GitHub Pages project hosting', () => {
  assert.equal(normalizeBasePath(''), '');
  assert.equal(normalizeBasePath('/'), '');
  assert.equal(normalizeBasePath('wedding-invitation-site'), '/wedding-invitation-site');
  assert.equal(normalizeBasePath('/wedding-invitation-site/'), '/wedding-invitation-site');
});

test('public assets receive the deployment base path exactly once', () => {
  assert.equal(withBasePath('/themes/navy/front.png', ''), '/themes/navy/front.png');
  assert.equal(
    withBasePath('/themes/navy/front.png', '/wedding-invitation-site'),
    '/wedding-invitation-site/themes/navy/front.png'
  );
  assert.equal(
    withBasePath('/wedding-invitation-site/themes/navy/front.png', '/wedding-invitation-site'),
    '/wedding-invitation-site/themes/navy/front.png'
  );
  assert.equal(withBasePath('https://example.com/a.png', '/repo'), 'https://example.com/a.png');
});

test('theme engine routes configurable front artwork through the deployment-aware public path helper', () => {
  const themeSource = fs.readFileSync(new URL('../lib/theme.mjs', import.meta.url), 'utf8');
  assert.match(themeSource, /withBasePath/);
  assert.match(themeSource, /frontFile\s*=\s*'front\.png'/);
  assert.match(themeSource, /front:\s*asset\(`\/themes\/\$\{themeId\}\/\$\{frontFile\}`\)/);
});

test('location QR uses the same public-path helper', () => {
  const insideRight = fs.readFileSync(new URL('../components/InsideRight.js', import.meta.url), 'utf8');
  assert.match(insideRight, /withBasePath\('\/images\/location-qr\.png'\)/);
});

test('Next configuration accepts an explicit deployment base path without shorthand', () => {
  const nextConfig = fs.readFileSync(new URL('../next.config.mjs', import.meta.url), 'utf8');
  assert.match(nextConfig, /NEXT_PUBLIC_BASE_PATH/);
  assert.match(nextConfig, /basePath:\s*basePath/);
  assert.doesNotMatch(nextConfig, /^\s*basePath,\s*$/m);
  assert.match(nextConfig, /assetPrefix:/);
});

test('GitHub Pages workflow exports and validates repository-scoped paths', () => {
  const workflow = fs.readFileSync(new URL('../.github/workflows/cd.yml', import.meta.url), 'utf8');
  assert.match(workflow, /NEXT_PUBLIC_BASE_PATH: \/\$\{\{ github\.event\.repository\.name \}\}/);

  // GitHub Actions treats both `out/` and `./out` as the same relative path.
  // Keep this assertion focused on the actual requirement instead of formatting.
  assert.match(workflow, /path:\s+(?:\.\/)?out\/?/);
});
