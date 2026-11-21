import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173',output=process.env.ART_CAPTURE_DIR||'docs/qa-fishing-v15';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],failed=[],screenshots=[];
async function enter(page,{look='boda',hair='negro',glasses=true,reduced=false,complete=false}={}){
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failed.push([r.status(),r.url()]);});
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await page.addInitScript(({look,hair,glasses,complete})=>{
    window.__fishingActors=[];
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){const source=args[0];
      if(source?.dataset?.fishingActor==='itza')window.__fishingActors[Number(source.dataset.fishingPose)]=source;
      return draw.apply(this,args);
    };
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position:{x:50,y:34},direction:'down',visited:[],
      outfits:{leo:{look,glasses},itza:{look,hair,glasses}},leoVoice:{enabled:false},soundEffects:{enabled:false},dayNight:{mode:'day'},
      ...(complete?{fishing:{collection:{freddy:1,bonnie:1,chica:1,foxy:1,'golden-freddy':1},casts:5,catches:5}}:{})}));
  },{look,hair,glasses,complete});
  await page.goto(base+'/game.html');await page.locator('#start-game').click();
  await page.locator('#world').focus();await page.keyboard.press('e');await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.fishing-scene')).toHaveAttribute('data-actor-ready','true');
}
async function shot(page,name){await page.screenshot({path:output+'/'+name+'.png'});screenshots.push(name+'.png');}
try{
  const missed=await browser.newPage({viewport:{width:1440,height:900}});await missed.clock.install();await enter(missed,{complete:true});
  await missed.clock.pauseAt(await missed.evaluate(()=>Date.now()+20));
  await missed.getByRole('button',{name:'Lanzar la caña',exact:true}).click();
  await missed.clock.runFor(4600);await expect(missed.locator('.fishing-scene')).toHaveAttribute('data-phase','missed');
  await shot(missed,'wedding-complete-missed-desktop');
  const data=await missed.locator('.fishing-scene').evaluate(c=>({...c.dataset}));
  expect(data.actorHeight).toBe('64');expect(data.bodyOffsetY).toBe('6');
  const native=await missed.evaluate(()=>window.__fishingActors[0].toDataURL());
  await fs.writeFile(output+'/wedding-missed-native.png',Buffer.from(native.split(',')[1],'base64'));await missed.close();
  for(const [name,width,height,look,hair]of[['principal',1440,900,'principal','rosa'],['alternative-phone',390,844,'alternativo','rubio'],['wedding-landscape',844,390,'boda','cafe']]){
    const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:width<1000});await enter(page,{look,hair,glasses:false,reduced:true});
    await shot(page,name+'-waiting');await page.getByRole('button',{name:'Lanzar la caña',exact:true}).click();
    await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','bite');await page.getByRole('button',{name:'¡Sacar!',exact:true}).click();
    await expect(page.locator('.fishing-scene')).toHaveAttribute('data-visual','caught');await shot(page,name+'-caught');await page.close();
  }
  const sequence=await browser.newPage({viewport:{width:1280,height:900}});await sequence.clock.install();await enter(sequence,{hair:'rubio',glasses:false});
  await sequence.clock.pauseAt(await sequence.evaluate(()=>Date.now()+20));await sequence.getByRole('button',{name:'Lanzar la caña',exact:true}).click();
  await shot(sequence,'wedding-sequence-01-cast');await sequence.clock.runFor(800);await shot(sequence,'wedding-sequence-02-wait');
  await sequence.clock.runFor(750);await expect(sequence.locator('.fishing-game')).toHaveAttribute('data-phase','bite');await sequence.getByRole('button',{name:'¡Sacar!',exact:true}).click();
  await sequence.clock.runFor(250);await shot(sequence,'wedding-sequence-03-reel');await sequence.clock.runFor(1100);await shot(sequence,'wedding-sequence-04-catch');
  await sequence.close();expect(errors).toEqual([]);expect(failed).toEqual([]);
  await fs.writeFile(output+'/result.json',JSON.stringify({screenshots,errors,failed,actor:data,note:'Actual full-game idle, expired bite and successful cast/bite/reel controls. Complete collection is seeded only to reproduce the supplied screenshot, with no catches added on the missed cast.'},null,2)+'\n');
  console.log(JSON.stringify({screenshots,errors,failed}));
}finally{await browser.close();}
