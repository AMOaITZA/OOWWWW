import {test,expect} from '@playwright/test';
import {COAST_LAYOUT} from '../../game/coast-layout.js';
import {HAWAII_ZONES} from '../../game/hawaii.js';

async function island(page){
  await page.addInitScript(position=>{
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',visited:[],outfits:{leo:{look:'boda'},itza:{look:'boda',hair:'rubio',glasses:false}},
      leoVoice:{enabled:false},soundEffects:{enabled:false}}));
    window.__musicPlayCalls=0;const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){if(this.id==='music-audio')window.__musicPlayCalls++;return play.apply(this,args);};
  },{x:COAST_LAYOUT.hawaiiArrival[0],y:COAST_LAYOUT.hawaiiArrival[1]});
  await page.goto('/game.html');await page.locator('#start-game').click();
  await page.evaluate(()=>{window.__originalMusic=document.getElementById('music-audio');});
  await page.locator('#world').focus();await page.keyboard.press('e');
  await page.getByRole('button',{name:'Subir al barco · Hawái',exact:true}).click();
  await expect(page.locator('.hawaii-map')).toBeVisible();
}
test('Hawaii plays and controls the existing music player during a dance and on return',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await island(page);
  expect(await page.evaluate(()=>window.__musicPlayCalls)).toBe(0);
  await expect(page.locator('#music-audio')).not.toHaveAttribute('src',/.+/);
  await page.locator('.scene-music-toggle').click();
  const songs=page.getByRole('combobox',{name:'Canción para bailar',exact:true});
  await expect(songs.locator('option')).toHaveCount(37);
  await songs.selectOption({index:1});
  const chosen=await songs.inputValue();
  await expect.poll(()=>page.locator('#music-audio').evaluate(audio=>!audio.paused&&audio.currentTime>.1)).toBe(true);
  expect(await page.evaluate(()=>window.__originalMusic===document.getElementById('music-audio'))).toBe(true);
  await page.getByRole('slider',{name:'Volumen de música en la isla',exact:true}).evaluate(input=>{input.value='23';input.dispatchEvent(new Event('input',{bubbles:true}));});
  expect(await page.locator('#music-audio').evaluate(audio=>audio.volume)).toBe(.23);
  await expect(page.locator('#music-volume')).toHaveValue('23');
  await page.getByRole('button',{name:'Pausar música en la isla',exact:true}).click();
  expect(await page.locator('#music-audio').evaluate(audio=>audio.paused)).toBe(true);
  await page.getByRole('button',{name:'Reproducir música en la isla',exact:true}).click();
  await expect.poll(()=>page.locator('#music-audio').evaluate(audio=>audio.paused)).toBe(false);
  await page.getByRole('button',{name:'Cerrar música de la isla',exact:true}).click();
  await page.locator('[data-hawaii-destination="dance"]').click();
  const point=HAWAII_ZONES.find(zone=>zone.id==='dance').arrival;
  await expect.poll(async()=>({x:Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-x')),y:Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-y'))})).toEqual(point);
  await page.getByRole('button',{name:'Bailar con Leo',exact:true}).click();
  await expect(page.locator('.hawaii-map')).toHaveAttribute('data-hawaii-action','dance');
  expect(await page.locator('#music-audio').evaluate(audio=>audio.paused)).toBe(false);
  await page.getByRole('button',{name:'Volver a nuestro mundo',exact:true}).click();
  await expect(page.locator('.scene-music')).toHaveCount(0);
  expect(await page.locator('#music-audio').evaluate(audio=>audio.paused)).toBe(false);
  expect(await page.evaluate(()=>window.__originalMusic===document.getElementById('music-audio'))).toBe(true);
  expect(await page.evaluate(()=>localStorage.getItem('oowwww-audio-track-v1'))).toBe(chosen);
  expect(await page.evaluate(()=>localStorage.getItem('oowwww-audio-volume-v1'))).toBe('0.23');
  expect(errors).toEqual([]);
});

test('the island music menu fits a phone in both orientations and Escape closes just the controls',async({page})=>{
  await page.setViewportSize({width:390,height:844});await island(page);
  for(const size of [{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(size);await page.locator('.scene-music-toggle').click();
    const panel=page.locator('.scene-music-panel');await expect(panel).toBeVisible();
    await expect.poll(()=>panel.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
    for(const control of await panel.locator('button,select,input').all())expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Escape');await expect(panel).toBeHidden();
    await expect(page.locator('.scene-music-toggle')).toBeFocused();await expect(page.locator('.hawaii-map')).toBeVisible();
  }
});
