import {test,expect} from '@playwright/test';

async function mountLake(page){
  await page.route('**/__lake-v12-component',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="es"><meta charset="UTF-8"><style>body{margin:16px;background:#f9f0e3}*{box-sizing:border-box}button{font-family:monospace}</style><main id="fixture"></main></html>'}));
  await page.goto('/__lake-v12-component');
  await page.evaluate(async()=>{
    const {mount}=await import('/game/experiences/mirador.js');
    const images={};
    await Promise.all(['/assets/game/characters/leo/look-01.png','/assets/game/characters/itza/look-01.png','/assets/game/home/seated-bodies.png','/assets/game/home/seated-crossed.png'].map(url=>new Promise(resolve=>{
      const image=new Image();image.onload=()=>{images[url]=image;resolve();};image.onerror=resolve;image.src=url;
    })));
    const fill=CanvasRenderingContext2D.prototype.fillRect;window.__lakeDraws=0;
    CanvasRenderingContext2D.prototype.fillRect=function(...args){if(this.canvas.classList.contains('lakeside-scene'))window.__lakeDraws++;return fill.apply(this,args);};
    window.__lakeSave={};window.__lakeSays=[];window.__lakeProgress=0;
    window.__closeLake=mount(document.querySelector('#fixture'),{},
      {save:window.__lakeSave,assetImage:url=>images[url],onProgressChange:()=>window.__lakeProgress++,onLeoSay:line=>window.__lakeSays.push(line)});
  });
}

test('the lake seats the pair before a finite manual show, records wishes and cleans its animation',async({page})=>{
  await page.clock.install();await mountLake(page);
  const scene=page.locator('.lakeside-scene');
  await expect(scene).toHaveAttribute('data-sitting','false');
  await expect(page.getByRole('button',{name:'Ver fuegos artificiales',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Sentarnos juntos',exact:true}).click();
  await page.getByRole('button',{name:'Ver fuegos artificiales',exact:true}).click();
  await page.clock.runFor(1000);
  await expect(scene).toHaveAttribute('data-fireworks','true');
  expect(Number(await scene.getAttribute('data-active-particles'))).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Pedir un deseo',exact:true}).click();
  await expect(scene).toHaveAttribute('data-wishes','1');
  expect(await page.evaluate(()=>window.__lakeSave.lakeside)).toEqual({visits:1,sits:1,shows:1,wishes:1});
  await page.clock.runFor(19000);
  await expect(scene).toHaveAttribute('data-fireworks','false');
  await page.getByRole('button',{name:'Levantarnos',exact:true}).click();
  await expect(scene).toHaveAttribute('data-sitting','false');
  await expect(page.getByRole('button',{name:'Sentarnos juntos',exact:true})).toBeFocused();
  await page.evaluate(()=>window.__closeLake());
  const stopped=await page.evaluate(()=>window.__lakeDraws);await page.clock.runFor(3000);
  expect(await page.evaluate(()=>window.__lakeDraws)).toBe(stopped);
});

test('reduced motion keeps fireworks static and the phone controls fit without horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  await page.clock.install();await mountLake(page);
  await page.getByRole('button',{name:'Sentarnos juntos',exact:true}).click();
  await page.getByRole('button',{name:'Ver fuegos artificiales',exact:true}).click();
  await expect(page.locator('.lakeside-scene')).toHaveAttribute('data-active-particles','54');
  const still=await page.evaluate(()=>window.__lakeDraws);await page.clock.runFor(2000);
  expect(await page.evaluate(()=>window.__lakeDraws)).toBe(still);
  await page.getByRole('button',{name:'Pedir un deseo',exact:true}).click();
  await expect(page.locator('.lakeside-scene')).toHaveAttribute('data-visible-shooting-stars','1');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const button of await page.locator('.lakeside-button:visible').all())expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button',{name:'Ocultar fuegos artificiales',exact:true}).click();
  await expect(page.locator('.lakeside-scene')).toHaveAttribute('data-active-particles','0');
  await page.evaluate(()=>window.__closeLake());
});
