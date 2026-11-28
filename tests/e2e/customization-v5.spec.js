import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import pngjs from 'pngjs';

const savedKey='oowwww-game-v1';
const hairChoices=[['negro','Negro'],['cafe','Café'],['rosa','Rosa pastel'],['rubio','Rubio claro']];
function rgbaHash(data){let hash=2166136261;for(const byte of data)hash=Math.imul(hash^byte,16777619);return hash>>>0;}
const originalHash=path=>rgbaHash(pngjs.PNG.sync.read(readFileSync(new URL('../../'+path,import.meta.url))).data);

async function enter(page,{position={x:14,y:42},outfits={leo:{look:'principal'},itza:{look:'principal'}},dayNight}={}){
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(({position,outfits,dayNight,savedKey})=>{
    const hashes=new WeakMap(),original=CanvasRenderingContext2D.prototype.drawImage;
    const hashImage=image=>{
      if(hashes.has(image))return hashes.get(image);
      const canvas=document.createElement('canvas');canvas.width=image.naturalWidth||image.width;canvas.height=image.naturalHeight||image.height;
      const context=canvas.getContext('2d');context.drawImage(image,0,0);
      let hash=2166136261;for(const byte of context.getImageData(0,0,canvas.width,canvas.height).data)hash=Math.imul(hash^byte,16777619);
      hashes.set(image,hash>>>0);return hash>>>0;
    };
    window.__customizationDraws=[];
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
      const image=args[0],src=typeof image?.src==='string'?new URL(image.src).pathname:'';
      if((this.canvas.id==='world'||this.canvas.classList.contains('wedding-cinema'))&&
          (image?.dataset?.hairProfile||src.includes('/characters/')||src.includes('/moments/seated/'))){
        window.__customizationDraws.push({canvas:this.canvas.id||'ceremony',src,
          profile:image.dataset?.hairProfile||'',color:image.dataset?.hairColor||'negro',hash:hashImage(image)});
        if(window.__customizationDraws.length>300)window.__customizationDraws.splice(0,100);
      }
      return original.apply(this,args);
    };
    if(!sessionStorage.getItem('__v5_seeded')){
      sessionStorage.setItem('__v5_seeded','yes');
      localStorage.setItem(savedKey,JSON.stringify({position,direction:'down',outfits,visited:[],...(dayNight?{dayNight}:{})}));
    }
  },{position,outfits,dayNight,savedKey});
  await page.goto('/game.html');await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
}
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),savedKey);
const draws=page=>page.evaluate(()=>window.__customizationDraws);
async function openWardrobe(page){await page.locator('#world').focus();await page.keyboard.press('e');await expect(page.locator('.wardrobe-preview')).toBeVisible();}
const preview=page=>page.locator('.wardrobe-preview').evaluate(canvas=>canvas.toDataURL());

