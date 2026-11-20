import {test,expect} from '@playwright/test';
import {HAWAII_ZONES} from '../../game/hawaii.js';

const key='oowwww-game-v1';
const outfits={leo:{look:'alternativo',glasses:false},itza:{look:'principal',hair:'rosa',glasses:false}};
test.use({hasTouch:true});
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
async function enter(page,{position={x:30,y:25},reduced=true}={}){
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await page.addInitScript(({key,position,outfits})=>{
    window.__travelDraws={hawaii:0,lake:0};
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
      if(this.canvas.classList.contains('hawaii-map'))window.__travelDraws.hawaii++;
      if(this.canvas.classList.contains('lakeside-scene'))window.__travelDraws.lake++;
      return draw.apply(this,args);
    };
    if(sessionStorage.getItem('__travel_v12_seed'))return;
    sessionStorage.setItem('__travel_v12_seed','yes');
    localStorage.setItem(key,JSON.stringify({position,direction:'down',outfits,visited:[],
      leoVoice:{enabled:false},soundEffects:{enabled:false,volume:.2},dayNight:{mode:'day',cycleStartedAt:Date.now()}}));
  },{key,position,outfits});
  await page.goto('/game.html');await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
}
async function interact(page){await page.locator('#world').focus();await page.keyboard.press('e');}
function errorsOf(page){
  const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().includes('/assets/game/')&&r.status()>=400)failed.push(r.url());});
  return ()=>{expect(errors).toEqual([]);expect(failed).toEqual([]);};
}
async function visitZone(page,id){
  await page.locator('[data-hawaii-destination="'+id+'"]').click();
  const point=HAWAII_ZONES.find(zone=>zone.id===id).arrival;
  await expect.poll(async()=>({x:Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-x')),
    y:Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-y'))})).toEqual(point);
  await expect(page.locator('.hawaii-trip')).toHaveAttribute('data-hawaii-zone',id);
}

test('the village map reaches Hawaii, all activities persist and returning preserves the village position',async({page})=>{
  const check=errorsOf(page);await enter(page);
  await page.locator('#map-button').click();
  await expect(page.getByRole('button',{name:'Orilla de los deseos',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Viaje a Hawái',exact:true}).click();
  await expect.poll(async()=>(await saved(page)).position,{timeout:25000}).toEqual({x:76,y:42});
  await interact(page);await expect(page.locator('.hawaii-map')).toBeVisible();
  await expect(page.locator('.hawaii-map')).toHaveAttribute('data-itza-hair','rosa');
  await expect(page.locator('.hawaii-map')).toHaveAttribute('data-itza-glasses','false');
  await page.locator('.hawaii-map').focus();await page.keyboard.down('ArrowUp');
  await expect.poll(async()=>Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-y'))).toBeLessThan(317);
  await page.keyboard.up('ArrowUp');
  await visitZone(page,'dance');await page.getByRole('button',{name:'Bailar con Leo',exact:true}).click();
  await expect(page.locator('.hawaii-map')).toHaveAttribute('data-hawaii-action','dance');
  expect((await saved(page)).hawaii.dances).toBe(1);
  await page.getByRole('button',{name:'Dejar de bailar',exact:true}).click();
  await visitZone(page,'bar');
  for(const id of ['pina','mango','coco'])await page.locator('[data-hawaii-drink="'+id+'"] button, button[data-hawaii-drink="'+id+'"]').click();
  expect((await saved(page)).hawaii.drinks).toEqual({pina:1,mango:1,coco:1});
  await visitZone(page,'giraffe');await page.getByRole('button',{name:'Acariciar a la jirafa',exact:true}).click();
  expect((await saved(page)).hawaii.giraffePets).toBe(1);
  await expect(page.locator('.hawaii-map')).toHaveAttribute('data-hawaii-action','pet');
  await page.getByRole('button',{name:'Volver a nuestro mundo',exact:true}).click();
  await expect(page.locator('#experience')).toBeHidden();
  expect((await saved(page)).position).toEqual({x:76,y:42});
  const stopped=await page.evaluate(()=>window.__travelDraws.hawaii);await page.waitForTimeout(250);
  expect(await page.evaluate(()=>window.__travelDraws.hawaii)).toBe(stopped);
  await page.reload();await page.locator('#start-game').click();await interact(page);
  const state=(await saved(page)).hawaii;
  expect(state).toMatchObject({visits:2,dances:1,giraffePets:1,shells:9,drinks:{pina:1,mango:1,coco:1},lastDrink:'coco'});
  check();
});

test('the real lakeside seats the personalized couple, runs fireworks, grants a wish and stops on return',async({page})=>{
  const check=errorsOf(page);await enter(page,{position:{x:58,y:34},reduced:false});await interact(page);
  const scene=page.locator('.lakeside-scene');await expect(scene).toBeVisible();
  await expect(page.getByRole('button',{name:'Ver fuegos artificiales',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Sentarnos juntos',exact:true}).click();
  await page.getByRole('button',{name:'Ver fuegos artificiales',exact:true}).click();
  await expect.poll(async()=>Number(await scene.getAttribute('data-active-particles'))).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Pedir un deseo',exact:true}).click();
  await expect(scene).toHaveAttribute('data-visible-shooting-stars','1');
  expect((await saved(page)).lakeside).toEqual({visits:1,sits:1,shows:1,wishes:1});
  await page.getByRole('button',{name:'Levantarnos',exact:true}).click();
  await expect(scene).toHaveAttribute('data-sitting','false');await expect(scene).toHaveAttribute('data-fireworks','false');
  await page.getByRole('button',{name:'Volver al mundo',exact:true}).click();
  const stopped=await page.evaluate(()=>window.__travelDraws.lake);await page.waitForTimeout(250);
  expect(await page.evaluate(()=>window.__travelDraws.lake)).toBe(stopped);
  expect((await saved(page)).position).toEqual({x:58,y:34});
  await page.reload();await page.locator('#start-game').click();await interact(page);
  expect((await saved(page)).lakeside).toEqual({visits:2,sits:1,shows:1,wishes:1});check();
});

test('phone touch navigation and rotation keep Hawaii usable and reduced-motion lake fireworks static',async({page})=>{
  const check=errorsOf(page);await page.setViewportSize({width:390,height:844});
  await enter(page,{position:{x:76,y:42}});await interact(page);
  const canvas=page.locator('.hawaii-map');await expect(canvas).toBeVisible();
  const original=await canvas.getAttribute('data-hawaii-x');
  const box=await canvas.boundingBox();await page.touchscreen.tap(box.x+box.width*.74,box.y+box.height*.7);
  await expect.poll(()=>canvas.getAttribute('data-hawaii-x')).not.toBe(original);
  await visitZone(page,'giraffe');await page.getByRole('button',{name:'Acariciar a la jirafa',exact:true}).tap();
  await page.setViewportSize({width:844,height:390});await expect(canvas).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const button of await page.locator('.hawaii-destination').all())expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button',{name:'Volver a nuestro mundo',exact:true}).click();
  await page.locator('#map-button').click();await page.getByRole('button',{name:'Orilla de los deseos',exact:true}).click();
  await expect.poll(async()=>(await saved(page)).position,{timeout:20000}).toEqual({x:58,y:34});await interact(page);
  await page.getByRole('button',{name:'Sentarnos juntos',exact:true}).click();await page.getByRole('button',{name:'Ver fuegos artificiales',exact:true}).click();
  const scene=page.locator('.lakeside-scene');await expect(scene).toHaveAttribute('data-active-particles','54');
  const still=await page.evaluate(()=>window.__travelDraws.lake);await page.waitForTimeout(250);
  expect(await page.evaluate(()=>window.__travelDraws.lake)).toBe(still);
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const button of await page.locator('.lakeside-button:visible').all())expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
  check();
});
