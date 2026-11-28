// Build first and start Vite preview before running this production-path check.
import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const base=process.env.ART_PREVIEW_URL||'http://127.0.0.1:5184';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-v8',errors=[],failed=[],results=[];
await mkdir(output,{recursive:true});
try {
 for(const [name,width,height,mobile] of [['desktop',1440,900,false],['phone',390,844,true]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))failed.push([r.status(),r.url()]);});
  await page.addInitScript(()=>localStorage.setItem('oowwww-game-v1',JSON.stringify({position:{x:14,y:42},direction:'down',visited:[],outfits:{itza:{look:'principal',hair:'rubio',glasses:false},leo:{look:'principal'}},dayNight:{mode:'day'},leoVoice:{enabled:false}})));
  await page.goto(base+'/game.html');if(mobile)await page.locator('#start-game').tap();else await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
  const metrics=()=>page.locator('#world').evaluate(c=>{const r=c.getBoundingClientRect();return {width:c.width,height:c.height,cssWidth:r.width,cssHeight:r.height,viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth-innerWidth};});
  await page.locator('#world').focus();await page.keyboard.press('e');await expect(page.locator('.wardrobe-preview')).toBeVisible();
  const original=await page.locator('.wardrobe-preview').evaluate(c=>c.toDataURL());
  await page.getByRole('group',{name:'Color de cabello de Itza',exact:true}).getByRole('button',{name:'Rosa pastel',exact:true}).click();
  expect(await page.locator('.wardrobe-preview').evaluate(c=>c.toDataURL())).not.toBe(original);
  await page.getByRole('group',{name:'Lentes de Itza',exact:true}).getByRole('button',{name:'Con lentes',exact:true}).click();
  await page.getByRole('group',{name:'Conjuntos completos',exact:true}).getByRole('button',{name:'Vestido de novia',exact:true}).click();
  await page.getByRole('group',{name:'Lentes de Itza',exact:true}).getByRole('button',{name:'Sin lentes',exact:true}).click();
  await page.locator('#experience-content').evaluate(element=>{element.scrollTop=0;});
  await page.screenshot({path:output+'/production-'+name+'-wardrobe.png'});await page.locator('#close-experience').click();
  const portrait=await metrics();expect(portrait.overflow).toBeLessThanOrEqual(0);expect(portrait.cssWidth/portrait.width).toBe(portrait.cssHeight/portrait.height);
  if(mobile){await page.setViewportSize({width:844,height:390});await expect.poll(async()=>{const r=await metrics();return Math.abs(r.cssHeight-r.viewport[1])<=3;}).toBe(true);}
  await page.locator('#map-button').click();await expect(page.locator('#map-panel')).toBeVisible();await page.locator('#close-map').click();
  const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({url:new URL(r.name).pathname,bytes:r.encodedBodySize})));
  expect(resources.filter(r=>r.url.includes('/audio/')||r.url.endsWith('.mp3'))).toEqual([]);
  results.push({name,portrait,after:await metrics(),initialResourceBytes:resources.reduce((a,r)=>a+r.bytes,0),audioRequests:0});await page.close();
 }
} finally {await browser.close();}
expect(errors).toEqual([]);expect(failed).toEqual([]);
await writeFile(output+'/production-smoke.json',JSON.stringify({results,errors,failed},null,2)+'\n');console.log(JSON.stringify({results,errors,failed}));
