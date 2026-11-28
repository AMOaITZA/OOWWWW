import {test,expect} from '@playwright/test';
import {COAST_LAYOUT} from '../../game/coast-layout.js';
import {BOAT_ISLANDS} from '../../game/boating.js';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const KEY='oowwww-game-v1';
const HOUSE={x:37,y:53};
const HARBOR={x:COAST_LAYOUT.hawaiiArrival[0],y:COAST_LAYOUT.hawaiiArrival[1]};
const OUTFITS={leo:{look:'alternativo',glasses:false},itza:{look:'boda',hair:'rosa',glasses:false}};
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);

function watchErrors(page){
  const errors=[],failed=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().includes('/assets/game/')&&response.status()>=400)failed.push(response.url());});
  return ()=>{expect(errors).toEqual([]);expect(failed).toEqual([]);};
}

async function enter(page,{position=HOUSE,motion='reduce',outfits=OUTFITS,extra={}}={}){
  await page.emulateMedia({reducedMotion:motion});
  await page.addInitScript(({key,position,outfits,extra})=>{
    if(sessionStorage.getItem('__activities_v15_seed'))return;
    sessionStorage.setItem('__activities_v15_seed','yes');
    localStorage.setItem(key,JSON.stringify({position,direction:'down',visited:[],outfits,
      leoVoice:{enabled:false},soundEffects:{enabled:false},dayNight:{mode:'day',cycleStartedAt:Date.now()},...extra}));
  },{key:KEY,position,outfits,extra});
  await page.goto('/game.html');await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
}

