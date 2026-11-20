import {test,expect} from '@playwright/test';

async function setup(page){
  await page.route('**/__soundscape-v11',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><button id="unlock">Entrar</button><aside id="music-dock"></aside>'}));
  await page.goto('/__soundscape-v11');
  await page.evaluate(async()=>{
    const {createSoundscape}=await import('/game/soundscape.js');
    window.__sfxStarts=0;window.__sfxStops=0;window.__sfxContexts=0;window.__sfxChanges=[];
    const Audio=window.AudioContext||window.webkitAudioContext;
    const create=()=>{
      window.__sfxContexts++;const context=new Audio();
      const buffer=context.createBufferSource.bind(context);
      context.createBufferSource=()=>{
        const source=buffer(),start=source.start.bind(source),stop=source.stop.bind(source);
        source.start=(...args)=>{window.__sfxStarts++;return start(...args);};
        source.stop=(...args)=>{window.__sfxStops++;return stop(...args);};return source;
      };return context;
    };
    window.__sfx=createSoundscape({createAudioContext:create,onChange:state=>window.__sfxChanges.push(state)});
    window.__sfx.mount(document.getElementById('music-dock'));
    document.getElementById('unlock').onclick=()=>window.__sfx.unlock();
  });
}

test('sound effects require a gesture and music-dock controls persist their own preferences',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await setup(page);
  await page.evaluate(()=>{window.__sfx.setEnvironment({active:true,night:true,nearWater:true});window.__sfx.meow();});
  expect(await page.evaluate(()=>window.__sfxContexts)).toBe(0);
  await page.locator('#unlock').click();await expect.poll(()=>page.evaluate(()=>window.__sfxStarts)).toBe(2);
  await page.locator('#sound-effects-toggle').click();
  await expect(page.locator('#sound-effects-toggle')).toHaveAttribute('aria-pressed','false');
  const stopped=await page.evaluate(()=>window.__sfxStarts);
  await page.evaluate(()=>{window.__sfx.meow();window.__sfx.splash();window.__sfx.step();});
  expect(await page.evaluate(()=>window.__sfxStarts)).toBe(stopped);
  await page.locator('#sound-effects-volume').focus();await page.keyboard.press('Home');
  for(let i=0;i<20;i++)await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(()=>window.__sfx.getState())).toEqual({enabled:false,volume:.2});
  await page.locator('#sound-effects-toggle').click();
  await expect.poll(()=>page.evaluate(()=>window.__sfxStarts)).toBeGreaterThan(stopped);
  const state=await page.evaluate(()=>window.__sfxChanges.at(-1));expect(state).toEqual({enabled:true,volume:.2});
  expect(errors).toEqual([]);await page.evaluate(()=>window.__sfx.dispose());
});

test('dialog and media pauses stop ambience and disposal prevents late playback',async({page})=>{
  await setup(page);await page.locator('#unlock').click();
  await page.evaluate(()=>window.__sfx.setEnvironment({active:true,night:true,nearWater:true}));
  const before=await page.evaluate(()=>window.__sfxStarts);expect(before).toBe(2);
  await page.evaluate(()=>window.__sfx.setEnvironment({active:false,night:true,nearWater:true}));
  expect(await page.evaluate(()=>window.__sfxStops)).toBe(2);
  await page.evaluate(()=>{window.__sfx.suspend('television');window.__sfx.setEnvironment({active:true,night:true,nearWater:true});window.__sfx.splash();});
  expect(await page.evaluate(()=>window.__sfxStarts)).toBe(before);
  await page.evaluate(()=>window.__sfx.resume('television'));
  await expect.poll(()=>page.evaluate(()=>window.__sfxStarts)).toBe(4);
  await page.evaluate(()=>{window.__sfx.dispose();window.__sfx.splash();window.__sfx.meow();});
  expect(await page.evaluate(()=>window.__sfxStarts)).toBe(4);
  await expect(page.locator('#sound-effects-toggle')).toHaveCount(0);
});
