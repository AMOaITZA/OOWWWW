import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const places=JSON.parse(readFileSync(new URL('../../game/data/places.json',import.meta.url),'utf8'));
const place=id=>places.find(item=>item.id===id);

async function enterAt(page,id){
  const destination=place(id);
  await page.addInitScript(position=>{
    if(sessionStorage.getItem('__character_style_seeded'))return;
    sessionStorage.setItem('__character_style_seeded','yes');
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',outfits:{leo:{},itza:{}},visited:[]}));
  },{x:destination.arrival[0],y:destination.arrival[1]});
  await page.goto('/game.html');
  await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.locator('#experience')).toBeVisible();
}

async function characterState(page){
  return page.evaluate(async()=>{
    const art=await import('/game/wedding-assets.js');
    await art.loadWeddingImages();
    return {source:art.weddingCharacterSource(),images:Object.fromEntries(
      ['leo-walk','itza-walk','idle','vows','kiss','hug','celebrate'].map(key=>{
        const image=art.weddingImage(key);
        return [key,image?[image.naturalWidth||image.width,image.naturalHeight||image.height]:null];
      }))};
  });
}

test('look 1 and wedding looks preview every direction, animate and keep both saved choices',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await enterAt(page,'armario');
  const preview=page.locator('.wardrobe-preview');
  await expect(page.locator('#experience-title')).toHaveText('Armario');
  for(const who of ['Itza','Leo']){
    await page.getByRole('button',{name:who,exact:true}).click();
    for(const id of ['principal','boda']){
      const choice=page.locator('[data-wardrobe-focus="look-'+id+'"]');
      await expect(choice).toBeEnabled();await choice.click();
      await expect(choice).toHaveAttribute('aria-pressed','true');
      for(const direction of ['Frente','Lado','Espalda']){
        await page.getByRole('button',{name:direction,exact:true}).click();
        await expect(preview).toHaveAttribute('aria-label',new RegExp(who));
      }
      await page.getByRole('button',{name:'Frente',exact:true}).click();
      await page.getByRole('button',{name:'Ver caminata',exact:true}).click();
      const first=await preview.evaluate(canvas=>canvas.toDataURL());
      await expect.poll(()=>preview.evaluate(canvas=>canvas.toDataURL())).not.toBe(first);
      await page.getByRole('button',{name:'Detener animación',exact:true}).click();
    }
  }
  await page.keyboard.press('Escape');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('oowwww-game-v1')));
  expect(saved.outfits.leo.look).toBe('boda');expect(saved.outfits.itza.look).toBe('boda');
  await page.reload();await page.locator('#start-game').click();
  await page.keyboard.press('e');
  await expect(page.locator('[data-wardrobe-focus="look-boda"]')).toHaveAttribute('aria-pressed','true');
  expect((await characterState(page)).source).toBe('atlas');
  expect(errors).toEqual([]);
});

test('all ceremonial poses remain real new sprites when the atlas is unavailable',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const loaded=new Set();
  page.on('response',response=>{
    if(response.status()===200&&response.url().includes('/wedding/characters/'))loaded.add(response.url().split('/').at(-1));
  });
  await page.route('**/assets/game/wedding/atlas.png',route=>route.fulfill({status:404,body:''}));
  await enterAt(page,'boda');
  const state=await characterState(page);
  expect(state.source).toBe('standalone');
  expect(state.images).toEqual({'leo-walk':[192,144],'itza-walk':[192,144],idle:[128,48],vows:[256,48],kiss:[192,48],hug:[128,48],celebrate:[192,48]});
  expect([...loaded].sort()).toEqual(['leo-walk.png','itza-walk.png','idle.png','vows.png','kiss.png','hug.png','celebrate.png'].sort());
  for(const name of ['La llegada','Nuestras promesas','El gran sí','El abrazo','¡A celebrar!','Para recordar']){
    await expect(page.locator('.wedding-stage-title')).toHaveText(name);
    await expect(page.locator('.wedding-cinema')).toBeVisible();
    if(name!=='Para recordar')await page.getByRole('button',{name:'Siguiente',exact:true}).click();
  }
  await expect(page.locator('.wedding-art-notice')).toContainText('respaldo');
  expect(errors).toEqual([]);
});
