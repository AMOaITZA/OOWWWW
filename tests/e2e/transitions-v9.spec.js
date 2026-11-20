import {test,expect} from '@playwright/test';

async function enter(page,reducedMotion='no-preference'){
  await page.emulateMedia({reducedMotion});
  await page.addInitScript(()=>localStorage.setItem('oowwww-game-v1',JSON.stringify({
    position:{x:14,y:42},direction:'down',visited:[],outfits:{itza:{look:'principal'},leo:{look:'principal'}},
    leoVoice:{enabled:false},dayNight:{mode:'day',cycleStartedAt:Date.now()}
  })));
  await page.goto('/game.html');await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
}

test('entry fades on the full scene and exit releases focus and artwork immediately',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await enter(page);await page.locator('#world').focus();await page.keyboard.press('e');
  await expect(page.locator('#close-experience')).toBeFocused();
  const entry=await page.locator('#experience').evaluate(panel=>({state:panel.dataset.transition,
    names:panel.getAnimations({subtree:true}).map(animation=>animation.animationName)}));
  expect(entry.state).toBe('entering');expect(entry.names).toContain('game-scene-arrive');
  await expect(page.locator('#experience')).not.toHaveAttribute('data-transition','entering');
  const immediate=await page.evaluate(()=>{
    document.getElementById('close-experience').click();
    return {closed:document.getElementById('experience').hidden,focus:document.activeElement.id,
      departureLayers:document.querySelectorAll('.experience-departure').length,
      contentEmpty:document.getElementById('experience-content').childElementCount===0,
      count:document.querySelectorAll('#experience-content').length};
  });
  expect(immediate).toEqual({closed:true,focus:'world',departureLayers:0,contentEmpty:true,count:1});
  await expect(page.locator('.experience-departure')).toHaveCount(0);
  await expect(page.locator('#experience-content')).toBeEmpty();
  expect(errors).toEqual([]);
});

test('rapid reopen and switching to the map cannot erase a new experience or trap focus',async({page})=>{
  await enter(page);await page.locator('#help-button').click();
  await page.evaluate(()=>{
    document.getElementById('close-experience').click();
    document.getElementById('help-button').click();
  });
  await expect(page.locator('.experience-departure')).toHaveCount(0);
  await expect(page.locator('#experience')).toBeVisible();
  await expect(page.locator('#experience')).not.toHaveAttribute('data-transition','entering');
  await expect(page.locator('#experience-content')).toContainText('Toca o haz clic');
  await expect(page.locator('#close-experience')).toBeFocused();
  expect(await page.locator('.experience-panel').count()).toBe(1);
  await page.evaluate(()=>{
    document.getElementById('close-experience').click();
    document.getElementById('map-button').focus();
    document.getElementById('map-button').click();
  });
  await expect(page.locator('.experience-departure')).toHaveCount(0);
  await expect(page.locator('#map-panel')).toBeVisible();await expect(page.locator('#close-map')).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('#map-button')).toBeFocused();
  expect(await page.locator('#experience .experience-panel').count()).toBe(1);
});

test('reduced motion skips both transitions, including preference changes while open',async({page})=>{
  await enter(page,'reduce');await page.locator('#help-button').click();
  await expect(page.locator('#experience')).not.toHaveAttribute('data-transition','entering');
  expect(await page.locator('#experience').evaluate(panel=>panel.getAnimations({subtree:true}).length)).toBe(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.experience-departure')).toHaveCount(0);
  await expect(page.locator('#experience-content')).toBeEmpty();await expect(page.locator('#help-button')).toBeFocused();
  await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#help-button').click();
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('#experience')).not.toHaveAttribute('data-transition','entering');
  await page.keyboard.press('Escape');await expect(page.locator('.experience-departure')).toHaveCount(0);
});

test('closing immediately stops the wardrobe animation and leaves no exit surface',async({page})=>{
  await enter(page);
  await page.evaluate(()=>{
    window.__wardrobeDraws=0;
    const original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
      if(this.canvas.classList.contains('wardrobe-preview'))window.__wardrobeDraws++;
      return original.apply(this,args);
    };
  });
  await page.locator('#world').focus();await page.keyboard.press('e');
  await page.getByRole('button',{name:'Ver caminata',exact:true}).click();
  const before=await page.evaluate(()=>window.__wardrobeDraws);
  await expect.poll(()=>page.evaluate(()=>window.__wardrobeDraws)).toBeGreaterThan(before+1);
  const stoppedAt=await page.evaluate(()=>{document.getElementById('close-experience').click();return window.__wardrobeDraws;});
  await expect(page.locator('.experience-departure')).toHaveCount(0);
  expect(await page.evaluate(()=>window.__wardrobeDraws)).toBe(stoppedAt);
  await expect(page.locator('#world')).toBeFocused();
});
