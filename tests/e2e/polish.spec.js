import {test,expect} from '@playwright/test';

async function enter(page,position={x:30,y:25}){
  await page.addInitScript(position=>localStorage.setItem('oowwww-game-v1',JSON.stringify({
    position,direction:'down',outfits:{leo:{},itza:{}},visited:[]
  })),position);
  await page.goto('/game.html');
  await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
}
async function openWedding(page){
  await enter(page,{x:105,y:56});
  const box=await page.locator('#world').boundingBox();
  await page.locator('#world').click({position:{x:box.width/2,y:box.height*55/270}});
  await expect(page.locator('.wedding-cinema')).toBeVisible();
}

test('dialogs contain keyboard focus, restore the trigger and keep music mounted',async({page})=>{
  await enter(page);
  await page.locator('#music-button').click();
  await expect(page.locator('#music-dock')).toBeVisible();
  const audio=await page.locator('#music-audio').elementHandle();
  await page.locator('#help-button').click();
  await expect(page.locator('#music-dock')).toBeHidden();
  await expect(page.locator('#close-experience')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#close-experience')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#close-experience')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#experience')).toBeHidden();
  await expect(page.locator('#help-button')).toBeFocused();
  await expect(page.locator('#music-dock')).toBeVisible();
  expect(await audio.evaluate(node=>node===document.getElementById('music-audio'))).toBe(true);
  await page.locator('#music-close').click();
  await page.locator('#map-button').click();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button',{name:'Banca · Banca del sendero'})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#close-map')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#map-button')).toBeFocused();
});

for(const size of [{width:375,height:812},{width:812,height:375},{width:1440,height:1000}]){
 test(`all wedding chapters and controls fit ${size.width}×${size.height}`,async({page},testInfo)=>{
  await page.setViewportSize(size);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const failed=[];page.on('response',res=>{if(res.url().includes('/assets/game/')&&res.status()>=400)failed.push(res.url());});
  await openWedding(page);
  await expect(page.locator('#music-audio')).not.toHaveAttribute('src',/.+/);
  const stages=['La llegada','Nuestras promesas','El gran sí','El abrazo','¡A celebrar!','Para recordar'];
  for(let i=0;i<stages.length;i++){
    await expect(page.locator('.wedding-stage-title')).toHaveText(stages[i]);
    const metrics=await page.locator('.wedding-cinema').evaluate(canvas=>{
      const r=canvas.getBoundingClientRect(),style=getComputedStyle(canvas);
      return {width:r.width-parseFloat(style.borderLeftWidth)-parseFloat(style.borderRightWidth),
        height:r.height-parseFloat(style.borderTopWidth)-parseFloat(style.borderBottomWidth),
        overflow:document.documentElement.scrollWidth-innerWidth};
    });
    expect(Math.abs(metrics.width/metrics.height-16/9)).toBeLessThan(.02);
    expect(metrics.overflow).toBeLessThanOrEqual(1);
    await page.getByRole('button',{name:'Repetir escena',exact:true}).click();
    if(i===1)await page.getByRole('button',{name:'Sí, quiero',exact:true}).click();
    else if(i<5)await page.getByRole('button',{name:'Siguiente',exact:true}).click();
  }
  await page.getByRole('button',{name:'Reproducir historia',exact:true}).click();
  await expect(page.locator('.wedding-stage-title')).toHaveText('La llegada');
  await page.getByRole('button',{name:'Pausar historia',exact:true}).click();
  await page.locator('.wedding-cinema').scrollIntoViewIfNeeded();
  await testInfo.attach('wedding-'+size.width,{body:await page.screenshot(),contentType:'image/png'});
  await page.keyboard.press('Escape');
  await expect(page.locator('#experience')).toBeHidden();
  const box=await page.locator('#world').boundingBox();
  await page.locator('#world').click({position:{x:box.width/2,y:box.height*55/270}});
  await expect(page.locator('.wedding-stage-title')).toHaveText('La llegada');
  expect(errors).toEqual([]);expect(failed).toEqual([]);
 });
}

test('range controls do not send movement keys to the world',async({page})=>{
  await enter(page);
  const original=await page.evaluate(()=>localStorage.getItem('oowwww-game-v1'));
  await page.locator('#music-button').click();
  await page.locator('#music-volume').focus();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(450);
  await page.keyboard.up('ArrowRight');
  await page.locator('#help-button').click();
  await page.keyboard.press('Escape');
  const after=await page.evaluate(()=>localStorage.getItem('oowwww-game-v1'));
  expect(JSON.parse(after).position).toEqual(JSON.parse(original).position);
});

test('classic page remains available with its original sections',async({page})=>{
  await page.goto('/');
  for(const id of ['hero','carta','galeria','razones','playlist','detalles','contador','lugares','final'])
    await expect(page.locator('#'+id)).toHaveCount(1);
});

test('reduced motion keeps wedding artwork still and navigation usable',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await openWedding(page);
  const canvas=page.locator('.wedding-cinema');
  const before=await canvas.screenshot();
  await page.waitForTimeout(350);
  expect((await canvas.screenshot()).equals(before)).toBe(true);
  await page.getByRole('button',{name:'Siguiente',exact:true}).click();
  await page.getByRole('button',{name:'Sí, quiero',exact:true}).click();
  await expect(page.locator('.wedding-stage-title')).toHaveText('El gran sí');
  await expect(page.locator('.wedding-vow')).toContainText('Sí, quiero');
});

test('missing wedding atlas uses an identified fallback without speculative image requests',async({page})=>{
  const speculative=[];
  page.on('request',req=>{if(/\/wedding\/(castle|roof|arch|pair-).*\.png/.test(req.url()))speculative.push(req.url());});
  await page.route('**/assets/game/wedding/atlas.png',route=>route.fulfill({status:404,body:''}));
  await openWedding(page);
  await expect(page.locator('.wedding-art-notice')).toContainText(/respaldo/);
  await page.getByRole('button',{name:'Siguiente',exact:true}).click();
  await expect(page.locator('.wedding-stage-title')).toHaveText('Nuestras promesas');
  expect(speculative).toEqual([]);
});

test('long Leo dialogue stays in the scene on a touch screen',async({browser})=>{
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  try{
    const page=await context.newPage();
    await page.addInitScript(()=>{Math.random=()=>.46;});
    await enter(page,{x:24,y:33});
    const canvas=page.locator('#world'),rect=await canvas.boundingBox();
    await canvas.tap({position:{x:rect.width/2,y:rect.height*103/270}});
    await expect(page.locator('#leo-bubble')).toContainText('te amo como el mar');
    await expect(page.locator('#world-status')).toContainText('Descansando');
    const bounds=await page.locator('#leo-bubble').boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(rect.x);
    expect(bounds.y).toBeGreaterThanOrEqual(rect.y);
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(rect.x+rect.width+1);
    expect(bounds.y+bounds.height).toBeLessThanOrEqual(rect.y+rect.height+1);
  }finally{await context.close();}
});
