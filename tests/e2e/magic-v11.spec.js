import {test,expect} from '@playwright/test';
import {existsSync} from 'node:fs';

const installedHomeVideo=existsSync(new URL('../../assets/game/home/videos/nuestro-video.mp4',import.meta.url))||
  existsSync(new URL('../../assets/game/home/videos/nuestro-video.webm',import.meta.url));

const key='oowwww-game-v1';
const outfits={leo:{look:'boda',glasses:false},itza:{look:'boda',hair:'rubio',glasses:false}};
const secrets=[
  {id:'cofre-cerezo',arrival:{x:39,y:36}},
  {id:'cofre-luna',arrival:{x:108,y:71}},
  {id:'carta-bosque',arrival:{x:55,y:74}}
];
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
async function enter(page,{position={x:37,y:53},mode='day',effects=false,reduced=true,customOutfits=outfits}={}){
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await page.addInitScript(({key,position,mode,effects,outfits})=>{
    if(sessionStorage.getItem('__magic_v11_seeded'))return;
    sessionStorage.setItem('__magic_v11_seeded','yes');
    localStorage.setItem(key,JSON.stringify({position,direction:'down',outfits,visited:[],
      leoVoice:{enabled:false},soundEffects:{enabled:effects,volume:.35},
      dayNight:{mode,cycleStartedAt:Date.now()}}));
  },{key,position,mode,effects,outfits:customOutfits});
  await page.goto('/game.html');await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
}
async function interact(page){await page.locator('#world').focus();await page.keyboard.press('e');}
async function audioProbe(page){
  await page.addInitScript(()=>{
    window.__effectStarts=[];window.__effectLoops=new Set();let id=0;
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    const create=Audio.prototype.createBufferSource;
    Audio.prototype.createBufferSource=function(...args){
      const source=create.apply(this,args),identifier=++id,start=source.start,stop=source.stop;
      source.start=function(...values){
        window.__effectStarts.push({duration:this.buffer?.duration??0,loop:this.loop});
        if(this.loop)window.__effectLoops.add(identifier);
        return start.apply(this,values);
      };
      source.stop=function(...values){window.__effectLoops.delete(identifier);return stop.apply(this,values);};
      return source;
    };
  });
}
const effectStarts=page=>page.evaluate(()=>window.__effectStarts);
const activeLoops=page=>page.evaluate(()=>window.__effectLoops.size);
async function navigateTile(page,point){
  await page.locator('#map-button').click();
  const position=await page.locator('#overview').evaluate((canvas,{x,y})=>{
    const r=canvas.getBoundingClientRect(),style=getComputedStyle(canvas);
    return {x:r.left+parseFloat(style.borderLeftWidth)+(x+.5)*3*canvas.clientWidth/canvas.width,
      y:r.top+parseFloat(style.borderTopWidth)+(y+.5)*3*canvas.clientHeight/canvas.height};
  },point);
  await page.mouse.click(position.x,position.y);
  await expect.poll(async()=>(await saved(page)).position,{timeout:40000}).toEqual(point);
}

test('walking stays silent, cats still meow, and mute and volume persist',async({page})=>{
  await audioProbe(page);
  await page.addInitScript(()=>{window.__preGestureStarts=()=>window.__effectStarts.length;});
  await enter(page,{position:{x:68,y:51},effects:true});
  // Daytime by the cats has no ambient loop; the first meow needs a real interaction.
  expect(await effectStarts(page)).toHaveLength(0);
  await interact(page);await expect(page.locator('#world-status')).toContainText('Acariciando');
  await expect.poll(async()=>(await effectStarts(page)).some(event=>Math.abs(event.duration-.66)<.01)).toBe(true);
  const beforeWalking=(await effectStarts(page)).length;
  await page.locator('#world').focus();await page.keyboard.down('ArrowDown');await page.waitForTimeout(420);await page.keyboard.up('ArrowDown');
  await expect.poll(async()=>(await saved(page)).position.y).toBeGreaterThan(51);
  expect((await effectStarts(page)).length).toBe(beforeWalking,'Walking creates no audio sources');
  expect((await effectStarts(page)).some(event=>event.duration<.2)).toBe(false);
  await page.locator('#music-button').click();
  const volume=page.locator('#sound-effects-volume');await volume.focus();await page.keyboard.press('Home');
  for(let i=0;i<25;i++)await page.keyboard.press('ArrowRight');
  await expect.poll(async()=>(await saved(page)).soundEffects.volume).toBe(.25);
  await page.locator('#sound-effects-toggle').click();await expect(page.locator('#sound-effects-toggle')).toHaveAttribute('aria-pressed','false');
  await page.locator('#music-close').click();const count=(await effectStarts(page)).length;
  await interact(page);await expect(page.locator('#world-status')).toContainText('Acariciando');
  expect((await effectStarts(page)).length).toBe(count);
  await page.reload();await page.locator('#start-game').click();await page.locator('#music-button').click();
  await expect(page.locator('#sound-effects-toggle')).toHaveAttribute('aria-pressed','false');
  await expect(volume).toHaveValue('25');
});

test('night water and crickets stop behind dialogs and hidden visibility, then resume without layering',async({page})=>{
  await audioProbe(page);await enter(page,{position:{x:50,y:34},effects:true,mode:'night'});
  await expect.poll(()=>activeLoops(page)).toBe(2);
  await page.locator('#help-button').click();await expect.poll(()=>activeLoops(page)).toBe(0);
  await page.keyboard.press('Escape');await expect.poll(()=>activeLoops(page)).toBe(2);
  await page.evaluate(()=>{
    window.__magicHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__magicHidden});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(()=>activeLoops(page)).toBe(0);
  await page.evaluate(()=>{window.__magicHidden=false;document.dispatchEvent(new Event('visibilitychange'));});
  await expect.poll(()=>activeLoops(page)).toBe(2);
  await page.locator('#music-button').click();await page.locator('#sound-effects-toggle').click();
  await expect.poll(()=>activeLoops(page)).toBe(0);
  expect((await effectStarts(page)).filter(event=>event.loop).every(event=>Math.abs(event.duration-4)<.01)).toBe(true);
});

