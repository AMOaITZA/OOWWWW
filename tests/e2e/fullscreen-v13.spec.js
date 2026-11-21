import {test,expect} from '@playwright/test';

async function enter(page,position={x:37,y:53}){
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(position=>localStorage.setItem('oowwww-game-v1',JSON.stringify({position,
    outfits:{leo:{look:'principal',glasses:false},itza:{look:'principal',hair:'rosa',glasses:false}},visited:[],
    leoVoice:{enabled:false},soundEffects:{enabled:false}})),position);
  await page.goto('/game.html');await page.locator('#start-game').click();
}
async function interact(page){await page.locator('#world').focus();await page.keyboard.press('e');}
async function expectSurface(page,selector){
  const rect=await page.locator(selector).evaluate(element=>{
    const r=element.getBoundingClientRect(),s=getComputedStyle(element);
    return {x:r.x,y:r.y,width:r.width,height:r.height,vw:innerWidth,vh:innerHeight,border:s.borderTopWidth,shadow:s.boxShadow};
  });
  expect(rect.x).toBe(0);expect(rect.y).toBe(0);expect(rect.width).toBe(rect.vw);expect(rect.height).toBe(rect.vh);
  expect(rect.border).toBe('0px');expect(rect.shadow).toBe('none');
}

test('reading experiences and the map occupy the full game surface with an immediate return',async({page})=>{
  await enter(page,{x:45,y:21});await interact(page);
  await expectSurface(page,'#experience .experience-panel');
  expect(await page.locator('#experience').evaluate(e=>getComputedStyle(e).backdropFilter)).toBe('none');
  await expect(page.locator('.letter-original')).toBeVisible();await page.locator('#close-experience').click();
  await expect(page.locator('#experience')).toBeHidden();await expect(page.locator('#world')).toBeFocused();
  await expect(page.locator('.experience-departure')).toHaveCount(0);
  await page.locator('#map-button').click();await expectSurface(page,'#map-panel .map-paper');
  await page.keyboard.press('Escape');await expect(page.locator('#map-button')).toBeFocused();
});

test('the house is a full room with usable activity HUD and an optional TV control drawer on phones',async({page})=>{
  await page.setViewportSize({width:390,height:844});await enter(page);await interact(page);
  await expectSurface(page,'#experience .experience-panel');await expectSurface(page,'.home-room');
  for(const [id,label,focus] of [['sleep','Dormir juntos',85],['tv','Ver la tele',374],['eat','Comer juntos',234]]){
    await page.getByRole('button',{name:label,exact:true}).click();
    await expect(page.locator('.home-scene')).toHaveAttribute('data-activity',id);
    await expect(page.locator('.home-scene')).toHaveAttribute('data-camera-focus',String(focus));
    await expect(page.locator('.home-scene')).toBeVisible();
    const controls=await page.getByRole('button',{name:label,exact:true}).boundingBox();
    expect(controls.height).toBeGreaterThanOrEqual(44);expect(controls.y+controls.height).toBeLessThanOrEqual(844);
  }
  await page.getByRole('button',{name:'Ver la tele',exact:true}).click();
  await page.locator('.scene-options>summary').click();
  await expect(page.locator('.home-video-play')).toBeVisible();
  await page.locator('.scene-options>summary').click();
  await page.setViewportSize({width:844,height:390});await expectSurface(page,'.home-room');
  await expect(page.locator('#close-experience')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('the wedding stage fills the screen and chapter controls remain keyboard accessible',async({page})=>{
  await page.setViewportSize({width:390,height:844});await enter(page,{x:105,y:54});await interact(page);
  await expectSurface(page,'.wedding-ceremony');await expect(page.locator('.wedding-cinema')).toBeVisible();
  await page.getByRole('button',{name:'Siguiente',exact:true}).click();
  await expect(page.locator('.wedding-stage-title')).toHaveText('Nuestras promesas');
  await page.keyboard.press('Escape');await expect(page.locator('#experience')).toBeHidden();
  await expect(page.locator('.experience-departure')).toHaveCount(0);
});
