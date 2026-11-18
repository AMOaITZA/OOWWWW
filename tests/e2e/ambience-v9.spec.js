import {test,expect} from '@playwright/test';
import {pondTileBlocked} from '../../game/pond-geometry.js';

const saveKey='oowwww-game-v1';
test.use({viewport:{width:1440,height:900}});
async function enter(page,{position={x:50,y:34},mode='day',reduced=false}={}){
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await page.addInitScript(({position,mode,saveKey})=>localStorage.setItem(saveKey,JSON.stringify({
    position,direction:'down',visited:['carta'],
    outfits:{leo:{look:'principal'},itza:{look:'principal',hair:'rosa',glasses:false}},
    leoVoice:{enabled:false},dayNight:{mode,cycleStartedAt:Date.now()}
  })),{position,mode,saveKey});
  await page.goto('/game.html');await page.locator('#start-game').click();
  await expect(page.locator('#world')).toHaveAttribute('data-water-ready','true');
}
const clock=page=>page.locator('#world').evaluate(canvas=>Number(canvas.dataset.ambientTime));
const stats=page=>page.locator('#world').evaluate(canvas=>({...canvas.dataset}));
async function cropHash(page,box){
  return page.locator('#world').evaluate((canvas,{x,y,width,height})=>{
    x-=Number(canvas.dataset.cameraX);y-=Number(canvas.dataset.cameraY);
    if(x<0||y<0||x+width>canvas.width||y+height>canvas.height)throw new Error('QA crop is outside the camera');
    const pixels=canvas.getContext('2d').getImageData(x,y,width,height).data;
    let hash=2166136261;for(const value of pixels)hash=Math.imul(hash^value,16777619);
    return hash>>>0;
  },box);
}
const water={x:758,y:453,width:86,height:43};

test('the real pond water animates while particle counts stay bounded',async({page})=>{
  await enter(page);await expect.poll(async()=>Number((await stats(page)).visibleRipples)).toBeGreaterThan(0);
  const before=await cropHash(page,water);await page.waitForTimeout(1150);
  expect(await cropHash(page,water)).not.toBe(before);
  const state=await stats(page);expect(Number(state.visibleRipples)).toBeLessThanOrEqual(7);
  expect(Number(state.visiblePetals)).toBeLessThanOrEqual(50);expect(state.ambientMotion).toBe('active');
});

test('petals move near the cherry canopy without changing the ground artwork',async({page})=>{
  await enter(page,{position:{x:40,y:36}});
  await expect.poll(async()=>Number((await stats(page)).visiblePetals)).toBeGreaterThan(0);
  const petals={x:595,y:430,width:90,height:65},before=await cropHash(page,petals);
  await page.waitForTimeout(1250);expect(await cropHash(page,petals)).not.toBe(before);
});

test('night lights drift and glow without changing the selected night mode',async({page})=>{
  await enter(page,{position:{x:55,y:43},mode:'night'});
  await expect.poll(async()=>Number((await stats(page)).visibleLanterns)).toBeGreaterThan(0);
  const lamp={x:850,y:560,width:64,height:64},before=await cropHash(page,lamp);
  await page.waitForTimeout(1350);expect(await cropHash(page,lamp)).not.toBe(before);
  expect((await stats(page)).dayPhase).toBe('night');
});

test('reduced motion keeps the water static and live preference changes resume gently',async({page})=>{
  await enter(page,{reduced:true});const before=await cropHash(page,water),at=await clock(page);
  await page.waitForTimeout(700);expect(await cropHash(page,water)).toBe(before);expect(await clock(page)).toBe(at);
  const reduced=await stats(page);expect(reduced.ambientMotion).toBe('reduced');
  expect(reduced.visiblePetals).toBe('0');expect(reduced.visibleRipples).toBe('0');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect.poll(()=>clock(page)).toBeGreaterThan(at);
  await expect(page.locator('#world')).toHaveAttribute('data-ambient-motion','active');
});

test('ambient time pauses behind dialogs and simulated hidden visibility without catching up',async({page})=>{
  await enter(page);await page.locator('#help-button').click();const helpAt=await clock(page);
  await page.waitForTimeout(400);expect(await clock(page)).toBe(helpAt);
  await page.keyboard.press('Escape');await expect.poll(()=>clock(page)).toBeGreaterThan(helpAt);
  await page.locator('#map-button').click();const mapAt=await clock(page);
  await page.waitForTimeout(400);expect(await clock(page)).toBe(mapAt);await page.locator('#close-map').click();
  await page.evaluate(()=>{
    window.__qaHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__qaHidden});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hiddenAt=await clock(page);await page.waitForTimeout(500);expect(await clock(page)).toBe(hiddenAt);
  await page.evaluate(()=>{window.__qaHidden=false;document.dispatchEvent(new Event('visibilitychange'));});
  await expect.poll(()=>clock(page)).toBeGreaterThan(hiddenAt);
  expect((await clock(page))-hiddenAt).toBeLessThan(.35);
});

test('phone taps stop at the pond shore and rotation preserves the effect and controls',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  try{
    const page=await context.newPage();await enter(page);
    const point=await page.locator('#world').evaluate(canvas=>{const r=canvas.getBoundingClientRect();
      return {x:r.left+(800-Number(canvas.dataset.cameraX))*r.width/canvas.width,
        y:r.top+(479-Number(canvas.dataset.cameraY))*r.height/canvas.height};});
    await page.touchscreen.tap(point.x,point.y);
    await expect.poll(()=>page.locator('#world-status').textContent()).not.toContain('Caminando…');
    await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).position,saveKey)).not.toEqual({x:50,y:34});
    const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),saveKey);
    expect(pondTileBlocked(saved.position.x,saved.position.y)).toBe(false);
    expect(Math.hypot(saved.position.x-50,saved.position.y-30)).toBeLessThanOrEqual(6);
    await page.setViewportSize({width:844,height:390});
    await expect.poll(()=>page.locator('#world').evaluate(c=>Math.abs(c.getBoundingClientRect().height-innerHeight))).toBeLessThanOrEqual(3);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
    await page.locator('#help-button').tap();await expect(page.locator('#experience')).toBeVisible();
    await page.locator('#close-experience').tap();await expect(page.locator('#experience')).toBeHidden();
  }finally{await context.close();}
});

test('an older save inside the new pond moves only to a nearby shore',async({page})=>{
  await enter(page,{position:{x:50,y:30}});
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),saveKey);
  expect(pondTileBlocked(saved.position.x,saved.position.y)).toBe(false);
  expect(Math.hypot(saved.position.x-50,saved.position.y-30)).toBeLessThanOrEqual(6);
  expect(saved.visited).toContain('carta');expect(saved.outfits.itza.hair).toBe('rosa');
});
