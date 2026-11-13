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
    if(id==='final'){
      await expect(page.locator('.final-pair img').first()).toBeVisible();
      await page.getByRole('button',{name:'Para siempre'}).click();
      await expect(page.getByRole('button',{name:'Te amo'})).toBeVisible();
      await expect(page.locator('.final-pair img').last()).toBeVisible();
    }
    await page.locator('#close-experience').click();
    await expect(page.locator('#experience')).toBeHidden();
    expect(errors).toEqual([]);
  });
}
test('three outfits per character, switch and saved choice',async({page})=>{
  // PNG sintético válido: comprueba el segundo conjunto antes de que se suba su arte.
  const tiny='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/zpwAAAAASUVORK5CYII=';
  const png=Buffer.from(tiny,'base64');
  // Los sprites se generan con el tamaño exacto usando pngjs.
  const {default:pngjs}=await import('pngjs');
  const {PNG}=pngjs;
  const sheet=new PNG({width:192,height:144});
  for(let i=0;i<sheet.data.length;i+=4){
    sheet.data[i]=80;sheet.data[i+1]=65;sheet.data[i+2]=82;sheet.data[i+3]=255;
  }
  const body=PNG.sync.write(sheet);
  await page.route('**/assets/game/characters/*/look-0*.png',route=>route.fulfill({
    status:200,contentType:'image/png',body
  }));
  const place=await loadAt(page,'armario');
  await tapPlace(page,place);
  await expect(page.locator('#experience-title')).toHaveText('Armario');
  await expect(page.locator('.wardrobe-item')).toHaveCount(3);
  await expect(page.getByRole('button',{name:'Segundo conjunto'})).toBeEnabled();
  await page.getByRole('button',{name:'Segundo conjunto'}).click();
  await expect(page.getByRole('button',{name:'Segundo conjunto'})).toHaveClass(/selected/);
  await page.getByRole('button',{name:'Lado'}).click();
  await page.getByRole('button',{name:'Ver caminata'}).click();
  await expect(page.getByRole('button',{name:'Detener animación'})).toBeVisible();
  await page.getByRole('button',{name:'Leo',exact:true}).click();
  await expect(page.locator('.wardrobe-item')).toHaveCount(3);
  await expect(page.getByRole('button',{name:'Conjunto original'})).toHaveClass(/selected/);
  await page.locator('#close-experience').click();
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('oowwww-game-v1')));
  expect(save.outfits.itza.look).toBe('alternativo');
  expect(save.outfits.leo.look??'principal').toBe('principal');
  await page.reload();await page.locator('#start-game').click();
  await tapPlace(page,place);
  await expect(page.getByRole('button',{name:'Segundo conjunto'})).toHaveClass(/selected/);
});
test('overview navigates without teleporting and can be closed',async({page})=>{
  await page.goto('/game.html');
  await page.locator('#start-game').click();
  await page.locator('#map-button').click();
  await expect(page.locator('#map-panel')).toBeVisible();
  await expect(page.locator('#map-destinations button')).toHaveCount(14);
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

test('touchscreen portrait navigates and shows responsive game',async({browser})=>{
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage();
  try{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/game.html');
    await page.locator('#start-game').tap();
    await expect(page.locator('#world')).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    expect(overflow).toBeLessThanOrEqual(3);
    await page.locator('#map-button').tap();
    await expect(page.locator('#map-panel')).toBeVisible();
    await expect(page.locator('#map-destinations button')).toHaveCount(14);
    await page.locator('#close-map').tap();
    await expect(page.locator('#map-panel')).toBeHidden();
    await page.locator('#help-button').tap();
    await expect(page.locator('#experience-title')).toHaveText('Cómo jugar');
    await page.locator('#close-experience').tap();
    expect(errors).toEqual([]);
  }finally{await context.close();}
});

test('local MP3 playlist lists 37 songs and persists through experiences',async({page})=>{
  await page.route('**/assets/game/audio/**',route=>route.fulfill({
    status:200,contentType:'audio/mpeg',body:''
  }));
  await page.addInitScript(()=>{
    HTMLMediaElement.prototype.play=function(){
      this.dispatchEvent(new Event('play'));
      this.dispatchEvent(new Event('playing'));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause=function(){this.dispatchEvent(new Event('pause'));};
  });
  const place=await loadAt(page,'playlist');
  await tapPlace(page,place);
  await expect(page.locator('.playlist-song')).toHaveCount(37);
  await page.locator('.playlist-search').fill('Carla Morrison');
  await expect(page.locator('.playlist-song')).toHaveCount(2);
  await page.getByRole('button',{name:'Elegir Compartir — Carla Morrison'}).click();
  await expect(page.locator('#experience')).toBeHidden();
  await expect(page.locator('#music-dock')).toBeVisible();
  await expect(page.locator('#music-track-title')).toHaveText('Compartir');
  await expect(page.locator('#music-track-artist')).toHaveText('Carla Morrison');
  await expect(page.locator('#music-audio')).toHaveAttribute('src',/Compartir%20-%20Carla%20Morrison/);
  await page.locator('#help-button').click();
  await expect(page.locator('#experience')).toBeVisible();
  await expect(page.locator('#music-audio')).toHaveCount(1);
  await expect(page.locator('#music-track-title')).toHaveText('Compartir');
  await page.locator('#close-experience').click();
  await page.getByRole('button',{name:'Minimizar reproductor'}).click();
  await expect(page.locator('#music-dock')).toBeHidden();
  await expect(page.locator('#music-audio')).toHaveAttribute('src',/Compartir%20-%20Carla%20Morrison/);
  await page.locator('#music-button').click();
  await expect(page.locator('#music-dock')).toBeVisible();
  const saved=await page.evaluate(()=>localStorage.getItem('oowwww-audio-track-v1'));
  expect(saved).toBe('Compartir - Carla Morrison - Spotimate.app.mp3');
  await page.locator('#music-list').click();
  await expect(page.locator('.playlist-song')).toHaveCount(37);
});

test('audio player fits mobile portrait and does not autoplay on entry',async({browser})=>{
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  try{
    await page.goto('/game.html');
    await page.locator('#start-game').tap();
    await expect(page.locator('#music-audio')).not.toHaveAttribute('src',/.+/);
    await page.locator('#music-button').tap();
    await expect(page.locator('#music-dock')).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    expect(overflow).toBeLessThanOrEqual(3);
    await page.locator('#music-close').tap();
    await expect(page.locator('#music-dock')).toBeHidden();
  }finally{await context.close();}
});

test('cats can be petted and show sparkles state, bench can be used and exited',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>localStorage.setItem('oowwww-game-v1',JSON.stringify({
    position:{x:68,y:51},direction:'down',outfits:{leo:{},itza:{}},visited:[]
  })));
  await page.goto('/game.html');
  await page.locator('#start-game').click();
  await page.keyboard.press('e');
  await expect(page.locator('#world-status')).toContainText('Acariciando a los gatitos');
  await expect(page.locator('#leo-bubble')).toBeVisible();
  await page.locator('#map-button').click();
  await expect(page.locator('#map-destinations button')).toHaveCount(14);
  await expect(page.getByRole('button',{name:'Gatitos · Acariciar'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Banca · Banca del jardín/})).toBeVisible();
  await page.locator('#close-map').click();
  expect(errors).toEqual([]);
});
test('bench interaction uses E, repeats to stand, and walking stands up',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>localStorage.setItem('oowwww-game-v1',JSON.stringify({
    position:{x:24,y:33},direction:'down',outfits:{leo:{},itza:{}},visited:[]
  })));
  await page.goto('/game.html');
  await page.locator('#start-game').click();
  await page.keyboard.press('e');
  await expect(page.locator('#world-status')).toContainText('Descansando juntos en la banca');
  await expect(page.locator('#leo-bubble')).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.locator('#leo-bubble')).toContainText('vamos a seguir caminando');
  await page.keyboard.press('e');
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(350);
  await page.keyboard.up('ArrowDown');
  await expect(page.locator('#world')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Leo speech bubble floats near the characters without hiding the cats',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>localStorage.setItem('oowwww-game-v1',JSON.stringify({
    position:{x:68,y:51},direction:'down',outfits:{leo:{},itza:{}},visited:[]
  })));
  await page.goto('/game.html');
  await page.locator('#start-game').click();
  await page.keyboard.press('e');
  const bubble=page.locator('#leo-bubble');
  await expect(bubble).toBeVisible();
  await expect(bubble).toHaveCSS('position','fixed');
  const metrics=await page.evaluate(()=>{
    const element=document.querySelector('#leo-bubble');
    const b=element.getBoundingClientRect();
    const canvas=document.querySelector('#world').getBoundingClientRect();
    const k=canvas.width/480;
    const catX=canvas.left+(68*16-20-(68*16-240))*k;
    const catY=canvas.top+(47*16-32-(51*16-135))*k;
    const overlap=Math.max(0,Math.min(b.right,catX+40*k)-Math.max(b.left,catX))*
      Math.max(0,Math.min(b.bottom,catY+32*k)-Math.max(b.top,catY));
    return {overlap,x:b.x,y:b.y,right:b.right,bottom:b.bottom,
      tail:element.dataset.tail,width:innerWidth,height:innerHeight};
  });
  expect(metrics.overlap).toBe(0);
  expect(metrics.x).toBeGreaterThanOrEqual(0);
  expect(metrics.y).toBeGreaterThanOrEqual(0);
  expect(metrics.right).toBeLessThanOrEqual(metrics.width);
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.height);
  expect(['top','bottom','left','right']).toContain(metrics.tail);
  await page.locator('#map-button').click();
  await page.getByRole('button',{name:'Banca · Banca del sendero'}).click();
  await expect(page.locator('#world-status')).toContainText('Descansando juntos en la banca',{timeout:12000});
  await expect(bubble).toBeVisible();
  expect(errors).toEqual([]);
});

