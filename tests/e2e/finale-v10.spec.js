import {test,expect} from '@playwright/test';

const key='oowwww-game-v1';
const ids=['freddy','bonnie','chica','foxy','golden-freddy'];
const fishingMapName='Pesca · Lago de los peluches';
const ponyoMapName='Ponyo · Acariciar';
const outfits={leo:{look:'alternativo',glasses:false},itza:{look:'boda',hair:'rubio',glasses:false}};

async function enter(page,{position={x:50,y:34},fishing,reduced=true}={}){
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await page.addInitScript(({key,position,outfits,fishing})=>{
    if(sessionStorage.getItem('__finale_seeded'))return;
    sessionStorage.setItem('__finale_seeded','yes');
    localStorage.setItem(key,JSON.stringify({position,direction:'down',visited:[],outfits,fishing,
      leoVoice:{enabled:false},dayNight:{mode:'day',cycleStartedAt:Date.now()}}));
  },{key,position,outfits,fishing});
  await page.goto('/game.html');await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
}
const state=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
async function interact(page){await page.locator('#world').focus();await page.keyboard.press('e');}
async function openFishing(page){await interact(page);await expect(page.locator('.fishing-game')).toBeVisible();}
async function catchOne(page,touch=false){
  const action=page.locator('.fishing-action');
  if(touch)await action.tap();else await action.click();
  await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','bite');
  await expect(action).toHaveText('¡Sacar!');
  if(touch)await action.tap();else await action.click();
  await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','caught');
}
async function realImages(page,selector){
  await expect.poll(()=>page.locator(selector).evaluateAll(images=>
    images.length>0&&images.every(image=>image.complete&&image.naturalWidth>0))).toBe(true);
}

test('five actual catches persist the collection and unlock an interactive Ponyo by the cats',async({page})=>{
  test.setTimeout(90000);
  const errors=[],failed=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().includes('/assets/game/')&&response.status()>=400)failed.push(response.url());});
  await enter(page);await expect(page.locator('#world')).toHaveAttribute('data-ponyo-unlocked','false');
  await page.locator('#map-button').click();
  await expect(page.getByRole('button',{name:fishingMapName,exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:ponyoMapName,exact:true})).toHaveCount(0);
  await page.locator('#close-map').click();await openFishing(page);
  await realImages(page,'.fishing-plush img');
  for(let count=1;count<=5;count++){
    await catchOne(page);
    await expect(page.locator('.fishing-game')).toHaveAttribute('data-collected',String(count));
    expect(await page.locator('.fishing-plush[data-found="true"]').count()).toBe(count);
    await expect(page.locator('.fishing-reward')).toBeVisible();
  }
  await expect(page.locator('.fishing-completion')).toBeVisible();
  const completed=await state(page);
  expect(Object.keys(completed.fishing.collection).sort()).toEqual([...ids].sort());
  expect(completed.fishing.catches).toBe(5);expect(completed.outfits).toEqual(outfits);
  await page.locator('#close-experience').click();
  await expect(page.locator('#world')).toHaveAttribute('data-ponyo-unlocked','true');
  await page.reload();await page.locator('#start-game').click();await openFishing(page);
  await expect(page.locator('.fishing-game')).toHaveAttribute('data-collected','5');
  await expect(page.locator('.fishing-completion')).toBeVisible();await page.locator('#close-experience').click();
  await page.locator('#map-button').click();await page.getByRole('button',{name:ponyoMapName,exact:true}).click();
  await expect.poll(async()=>JSON.stringify((await state(page)).position),{timeout:20000}).toBe(JSON.stringify({x:71,y:50}));
  await interact(page);await expect(page.locator('#leo-bubble')).toHaveText('Leo: ponyo ponyo que divertida es');
  expect((await state(page)).fishing.collection).toEqual(completed.fishing.collection);
  expect(errors).toEqual([]);expect(failed).toEqual([]);
});

