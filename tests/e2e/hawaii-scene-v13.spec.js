import {test,expect} from '@playwright/test';
import {COAST_LAYOUT} from '../../game/coast-layout.js';
import {HAWAII_ZONES} from '../../game/hawaii.js';
const key='oowwww-game-v1';
async function enter(page,reduced=true){
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await page.addInitScript(({position,key})=>localStorage.setItem(key,JSON.stringify({position,outfits:{leo:{look:'principal',glasses:false},itza:{look:'boda',hair:'rosa',glasses:false}},visited:[],leoVoice:{enabled:false},soundEffects:{enabled:false}})),{position:{x:COAST_LAYOUT.hawaiiArrival[0],y:COAST_LAYOUT.hawaiiArrival[1]},key});
  await page.goto('/game.html');await page.locator('#start-game').click();
  await page.locator('#world').focus();await page.keyboard.press('e');
  await page.getByRole('button',{name:'Subir al barco · Hawái',exact:true}).click();
  await expect(page.locator('.hawaii-map')).toBeVisible();
}
async function visit(page,id){
  const point=HAWAII_ZONES.find(z=>z.id===id).arrival;
  await page.locator('[data-hawaii-destination="'+id+'"]').click();
  await expect.poll(async()=>({x:Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-x')),y:Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-y'))}),{timeout:12000}).toEqual(point);
}
for(const [width,height] of [[1440,1000],[390,844],[844,390]])test(`Hawaii is a continuous full-screen map with usable HUD at ${width}×${height}`,async({page})=>{
  await page.setViewportSize({width,height});await enter(page);
  const map=page.locator('.hawaii-map');
  const scene=await page.locator('.hawaii-trip').boundingBox();
  expect(scene.x).toBe(0);expect(scene.y).toBe(0);expect(scene.width).toBe(width);expect(scene.height).toBe(height);
  const canvas=await map.boundingBox();expect(canvas.width).toBeGreaterThanOrEqual(width);expect(canvas.height).toBeGreaterThanOrEqual(height);
  expect(await page.locator('#experience-content').evaluate(el=>el.scrollHeight<=el.clientHeight+1&&el.scrollWidth<=el.clientWidth+1)).toBe(true);
  for(const button of await page.locator('.hawaii-destination').all()){
    const box=await button.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);expect(box.y+box.height).toBeLessThanOrEqual(height);
  }
  await visit(page,'bar');await expect(page.locator('.hawaii-drinks')).toBeVisible();
  const menu=await page.locator('.hawaii-drinks').boundingBox();expect(menu.x).toBeGreaterThanOrEqual(0);expect(menu.y).toBeGreaterThanOrEqual(0);expect(menu.y+menu.height).toBeLessThanOrEqual(height);
  await page.locator('button[data-hawaii-drink="coco"]').click();
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);expect(saved.hawaii.drinks.coco).toBe(1);
  await page.getByRole('button',{name:'Volver a nuestro mundo',exact:true}).click();await expect(page.locator('#experience')).toBeHidden();
  expect((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)).position).toEqual({x:COAST_LAYOUT.hawaiiArrival[0],y:COAST_LAYOUT.hawaiiArrival[1]});
});
test('the Hawaii dance uses the drawn dance sequence and keeps both current looks',async({page})=>{
  await page.addInitScript(()=>{
    window.__drawnDanceActors=[];
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
      const data=args[0]?.dataset;
      if(this.canvas.classList.contains('hawaii-map')&&data?.danceCharacter)
        window.__drawnDanceActors.push({who:data.danceCharacter,pose:data.dancePose,look:data.danceLook});
      return draw.apply(this,args);
    };
  });
  await enter(page,false);await visit(page,'dance');await page.getByRole('button',{name:'Bailar con Leo',exact:true}).click();
  const frames=new Set(),phases=new Set();
  for(let i=0;i<16;i++){
    frames.add(await page.locator('.hawaii-map').getAttribute('data-dance-frame'));
    phases.add(await page.locator('.hawaii-map').getAttribute('data-dance-phase'));
    await page.waitForTimeout(190);
  }
  expect(frames.size).toBeGreaterThanOrEqual(6);expect(phases.size).toBeGreaterThanOrEqual(6);
  const drawn=await page.evaluate(()=>window.__drawnDanceActors);
  expect(new Set(drawn.map(actor=>actor.who))).toEqual(new Set(['leo','itza']));
  expect(new Set(drawn.map(actor=>actor.pose)).size).toBeGreaterThanOrEqual(6);
  expect(drawn.every(actor=>actor.look===(actor.who==='leo'?'principal':'boda'))).toBe(true);
  await expect(page.locator('.hawaii-map')).toHaveAttribute('data-leo-look','principal');
  await expect(page.locator('.hawaii-map')).toHaveAttribute('data-itza-look','boda');
  await expect(page.locator('.hawaii-map')).toHaveAttribute('data-itza-hair','rosa');
  await page.getByRole('button',{name:'Dejar de bailar',exact:true}).click();await expect(page.locator('.hawaii-map')).toHaveAttribute('data-hawaii-action','explore');
});
