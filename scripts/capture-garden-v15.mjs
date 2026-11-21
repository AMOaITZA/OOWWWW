import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173',output=process.env.ART_CAPTURE_DIR||'docs/qa-garden-v15';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],failed=[],screenshots=[],layouts=[];
async function shot(page,name){await page.screenshot({path:output+'/'+name+'.png'});screenshots.push(name+'.png');}
try{
 for(const [name,width,height,look,hair] of [['desktop',1440,900,'principal','rosa'],['phone',390,844,'boda','rubio'],['landscape',844,390,'alternativo','cafe']]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:name!=='desktop'});
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/game/')&&r.status()>=400)failed.push(r.url());});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(({look,hair})=>{if(sessionStorage.getItem('gardenSeed'))return;sessionStorage.setItem('gardenSeed','yes');localStorage.setItem('oowwww-game-v1',JSON.stringify({position:{x:37,y:53},direction:'down',visited:[],outfits:{leo:{look,glasses:false},itza:{look,hair,glasses:false}},leoVoice:{enabled:false},soundEffects:{enabled:false},dayNight:{mode:'day'}}));},{look,hair});
  await page.goto(base+'/game.html');await page.locator('#start-game').click();await page.locator('#world').focus();await page.keyboard.press('e');
  await page.getByText('Más en casa',{exact:true}).click();await page.getByRole('button',{name:'Cuidar el huerto',exact:true}).click();
  await expect(page.locator('.garden-scene')).toBeVisible();await page.evaluate(()=>document.fonts.ready);await shot(page,'garden-empty-'+name);
  if(name==='desktop'){
   await page.locator('.garden-plot[data-garden-plot="4"]').click();await page.locator('[data-garden-seed="cosmos"]').click();await page.locator('.garden-primary').click();
   await expect(page.locator('.garden-primary')).toHaveText('Regar las flores');await page.locator('.garden-primary').click();await page.waitForTimeout(700);await shot(page,'garden-watering-'+name);
   await expect(page.locator('.garden-primary')).toHaveText('Recoger flores',{timeout:16000});await shot(page,'garden-bloom-'+name);
   await page.locator('.garden-primary').click();await page.locator('.garden-decor-toggle').click();await page.locator('[data-garden-decoration="cosmos"]').click();await shot(page,'garden-decoration-'+name);
   await page.locator('.garden-go-home').click();await expect(page.locator('.home-scene')).toHaveAttribute('data-flower-decoration','cosmos');await shot(page,'home-cosmos-vase-'+name);
  }else{
   await page.locator('.garden-primary').click();await expect(page.locator('.garden-primary')).toHaveText('Regar las flores');await page.locator('.garden-primary').click();
   await expect(page.locator('.garden-primary')).toHaveText('Recoger flores',{timeout:16000});await shot(page,'garden-bloom-'+name);
   const positions=await page.locator('.garden-trip button,#close-experience,.scene-camera-button').evaluateAll(elements=>elements.filter(el=>el.offsetWidth&&el.offsetHeight).map(el=>{const r=el.getBoundingClientRect();return {text:el.textContent,aria:el.getAttribute('aria-label'),x:r.x,y:r.y,w:r.width,h:r.height};}));layouts.push({name,width,height,positions});
  }
  await page.close();
 }
 expect(errors).toEqual([]);expect(failed).toEqual([]);
 await fs.writeFile(output+'/result.json',JSON.stringify({screenshots,errors,failed,layouts,note:'Actual user controls; no garden progress injected. All three views grow flowers under reduced motion. Desktop harvest creates a vase and opens the actual house.'},null,2)+'\n');console.log(JSON.stringify({screenshots,errors,failed,layouts}));
}finally{await browser.close();}