test('three hidden objects can be found through the world and their messages survive a reload',async({page})=>{
  test.setTimeout(150000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await enter(page,{position:secrets[0].arrival});
  for(const [index,secret] of secrets.entries()){
    if(index)await navigateTile(page,secret.arrival);
    await interact(page);
    await expect(page.locator('.hidden-finding')).toHaveAttribute('data-secret',secret.id);
    await expect(page.locator('.finding-message')).not.toBeEmpty();
    await expect(page.locator('.finding-progress')).toHaveText(`${index+1} / 3 secretos`);
    await expect(page.locator('.finding-collection li[data-found="true"]')).toHaveCount(index+1);
    expect((await saved(page)).hiddenSecrets.found).toContain(secret.id);
    await page.keyboard.press('Escape');
  }
  const before=(await saved(page)).hiddenSecrets;
  await page.reload();await page.locator('#start-game').click();await interact(page);
  await expect(page.locator('.finding-progress')).toHaveText('3 / 3 secretos');
  expect((await saved(page)).hiddenSecrets).toEqual(before);
  expect(errors).toEqual([]);
});

test('the TV stays manual with or without an installed video and preserves customization on a phone',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  try{
    const page=await context.newPage(),requests=[],errors=[];
    // Vite's tiny ?url script discovers the installed filename; only media
    // requests would mean that the personal video is loaded before a gesture.
    page.on('request',request=>{if(request.resourceType()==='media'&&/\/home\/videos\/.*\.(mp4|webm)(?:\?|$)/.test(request.url()))requests.push(request.url());});
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>{
      window.__magicPlayCalls=0;const play=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function(...args){window.__magicPlayCalls++;return play.apply(this,args);};
    });
    await enter(page);await interact(page);await expect(page.locator('.home-scene')).toBeVisible();
    const scenes=[];
    for(const [activity,label] of [['eat','Comer juntos'],['tv','Ver la tele']]){
      await page.getByRole('button',{name:label,exact:true}).tap();
      await expect(page.locator('.home-scene')).toHaveAttribute('data-activity',activity);
      await expect(page.locator('.home-scene')).toHaveAttribute('data-itza-hair','rubio');
      await expect(page.locator('.home-scene')).toHaveAttribute('data-itza-glasses','false');
      scenes.push(await page.locator('.home-scene').evaluate(canvas=>canvas.toDataURL()));
    }
    expect(new Set(scenes).size).toBe(2);
    if(installedHomeVideo){
      await expect(page.locator('.home-video-status')).toContainText('Tu video está listo');
      await expect(page.locator('.home-video-play')).toBeEnabled();
    }else{
      await expect(page.locator('.home-video-status')).toContainText('Pronto veremos nuestro video');
      await expect(page.locator('.home-video-play')).toBeDisabled();
    }
    await expect(page.locator('.home-video-source')).not.toHaveAttribute('src',/.+/);
    expect(await page.evaluate(()=>window.__magicPlayCalls)).toBe(0);expect(requests).toEqual([]);
    await page.setViewportSize({width:844,height:390});await page.locator('#experience-content').evaluate(body=>{body.scrollTop=0;});
    const geometry=await page.locator('.home-scene').evaluate(canvas=>{const r=canvas.getBoundingClientRect(),body=document.getElementById('experience-content').getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,bodyTop:body.top,bodyBottom:body.bottom};});
    expect(geometry.height).toBeLessThanOrEqual(200);expect(geometry.top).toBeGreaterThanOrEqual(geometry.bodyTop);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.bodyBottom+1);
    await page.locator('#close-experience').tap();await expect(page.locator('#experience')).toBeHidden();
    expect((await saved(page)).outfits).toEqual(outfits);expect(errors).toEqual([]);
  }finally{await context.close();}
});

test('shooting stars are brief, nocturnal and disabled by reduced motion',async({page})=>{
  await page.clock.install();await enter(page,{position:{x:50,y:34},mode:'night',reduced:false});
  await page.clock.runFor(6500);
  await expect(page.locator('#world')).toHaveAttribute('data-visible-shooting-stars','1');
  await page.locator('#day-night-day').click();
  await expect(page.locator('#world')).toHaveAttribute('data-visible-shooting-stars','0');
  await page.locator('#day-night-night').click();await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('#world')).toHaveAttribute('data-visible-shooting-stars','0');
});

test('the alternate TV outfit has a complete seated torso beneath personalized hair',async({page})=>{
  await page.addInitScript(()=>{
    window.__seatedTorso=[];
    const original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
      const source=args[0],data=source?.dataset;
      if(this.canvas.classList.contains('home-scene')&&data?.homePose==='tv'&&
        data.homeCharacter==='itza'&&data.homeLook==='alternativo'){
        window.__seatedTorso.push([...source.getContext('2d').getImageData(15,32,1,1).data]);
      }
      return original.apply(this,args);
    };
  });
  await enter(page,{customOutfits:{leo:{look:'principal'},itza:{look:'alternativo',hair:'rosa',glasses:false}}});
  await interact(page);await page.getByRole('button',{name:'Ver la tele',exact:true}).click();
  const samples=await page.evaluate(()=>window.__seatedTorso);
  expect(samples.length).toBeGreaterThan(0);
  for(const [r,g,b,a] of samples){
    expect(a).toBe(255);expect(Math.max(r,g,b)).toBeLessThan(140);
  }
});