test('Itza hair choices preserve Leo, persist and reach all outfits, seated poses and wedding chapters',async({page,browser})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await enter(page);await openWardrobe(page);
  const colors=page.getByRole('group',{name:'Color de cabello de Itza',exact:true});
  await expect(colors).toBeVisible();
  await page.getByRole('button',{name:'Leo',exact:true}).click();
  await expect(colors).toBeHidden();const leoBefore=await preview(page);
  await page.getByRole('button',{name:'Itza',exact:true}).click();
  const appearances=[];
  for(const [id,label] of hairChoices){
    await colors.getByRole('button',{name:label,exact:true}).click();
    await expect(colors.getByRole('button',{name:label,exact:true})).toHaveAttribute('aria-pressed','true');
    await expect.poll(async()=>((await saved(page)).outfits.itza.hair??'negro')).toBe(id);
    appearances.push(await preview(page));
  }
  expect(new Set(appearances).size).toBe(4);
  await page.getByRole('button',{name:'Leo',exact:true}).click();expect(await preview(page)).toBe(leoBefore);
  expect((await saved(page)).outfits.leo).toEqual({look:'principal'});
  await page.keyboard.press('Escape');await page.reload();await page.locator('#start-game').click();
  await openWardrobe(page);await expect(colors.getByRole('button',{name:'Rubio claro',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(errors).toEqual([]);
  for(const [look,hair] of [['principal','rosa'],['alternativo','cafe'],['boda','rubio']]){
    const scene=await browser.newPage();try{await verifySeatedLook(scene,look,hair);}finally{await scene.close();}
  }
  const ceremony=await browser.newPage();try{await verifyCeremony(ceremony);}finally{await ceremony.close();}
});

async function verifySeatedLook(page,look,hair){
  const outfits={leo:{look:'alternativo'},itza:{look,hair}};
  await enter(page,{position:{x:24,y:33},outfits});
  await expect.poll(async()=>(await draws(page)).some(draw=>draw.color===hair&&draw.profile.startsWith('walk-'))).toBe(true);
  const walking=await draws(page);
  const itza=walking.find(draw=>draw.color===hair&&draw.profile.startsWith('walk-'));
  const itzaPath=look==='boda'?'assets/game/wedding/characters/itza-walk.png':`assets/game/characters/itza/look-${look==='principal'?'01':'02'}.png`;
  expect(itza.hash).not.toBe(originalHash(itzaPath));
  expect(walking.some(draw=>draw.src.endsWith('/characters/leo/look-02.png')&&draw.hash===originalHash('assets/game/characters/leo/look-02.png'))).toBe(true);
  await page.keyboard.press('e');await expect(page.locator('#world-status')).toContainText('Descansando');
  await expect.poll(async()=>(await draws(page)).some(draw=>draw.color===hair&&draw.profile.startsWith('seat-'))).toBe(true);
  const sitting=await draws(page),seatedItza=sitting.find(draw=>draw.color===hair&&draw.profile.startsWith('seat-'));
  expect(seatedItza.hash).not.toBe(originalHash(`assets/game/moments/seated/itza-${look}.png`));
  expect(sitting.some(draw=>draw.src.endsWith('/seated/leo-alternativo.png')&&draw.hash===originalHash('assets/game/moments/seated/leo-alternativo.png'))).toBe(true);
  const state=await saved(page);expect(state.outfits).toEqual(outfits);expect(state.position).toEqual({x:24,y:33});
}

async function verifyCeremony(page){
  await enter(page,{position:{x:105,y:54},outfits:{leo:{look:'boda'},itza:{look:'boda',hair:'rubio'}}});
  await page.locator('#world').focus();await page.keyboard.press('e');await expect(page.locator('.wedding-cinema')).toBeVisible();
  const originals=['idle','vows','kiss','hug','celebrate'].map(key=>'assets/game/wedding/characters/'+key+'.png');
  originals.push('assets/game/wedding/pair-bench-v2.png');
  for(let chapter=0;chapter<6;chapter++){
    await page.evaluate(()=>{window.__customizationDraws=[];});
    await expect.poll(async()=>(await draws(page)).some(draw=>draw.canvas==='ceremony'&&draw.color==='rubio'&&draw.hash!==originalHash(originals[chapter]))).toBe(true);
    if(chapter<5)await page.getByRole('button',{name:'Siguiente',exact:true}).click();
  }
  expect((await saved(page)).outfits.itza.hair).toBe('rubio');
}

async function lightness(page){return page.locator('#world').evaluate(canvas=>{
  const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  let total=0;for(let i=0;i<pixels.length;i+=4)total+=(pixels[i]+pixels[i+1]+pixels[i+2])/3;
  return total/(pixels.length/4);
});}

test('automatic light alternates at five-minute boundaries and manual choices stay fixed',async({page})=>{
  const epoch=Date.UTC(2026,10,16,18,0,0);
  await page.clock.setFixedTime(new Date(epoch));
  await enter(page,{position:{x:24,y:33}});
  const world=page.locator('#world');
  await expect(world).toHaveAttribute('data-lighting-mode','auto');await expect(world).toHaveAttribute('data-day-phase','day');
  const initialPosition=(await saved(page)).position,day=await lightness(page);
  await page.clock.setFixedTime(new Date(epoch+299999));await expect(world).toHaveAttribute('data-day-phase','day');
  await page.clock.setFixedTime(new Date(epoch+300000));await expect(world).toHaveAttribute('data-day-phase','night');
  await expect.poll(()=>lightness(page)).toBeLessThan(day*.85);
  await page.clock.setFixedTime(new Date(epoch+600000));await expect(world).toHaveAttribute('data-day-phase','day');
  await page.locator('#day-night-night').click();await expect(world).toHaveAttribute('data-day-phase','night');
  await page.clock.setFixedTime(new Date(epoch+1800000));await expect(world).toHaveAttribute('data-day-phase','night');
  await expect(page.locator('#day-night-night')).toHaveAttribute('aria-pressed','true');
  await page.locator('#day-night-day').click();await page.clock.setFixedTime(new Date(epoch+3000000));
  await expect(world).toHaveAttribute('data-day-phase','day');await expect(world).toHaveAttribute('data-lighting-mode','day');
  await page.locator('#day-night-auto').click();await expect(world).toHaveAttribute('data-day-phase','day');
  await page.clock.setFixedTime(new Date(epoch+3300000));await expect(world).toHaveAttribute('data-day-phase','night');
  await page.clock.setFixedTime(new Date(epoch+3600000));await expect(world).toHaveAttribute('data-day-phase','day');
  expect((await saved(page)).position).toEqual(initialPosition);
  await page.locator('#day-night-night').click();await page.reload();await page.locator('#start-game').click();
  await expect(world).toHaveAttribute('data-lighting-mode','night');await expect(world).toHaveAttribute('data-day-phase','night');
});

test('hair and light controls fit a touch screen and keep the world accessible',async({browser})=>{
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  try{
    const page=await context.newPage();await enter(page);
    await page.locator('#day-night-night').tap();await expect(page.locator('#world')).toHaveAttribute('data-day-phase','night');
    await openWardrobe(page);
    await page.getByRole('group',{name:'Color de cabello de Itza',exact:true}).getByRole('button',{name:'Rosa pastel',exact:true}).tap();
    expect((await saved(page)).outfits.itza.hair).toBe('rosa');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
    await page.getByRole('button',{name:'Cerrar',exact:true}).tap();await expect(page.locator('#world')).toBeVisible();
  }finally{await context.close();}
});
