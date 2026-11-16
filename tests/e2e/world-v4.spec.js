import {test,expect} from '@playwright/test';

const looks=['principal','alternativo','boda'];
async function enter(page,{position={x:24,y:33},outfits={leo:{},itza:{}}}={}){
  await page.addInitScript(({position,outfits})=>{
    const original=CanvasRenderingContext2D.prototype.drawImage;
    const imageIds=new WeakMap();let nextImageId=0;
    window.__worldArtDraws=[];
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
      const image=args[0],src=typeof image?.src==='string'?image.src:'';
      if(this.canvas.id==='world'){
        const width=args.length===9?args[7]:args.length===5?args[3]:image.naturalWidth;
        const height=args.length===9?args[8]:args.length===5?args[4]:image.naturalHeight;
        const walking=src.includes('/characters/')||Boolean(image?.dataset?.weddingSource&&image.width===192&&image.height===144);
        if(walking||src.includes('/moments/seated/')||src.includes('/architecture/')||src.includes('bench-seat-v4.png')||src.includes('/objects/roof.png')){
          if(!imageIds.has(image))imageIds.set(image,++nextImageId);
          window.__worldArtDraws.push({src:src?new URL(src).pathname:'',width,height,walking,imageId:imageIds.get(image)});
          if(window.__worldArtDraws.length>1000)window.__worldArtDraws.splice(0,400);
        }
      }
      return original.apply(this,args);
    };
    if(sessionStorage.getItem('__world_v4_seeded'))return;
    sessionStorage.setItem('__world_v4_seeded','yes');
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',outfits,visited:[]}));
  },{position,outfits});
  await page.goto('/game.html');
  await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
}
const drawnSeated=page=>page.evaluate(()=>[...new Set(window.__worldArtDraws.filter(draw=>draw.src.includes('/moments/seated/')).map(draw=>draw.src.split('/').at(-1)))].sort());

for(const leo of looks)for(const itza of looks){
  test(`sitting preserves Leo ${leo} and Itza ${itza} without switching clothing`,async({page})=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const outfits={leo:{look:leo},itza:{look:itza}};
    await enter(page,{outfits});
    await expect.poll(()=>page.evaluate(()=>new Set(window.__worldArtDraws.filter(draw=>draw.walking).map(draw=>draw.imageId)).size)).toBe(2);
    const walking=await page.evaluate(()=>window.__worldArtDraws.filter(draw=>draw.walking));
    const walkingWidth=Math.min(...walking.map(draw=>draw.width)),walkingHeight=Math.min(...walking.map(draw=>draw.height));
    expect(walkingWidth).toBe(32);expect(walkingHeight).toBe(48);
    await page.keyboard.press('e');
    await expect(page.locator('#world-status')).toContainText('Descansando');
    await expect.poll(()=>drawnSeated(page)).toEqual([`leo-${leo}.png`,`itza-${itza}.png`].sort());
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('oowwww-game-v1')));
    expect(saved.outfits).toEqual(outfits);
    expect(saved.position).toEqual({x:24,y:33});
    const measurements=await page.evaluate(()=>window.__worldArtDraws.filter(draw=>draw.src.includes('/moments/seated/')||draw.src.includes('bench-seat-v4.png')));
    const benches=measurements.filter(draw=>draw.src.includes('bench-seat-v4.png'));
    expect(benches.length).toBeGreaterThan(0);
    for(const bench of benches){
      expect(bench.width).toBeLessThanOrEqual(56);expect(bench.height).toBeLessThanOrEqual(32);
      expect(bench.width/walkingWidth).toBeLessThanOrEqual(1.75);
      expect(bench.height/walkingHeight).toBeLessThan(.75);
    }
    const characters=measurements.filter(draw=>draw.src.includes('/moments/seated/'));
    for(const character of characters){expect(character.width).toBeLessThanOrEqual(32);expect(character.height).toBeLessThanOrEqual(48);expect(character.height).toBeGreaterThan(30);}
    await page.keyboard.press('e');
    await expect(page.locator('#leo-bubble')).toContainText('vamos a seguir caminando');
    expect(errors).toEqual([]);
  });
}

test('all ten complete destination buildings load and render without the repeated roof overlay',async({page})=>{
  const responses=[];page.on('response',response=>{if(response.url().includes('/assets/game/architecture/'))responses.push({path:new URL(response.url()).pathname,status:response.status()});});
  await enter(page,{position:{x:30,y:22}});
  await expect.poll(()=>page.evaluate(()=>new Set(window.__worldArtDraws.filter(draw=>draw.src.includes('/architecture/')).map(draw=>draw.src)).size)).toBe(10);
  expect(new Set(responses.filter(response=>response.status===200).map(response=>response.path)).size).toBe(10);
  expect(responses.filter(response=>response.status>=400)).toEqual([]);
  expect(await page.evaluate(()=>window.__worldArtDraws.filter(draw=>draw.src.includes('/objects/roof.png')))).toEqual([]);
  await page.keyboard.press('e');
  await expect(page.locator('#experience')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#experience')).toBeHidden();
});

test('mixed seated clothing and the compact bench work on a touch screen',async({browser})=>{
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  try{
    const page=await context.newPage();
    await enter(page,{outfits:{leo:{look:'alternativo'},itza:{look:'boda'}}});
    const point=await page.locator('#world').evaluate(canvas=>{
      const r=canvas.getBoundingClientRect();
      return {x:(24*16-Number(canvas.dataset.cameraX))*r.width/480,
        y:(31*16-10-Number(canvas.dataset.cameraY))*r.height/270};
    });
    await page.locator('#world').tap({position:point});
    await expect.poll(()=>drawnSeated(page)).toEqual(['itza-boda.png','leo-alternativo.png']);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('#leo-bubble')).toBeVisible();
  }finally{await context.close();}
});