test('the house changes real scenes for meals, sleep and television without changing the selected outfits',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    window.__homeSources=[];const original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
      if(this.canvas.classList?.contains('home-scene')||args[0]?.src?.includes('/home/seated-bodies.png')){
        const image=args[0],data=image.dataset||{};
        window.__homeSources.push({src:image.src||data.assetSource||'',profile:data.hairProfile,
          color:data.hairColor,itzaGlasses:data.glassesItza,leoGlasses:data.glassesLeo,
          pose:data.homePose,character:data.homeCharacter,look:data.homeLook});
      }
      return original.apply(this,args);
    };
  });
  await enter(page,{position:{x:37,y:53}});await interact(page);
  const scene=page.locator('.home-scene');await expect(scene).toBeVisible();
  const fingerprints=[];
  for(const [activity,label] of [['eat','Comer juntos'],['sleep','Dormir juntos'],['tv','Ver la tele']]){
    await page.getByRole('group',{name:'Actividades de la casita',exact:true}).getByRole('button',{name:label,exact:true}).click();
    await expect(scene).toHaveAttribute('data-activity',activity);
    await expect(scene).toHaveAttribute('data-leo-look','alternativo');
    await expect(scene).toHaveAttribute('data-itza-look','boda');
    await expect(scene).toHaveAttribute('data-itza-hair','rubio');
    await expect(scene).toHaveAttribute('data-itza-glasses','false');
    fingerprints.push(await scene.evaluate(canvas=>canvas.toDataURL()));
    expect((await state(page)).outfits).toEqual(outfits);
  }
  expect(new Set(fingerprints).size).toBe(3);
  const sources=await page.evaluate(()=>window.__homeSources);
  expect(sources.some(source=>source.src.includes('/home/seated-bodies.png'))).toBe(true);
  for(const pose of ['eat','tv']){
    expect(sources.some(source=>source.pose===pose&&source.character==='itza'&&source.look==='boda'&&
      source.profile==='walk-boda'&&source.color==='rubio'&&source.itzaGlasses==='off')).toBe(true);
    expect(sources.some(source=>source.pose===pose&&source.character==='leo'&&source.look==='alternativo'&&
      source.leoGlasses==='off')).toBe(true);
  }
  expect(sources.some(source=>source.profile==='walk-boda'&&source.color==='rubio'&&source.itzaGlasses==='off')).toBe(true);
  expect((await state(page)).home.activity).toBe('tv');
  await page.locator('#close-experience').click();await interact(page);
  await expect(scene).toHaveAttribute('data-activity','tv');
  expect(errors).toEqual([]);
});

test('fishing and the three home activities remain usable with real phone taps and rotation',async({browser})=>{
  test.setTimeout(90000);
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  try{
    const page=await context.newPage();await enter(page);await page.locator('#map-button').tap();
    await page.getByRole('button',{name:fishingMapName,exact:true}).tap();
    await interact(page);await expect(page.locator('.fishing-game')).toBeVisible();await catchOne(page,true);
    await page.locator('#close-experience').tap();await page.locator('#map-button').tap();
    await page.getByRole('button',{name:/casita/i}).tap();
    await expect.poll(async()=>JSON.stringify((await state(page)).position),{timeout:20000}).toBe(JSON.stringify({x:37,y:53}));
    await interact(page);await expect(page.locator('.home-scene')).toBeVisible();
    for(const label of ['Comer juntos','Dormir juntos','Ver la tele']){
      const button=page.getByRole('group',{name:'Actividades de la casita',exact:true}).getByRole('button',{name:label,exact:true});
      await button.tap();const box=await button.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await page.setViewportSize({width:844,height:390});
    await page.locator('#experience-content').evaluate(body=>{body.scrollTop=0;});
    const room=await page.locator('.home-scene').evaluate(canvas=>{
      const r=canvas.getBoundingClientRect(),body=document.getElementById('experience-content').getBoundingClientRect();
      return {top:r.top,bottom:r.bottom,height:r.height,width:r.width,bodyTop:body.top,bodyBottom:body.bottom};
    });
    expect(room.height).toBeLessThanOrEqual(200);
    expect(room.top).toBeGreaterThanOrEqual(room.bodyTop);expect(room.bottom).toBeLessThanOrEqual(room.bodyBottom+1);
    expect(room.width/room.height).toBeCloseTo(16/9,2);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
    await expect(page.locator('#close-experience')).toBeVisible();await page.locator('#close-experience').tap();
    await expect(page.locator('#experience')).toBeHidden();expect((await state(page)).outfits).toEqual(outfits);
  }finally{await context.close();}
});
