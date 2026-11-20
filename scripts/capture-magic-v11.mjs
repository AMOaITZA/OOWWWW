// Real browser evidence. Start Vite and run this script for the completed game.
// To reproduce the baseline, serve checkout 10a9408 and set ART_CAPTURE_PHASE=before
// together with ART_CAPTURE_URL pointing to that baseline Vite server.
import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-magic-v11';
const phase=process.env.ART_CAPTURE_PHASE||'after';
if(phase==='before'&&!process.env.ART_CAPTURE_URL)throw new Error('Before capture requires ART_CAPTURE_URL for a Vite server running baseline 10a9408.');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],failed=[],evidence=[];
const outfits={leo:{look:'boda',glasses:false},itza:{look:'boda',hair:'cafe',glasses:false}};
async function seed(page,position={x:37,y:53},extra={}){
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failed.push([r.status(),r.url()]);});
  await page.addInitScript(({position,outfits,extra})=>localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',visited:[],outfits,
    leoVoice:{enabled:false},soundEffects:{enabled:false},dayNight:{mode:'day',cycleStartedAt:Date.now()},...extra})),{position,outfits,extra});
  await page.goto(base+'/game.html');await page.locator('#start-game').click();await page.evaluate(()=>document.fonts.ready);
}
async function shot(page,name,fullPage=false){await page.screenshot({path:output+'/'+phase+'-'+name+'.png',fullPage});evidence.push(phase+'-'+name+'.png');}
try{
  for(const [name,width,height,mobile] of process.env.ART_CAPTURE_FACES_ONLY==='1'?[]:[['desktop',1440,1000,false],['phone',390,844,true]]){
    const page=await browser.newPage({viewport:{width,height},hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce'});
    await seed(page);await page.locator('#world').focus();await page.keyboard.press('e');await expect(page.locator('.home-scene')).toBeVisible();
    for(const [activity,label] of [['eat','Comer juntos'],['tv','Ver la tele']]){
      await page.getByRole('button',{name:label,exact:true}).click();
      await page.locator('#experience-content').evaluate(body=>{body.scrollTop=0;});await shot(page,'home-'+activity+'-'+name);
    }
    if(mobile){await page.setViewportSize({width:844,height:390});await page.locator('#experience-content').evaluate(body=>{body.scrollTop=0;});await shot(page,'home-tv-landscape');}
    await page.close();
  }
  if(phase==='after'&&process.env.ART_CAPTURE_FACES_ONLY!=='1'){
    for(const [name,position] of [['cofre-cerezo',{x:39,y:36}],['cofre-luna',{x:108,y:71}],['carta-bosque',{x:55,y:74}]]){
      const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
      await seed(page,position);await page.locator('#world').focus();await page.keyboard.press('e');
      await expect(page.locator('.hidden-finding')).toHaveAttribute('data-secret',name);
      await shot(page,'finding-'+name);await page.close();
    }
    for(const [name,mode] of [['structure-shadows-day','day'],['structure-shadows-night','night']]){
      const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
      await seed(page,{x:45,y:21},{dayNight:{mode,cycleStartedAt:Date.now()}});
      await shot(page,name);await page.close();
    }
    const controls=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    await seed(controls,{x:50,y:34},{soundEffects:{enabled:true,volume:.35}});
    await controls.locator('#music-button').tap();await expect(controls.locator('#sound-effects-volume')).toBeVisible();
    await shot(controls,'sound-controls-phone');await controls.close();
    const stars=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
    await stars.clock.install();await seed(stars,{x:50,y:34},{dayNight:{mode:'night',cycleStartedAt:Date.now()}});
    await stars.clock.pauseAt(await stars.evaluate(()=>Date.now()+100));
    const elapsed=await stars.locator('#world').evaluate(canvas=>Number(canvas.dataset.ambientTime));
    await stars.clock.runFor(Math.max(0,(6.8-elapsed)*1000));
    await expect(stars.locator('#world')).toHaveAttribute('data-visible-shooting-stars','1');
    await shot(stars,'shooting-star');
    const starClip=await stars.locator('#world').evaluate(canvas=>{
      const r=canvas.getBoundingClientRect(),progress=(Number(canvas.dataset.ambientTime)%45-6)/1.6;
      const x=Math.round(canvas.width*.08+progress*Math.min(120,canvas.width*.22));
      const y=Math.round(Math.max(28,Math.min(60,canvas.height*.2))+progress*Math.min(25,canvas.height*.12));
      return {x:r.left+(x-18)*r.width/canvas.width,y:r.top+(y-9)*r.height/canvas.height,
        width:26*r.width/canvas.width,height:17*r.height/canvas.height};
    });
    await stars.screenshot({path:output+'/'+phase+'-shooting-star-detail.png',clip:starClip});
    evidence.push(phase+'-shooting-star-detail.png');await stars.close();
  }
  const page=await browser.newPage({viewport:{width:1160,height:1000}});
  await page.route(base+'/__magic-v11-faces',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html lang="es"><meta charset="UTF-8"><body></body></html>'}));
  await page.goto(base+'/__magic-v11-faces');
  await page.evaluate(async phase=>{
    const hair=await import('/game/hair.js'),glasses=await import('/game/glasses.js');
    async function pixels(url){const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d').drawImage(image,0,0);return canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);}
    const eyes=await pixels('/assets/game/appearance/eyes-without-glasses.png');
    document.body.style='margin:0;padding:16px;background:#fff1dc;color:#332119;font:14px monospace';
    const h=document.createElement('h1');h.textContent=(phase==='before'?'Antes':'Después')+' · rostro nativo con y sin lentes';document.body.append(h);
    for(const who of ['itza','leo'])for(const pose of ['walk','seat'])for(const look of ['principal','alternativo','boda']){
      const url=pose==='seat'?'/assets/game/moments/seated/'+who+'-'+look+'.png':look==='boda'?'/assets/game/wedding/characters/'+who+'-walk.png':'/assets/game/characters/'+who+'/look-0'+(look==='principal'?1:2)+'.png';
      const source=await pixels(url),profile=pose+'-'+look;
      const title=document.createElement('h3');title.textContent=who+' · '+look+' · '+(pose==='seat'?'sentada/o':'frente');document.body.append(title);
      const row=document.createElement('div');row.style='display:flex;gap:6px';document.body.append(row);
      for(const color of who==='itza'?['negro','cafe','rosa','rubio']:['negro'])for(const enabled of [true,false]){
        let data=who==='itza'?hair.recolorHairPixels(source,profile,color):new Uint8ClampedArray(source.data);
        if(!enabled)data=glasses.removeGlassesPixels({width:source.width,height:source.height,data},profile,[who],eyes);
        const sheet=document.createElement('canvas');sheet.width=source.width;sheet.height=source.height;sheet.getContext('2d').putImageData(new ImageData(data,source.width,source.height),0,0);
        const group=document.createElement('figure');group.style='margin:0;background:#ead1ae;padding:4px';
        const canvas=document.createElement('canvas');canvas.width=128;canvas.height=192;canvas.style='image-rendering:pixelated';const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(sheet,0,0,32,48,0,0,128,192);
        const caption=document.createElement('figcaption');caption.textContent=color+' · '+(enabled?'con':'sin');caption.style='text-align:center;font-size:11px';group.append(canvas,caption);row.append(group);
      }
    }
  },phase);
  await shot(page,'faces-all-looks',true);await page.close();
}finally{await browser.close();}
await writeFile(output+'/'+phase+'-result.json',JSON.stringify({phase,evidence,errors,failed},null,2)+'\n');
console.log(JSON.stringify({phase,evidence,errors,failed}));if(errors.length||failed.length)process.exitCode=1;
