import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const places=JSON.parse(readFileSync(new URL('../../game/data/places.json',import.meta.url),'utf8'));
const find=id=>places.find(p=>p.id===id);
async function loadAt(page,id){
  const place=find(id);if(!place)throw Error('No existe el lugar '+id);
  await page.goto('/game.html');
  // La página guarda su posición al salir. Entregamos el punto de prueba
  // al documento recién cargado para que pagehide no lo sobrescriba.
  await page.evaluate(p=>sessionStorage.setItem('__test_spawn',JSON.stringify({
    position:{x:p.arrival[0],y:p.arrival[1]},direction:'down',outfits:{leo:{},itza:{}},visited:[]
  })),place);
  await page.addInitScript(()=>{
    const seed=sessionStorage.getItem('__test_spawn');
    if(seed){localStorage.setItem('oowwww-game-v1',seed);sessionStorage.removeItem('__test_spawn');}
  });
  await page.reload();
  await page.locator('#start-game').click();
  return place;
}
async function tapPlace(page,place){
  await page.evaluate(p=>{
    const canvas=document.getElementById('world'),rect=canvas.getBoundingClientRect();
    const save=JSON.parse(localStorage.getItem('oowwww-game-v1'));
    const cameraX=Math.max(0,Math.min(1920-480,Math.round(save.position.x*16-240)));
    const cameraY=Math.max(0,Math.min(1280-270,Math.round(save.position.y*16-135)));
    const wx=p.tile[0]*16,wy=p.tile[1]*16;
    const clientX=rect.left+(wx-cameraX)*rect.width/480,clientY=rect.top+(wy-cameraY)*rect.height/270;
    canvas.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX,clientY,pointerType:'mouse'}));
  },place);
}
test('title, help, canvas and return to map',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/game.html');
  await expect(page.getByRole('button',{name:'Entrar'})).toBeVisible();
  await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
  await page.locator('#help-button').click();
  await expect(page.locator('#experience-title')).toHaveText('Cómo jugar');
  await page.locator('#close-experience').click();
  await expect(page.locator('#experience')).toBeHidden();
  expect(errors).toEqual([]);
});
test('walking, second tap and exact position retention',async({page})=>{
  await page.goto('/game.html');
  await page.evaluate(()=>localStorage.removeItem('oowwww-game-v1'));
  await page.reload();await page.locator('#start-game').click();
  const place=find('inicio');
  await tapPlace(page,place);
  await expect(page.locator('#world-status')).toContainText('Llegamos',{timeout:10000});
  await tapPlace(page,place);
  await expect(page.locator('#experience-title')).toHaveText(/Todo lo bueno/);
  await page.locator('#close-experience').click();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('oowwww-game-v1')));
  expect(state.position).toEqual({x:place.arrival[0],y:place.arrival[1]});
  expect(state.visited).toContain('inicio');
});
for(const id of ['carta','galeria','razones','playlist','recuerdos','contador','lugares','final']){
  test('experience '+id+' mounts and returns to map',async({page})=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const place=await loadAt(page,id);
    await tapPlace(page,place);
    await expect(page.locator('#experience')).toBeVisible();
    await expect(page.locator('#experience-title')).not.toBeEmpty();
    if(id==='carta')await expect(page.locator('.letter-original')).toContainText('Quiero que sepas algo');
    if(id==='galeria'){
      await expect(page.locator('.photo-tile')).toHaveCount(8);
      await page.getByRole('button',{name:'Ver fotografía 1'}).click();
      await expect(page.locator('.gallery-viewer')).toBeVisible();
      await page.getByRole('button',{name:'Cerrar foto'}).click();
      await expect(page.locator('.photo-tile')).toHaveCount(8);
    }
    if(id==='razones'){
      await expect(page.locator('.reasons-list li')).toHaveCount(8);
      await page.getByRole('button',{name:'Siguiente'}).click();
      await expect(page.locator('.reasons-count')).toHaveText('2 / 13');
    }
    if(id==='recuerdos'){
      await page.getByRole('button',{name:'Encender'}).click();
      await expect(page.locator('.tv-number')).toHaveText('1 / 21');
      await page.getByRole('button',{name:'Recuerdo siguiente'}).click();
      await expect(page.locator('.tv-number')).toHaveText('2 / 21');
    }
    if(id==='contador')await expect(page.locator('.counter-box')).toHaveCount(6);
    if(id==='lugares')await expect(page.locator('.place-memory')).toHaveCount(3);
    await page.locator('#close-experience').click();
    await expect(page.locator('#experience')).toBeHidden();
    expect(errors).toEqual([]);
  });
}
test('wardrobe changes remain after closing and reloading',async({page})=>{
  const place=await loadAt(page,'armario');
  await tapPlace(page,place);
  await expect(page.locator('#experience-title')).toHaveText('Armario');
  await page.getByRole('button',{name:'Suéter rosa'}).click();
  await expect(page.getByRole('button',{name:'Suéter rosa'})).toHaveClass(/selected/);
  await page.locator('#close-experience').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('oowwww-game-v1')));
  expect(saved.outfits.itza.top).toBe('rosa');
  await page.reload();await page.locator('#start-game').click();
  await tapPlace(page,place);
  await expect(page.getByRole('button',{name:'Suéter rosa'})).toHaveClass(/selected/);
});


test('overview navigates without teleporting and can be closed',async({page})=>{
  await page.goto('/game.html');
  await page.locator('#start-game').click();
  await page.locator('#map-button').click();
  await expect(page.locator('#map-panel')).toBeVisible();
  await expect(page.locator('#map-destinations button')).toHaveCount(10);
  const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('oowwww-game-v1')).position);
  await page.getByRole('button',{name:'Carta',exact:true}).click();
  await expect(page.locator('#map-panel')).toBeHidden();
  await expect(page.locator('#world-status')).toContainText('Caminando hacia Carta');
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('oowwww-game-v1')).position);
  expect(after).toEqual(original);
  await page.locator('#map-button').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#map-panel')).toBeHidden();
});
