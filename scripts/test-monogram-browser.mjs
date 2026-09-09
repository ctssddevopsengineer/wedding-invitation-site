import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL || 'chrome'});
const errors=[];
try {
 const page=await browser.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await fs.mkdir('/tmp/wedding-monogram-qa',{recursive:true});
 for(const width of [390,1440]) {
 await page.setViewportSize({width,height:1000});
 await page.goto(process.env.TEST_URL || 'http://127.0.0.1:3000');
 await page.waitForSelector('main[data-theme-ready="true"]');
 if(await page.locator('[data-intro-skip]').isVisible()) await page.locator('[data-intro-skip]').click();
 await page.waitForSelector('[data-cinematic-intro="complete"]');
 await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
 for(const theme of ['classic','blush','magenta','navy','plum','saffron']) for(const name of ['front','family','details','back']) for(const language of ['en','bn','ne']) {
 await page.evaluate(search=>{history.pushState({},'',search);dispatchEvent(new PopStateEvent('popstate'));},`?theme=${theme}&page=${name}&lang=${language}`);
 await page.waitForSelector(`main[data-theme-ready="true"][data-invitation-theme="${theme}"][lang="${language}"]`);
 await page.waitForSelector(`.bookStage.page-${({family:'inside-left',details:'inside-right'})[name]||name}`);
 await page.locator('.invitePage img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
 const count=theme==='classic'&&name==='details'?0:1;
 assert.equal(await page.locator('.weddingMonogram > picture > img').count(),count);
 if(count) {
 const issues=await page.evaluate(()=>{
 const image=document.querySelector('.weddingMonogram > picture > img'); const r=image.getBoundingClientRect();const card=document.querySelector('.invitePage').getBoundingClientRect();const issues=[];
 if(!image.naturalWidth||!image.currentSrc.endsWith('/images/wedding-monogram.webp')) issues.push('wrong or missing image');
 const axis = document.querySelector('.weddingMonogram--insideRight') ? ({magenta: .516, navy: .52, plum: .52, saffron: .515}[document.querySelector('main').dataset.invitationTheme] ?? .5) : .5;
 if(Math.abs((r.left+r.right)/2 - (card.left+card.width*axis))>1) issues.push('off ornament center');
 if(Math.abs(r.width-r.height)>1) issues.push('distorted');
 if(r.left<card.left||r.right>card.right||r.top<card.top||r.bottom>card.bottom) issues.push('outside card');
 for(const heading of document.querySelectorAll('.invitePage h1,.invitePage h2')) {const h=heading.getBoundingClientRect();if(r.left<h.right&&r.right>h.left&&r.top<h.bottom&&r.bottom>h.top) issues.push('heading overlap: '+heading.className);}
 return issues;
 });
 if(issues.length) errors.push(`${width}/${theme}/${name}/${language}: ${issues.join(', ')}`);
 }
 await page.locator('.invitePage').screenshot({path:`/tmp/wedding-monogram-qa/${width}-${theme}-${name}-${language}.png`});
 }
 }
 assert.deepEqual(errors,[]);
 console.log('144 theme/page/language/viewport checks passed.');
} finally {await browser.close();}
