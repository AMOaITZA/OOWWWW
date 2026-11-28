import {test,expect} from '@playwright/test';
import {FISHING_SPOT} from '../../game/finale-spots.js';

const key='oowwww-game-v1';
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
async function enter(page,{position={x:60,y:79},look='principal',hair='rosa',motion='reduce'}={}){
  await page.emulateMedia({reducedMotion:motion});
  await page.addInitScript(({key,position,look,hair})=>{
    window.__v14Ground=[];window.__v14FishingRewards=[];
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
      const source=args[0],url=source?.src||'';
      if(this.canvas.id==='world'&&/ground(?:-unified|-v4)?(?:-[\w-]+)?\.png/.test(url)){
        const value={url,width:source.naturalWidth||source.width,height:source.naturalHeight||source.height};
        if(!window.__v14Ground.some(item=>item.url===url))window.__v14Ground.push(value);
      }
      if(this.canvas.classList.contains('fishing-scene')&&/\/(freddy|bonnie|chica|foxy|golden-freddy)(?:-[\w-]+)?\.png/.test(url)){
        const values=args.length===9?args.slice(5,9):args.slice(1,5);
        window.__v14FishingRewards.push({x:values[0],y:values[1],width:values[2],height:values[3],at:performance.now()});
      }
      return draw.apply(this,args);
    };
    if(sessionStorage.getItem('__polish_v14_seed'))return;
    sessionStorage.setItem('__polish_v14_seed','yes');
    localStorage.setItem(key,JSON.stringify({position,direction:'down',visited:[],
      outfits:{leo:{look,glasses:false},itza:{look,hair,glasses:false}},
      leoVoice:{enabled:false},soundEffects:{enabled:false},dayNight:{mode:'day',cycleStartedAt:Date.now()}}));
  },{key,position,look,hair});
  await page.goto('/game.html');await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
}
async function interact(page){await page.locator('#world').focus();await page.keyboard.press('e');}
function errorsOf(page){
  const errors=[],failed=[];page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().includes('/assets/game/')&&response.status()>=400)failed.push(response.url());});
  return ()=>{expect(errors).toEqual([]);expect(failed).toEqual([]);};
}

test('the village and coast render from one complete terrain surface in both light phases',async({page})=>{
  const check=errorsOf(page);await enter(page);
  const draws=await page.evaluate(()=>window.__v14Ground);
  const unified=draws.filter(item=>/ground-unified/.test(item.url));
  expect(unified).toHaveLength(1);expect(unified[0]).toMatchObject({width:1920,height:1792});
  expect(draws.some(item=>/\/coast\/ground\.png/.test(item.url))).toBe(false);
  expect(draws.some(item=>/ground-v4/.test(item.url))).toBe(false);
  const day=await page.locator('#world').evaluate(canvas=>canvas.toDataURL());
  await page.locator('#day-night-night').click();
  await expect(page.locator('#world')).toHaveAttribute('data-day-phase','night');
  expect(await page.locator('#world').evaluate(canvas=>canvas.toDataURL())).not.toBe(day);
  expect((await saved(page)).position).toEqual({x:60,y:79});
  check();
});

