import {test,expect} from '@playwright/test';
import {COAST_LAYOUT} from '../../game/coast-layout.js';

async function mount(page,{width=1100,height=800}={}){
  await page.setViewportSize({width,height});
  await page.route('**/__coast-component-v13',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;background:#20313b}#game-screen,#game-frame{position:relative;width:100%;height:100%;overflow:hidden}#world{display:block;width:100%;height:100%;image-rendering:pixelated}button{font-family:monospace}</style></head><body><main id="game-screen"><div id="game-frame"><canvas id="world" width="480" height="300" tabindex="0"></canvas></div></main></body></html>`}));
  await page.goto('/__coast-component-v13');
  await page.evaluate(async()=>{
    const {createCoast}=await import('/game/coast.js');
    const {COAST_LAYOUT}=await import('/game/coast-layout.js');
    const assets=await import('/game/assets.js');await assets.prepareWorldAssets();
    const outfits={leo:{look:'alternativo',glasses:false},itza:{look:'boda',hair:'rosa',glasses:false}};
    window.__save={outfits};window.__night=0;window.__writes=0;window.__pair={x:COAST_LAYOUT.shoreArrival[0],y:COAST_LAYOUT.shoreArrival[1],moving:true};
    window.__coast=createCoast({pair:window.__pair,save:window.__save,
      getOutfits:()=>outfits,getCharacterImage:url=>assets.outfitImage(url,outfits),getRawImage:assets.assetImage,assetImage:assets.assetImage,
      onNight:()=>window.__night++,onChange:()=>window.__writes++});
    window.__draw=()=>window.__coast.drawView(document.getElementById('world').getContext('2d'),{reducedMotion:false});
    window.__coast.sync({active:true,near:true});
  });
}

test('the coast uses the existing world canvas, pauses with the game and restores its position on standing',async({page})=>{
  await mount(page);
  await expect(page.getByRole('button',{name:'Sentarnos juntos',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Sentarnos juntos',exact:true}).click();
  expect(await page.evaluate(()=>window.__draw())).toBe(true);
  expect(await page.locator('canvas').count()).toBe(1);
  await expect(page.locator('#world')).toHaveAttribute('data-coast-sitting','true');
  expect(await page.evaluate(()=>window.__night)).toBe(1);
  await page.getByRole('button',{name:'Ver fuegos artificiales',exact:true}).click();
  await page.getByRole('button',{name:'Pedir un deseo',exact:true}).click();
  await page.evaluate(()=>{window.__coast.tick(.1,{active:true,night:true});window.__draw();});
  await expect(page.locator('#world')).toHaveAttribute('data-coast-stars','1');
  expect(await page.evaluate(()=>window.__save.lakeside)).toEqual({visits:1,sits:1,shows:1,wishes:1});
  const before=await page.evaluate(()=>window.__coast.getStats().clock);
  await page.evaluate(()=>{window.__coast.sync({active:false,near:true});window.__coast.tick(.1,{active:false,night:true});});
  expect(await page.evaluate(()=>window.__coast.getStats().clock)).toBe(before);
  await expect(page.locator('.coast-hud')).toBeHidden();
  await page.evaluate(()=>window.__coast.sync({active:true,near:true}));
  await page.getByRole('button',{name:'Levantarnos',exact:true}).click();
  expect(await page.evaluate(()=>window.__draw())).toBe(false);
  expect(await page.evaluate(()=>({x:window.__pair.x,y:window.__pair.y}))).toEqual({x:COAST_LAYOUT.shoreArrival[0],y:COAST_LAYOUT.shoreArrival[1]});
  await expect(page.locator('#world')).toHaveAttribute('data-coast-view','false');
  await page.evaluate(()=>window.__coast.dispose());await expect(page.locator('.coast-hud')).toHaveCount(0);
});

test('coastal controls fit portrait and landscape, with no modal or extra canvas',async({page})=>{
  await mount(page,{width:390,height:844});
  await page.getByRole('button',{name:'Sentarnos juntos',exact:true}).click();await page.evaluate(()=>window.__draw());
  await page.getByRole('button',{name:'Ver fuegos artificiales',exact:true}).click();
  await page.evaluate(()=>{
    const ctx=document.getElementById('world').getContext('2d'),fill=ctx.fillRect;
    window.__goldBurst=[];
    ctx.fillRect=function(x,y,width,height){
      if(this.fillStyle==='#f4ce8b'&&y<this.canvas.height*.45)window.__goldBurst.push({x,y,width,height});
      return fill.call(this,x,y,width,height);
    };
    for(let i=0;i<10;i++)window.__coast.tick(.1,{active:true,night:true});
  });
  for(const [width,height] of [[390,844],[844,390]]){
    await page.setViewportSize({width,height});
    const ratio=await page.evaluate(({width,height})=>{
      const canvas=document.getElementById('world');canvas.width=Math.ceil(width/2);canvas.height=Math.ceil(height/2);
      window.__goldBurst=[];window.__draw();
      const points=window.__goldBurst;
      const spanX=Math.max(...points.map(p=>p.x+p.width))-Math.min(...points.map(p=>p.x));
      const spanY=Math.max(...points.map(p=>p.y+p.height))-Math.min(...points.map(p=>p.y));
      return {count:points.length,ratio:spanY/spanX};
    },{width,height});
    expect(ratio.count).toBeGreaterThan(30);expect(ratio.ratio).toBeGreaterThan(.5);expect(ratio.ratio).toBeLessThan(1.5);
    for(const button of await page.locator('.coast-action:visible').all()){
      const rect=await button.boundingBox();expect(rect.height).toBeGreaterThanOrEqual(44);
      expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(width);
    }
    expect(await page.locator('[role="dialog"]').count()).toBe(0);
    expect(await page.locator('canvas').count()).toBe(1);
  }
});
