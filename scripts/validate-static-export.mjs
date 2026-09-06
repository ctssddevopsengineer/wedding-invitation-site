import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const outDir = path.resolve(process.cwd(), 'out');
const expectedBasePath = String(process.env.NEXT_PUBLIC_BASE_PATH ?? '')
  .trim()
  .replace(/\/$/, '');

function fail(message) {
  console.error(`Static export validation failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(outDir)) fail('out/ directory does not exist');

const indexPath = path.join(outDir, 'index.html');
if (!fs.existsSync(indexPath)) fail('out/index.html does not exist');

const textExtensions = new Set(['.html', '.js', '.css', '.json', '.txt', '.xml', '.webmanifest']);
const unresolved = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }

    if (!textExtensions.has(path.extname(entry.name))) continue;
    const source = fs.readFileSync(absolute, 'utf8');
    const matches = [...source.matchAll(/{{([A-Z0-9_]+)}}/g)].map((match) => match[1]);
    if (matches.length) {
      unresolved.push({
        file: path.relative(outDir, absolute),
        keys: [...new Set(matches)]
      });
    }
  }
}

walk(outDir);

if (unresolved.length) {
  const detail = unresolved
    .map(({ file, keys }) => `${file}: ${keys.join(', ')}`)
    .join('; ');
  fail(`unresolved invitation placeholders found (${detail})`);
}

const indexHtml = fs.readFileSync(indexPath, 'utf8');
if (expectedBasePath) {
  const expectedNextPrefix = `${expectedBasePath}/_next/`;
  if (!indexHtml.includes(expectedNextPrefix)) {
    fail(`index.html does not contain the expected GitHub Pages asset prefix ${expectedNextPrefix}`);
  }
}

const requiredPublicAssets = [
  'themes/classic/front.png',
  'themes/blush/front.png',
  'themes/magenta/front.png',
  'themes/navy/front.png',
  'themes/plum/front.png',
  'themes/saffron/front.png',
  'themes/classic/front.webp',
  'themes/blush/front.webp',
  'themes/magenta/front.webp',
  'themes/navy/front.webp',
  'themes/plum/front.webp',
  'themes/saffron/front.webp',
  'images/location-qr.png'
];

for (const relativePath of requiredPublicAssets) {
  if (!fs.existsSync(path.join(outDir, relativePath))) {
    fail(`required public asset is missing from export: ${relativePath}`);
  }
}

console.log(`Static export validation passed${expectedBasePath ? ` for base path ${expectedBasePath}` : ' for root hosting'}.`);
