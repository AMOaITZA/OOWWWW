import {test,expect} from '@playwright/test';
import {COAST_LAYOUT} from '../../game/coast-layout.js';
import {HAWAII_ZONES} from '../../game/hawaii.js';

const key='oowwww-game-v1';
const shore={x:COAST_LAYOUT.shoreArrival[0],y:COAST_LAYOUT.shoreArrival[1]};
const harbor={x:COAST_LAYOUT.hawaiiArrival[0],y:COAST_LAYOUT.hawaiiArrival[1]};
const outfits={leo:{look:'principal',glasses:false},itza:{look:'principal',hair:'rosa',glasses:false}};
test.use({hasTouch:true});
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
async function enter(page,{position={x:30,y:25},reduced=false,choices=outfits}={}){
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await page.addInitScript(({key,position,choices})=>{
    window.__immersiveDraws={hawaii:0,coast:0};
    window.__danceBodies={leo:[],itza:[]};window.__danceHashes={leo:[],itza:[]};
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
      if(this.canvas.classList.contains('hawaii-map')){
        window.__immersiveDraws.hawaii++;
        const image=args[0],who=image?.dataset?.danceCharacter;
        if(who){
          const body=image.getContext('2d').getImageData(0,24,40,32).data;let hash=0;
          for(const value of body)hash=(Math.imul(hash,31)+value)|0;
          const frame=Number(image.dataset.dancePose);
          if(!window.__danceBodies[who].includes(frame))window.__danceBodies[who].push(frame);
          if(!window.__danceHashes[who].includes(hash))window.__danceHashes[who].push(hash);
        }
      }
      return draw.apply(this,args);
    };
    if(sessionStorage.getItem('__immersive_v13_seed'))return;
    sessionStorage.setItem('__immersive_v13_seed','yes');
    localStorage.setItem(key,JSON.stringify({position,direction:'down',outfits:choices,visited:[],
      leoVoice:{enabled:false},soundEffects:{enabled:false},dayNight:{mode:'day',cycleStartedAt:Date.now()}}));
  },{key,position,choices});
  await page.goto('/game.html');await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
  await page.evaluate(()=>{window.__sameWorld=document.getElementById('world');});
}
async function interact(page){await page.locator('#world').focus();await page.keyboard.press('e');}
function watchErrors(page){
  const errors=[],failed=[];page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().includes('/assets/game/')&&response.status()>=400)failed.push(response.url());});
  return ()=>{expect(errors).toEqual([]);expect(failed).toEqual([]);};
}
async function zone(page,id){
  await page.locator('[data-hawaii-destination="'+id+'"]').click();
  const point=HAWAII_ZONES.find(item=>item.id===id).arrival;
  await expect.poll(async()=>({x:Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-x')),
    y:Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-y'))}),{timeout:12000}).toEqual(point);
}
async function fullSurface(page,selector){
  const bounds=await page.locator(selector).boundingBox(),viewport=page.viewportSize();
  expect(Math.abs(bounds.x)).toBeLessThanOrEqual(1);expect(Math.abs(bounds.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(bounds.width-viewport.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(bounds.height-viewport.height)).toBeLessThanOrEqual(1);
}

test('a real village route reaches the coastal blanket and fireworks remain in the same fullscreen world',async({page})=>{
  const check=watchErrors(page);await enter(page);
  await page.locator('#map-button').click();
  await expect(page.locator('#overview')).toHaveAttribute('height','336');
  await page.getByRole('button',{name:'Orilla de los deseos',exact:true}).click();
  await expect.poll(async()=>(await saved(page)).position,{timeout:40000}).toEqual(shore);
  await expect(page.locator('.coast-hud')).toBeVisible();
  await expect(page.locator('#experience')).toBeHidden();
  await interact(page);
  await expect(page.locator('#world')).toHaveAttribute('data-coast-view','true');
  await fullSurface(page,'#game-frame');
  expect(await page.evaluate(()=>window.__sameWorld===document.getElementById('world'))).toBe(true);
  await expect(page.locator('.lakeside-scene')).toHaveCount(0);
  await page.getByRole('button',{name:'Ver fuegos artificiales',exact:true}).click();
  await expect.poll(async()=>Number(await page.locator('#world').getAttribute('data-coast-particles'))).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Pedir un deseo',exact:true}).click();
  await expect(page.locator('#world')).toHaveAttribute('data-coast-stars','1');
  expect((await saved(page)).lakeside).toMatchObject({visits:1,sits:1,shows:1,wishes:1});
  await page.getByRole('button',{name:'Levantarnos',exact:true}).click();
  await expect(page.locator('#world')).toHaveAttribute('data-coast-view','false');
  expect((await saved(page)).position).toEqual(shore);
  await page.reload();await page.locator('#start-game').click();
  expect((await saved(page)).lakeside).toMatchObject({visits:1,sits:1,shows:1,wishes:1});
  await expect(page.locator('#world')).toHaveAttribute('data-coast-view','false');check();
});

test('a physical harbor boards Hawaii and its fullscreen dance draws eight different body poses for both partners',async({page})=>{
  const check=watchErrors(page);await enter(page,{position:harbor});await interact(page);
  await expect(page.locator('.harbor-hud')).toBeVisible();await expect(page.locator('#experience')).toBeHidden();
  await page.getByRole('button',{name:'Subir al barco · Hawái',exact:true}).click();
  await expect(page.locator('.hawaii-map')).toBeVisible();await fullSurface(page,'.hawaii-stage');
  await expect(page.locator('.experience-hero')).toBeHidden();
  await expect(page.locator('.hawaii-map')).toHaveAttribute('data-itza-hair','rosa');
  await expect(page.locator('.hawaii-map')).toHaveAttribute('data-itza-glasses','false');
  await zone(page,'dance');await page.getByRole('button',{name:'Bailar con Leo',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>[window.__danceBodies.leo.length,window.__danceBodies.itza.length]),{timeout:9000}).toEqual([8,8]);
  const hashes=await page.evaluate(()=>[window.__danceHashes.leo.length,window.__danceHashes.itza.length]);
  expect(hashes).toEqual([8,8]);
  await page.getByRole('button',{name:'Dejar de bailar',exact:true}).click();
  await zone(page,'bar');
  for(const id of ['pina','mango','coco'])await page.locator('button[data-hawaii-drink="'+id+'"]').click();
  await zone(page,'giraffe');await page.getByRole('button',{name:'Acariciar a la jirafa',exact:true}).click();
  await page.getByRole('button',{name:'Volver a nuestro mundo',exact:true}).click();
  await expect(page.locator('#experience')).toBeHidden();
  const stopped=await page.evaluate(()=>window.__immersiveDraws.hawaii);await page.waitForTimeout(250);
  expect(await page.evaluate(()=>window.__immersiveDraws.hawaii)).toBe(stopped);
  expect((await saved(page)).position).toEqual(harbor);
  expect((await saved(page)).hawaii).toMatchObject({dances:1,giraffePets:1,drinks:{pina:1,mango:1,coco:1},shells:9});check();
});

test('phone coast and Hawaii fill portrait and landscape with reachable HUD controls and stable world coordinates',async({page})=>{
  const check=watchErrors(page);await page.setViewportSize({width:390,height:844});
  await enter(page,{position:shore,reduced:true,choices:{leo:{look:'boda',glasses:false},itza:{look:'boda',hair:'rubio',glasses:false}}});
  await interact(page);await page.getByRole('button',{name:'Ver fuegos artificiales',exact:true}).tap();
  for(const size of [{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(size);await fullSurface(page,'#game-frame');
    await expect(page.locator('#world')).toHaveAttribute('data-coast-particles','54');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    for(const control of await page.locator('.coast-action:visible').all())expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole('button',{name:'Levantarnos',exact:true}).click();
  await page.locator('#map-button').click();await page.getByRole('button',{name:'Viaje a Hawái',exact:true}).click();
  await expect.poll(async()=>(await saved(page)).position,{timeout:25000}).toEqual(harbor);
  await interact(page);await page.getByRole('button',{name:'Subir al barco · Hawái',exact:true}).click();
  await expect(page.locator('.hawaii-map')).toBeVisible();
  for(const size of [{width:844,height:390},{width:390,height:844}]){
    await page.setViewportSize(size);await fullSurface(page,'.hawaii-stage');
    for(const control of await page.locator('.hawaii-destination').all())expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  const map=page.locator('.hawaii-map'),originalX=await map.getAttribute('data-hawaii-x'),box=await map.boundingBox();
  await page.touchscreen.tap(box.x+box.width*.8,box.y+box.height*.65);
  await expect.poll(()=>map.getAttribute('data-hawaii-x')).not.toBe(originalX);
  await zone(page,'giraffe');await page.getByRole('button',{name:'Acariciar a la jirafa',exact:true}).click();
  await page.getByRole('button',{name:'Volver a nuestro mundo',exact:true}).click();
  expect((await saved(page)).position).toEqual(harbor);
  expect((await saved(page)).outfits.itza).toEqual({look:'boda',hair:'rubio',glasses:false});check();
});
