import {test,expect} from '@playwright/test';

const key='oowwww-game-v1';
async function enter(page,{position={x:14,y:42},outfits={leo:{look:'principal',glasses:true},itza:{look:'principal',hair:'rosa',glasses:true}}}={}){
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(({position,outfits,key})=>{
    window.__leoOscStarts=0;window.__mediaPlayCalls=0;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(Audio){
      const create=Audio.prototype.createOscillator;
      Audio.prototype.createOscillator=function(...args){
        const oscillator=create.apply(this,args),start=oscillator.start;
        oscillator.start=function(...values){window.__leoOscStarts++;return start.apply(this,values);};
        return oscillator;
      };
    }
    const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){window.__mediaPlayCalls++;return play.apply(this,args);};
    if(sessionStorage.getItem('__v6_seeded'))return;
    sessionStorage.setItem('__v6_seeded','yes');
    localStorage.setItem(key,JSON.stringify({position,direction:'down',outfits,visited:[],leoVoice:{enabled:true},dayNight:{mode:'day',cycleStartedAt:Date.now()}}));
  },{position,outfits,key});
  await page.goto('/game.html');await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
}
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
const preview=page=>page.locator('.wardrobe-preview').evaluate(canvas=>canvas.toDataURL());
async function interact(page){await page.locator('#world').focus();await page.keyboard.press('e');}

test('glasses change real previews independently for Itza and Leo and persist across outfits',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await enter(page);await interact(page);await expect(page.locator('.wardrobe-preview')).toBeVisible();
  await page.getByRole('button',{name:'Lado',exact:true}).click();
  await page.getByRole('button',{name:'Leo',exact:true}).click();const leoBefore=await preview(page);
  await page.getByRole('button',{name:'Itza',exact:true}).click();
  const itzaGlasses=page.getByRole('group',{name:'Lentes de Itza',exact:true});
  for(const look of ['Conjunto original','Segundo conjunto','Vestido de novia']){
    await page.getByRole('group',{name:'Conjuntos completos',exact:true}).getByRole('button',{name:look,exact:true}).click();
    await itzaGlasses.getByRole('button',{name:'Con lentes',exact:true}).click();const before=await preview(page);
    await itzaGlasses.getByRole('button',{name:'Sin lentes',exact:true}).click();
    await expect(itzaGlasses.getByRole('button',{name:'Sin lentes',exact:true})).toHaveAttribute('aria-pressed','true');
    expect(await preview(page)).not.toBe(before);expect((await saved(page)).outfits.leo.glasses).toBe(true);
    await itzaGlasses.getByRole('button',{name:'Con lentes',exact:true}).click();expect(await preview(page)).toBe(before);
  }
  await itzaGlasses.getByRole('button',{name:'Sin lentes',exact:true}).click();
  await page.getByRole('button',{name:'Leo',exact:true}).click();expect(await preview(page)).toBe(leoBefore);
  const leoGlasses=page.getByRole('group',{name:'Lentes de Leo',exact:true});
  await leoGlasses.getByRole('button',{name:'Sin lentes',exact:true}).click();expect(await preview(page)).not.toBe(leoBefore);
  expect((await saved(page)).outfits.itza.glasses).toBe(false);expect((await saved(page)).outfits.leo.glasses).toBe(false);
  await page.keyboard.press('Escape');await page.reload();await page.locator('#start-game').click();await interact(page);
  await expect(itzaGlasses.getByRole('button',{name:'Sin lentes',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Leo',exact:true}).click();
  await expect(leoGlasses.getByRole('button',{name:'Sin lentes',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(errors).toEqual([]);
});

test('the secret is discovered by visiting, reveals eight loving answers and keeps progress',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await enter(page,{position:{x:12,y:20}});await page.locator('#map-button').click();
  await expect(page.getByRole('button',{name:'Nuestro rinconcito secreto',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'La grabadora de Leo',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await interact(page);await expect(page.locator('.secret-quiz')).toBeVisible();
  for(let index=0;index<8;index++){
    await expect(page.locator('.secret-progress')).toHaveText(`Pregunta ${index+1} de 8`);
    await page.locator('.secret-options button').first().click();
    await expect(page.locator('.secret-reply')).toBeVisible();
    if(index===0)await expect(page.locator('.secret-reply')).toContainText('el de tus ojos');
    if(index===1)await expect(page.locator('.secret-reply')).toContainText('el tuyo');
    await page.getByRole('button',{name:index===7?'Guardar este secreto':'Siguiente',exact:true}).click();
  }
  await expect(page.locator('.secret-question')).toHaveText('Mi respuesta favorita eres tú');
  const state=await saved(page);expect(state.secretQuiz.index).toBe(8);expect(state.secretQuiz.choices.filter(Boolean)).toHaveLength(8);expect(state.visited).toContain('secreto');
  await page.keyboard.press('Escape');await page.locator('#map-button').click();
  await expect(page.getByRole('button',{name:'Nuestro rinconcito secreto',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await page.reload();await page.locator('#start-game').click();await interact(page);
  await expect(page.locator('.secret-question')).toHaveText('Mi respuesta favorita eres tú');expect(errors).toEqual([]);
});

test('Leo speaks after a gesture and muting blocks subsequent phrases and survives reload',async({page})=>{
  await enter(page,{position:{x:24,y:33}});
  expect(await page.evaluate(()=>window.__leoOscStarts)).toBe(0);await interact(page);
  await expect(page.locator('#world-status')).toContainText('Descansando');
  await expect.poll(()=>page.evaluate(()=>window.__leoOscStarts)).toBeGreaterThanOrEqual(4);
  await page.locator('#music-button').click();await page.locator('#leo-voice-toggle').click();
  await expect(page.locator('#leo-voice-toggle')).toHaveAttribute('aria-pressed','false');
  await page.locator('#music-close').click();const starts=await page.evaluate(()=>window.__leoOscStarts);
  await interact(page);await expect(page.locator('#leo-bubble')).toContainText('vamos a seguir caminando');
  expect(await page.evaluate(()=>window.__leoOscStarts)).toBe(starts);expect((await saved(page)).leoVoice.enabled).toBe(false);
  await page.reload();await page.locator('#start-game').click();await page.locator('#music-button').click();
  await expect(page.locator('#leo-voice-toggle')).toHaveAttribute('aria-pressed','false');
});

test('the empty recorder opens on mobile without missing audio requests or autoplay',async({browser})=>{
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  try{
    const page=await context.newPage(),requests=[],errors=[];
    page.on('request',request=>{if(/\/voice-notes\/.*\.mp3(?:\?|$)/.test(request.url()))requests.push(request.url());});
    page.on('pageerror',error=>errors.push(error.message));
    await enter(page,{position:{x:98,y:23}});await interact(page);
    await expect(page.locator('.voice-recorder')).toBeVisible();await expect(page.locator('.recorder-status')).toContainText('Pronto habrá mensajes');
    await expect(page.getByRole('button',{name:'Reproducir mensaje',exact:true})).toBeDisabled();
    const audio=await page.locator('.voice-note-audio').elementHandle();expect(await audio.getAttribute('src')).toBeNull();
    expect(await page.evaluate(()=>window.__mediaPlayCalls)).toBe(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
    await page.getByRole('button',{name:'Cerrar',exact:true}).tap();expect(await audio.evaluate(element=>element.paused)).toBe(true);
    expect(requests).toEqual([]);expect(errors).toEqual([]);
  }finally{await context.close();}
});
