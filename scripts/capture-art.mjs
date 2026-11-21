// Repeatable real browser evidence. Start Vite first; BASELINE_URL optionally
// points to the previous revision running in a separate checkout.
import {chromium} from '@playwright/test';
import {mkdir,readFile} from 'node:fs/promises';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const baseline=process.env.BASELINE_URL;
const output=process.env.ART_CAPTURE_DIR||'docs/qa-art';
await mkdir(output,{recursive:true});
const browser=await chromium.launch(process.env.ART_CHROMIUM_PATH?{executablePath:process.env.ART_CHROMIUM_PATH,args:['--no-sandbox']}:{headless:true});
const places=JSON.parse(await readFile(new URL('../game/data/places.json',import.meta.url),'utf8'));
const errors=[];
async function enter(page,url,position,outfits={leo:{},itza:{}}){
 await page.addInitScript(({position,outfits})=>{
  Math.random=()=>.15;
  localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',outfits,visited:[]}));
 },{position,outfits});
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(url+'/game.html');await page.locator('#start-game').click();await page.evaluate(()=>document.fonts.ready);
}
for(const [version,url] of [...(baseline?[['before',baseline]]:[]),['after',base]]){
 for(const mobile of [false,true]){
  const size=mobile?{width:375,height:812}:{width:1440,height:1000};
  const label=mobile?'mobile':'desktop';
  const castle=places.find(place=>place.id==='boda');
  const position=version==='before'?{x:105,y:56}:{x:castle.arrival[0],y:castle.arrival[1]};
  const page=await browser.newPage({viewport:size,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
  await enter(page,url,position);await page.screenshot({path:`${output}/${version}-castle-${label}.png`});
  if(version==='after')await page.keyboard.press('e');
  else await page.locator('#world').dispatchEvent('pointerdown',await page.locator('#world').evaluate(c=>{const r=c.getBoundingClientRect();return {clientX:r.left+r.width/2,clientY:r.top+55*r.height/270};}));
  await page.locator('.wedding-cinema').waitFor({state:'visible'});
  await page.screenshot({path:`${output}/${version}-wedding-${label}.png`});
  if(version==='after')for(let stage=0;stage<6;stage++){
   await page.locator('.wedding-cinema').screenshot({path:`${output}/chapter-${stage+1}-${label}.png`});
   if(stage<5)await page.getByRole('button',{name:'Siguiente',exact:true}).click();
  }
  await page.close();
  const benchPage=await browser.newPage({viewport:size,isMobile:mobile,hasTouch:mobile});
  await enter(benchPage,url,{x:24,y:33});await benchPage.keyboard.press('e');await benchPage.waitForTimeout(700);
  await benchPage.screenshot({path:`${output}/${version}-bench-${label}.png`});await benchPage.close();
  if(version==='after'){
   const wardrobe=await browser.newPage({viewport:size,isMobile:mobile,hasTouch:mobile});
   await enter(wardrobe,url,{x:14,y:42},{leo:{look:'alternativo'},itza:{look:'alternativo'}});
   await wardrobe.screenshot({path:`${output}/after-alternates-${label}.png`});await wardrobe.keyboard.press('e');
   await wardrobe.locator('.wardrobe-preview').waitFor({state:'visible'});
   await wardrobe.screenshot({path:`${output}/after-wardrobe-${label}.png`});await wardrobe.close();
  }
 }
}
await browser.close();console.log(JSON.stringify({output,errors}));if(errors.length)process.exitCode=1;
