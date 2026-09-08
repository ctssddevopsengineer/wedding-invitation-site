import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { THEME_IDS, WEDDING_MONOGRAM } from '../lib/theme.mjs';
import { getPageArtworkAssets } from '../lib/artwork.mjs';
import { getThemeWarmupAssets } from '../lib/theme-preload.mjs';

test('shared wedding artwork has real transparency and sufficient detail', async () => {
 const file = new URL('../public/images/wedding-monogram.webp', import.meta.url);
 const image=sharp(await fs.readFile(file));
 const metadata=await image.metadata();
 assert.equal(metadata.hasAlpha,true);
 assert.equal(metadata.width,1254);
 assert.equal(metadata.height,1254);
 const {data,info}=await image.raw().toBuffer({resolveWithObject:true});
 let transparent=0,opaque=0;
 for(let i=3;i<data.length;i+=info.channels) {if(data[i]===0) transparent++;if(data[i]>240) opaque++;}
 assert.ok(transparent/(info.width*info.height)>.4,'parchment must be transparent, not a solid background');
 assert.ok(opaque/(info.width*info.height)>.2,'the detailed emblem must remain visible');
 for(const [x,y] of [[0,0],[1253,0],[0,1253],[1253,1253]]) assert.ok(data[(y*info.width+x)*4+3]<=1, 'corners are visually transparent');
 assert.ok((await fs.stat(file)).size<500_000,'shared asset stays within the loading budget');
});

test('all theme page warmups use the shared emblem without downloading retired crests',()=>{
 for(const theme of THEME_IDS) for(let page=0;page<4;page++) {
 const current=getPageArtworkAssets(theme,page);
 assert.equal(current.includes(WEDDING_MONOGRAM),theme!=='classic'||page!==2);
 const warm=getThemeWarmupAssets(theme,page);
 assert.ok(warm.includes(WEDDING_MONOGRAM));
 assert.ok([...current,...warm].every(url=>!url.includes('/themes/')||!url.includes('monogram')));
 }
});