async function interact(page){await page.locator('#world').focus();await page.keyboard.press('e');}
async function houseActivity(page,name){
  await interact(page);await expect(page.locator('.home-scene')).toBeVisible();
  await page.getByText('Más en casa',{exact:true}).click();
  await page.getByRole('button',{name,exact:true}).click();
}
async function fullScreen(page){
  await expect.poll(()=>page.locator('#experience .experience-panel').evaluate(element=>{
    const r=element.getBoundingClientRect();return Math.abs(r.x)<1&&Math.abs(r.y)<1&&Math.abs(r.width-innerWidth)<1&&Math.abs(r.height-innerHeight)<1;
  })).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
}
async function onScreenControls(page,selector,{scrollEach=false}={}){
  for(const control of await page.locator(selector).all()){
    if(!await control.isVisible())continue;
    if(scrollEach)await control.scrollIntoViewIfNeeded();
    const box=await control.boundingBox(),viewport=page.viewportSize();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(-1);expect(box.y).toBeGreaterThanOrEqual(-1);
    expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+1);
    expect(box.y+box.height).toBeLessThanOrEqual(viewport.height+1);
  }
}
async function cookingWorktopClear(page){
  const geometry=await page.locator('.cooking-scene').evaluate(canvas=>{
    const rect=canvas.getBoundingClientRect(),position=getComputedStyle(canvas).objectPosition.split(' '),scale=Math.max(rect.width/640,rect.height/400);
    const top=rect.top+(rect.height-400*scale)*parseFloat(position[1])/100;
    return {worktopBottom:top+267*scale,controlsTop:document.querySelector('.cooking-controls').getBoundingClientRect().top};
  });
  expect(geometry.worktopBottom).toBeLessThan(geometry.controlsTop);
}
async function photoRecords(page){
  return page.evaluate(async()=>{
    const database=await new Promise((resolve,reject)=>{const request=indexedDB.open('oowwww-retratos-v1',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    try{
      const records=await new Promise((resolve,reject)=>{const request=database.transaction('photos','readonly').objectStore('photos').getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
      return await Promise.all(records.map(async({id,title,pose,width,height,blob})=>({id,title,pose,width,height,size:blob.size,type:blob.type,
        hash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(byte=>byte.toString(16).padStart(2,'0')).join('')})));
    }finally{database.close();}
  });
}

test('the black Canon captures actual scenes into a persistent album and exports the stored PNG',async({page})=>{
  const check=watchErrors(page);await enter(page);
  await page.locator('#world').evaluate(canvas=>{window.__v15WorldCanvas=canvas;});
  await page.getByRole('button',{name:'Abrir cámara Canon',exact:true}).click();
  const camera=page.getByRole('dialog',{name:'Cámara Canon digital retro',exact:true});await expect(camera).toBeVisible();
  await expect(page.getByAltText('Canon digital retro negra, con lente plateado y flash',{exact:true})).toBeVisible();
  await expect(page.locator('.retro-camera-shutter')).toBeFocused();
  // Compare the natural photo with the actual source at the instant toBlob is
  // called. Idle frames may change while the camera is open, so comparing two
  // world screenshots taken seconds apart would test an unrelated animation.
  await page.evaluate(()=>{
    const original=HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob=function(...args){
      const world=document.getElementById('world'),height=Math.floor(world.height*.9);
      const source=world.getContext('2d').getImageData(0,0,world.width,height).data;
      const photo=this.getContext('2d').getImageData(0,0,world.width,height).data;
      window.__v15NaturalSourceMatches=this.width===world.width&&this.height===world.height&&source.every((value,index)=>photo[index]===value);
      HTMLCanvasElement.prototype.toBlob=original;
      return original.apply(this,args);
    };
  });
  await page.locator('.retro-camera-shutter').click();
  await expect(camera).toHaveAttribute('data-storage','persistent');await expect(camera).toHaveAttribute('data-last-photo',/.+/);
  await expect(page.locator('.retro-camera-status')).toContainText('Foto guardada');
  expect(await page.evaluate(()=>window.__v15NaturalSourceMatches)).toBe(true);
  expect((await saved(page)).camera.shots).toBe(1);
  await page.keyboard.press('Escape');await expect(camera).toHaveCount(0);await expect(page.locator('#experience')).toBeHidden();
  expect(await page.locator('#world').evaluate(canvas=>canvas===window.__v15WorldCanvas)).toBe(true);
  expect((await saved(page)).position).toEqual(HOUSE);
  await interact(page);await expect(page.locator('.home-scene')).toBeVisible();
  await page.getByRole('button',{name:'Abrir cámara Canon',exact:true}).click();await expect(camera).toBeVisible();
  const natural=await page.locator('.retro-camera-preview').evaluate(canvas=>canvas.toDataURL());
  await page.getByRole('combobox',{name:'Pose para la foto',exact:true}).selectOption('frente');
  expect(await page.locator('.retro-camera-preview').evaluate(canvas=>canvas.toDataURL())).not.toBe(natural);
  await page.locator('.retro-camera-shutter').click();await expect(page.locator('.retro-camera-status')).toContainText('Foto guardada');
  const id=await camera.getAttribute('data-last-photo');expect((await saved(page)).camera.shots).toBe(2);
  await page.getByRole('button',{name:'Ver nuestro álbum',exact:true}).click();await expect(camera).toHaveCount(0);
  await expect(page.locator('.photo-album-card')).toHaveCount(2);await fullScreen(page);
  await expect.poll(()=>page.locator('.photo-album-card img').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth>0))).toBe(true);
  const records=await photoRecords(page);expect(records).toHaveLength(2);expect(new Set(records.map(photo=>photo.hash)).size).toBe(2);
  expect(records.some(photo=>photo.pose==='natural')).toBe(true);expect(records.some(photo=>photo.pose==='frente')).toBe(true);
  for(const photo of records){expect(photo.size).toBeGreaterThan(1000);expect(photo.type).toBe('image/png');expect(photo.width).toBeGreaterThan(100);expect(photo.height).toBeGreaterThan(100);}
  expect((await saved(page)).camera).toEqual({shots:2,lastPhotoAt:(await saved(page)).camera.lastPhotoAt});
  await page.locator(`.photo-album-card[data-photo-id="${id}"]`).click();await expect(page.locator('.photo-album-viewer')).toBeVisible();
  const downloaded=page.waitForEvent('download');await page.locator('.photo-album-download').click();const download=await downloaded;
  expect(download.suggestedFilename()).toMatch(/^itza-y-leo-.+\.png$/);
  const bytes=await readFile(await download.path());expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(records.find(photo=>photo.id===id).hash);
  await page.keyboard.press('Escape');await expect(page.locator('.photo-album-viewer')).toBeHidden();await expect(page.locator('.photo-album')).toBeVisible();
  await page.locator('#close-experience').click();await page.reload();await page.locator('#start-game').click();
  await page.getByRole('button',{name:'Abrir cámara Canon',exact:true}).click();await page.getByRole('button',{name:'Ver nuestro álbum',exact:true}).click();
  await expect(page.locator('.photo-album-card')).toHaveCount(2);expect(await photoRecords(page)).toEqual(records);
  await page.locator(`.photo-album-card[data-photo-id="${id}"]`).click();await page.locator('.photo-album-delete').click();
  await expect(page.locator('.photo-album-card')).toHaveCount(1);expect(await photoRecords(page)).toEqual(records.filter(photo=>photo.id!==id));
  expect((await saved(page)).position).toEqual(HOUSE);expect((await saved(page)).outfits).toEqual(OUTFITS);check();
});

test('cooking a complete recipe updates the cookbook once and survives a return and reload',async({page})=>{
  const check=watchErrors(page);await enter(page);await houseActivity(page,'Cocinar juntos');await fullScreen(page);
  const room=page.locator('.cooking-room'),scene=page.locator('.cooking-scene');
  await expect(room).toHaveAttribute('data-cooking-stage','choose');await expect(scene).toBeVisible();
  const before=await scene.evaluate(canvas=>canvas.toDataURL());
  await page.locator('[data-cooking-choose="macarrones"]').click();
  for(const ingredient of ['macarrones','leche','queso'])await page.locator(`[data-cooking-ingredient="${ingredient}"]`).click();
  await expect(room).toHaveAttribute('data-cooking-stage','stir');
  for(let i=0;i<4;i++)await page.locator('[data-cooking-action="stir"]').click();
  await expect(room).toHaveAttribute('data-cooking-stage','cook');
  for(let i=0;i<3;i++)await page.locator('[data-cooking-action="cook"]').click();
  await expect(room).toHaveAttribute('data-cooking-stage','serve');
  await page.locator('[data-cooking-action="serve"]').click();
  await expect(room).toHaveAttribute('data-cooking-stage','served');
  await expect(room).toHaveAttribute('data-cooking-servings','1');
  expect(await scene.evaluate(canvas=>canvas.toDataURL())).not.toBe(before);
  expect((await saved(page)).cooking).toMatchObject({recipe:'macarrones',prepared:['macarrones','leche','queso'],stirs:4,heat:3,served:true,servings:{macarrones:1,crema:0,pastel:0}});
  expect((await saved(page)).position).toEqual(HOUSE);expect((await saved(page)).outfits).toEqual(OUTFITS);
  await page.getByRole('button',{name:'Comer juntos en la casita',exact:true}).click();
  await expect(page.locator('.home-scene')).toHaveAttribute('data-meal','macarrones');
  await expect(page.locator('.home-scene')).toHaveAttribute('data-activity','eat');await expect(room).toHaveCount(0);
  await page.locator('#close-experience').click();await page.reload();await page.locator('#start-game').click();
  await houseActivity(page,'Cocinar juntos');await expect(room).toHaveAttribute('data-cooking-stage','served');
  await page.locator('.cooking-book>summary').click();
  await expect(page.locator('.cooking-recipe[data-cooking-recipe="macarrones"]')).toContainText('Cocinada 1 vez');
  await page.locator('.cooking-recipe[data-cooking-recipe="crema"]').click();
  expect((await saved(page)).cooking.servings.macarrones).toBe(1);
  await expect(room).toHaveAttribute('data-cooking-stage','prepare');
  await page.locator('#close-experience').click();check();
});

test('a flower is planted, watered, grown and harvested into a lasting home decoration',async({page})=>{
  const check=watchErrors(page);await enter(page);await houseActivity(page,'Cuidar el huerto');await fullScreen(page);
  const scene=page.locator('.garden-scene');await expect(scene).toBeVisible();
  await page.locator('[data-garden-plot="0"]').click();await page.locator('.garden-seed-picker>summary').click();await page.locator('[data-garden-seed="cosmos"]').click();
  await page.locator('.garden-primary').click();
  await expect.poll(async()=>(await saved(page)).garden.plots[0]).toEqual({flower:'cosmos',watered:false,growth:0});
  await expect(page.locator('.garden-primary')).toHaveText('Regar las flores');await page.locator('.garden-primary').click();
  await expect.poll(async()=>(await saved(page)).garden.plots[0].watered).toBe(true);
  await expect(page.locator('.garden-primary')).toHaveText('Recoger flores',{timeout:15000});
  await page.locator('.garden-primary').click();
  await expect.poll(async()=>(await saved(page)).garden.harvested).toBe(1);
  await page.locator('.garden-decor-toggle').click();
  const vase=page.locator('[data-garden-decoration="cosmos"]');await expect(vase).toBeEnabled();await vase.click();
  const garden=(await saved(page)).garden;
  expect(garden.decoration).toBe('cosmos');expect(garden.decorations).toContain('cosmos');expect(garden.inventory.cosmos).toBe(0);
  expect(garden.plots[0]).toEqual({flower:null,watered:false,growth:0});
  expect((await saved(page)).position).toEqual(HOUSE);expect((await saved(page)).outfits).toEqual(OUTFITS);
  await page.locator('#close-experience').click();await interact(page);
  await expect(page.locator('.home-scene')).toHaveAttribute('data-flower-decoration','cosmos');
  await page.locator('#close-experience').click();await page.reload();await page.locator('#start-game').click();
  await interact(page);await expect(page.locator('.home-scene')).toHaveAttribute('data-flower-decoration','cosmos');
  expect((await saved(page)).garden).toEqual(garden);check();
});

test('the garden is reachable beside the house through the actual world map',async({page})=>{
  const check=watchErrors(page);await enter(page);await page.locator('#map-button').click();
  await page.locator('#map-destinations').getByRole('button',{name:'Nuestro jardín',exact:true}).click();
  await expect(page.locator('#map-panel')).toBeHidden();
  expect((await saved(page)).position).toEqual(HOUSE);
  await expect.poll(async()=>(await saved(page)).position,{timeout:12000}).toEqual({x:43,y:54});
  await interact(page);await expect(page.locator('.garden-scene')).toBeVisible();await fullScreen(page);
  await page.locator('#close-experience').click();await expect(page.locator('#world')).toBeFocused();
  expect((await saved(page)).position).toEqual({x:43,y:54});check();
});

test('the harbor launches a real boat and three explored islands keep their gifts on return',async({page})=>{
  const check=watchErrors(page);await enter(page,{position:HARBOR});await interact(page);
  await expect(page.locator('.harbor-hud')).toBeVisible();await page.getByRole('button',{name:'Pasear en barca',exact:true}).click();
  const trip=page.locator('.boating-trip'),map=page.locator('.boating-map');await expect(map).toBeVisible();await fullScreen(page);
  await expect(trip).toHaveAttribute('data-boat-found','0');
  const start=await map.getAttribute('data-boat-x');
  for(const [index,island]of BOAT_ISLANDS.entries()){
    await page.getByRole('button',{name:island.label,exact:true}).click();
    await expect(trip).toHaveAttribute('data-boat-moving','true');
    await expect(trip).toHaveAttribute('data-boat-island',island.id,{timeout:12000});
    const gift=page.getByRole('button',{name:'Abrir el regalo',exact:true});await expect(gift).toBeVisible();await gift.click();
    await expect(page.locator('.boating-message')).toBeVisible();await expect(page.locator('.boating-message')).toContainText(island.gift);
    await expect(page.locator('.boating-message')).toContainText('Leo:');
    await expect(trip).toHaveAttribute('data-boat-found',String(index+1));
    expect((await saved(page)).boating.found).toContain(island.id);
    await page.getByRole('button',{name:'Seguir navegando',exact:true}).click();
  }
  expect(await map.getAttribute('data-boat-x')).not.toBe(start);
  const found=(await saved(page)).boating.found;expect([...found].sort()).toEqual(BOAT_ISLANDS.map(island=>island.id).sort());
  await page.getByRole('button',{name:'Leer nuestra carta',exact:true}).click();
  expect((await saved(page)).boating.found).toEqual(found);
  await page.locator('#close-experience').click();await expect(trip).toHaveCount(0);
  expect((await saved(page)).position).toEqual(HARBOR);expect((await saved(page)).outfits).toEqual(OUTFITS);
  await page.reload();await page.locator('#start-game').click();await interact(page);
  await page.getByRole('button',{name:'Pasear en barca',exact:true}).click();
  await expect(page.locator('.boating-counter')).toHaveText('3 / 3 regalos');
  expect((await saved(page)).boating.found).toEqual(found);check();
});

test('the new house activities and Canon remain usable with phone taps in portrait and landscape',async({browser})=>{
  const context=await browser.newContext({viewport:{width:320,height:740},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  try{
    const page=await context.newPage(),check=watchErrors(page);await enter(page);await houseActivity(page,'Cocinar juntos');
    for(const size of [{width:320,height:740},{width:844,height:390}]){
      await page.setViewportSize(size);await fullScreen(page);await cookingWorktopClear(page);
      await onScreenControls(page,'.cooking-room button:not(.cooking-recipes button),.cooking-book>summary,#close-experience,.camera-open-control');
      await page.getByRole('button',{name:'Abrir cámara Canon',exact:true}).tap();
      await onScreenControls(page,'.retro-camera button,.retro-camera select');
      await page.getByRole('combobox',{name:'Pose para la foto',exact:true}).selectOption('lado');
      await page.locator('.retro-camera-shutter').tap();await expect(page.locator('.retro-camera-status')).toContainText('Foto guardada');
      await page.locator('.retro-camera-back').tap();await expect(page.locator('.cooking-scene')).toBeVisible();
      if(size.width===320){
        await page.locator('[data-cooking-choose="macarrones"]').tap();
        for(const id of ['macarrones','leche','queso'])await page.locator(`[data-cooking-ingredient="${id}"]`).tap();
        for(let i=0;i<4;i++)await page.locator('[data-cooking-action="stir"]').tap();
        for(let i=0;i<3;i++)await page.locator('[data-cooking-action="cook"]').tap();
        await page.locator('[data-cooking-action="serve"]').tap();
        await expect(page.locator('.cooking-room')).toHaveAttribute('data-cooking-stage','served');
      }
      // The served reply has more text than the initial recipe picker. Keep
      // the plates visible even when that live caption makes the HUD taller.
      await cookingWorktopClear(page);
      await onScreenControls(page,'.cooking-room button:not(.cooking-recipes button),#close-experience,.camera-open-control');
    }
    await page.getByRole('button',{name:'Comer juntos en la casita',exact:true}).tap();
    await page.getByText('Más en casa',{exact:true}).tap();await page.getByRole('button',{name:'Cuidar el huerto',exact:true}).tap();
    for(const size of [{width:390,height:844},{width:844,height:390}]){
      await page.setViewportSize(size);await fullScreen(page);await expect(page.locator('.garden-scene')).toBeVisible();
      await onScreenControls(page,'.garden-trip button:not(.garden-decoration button),.garden-seed-picker>summary,#close-experience,.camera-open-control');
      await page.locator('.garden-seed-picker>summary').tap();
      await expect(page.locator('.garden-seed:visible')).toHaveCount(6);
      await onScreenControls(page,'.garden-seed');
      await page.locator('[data-garden-seed="peonia"]').tap();
      await expect(page.locator('.garden-primary')).toHaveAccessibleName(/peonías/i);
      await page.locator('.garden-decor-toggle').tap();await expect(page.locator('.garden-decoration')).toBeVisible();
      await onScreenControls(page,'.garden-decoration button',{scrollEach:true});await page.getByRole('button',{name:'Cerrar decoración',exact:true}).tap();
    }
    await page.locator('#close-experience').tap();expect((await saved(page)).camera.shots).toBe(2);
    expect((await saved(page)).position).toEqual(HOUSE);check();
  }finally{await context.close();}
});

test('a small phone can steer the boat, open an island gift and keep controls after rotation',async({browser})=>{
  const context=await browser.newContext({viewport:{width:320,height:740},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  try{
    const page=await context.newPage(),check=watchErrors(page);await enter(page,{position:HARBOR});await interact(page);
    await page.getByRole('button',{name:'Pasear en barca',exact:true}).tap();await fullScreen(page);
    await onScreenControls(page,'.boating-trip button,#close-experience,.camera-open-control');
    await page.locator('[data-boat-destination="cerezo"]').tap();
    await expect(page.locator('.boating-trip')).toHaveAttribute('data-boat-island','cerezo',{timeout:12000});
    await page.getByRole('button',{name:'Abrir el regalo',exact:true}).tap();await expect(page.locator('.boating-message')).toBeVisible();
    await page.getByRole('button',{name:'Seguir navegando',exact:true}).tap();
    await page.setViewportSize({width:844,height:390});await fullScreen(page);
    await onScreenControls(page,'.boating-trip button,#close-experience,.camera-open-control');
    await page.locator('[data-boat-destination="muelle"]').tap();
    await expect(page.locator('.boating-trip')).toHaveAttribute('data-boat-destination','');
    await expect(page.locator('.boating-status')).toContainText('De vuelta al muelle');
    await page.locator('#close-experience').tap();expect((await saved(page)).position).toEqual(HARBOR);
    expect((await saved(page)).boating.found).toEqual(['cerezo']);check();
  }finally{await context.close();}
});

test('an expired cast keeps the complete wedding pose and the five earned plushies intact',async({page})=>{
  const check=watchErrors(page),collection=Object.fromEntries(['freddy','bonnie','chica','foxy','golden-freddy'].map(id=>[id,1]));
  await enter(page,{position:{x:50,y:34},motion:'no-preference',
    outfits:{leo:{look:'boda',glasses:true},itza:{look:'boda',hair:'negro',glasses:true}},
    extra:{fishing:{collection,casts:5,catches:5}}});
  await interact(page);const scene=page.locator('.fishing-scene');
  await expect(scene).toHaveAttribute('data-actor-ready','true');
  await page.locator('.fishing-action').click();
  await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','bite');
  await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','missed');
  await expect(scene).toHaveAttribute('data-visual','missed');
  await expect(scene).toHaveAttribute('data-itza-look','boda');
  await expect(scene).toHaveAttribute('data-itza-hair','negro');
  await expect(scene).toHaveAttribute('data-itza-glasses','true');
  const geometry=await scene.evaluate(canvas=>{
    const d=canvas.dataset;return {x:Number(d.actorX),y:Number(d.actorY),width:Number(d.actorWidth),height:Number(d.actorHeight),handX:Number(d.rodHandX),handY:Number(d.rodHandY),canvasHeight:canvas.height};
  });
  expect(geometry.width).toBeGreaterThan(0);expect(geometry.height).toBeGreaterThan(0);
  expect(geometry.handX).toBeGreaterThan(geometry.x);expect(geometry.handX).toBeLessThan(geometry.x+geometry.width);
  expect(geometry.handY).toBeGreaterThan(geometry.y);expect(geometry.handY).toBeLessThan(geometry.y+geometry.height);
  expect(geometry.y+geometry.height).toBeLessThanOrEqual(geometry.canvasHeight);
  expect((await saved(page)).fishing.collection).toEqual(collection);expect((await saved(page)).fishing.catches).toBe(5);
  await page.locator('#close-experience').click();await expect(scene).toHaveCount(0);
  expect((await saved(page)).position).toEqual({x:50,y:34});check();
});

async function pictureOf(canvas, box){
  return canvas.evaluate((source,[x,y,width,height])=>{
    const crop=document.createElement('canvas');
    crop.width=width;crop.height=height;
    crop.getContext('2d').drawImage(source,x,y,width,height,0,0,width,height);
    return crop.toDataURL();
  },box);
}

test('the three recipes make distinct meals at the dinner table and retain the old cookbook counts',async({page},testInfo)=>{
  const check=watchErrors(page);
  const recipes=[
    {id:'macarrones',name:'Macarrones con queso',ingredients:['macarrones','leche','queso']},
    {id:'crema',name:'Crema de calabaza',ingredients:['calabaza','crema','caldo']},
    {id:'pastel',name:'Pastel',ingredients:['harina','huevo','fresas']}
  ];
  await enter(page,{extra:{cooking:{recipe:'pasta',prepared:['pasta','tomate','albahaca'],
    stirs:4,heat:2,served:false,servings:{pasta:4,panqueques:2,galletas:3}}}});
  await houseActivity(page,'Cocinar juntos');
  const room=page.locator('.cooking-room');
  await expect(room).toHaveAttribute('data-cooking-stage','prepare');
  expect((await saved(page)).cooking.servings).toEqual({macarrones:4,crema:2,pastel:3});
  const kitchenPlates=new Set(),homePlates=new Set();
  for(const recipe of recipes){
    await page.locator('.cooking-book>summary').click();
    await page.locator(`.cooking-recipe[data-cooking-recipe="${recipe.id}"]`).click();
    await expect(page.locator('.cooking-title')).toHaveText(recipe.name);
    for(const ingredient of recipe.ingredients){
      await page.locator(`[data-cooking-ingredient="${ingredient}"]`).click();
    }
    for(let i=0;i<4;i++)await page.locator('[data-cooking-action="stir"]').click();
    for(let i=0;i<3;i++)await page.locator('[data-cooking-action="cook"]').click();
    await page.locator('[data-cooking-action="serve"]').click();
    await expect(room).toHaveAttribute('data-cooking-stage','served');
    kitchenPlates.add(await pictureOf(page.locator('.cooking-scene'),[268,241,100,29]));
    if(recipe.id==='macarrones')await testInfo.attach('cocina-servida',{body:await page.screenshot(),contentType:'image/png'});
    await page.getByRole('button',{name:'Comer juntos en la casita',exact:true}).click();
    const home=page.locator('.home-scene');
    await expect(home).toHaveAttribute('data-activity','eat');
    await expect(home).toHaveAttribute('data-meal',recipe.id);
    homePlates.add(await pictureOf(home,[194,180,72,30]));
    if(recipe.id==='pastel')await testInfo.attach('pastel-para-dos',{body:await page.screenshot(),contentType:'image/png'});
    if(recipe.id!=='pastel'){
      await page.getByText('Más en casa',{exact:true}).click();
      await page.getByRole('button',{name:'Cocinar juntos',exact:true}).click();
    }
  }
  expect(kitchenPlates.size).toBe(3);expect(homePlates.size).toBe(3);
  expect((await saved(page)).cooking.servings).toEqual({macarrones:5,crema:3,pastel:4});
  await page.locator('#close-experience').click();
  await page.reload();await page.locator('#start-game').click();await interact(page);
  await expect(page.locator('.home-scene')).toHaveAttribute('data-meal','pastel');
  expect((await saved(page)).position).toEqual(HOUSE);check();
});

test('lilies, pink roses and peonies can each be grown into a distinct vase in the house',async({page},testInfo)=>{
  const check=watchErrors(page);
  const flowers=[['lirio','Lirios'],['rosa','Rosas rosas'],['peonia','Peonías']];
  await enter(page,{extra:{garden:{inventory:{cosmos:1,lavanda:2,girasol:3},
    decorations:['cosmos'],decoration:'cosmos'}}});
  await houseActivity(page,'Cuidar el huerto');
  const primary=page.locator('.garden-primary');
  for(const [plot,[id,label]] of flowers.entries()){
    await page.locator(`.garden-plot[data-garden-plot="${plot}"]`).click();
    await page.locator('.garden-seed-picker>summary').click();
    const seed=page.locator(`[data-garden-seed="${id}"]`);
    await expect(seed).toHaveText(label);await seed.click();
    await primary.click();await expect(primary).toHaveText('Regar las flores');await primary.click();
    await expect.poll(async()=>(await saved(page)).garden.plots[plot].watered).toBe(true);
  }
  for(const [plot,[id]] of flowers.entries()){
    await page.locator(`.garden-plot[data-garden-plot="${plot}"]`).click();
    await expect(primary).toHaveText('Recoger flores',{timeout:16000});
    if(id==='lirio'){
      await expect(page.locator('.garden-plot[data-garden-stage="3"]')).toHaveCount(3,{timeout:16000});
      await testInfo.attach('jardin-en-flor',{body:await page.screenshot(),contentType:'image/png'});
    }
    await primary.click();
    await expect.poll(async()=>(await saved(page)).garden.inventory[id]).toBe(1);
  }
  const bouquets=new Set();
  for(const [id] of flowers){
    await page.locator('.garden-decor-toggle').click();
    await page.locator(`[data-garden-decoration="${id}"]`).click();
    await page.getByRole('button',{name:'Ver el florero en casa',exact:true}).click();
    const home=page.locator('.home-scene');
    await expect(home).toHaveAttribute('data-flower-decoration',id);
    bouquets.add(await pictureOf(home,[383,8,32,32]));
    if(id!=='peonia'){
      await page.getByText('Más en casa',{exact:true}).click();
      await page.getByRole('button',{name:'Cuidar el huerto',exact:true}).click();
    }
  }
  expect(bouquets.size).toBe(3);
  expect((await saved(page)).garden.inventory).toEqual({cosmos:1,lavanda:2,girasol:3,lirio:0,rosa:0,peonia:0});
  expect((await saved(page)).garden.decorations).toEqual(expect.arrayContaining(['cosmos','lirio','rosa','peonia']));
  await page.locator('#close-experience').click();await page.reload();await page.locator('#start-game').click();await interact(page);
  await expect(page.locator('.home-scene')).toHaveAttribute('data-flower-decoration','peonia');
  expect((await saved(page)).position).toEqual(HOUSE);check();
});