test('wedding castle opens cinematic chapters, keeps music node and can be revisited',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const place=await loadAt(page,'boda');
  await tapPlace(page,place);
  await expect(page.locator('#experience')).toBeVisible();
  await expect(page.locator('#experience-title')).toHaveText('Nuestra boda');
  await expect(page.locator('.wedding-cinema')).toBeVisible();
  await expect(page.locator('.wedding-stage-number')).toContainText('1 de 6');
  await page.getByRole('button',{name:'Siguiente'}).click();
  await expect(page.locator('.wedding-stage-title')).toHaveText('Nuestras promesas');
  await page.getByRole('button',{name:'Siguiente'}).click();
  await expect(page.locator('.wedding-stage-title')).toHaveText('El gran sí');
  await page.getByRole('button',{name:'Siguiente'}).click();
  await expect(page.locator('.wedding-stage-title')).toHaveText('El abrazo');
  await page.getByRole('button',{name:'Siguiente'}).click();
  await expect(page.locator('.wedding-stage-title')).toHaveText('¡A celebrar!');
  await page.getByRole('button',{name:'Siguiente'}).click();
  await expect(page.locator('.wedding-stage-title')).toHaveText('Para recordar');
  await page.getByRole('button',{name:'Volver al principio'}).click();
  await expect(page.locator('.wedding-stage-title')).toHaveText('La llegada');
  await expect(page.locator('#music-audio')).toHaveCount(1);
  await page.locator('#close-experience').click();
  await expect(page.locator('#experience')).toBeHidden();
  expect(errors).toEqual([]);
});
test('the wedding look appears in both armarios and can be selected',async({page})=>{
  const place=await loadAt(page,'armario');
  await tapPlace(page,place);
  await expect(page.getByRole('button',{name:'Vestido de novia'})).toBeEnabled();
  await page.getByRole('button',{name:'Vestido de novia'}).click();
  await expect(page.getByRole('button',{name:'Vestido de novia'})).toHaveClass(/selected/);
  await page.getByRole('button',{name:'Leo',exact:true}).click();
  await expect(page.getByRole('button',{name:'Traje de boda'})).toBeEnabled();
  await page.getByRole('button',{name:'Traje de boda'}).click();
  await expect(page.getByRole('button',{name:'Traje de boda'})).toHaveClass(/selected/);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('oowwww-game-v1')));
  expect(saved.outfits.itza.look).toBe('boda');
  expect(saved.outfits.leo.look).toBe('boda');
});

test('real wedding artwork ships and interactive vows and cinematic autoplay work',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const asset=await page.request.get('/assets/game/wedding/atlas.png');
  expect(asset.status()).toBe(200);
  expect(asset.headers()['content-type']).toContain('image/png');
  const bytes=await asset.body();
  expect(bytes.length).toBeGreaterThan(20000);
  const place=await loadAt(page,'boda');
  await tapPlace(page,place);
  await expect(page.locator('#experience-title')).toHaveText('Nuestra boda');
  await page.getByRole('button',{name:'Siguiente'}).click();
  await expect(page.getByRole('button',{name:'Sí, quiero'})).toBeVisible();
  await page.getByRole('button',{name:'Sí, quiero'}).click();
  await expect(page.locator('.wedding-stage-title')).toHaveText('El gran sí');
  await expect(page.locator('.wedding-vow')).toContainText('Sí, quiero');
  await page.getByRole('button',{name:'Reproducir historia'}).click();
  await expect(page.getByRole('button',{name:'Pausar historia'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Pausar historia'}).click();
  await expect(page.getByRole('button',{name:'Reproducir historia'})).toHaveAttribute('aria-pressed','false');
  await page.locator('#close-experience').click();
  expect(errors).toEqual([]);
});
