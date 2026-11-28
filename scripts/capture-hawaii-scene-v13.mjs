import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {COAST_LAYOUT} from '../game/coast-layout.js';
import {HAWAII_ZONES} from '../game/hawaii.js';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-hawaii-scene-v13';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],failed=[],screenshots=[];
async function enter(page){
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failed.push([r.status(),r.url()]);});
  await page.emulateMedia({reducedMotion:'no-preference'});await page.clock.install();
  await page.addInitScript(position=>localStorage.setItem('oowwww-game-v1',JSON.stringify({position,outfits:{leo:{look:'principal',glasses:false},itza:{look:'boda',hair:'rosa',glasses:false}},visited:[],leoVoice:{enabled:false},soundEffects:{enabled:false}})),{x:COAST_LAYOUT.hawaiiArrival[0],y:COAST_LAYOUT.hawaiiArrival[1]});
  await page.goto(base+'/game.html');await page.locator('#start-game').click();await page.locator('#world').focus();await page.keyboard.press('e');
  await page.getByRole('button',{name:'Subir al barco · Hawái',exact:true}).click();await expect(page.locator('.hawaii-map')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
}
async function zone(page,id){
  await page.locator('[data-hawaii-destination="'+id+'"]').click();const point=HAWAII_ZONES.find(z=>z.id===id).arrival;
  await expect.poll(async()=>({x:Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-x')),y:Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-y'))}),{timeout:12000}).toEqual(point);
}
async function shot(page,name){await page.screenshot({path:output+'/'+name+'.png'});screenshots.push(name+'.png');}
async function danceShot(page,name){
  await page.getByRole('button',{name:'Bailar con Leo',exact:true}).click();
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+30));await page.clock.runFor(650);
  await expect(page.locator('.hawaii-map')).toHaveAttribute('data-dance-frame','2');
  await shot(page,name);await page.clock.resume();
}
try{
  const desktop=await browser.newPage({viewport:{width:1440,height:1000}});await enter(desktop);
  await shot(desktop,'hawaii-fullscreen-desktop');await zone(desktop,'dance');await danceShot(desktop,'hawaii-dance-desktop');await desktop.close();
  const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await enter(phone);
  await zone(phone,'bar');await shot(phone,'hawaii-bar-phone');await phone.getByRole('button',{name:'Cerrar bebidas',exact:true}).click();
  await zone(phone,'dance');await danceShot(phone,'hawaii-dance-phone');
  await phone.setViewportSize({width:844,height:390});await zone(phone,'giraffe');await phone.getByRole('button',{name:'Acariciar a la jirafa',exact:true}).click();await shot(phone,'hawaii-giraffe-landscape');await phone.close();
  expect(errors).toEqual([]);expect(failed).toEqual([]);
  await fs.writeFile(output+'/result.json',JSON.stringify({screenshots,errors,failed,note:'Actual full-screen game route from the physical harbor; hand-drawn dance pose and mobile viewport camera. No composition is rendered outside the app.'},null,2)+'\n');
  console.log(JSON.stringify({screenshots,errors,failed}));
}finally{await browser.close();}
