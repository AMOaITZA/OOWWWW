// Run Vite first. Captures use real controls and the current renderer.
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-customization-v5';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[];
async function enter({position={x:14,y:42},look='principal',hair='negro',mobile=false}={}){
  const page=await browser.newPage({viewport:mobile?{width:375,height:812}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(({position,look,hair})=>{
    Math.random=()=>.15;
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',outfits:{leo:{look:'principal'},itza:{look,hair}},visited:[],dayNight:{mode:'day',cycleStartedAt:Date.now()}}));
  },{position,look,hair});
  await page.goto(base+'/game.html');await page.locator('#start-game').click();await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(250);return page;
}
async function openWardrobe(page){await page.locator('#world').focus();await page.keyboard.press('e');await page.locator('.wardrobe-preview').waitFor({state:'visible'});}
for(const [slug,look,hair] of [['black-main','principal','negro'],['pink-main','principal','rosa'],['brown-alternate','alternativo','cafe'],['blonde-wedding','boda','rubio']]){
  const page=await enter({look,hair});await openWardrobe(page);
  await page.locator('.wardrobe-layout').screenshot({path:`${output}/hair-${slug}-desktop.png`});await page.close();
}
{
  const page=await enter({position:{x:30,y:22},hair:'rosa'});
  await page.screenshot({path:`${output}/world-day-desktop.png`});
  await page.locator('#day-night-night').click();await page.waitForTimeout(100);
  await page.screenshot({path:`${output}/world-night-desktop.png`});await page.close();
}
{
  const page=await enter({position:{x:24,y:33},hair:'rosa'});await page.keyboard.press('e');await page.waitForTimeout(550);
  await page.locator('#world').screenshot({path:`${output}/bench-pink-desktop.png`});await page.close();
}
{
  const page=await enter({position:{x:105,y:54},look:'boda',hair:'rubio'});await page.keyboard.press('e');await page.locator('.wedding-cinema').waitFor({state:'visible'});
  for(let chapter=0;chapter<6;chapter++){
    if(chapter===2||chapter===5)await page.locator('.wedding-cinema').screenshot({path:`${output}/wedding-blonde-${chapter===2?'kiss':'seated'}-desktop.png`});
    if(chapter<5)await page.getByRole('button',{name:'Siguiente',exact:true}).click();
  }
  await page.close();
}
{
  const page=await enter({hair:'rosa',mobile:true});await openWardrobe(page);
  await page.getByRole('group',{name:'Color de cabello de Itza',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/hair-pink-mobile.png`});await page.close();
}
{
  const page=await enter({position:{x:30,y:22},look:'alternativo',hair:'cafe',mobile:true});
  await page.screenshot({path:`${output}/world-day-mobile.png`});await page.close();
}
{
  const page=await enter({position:{x:24,y:33},look:'boda',hair:'rubio',mobile:true});
  await page.locator('#day-night-night').tap();await page.locator('#world').focus();await page.keyboard.press('e');await page.waitForTimeout(550);
  await page.screenshot({path:`${output}/bench-night-mobile.png`});await page.close();
}
await browser.close();console.log(JSON.stringify({output,errors}));if(errors.length)process.exitCode=1;
