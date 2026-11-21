import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {COAST_LAYOUT} from '../game/coast-layout.js';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-polish-v14';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],failed=[],screenshots=[];
async function enter(page,{position={x:50,y:34},look='principal',hair='rosa',reduced=true}={}){
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failed.push([r.status(),r.url()]);});
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await page.addInitScript(({position,look,hair})=>localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',visited:[],
    outfits:{leo:{look,glasses:false},itza:{look,hair,glasses:false}},leoVoice:{enabled:false},soundEffects:{enabled:false},dayNight:{mode:'day'}})),{position,look,hair});
  await page.goto(base+'/game.html');await page.locator('#start-game').click();
  await page.locator('#world').focus();await page.keyboard.press('e');await page.evaluate(()=>document.fonts.ready);
}
async function shot(page,name){await page.screenshot({path:output+'/'+name+'.png'});screenshots.push(name+'.png');}
try{
  for(const [name,width,height,look,hair] of [
    ['desktop',1440,900,'principal','rosa'],['phone',390,844,'alternativo','rubio'],['landscape',844,390,'boda','cafe']]){
    const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:name!=='desktop'});
    await enter(page,{look,hair});await expect(page.locator('.fishing-scene')).toHaveAttribute('data-actor-ready','true');
    await page.getByRole('button',{name:'Lanzar la caña',exact:true}).click();
    await shot(page,'fishing-waiting-'+name);
    await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','bite');
    await page.getByRole('button',{name:'¡Sacar!',exact:true}).click();
    await expect(page.locator('.fishing-scene')).toHaveAttribute('data-visual','caught');
    await shot(page,'fishing-caught-'+name);await page.close();
  }
  const action=await browser.newPage({viewport:{width:1280,height:900}});await action.clock.install();
  await enter(action,{look:'boda',hair:'negro',reduced:false});
  await action.clock.pauseAt(await action.evaluate(()=>Date.now()+20));
  await action.getByRole('button',{name:'Lanzar la caña',exact:true}).click();
  await shot(action,'fishing-sequence-01-casting');
  await action.clock.runFor(800);await shot(action,'fishing-sequence-02-waiting');
  await action.clock.runFor(750);await expect(action.locator('.fishing-game')).toHaveAttribute('data-phase','bite');
  await action.getByRole('button',{name:'¡Sacar!',exact:true}).click();
  await action.clock.runFor(250);await expect(action.locator('.fishing-scene')).toHaveAttribute('data-visual','reeling');
  await shot(action,'fishing-sequence-03-reeling');await action.clock.runFor(1000);
  await expect(action.locator('.fishing-scene')).toHaveAttribute('data-visual','caught');
  await shot(action,'fishing-sequence-04-caught');await action.close();
  for(const [name,width,height] of [['desktop',1440,900],['phone',390,844]]){
    const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:name==='phone'});
    await enter(page,{position:{x:COAST_LAYOUT.hawaiiArrival[0],y:COAST_LAYOUT.hawaiiArrival[1]}});
    await page.getByRole('button',{name:'Subir al barco · Hawái',exact:true}).click();
    await expect(page.locator('.hawaii-map')).toBeVisible();await page.locator('.scene-music-toggle').click();
    await page.getByRole('combobox',{name:'Canción para bailar',exact:true}).selectOption({index:1});
    await expect.poll(()=>page.locator('#music-audio').evaluate(a=>!a.paused&&a.currentTime>.1)).toBe(true);
    await shot(page,'island-music-'+name);await page.close();
  }
  expect(errors).toEqual([]);expect(failed).toEqual([]);
  await fs.writeFile(output+'/result.json',JSON.stringify({screenshots,errors,failed,
    note:'Real cast/bite/reel controls, personalized outfits, and the existing native MP3 player. The four fishing sequence frames use the browser clock to freeze actual animation; no won progress is injected.'},null,2)+'\n');
  console.log(JSON.stringify({screenshots,errors,failed}));
}finally{await browser.close();}