// Fishing cases below exercise the ordinary cast/bite/reel controls, rather
// than seeding an earned plush collection. Scene details are recorded from the
// actual canvas and reviewed alongside the capture script.
test('Itza casts from the bank and visibly raises the earned plush while keeping her outfit and face options',async({page})=>{
  const check=errorsOf(page);await enter(page,{position:{x:FISHING_SPOT.arrival[0],y:FISHING_SPOT.arrival[1]},look:'boda',hair:'rubio',motion:'no-preference'});
  await interact(page);const scene=page.locator('.fishing-scene');
  await expect(scene).toHaveAttribute('data-actor-ready','true');
  await expect(scene).toHaveAttribute('data-itza-look','boda');await expect(scene).toHaveAttribute('data-itza-hair','rubio');
  await expect(scene).toHaveAttribute('data-itza-glasses','false');
  await page.getByRole('button',{name:'Lanzar la caña',exact:true}).click();
  await expect(scene).toHaveAttribute('data-phase','waiting');
  await expect(scene).toHaveAttribute('data-visual','waiting');
  await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','bite');
  await expect(scene).toHaveAttribute('data-visual','bite');
  const biteGrip=await scene.evaluate(({dataset:d})=>({
    x:Number(d.rodHandX)-Number(d.actorX),y:Number(d.rodHandY)-Number(d.actorY)
  }));
  // The bottom of the personalized side face is row 29 in the actor frame.
  expect(biteGrip.x).toBeGreaterThanOrEqual(30);expect(biteGrip.y).toBeGreaterThanOrEqual(30);
  await page.getByRole('button',{name:'¡Sacar!',exact:true}).click();
  await expect(scene).toHaveAttribute('data-visual','reeling');
  await expect(scene).toHaveAttribute('data-visual','caught');
  const motion=await page.evaluate(()=>window.__v14FishingRewards);
  expect(motion.length).toBeGreaterThan(3);
  expect(new Set(motion.map(value=>Math.round(value.y))).size).toBeGreaterThan(3);
  const layout=await scene.evaluate(canvas=>({
    handX:Number(canvas.dataset.rodHandX),handY:Number(canvas.dataset.rodHandY),
    actorX:Number(canvas.dataset.actorX),actorY:Number(canvas.dataset.actorY),
    actorWidth:Number(canvas.dataset.actorWidth),actorHeight:Number(canvas.dataset.actorHeight),
    rewardX:Number(canvas.dataset.rewardX),rewardY:Number(canvas.dataset.rewardY)
  }));
  expect(layout.handX).toBeGreaterThan(layout.actorX);expect(layout.handX).toBeLessThan(layout.actorX+layout.actorWidth);
  expect(layout.handY).toBeGreaterThanOrEqual(layout.actorY);expect(layout.handY).toBeLessThan(layout.actorY+layout.actorHeight);
  expect(Math.hypot(layout.rewardX-layout.handX,layout.rewardY-layout.handY)).toBeLessThan(35);
  expect((await saved(page)).fishing.catches).toBe(1);
  expect((await saved(page)).outfits.itza).toEqual({look:'boda',hair:'rubio',glasses:false});
  const handle=await scene.elementHandle();await page.locator('#close-experience').click();
  const stopped=await handle.evaluate(canvas=>canvas.toDataURL());await page.waitForTimeout(200);
  expect(await handle.evaluate(canvas=>canvas.toDataURL())).toBe(stopped);check();
});

test('phone fishing keeps Itza, her rod and the plush visible through rotation and reduced motion',async({page})=>{
  const check=errorsOf(page);await page.setViewportSize({width:390,height:844});
  await enter(page,{position:{x:FISHING_SPOT.arrival[0],y:FISHING_SPOT.arrival[1]},hair:'rosa'});await interact(page);
  const scene=page.locator('.fishing-scene');await expect(scene).toHaveAttribute('data-actor-ready','true');
  await page.getByRole('button',{name:'Lanzar la caña',exact:true}).click();
  await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','bite');
  await page.getByRole('button',{name:'¡Sacar!',exact:true}).click();
  await expect(scene).toHaveAttribute('data-visual','caught');
  for(const size of [{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(size);
    await expect.poll(()=>scene.evaluate(canvas=>{
      const r=canvas.getBoundingClientRect(),stage=canvas.parentElement.getBoundingClientRect();
      const x=Number(canvas.dataset.actorX),y=Number(canvas.dataset.actorY),s=r.width/canvas.width;
      const width=Number(canvas.dataset.actorWidth),height=Number(canvas.dataset.actorHeight);
      const actor={left:r.left+x*s,right:r.left+(x+width)*s,top:r.top+y*s,bottom:r.top+(y+height)*s};
      const clear=[...document.querySelectorAll('.fishing-status,.fishing-action,.fishing-mission')].every(el=>{
        const hud=el.getBoundingClientRect();
        return actor.right<=hud.left||actor.left>=hud.right||actor.bottom<=hud.top||actor.top>=hud.bottom;
      });
      return Math.abs(stage.width-innerWidth)<1&&Math.abs(stage.height-innerHeight)<1&&
        actor.left>=0&&actor.right<=innerWidth&&actor.top>=0&&actor.bottom<=innerHeight&&clear;
    })).toBe(true);
    const action=await page.locator('.fishing-action').boundingBox();expect(action.height).toBeGreaterThanOrEqual(44);
    expect(action.x).toBeGreaterThanOrEqual(0);expect(action.x+action.width).toBeLessThanOrEqual(size.width);
  }
  expect((await saved(page)).fishing.catches).toBe(1);check();
});
