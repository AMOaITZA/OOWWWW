import {test,expect} from '@playwright/test';

async function mountFishing(page,{reduced=false,state}={}){
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});await page.clock.install();
  await page.route('**/__fishing-component',route=>route.fulfill({contentType:'text/html',body:
    '<!doctype html><html lang="es"><meta charset="utf-8"><style>[hidden]{display:none!important}body{margin:0;padding:16px;background:#fff1dc}main{max-width:800px;margin:auto}</style><main id="fishing-root"></main></html>'}));
  await page.goto('/__fishing-component');
  await page.evaluate(async state=>{
    const {mount}=await import('/game/experiences/pesca.js');
    window.__fishNotifications=[];window.__fishSaves=0;
    window.__fishApi={save:{fishing:state},onProgressChange:()=>window.__fishSaves++,onFishingChange:event=>window.__fishNotifications.push(event)};
    window.__fishCleanup=mount(document.getElementById('fishing-root'),{},window.__fishApi);
  },state);
}
async function ready(page){
  await page.getByRole('button',{name:/^(Lanzar la caña|Lanzar otra vez)$/}).click();
  await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','waiting');
  await page.clock.fastForward(1501);await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','bite');
}

test('native fishing misses safely, retries, and completes five distinct real button catches',async({page})=>{
  await mountFishing(page);await ready(page);await page.clock.fastForward(2801);
  await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','missed');
  expect(await page.evaluate(()=>window.__fishApi.save.fishing.catches)).toBe(0);
  for(let index=0;index<5;index++){
    await ready(page);await page.getByRole('button',{name:'¡Sacar!',exact:true}).click();
    await expect(page.locator('.fishing-game')).toHaveAttribute('data-collected',String(index+1));
  }
  await expect(page.locator('.fishing-completion')).toBeVisible();
  expect(await page.locator('.fishing-plush[data-found="true"]').count()).toBe(5);
  const events=await page.evaluate(()=>window.__fishNotifications);
  expect(events.filter(event=>event.newlyCompleted)).toHaveLength(1);expect(events.at(-1).complete).toBe(true);
  expect(await page.evaluate(()=>window.__fishApi.save.fishing.casts)).toBe(6);
});

test('keyboard action retains focus while waiting and reduced motion has no deadline',async({page})=>{
  await mountFishing(page,{reduced:true});const action=page.locator('.fishing-action');
  await action.focus();await page.keyboard.press('Enter');await expect(action).toBeFocused();
  await page.clock.fastForward(1501);await expect(action).toBeFocused();
  await page.clock.fastForward(60000);await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','bite');
  await page.keyboard.press('Space');await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','caught');
  await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});await page.clock.fastForward(2801);
  await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','missed');
});

test('cleanup prevents stale waiting or bite timers from changing saved progress',async({page})=>{
  await mountFishing(page);await page.getByRole('button',{name:'Lanzar la caña',exact:true}).click();
  await page.evaluate(()=>window.__fishCleanup());
  const before=await page.evaluate(()=>({state:window.__fishApi.save.fishing,saves:window.__fishSaves,phase:document.querySelector('.fishing-game').dataset.phase}));
  await page.clock.fastForward(30000);
  expect(await page.evaluate(()=>({state:window.__fishApi.save.fishing,saves:window.__fishSaves,phase:document.querySelector('.fishing-game').dataset.phase}))).toEqual(before);
  await mountFishing(page);await ready(page);await page.evaluate(()=>window.__fishCleanup());
  await page.clock.fastForward(30000);await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','bite');
  expect(await page.evaluate(()=>window.__fishApi.save.fishing.catches)).toBe(0);
});

test('restoring partial progress and hiding a round preserves discoveries without granting a catch',async({page})=>{
  await mountFishing(page,{state:{collection:{freddy:1,chica:2},casts:4,catches:3}});
  await expect(page.locator('.fishing-game')).toHaveAttribute('data-collected','2');
  await ready(page);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','idle');await page.clock.fastForward(10000);
  expect(await page.evaluate(()=>window.__fishApi.save.fishing.collection)).toEqual({freddy:1,chica:2});
  expect(await page.evaluate(()=>window.__fishApi.save.fishing.catches)).toBe(3);
});
