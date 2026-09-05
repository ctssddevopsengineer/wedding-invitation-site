// Reproducible static WebP companions. Original approved artwork stays unchanged.
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const root = new URL('../public/themes/', import.meta.url);
let before = 0, after = 0;
for (const theme of await fs.readdir(root)) {
  for (const file of await fs.readdir(new URL(`${theme}/`, root))) {
    if (!file.endsWith('.png')) continue;
    const input = new URL(`${theme}/${file}`, root);
    const output = new URL(`${theme}/${file.replace(/\.png$/, '.webp')}`, root);
    const result = await sharp(await fs.readFile(input)).webp({ quality: 85, alphaQuality: 100, effort: 6 }).toFile(fileURLToPath(output));
    before += (await fs.stat(input)).size;
    after += result.size;
  }
}
console.log(JSON.stringify({ originalBytes: before, optimizedBytes: after, reductionPercent: Math.round((1 - after / before) * 100) }));
