import {test,expect} from '@playwright/test';

const saveKey='oowwww-game-v1';
const sizes=[
  ['desktop',{width:1440,height:900},false],
  ['phone portrait',{width:390,height:844},true],
  ['phone landscape',{width:844,height:390},true],
  ['small phone',{width:320,height:568},true]
];

async function enter(page,{position={x:30,y:25},outfits={itza:{look:'principal',hair:'rubio',glasses:false},leo:{look:'principal'}}}={}){
  await page.addInitScript(({saveKey,position,outfits})=>{
    localStorage.setItem(saveKey,JSON.stringify({position,direction:'down',visited:[],outfits,
      leoVoice:{enabled:false},dayNight:{mode:'day',cycleStartedAt:Date.now()}}));
  },{saveKey,position,outfits});
  await page.goto('/game.html');await page.locator('#start-game').click();
  await expect(page.locator('#world')).toBeVisible();
}

async function geometry(page){
  return page.locator('#world').evaluate(canvas=>{
    const r=canvas.getBoundingClientRect();
    return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,
      sourceWidth:canvas.width,sourceHeight:canvas.height,viewportWidth:innerWidth,viewportHeight:innerHeight,
      overflowX:document.documentElement.scrollWidth-innerWidth,
      overflowY:document.documentElement.scrollHeight-innerHeight,
      smooth:canvas.getContext('2d').imageSmoothingEnabled};
  });
}

async function expectFullscreen(page){
  // Browser visualViewport and resize events can arrive on adjacent frames.
  await expect.poll(async()=>{
    const r=await geometry(page);
    return Math.abs(r.right-r.viewportWidth)<=4&&Math.abs(r.bottom-r.viewportHeight)<=4;
  }).toBe(true);
  const g=await geometry(page);
  expect(g.left).toBeLessThanOrEqual(1);expect(g.top).toBeLessThanOrEqual(1);
  expect(g.right).toBeGreaterThanOrEqual(g.viewportWidth-1);
  expect(g.bottom).toBeGreaterThanOrEqual(g.viewportHeight-1);
  expect(g.right-g.viewportWidth).toBeLessThanOrEqual(4);
  expect(g.bottom-g.viewportHeight).toBeLessThanOrEqual(4);
  const scaleX=g.width/g.sourceWidth,scaleY=g.height/g.sourceHeight;
  expect(scaleX).toBeCloseTo(scaleY,5);expect(scaleX).toBeGreaterThanOrEqual(1);
  expect(scaleX).toBeCloseTo(Math.round(scaleX),5);
  expect(g.sourceWidth).toBeLessThanOrEqual(1920);
  expect(g.sourceHeight).toBeLessThanOrEqual(1280);
  expect(g.sourceWidth*g.sourceHeight).toBeLessThanOrEqual(1920*1280);
  expect(g.overflowX).toBeLessThanOrEqual(1);expect(g.overflowY).toBeLessThanOrEqual(1);
  expect(g.smooth).toBe(false);
  return g;
}

async function assertTouchTarget(page,selector){
  const button=page.locator(selector);await expect(button).toBeVisible();
  const result=await button.evaluate(element=>{
    const r=element.getBoundingClientRect();
    const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return {height:r.height,width:r.width,reachable:element===hit||element.contains(hit)};
  });
  expect(result.height).toBeGreaterThanOrEqual(44);expect(result.width).toBeGreaterThanOrEqual(44);
  expect(result.reachable).toBe(true);
}

for(const [label,viewport,mobile] of sizes){
  test(`${label}: world covers the screen with crisp pixels and accessible overlays`,async({browser})=>{
    const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?3:1,reducedMotion:'reduce'});
    try{
      const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
      await enter(page);await expectFullscreen(page);
      for(const selector of ['#help-button','#map-button','#music-button','#day-night-day','#day-night-night','#day-night-auto'])await assertTouchTarget(page,selector);
      if(mobile)await page.locator('#day-night-night').tap();else await page.locator('#day-night-night').click();
      await expect(page.locator('#world')).toHaveAttribute('data-day-phase','night');
      await page.locator('#day-night-day').click();
      await page.locator('#map-button').click();await expect(page.locator('#map-panel')).toBeVisible();
      await page.locator('#close-map').click();await expect(page.locator('#map-panel')).toBeHidden();
      await page.locator('#help-button').click();await expect(page.locator('#experience')).toBeVisible();
      await page.locator('#close-experience').click();await expect(page.locator('#experience')).toBeHidden();
      await expectFullscreen(page);expect(errors).toEqual([]);
    }finally{await context.close();}
  });
}

test('real screen taps map to the same world tile before and after phone rotation',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  try{
    const page=await context.newPage();await enter(page);
    async function tapWorldTile(x,y){
      const point=await page.locator('#world').evaluate((canvas,{x,y})=>{
        const r=canvas.getBoundingClientRect(),cameraX=Number(canvas.dataset.cameraX),cameraY=Number(canvas.dataset.cameraY);
        return {x:r.left+(x*16+8-cameraX)*r.width/canvas.width,y:r.top+(y*16+8-cameraY)*r.height/canvas.height};
      },{x,y});
      await page.touchscreen.tap(point.x,point.y);
      await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).position,saveKey)).toEqual({x,y});
    }
    await tapWorldTile(33,25);
    const portrait=await expectFullscreen(page);
    await page.setViewportSize({width:844,height:390});
    await expect.poll(async()=>(await geometry(page)).sourceWidth).not.toBe(portrait.sourceWidth);
    await expectFullscreen(page);
    expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).position,saveKey)).toEqual({x:33,y:25});
    await tapWorldTile(30,25);
    await page.setViewportSize({width:390,height:844});await expectFullscreen(page);
    await page.locator('#map-button').tap();
    await page.getByRole('button',{name:'Armario',exact:true}).tap();
    await expect(page.locator('#map-panel')).toBeHidden();
    await expect(page.locator('#world-status')).toContainText('Caminando hacia');
  }finally{await context.close();}
});

test('all Itza outfits retain four independent hair choices when glasses are removed',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await enter(page,{position:{x:14,y:42}});await page.locator('#world').focus();await page.keyboard.press('e');
  await expect(page.locator('.wardrobe-preview')).toBeVisible();
  for(const [look,label] of [['principal','Conjunto original'],['alternativo','Segundo conjunto'],['boda','Vestido de novia']]){
    await page.getByRole('group',{name:'Conjuntos completos',exact:true}).getByRole('button',{name:label,exact:true}).click();
    for(const [color,name] of [['negro','Negro'],['cafe','Café'],['rosa','Rosa pastel'],['rubio','Rubio claro']]){
      await page.getByRole('group',{name:'Color de cabello de Itza',exact:true}).getByRole('button',{name,exact:true}).click();
      for(const [glasses,label] of [[true,'Con lentes'],[false,'Sin lentes']]){
        await page.getByRole('group',{name:'Lentes de Itza',exact:true}).getByRole('button',{name:label,exact:true}).click();
        for(const facing of ['Frente','Lado','Espalda']){
          await page.getByRole('group',{name:'Dirección de la vista previa',exact:true}).getByRole('button',{name:facing,exact:true}).click();
          await expect(page.locator('.wardrobe-preview')).toHaveAttribute('aria-label',new RegExp(name.toLowerCase()+', '+(glasses?'con':'sin')+' lentes'));
        }
        const state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).outfits,saveKey);
        expect(state.itza).toEqual({look,hair:color,glasses});expect(state.leo).toEqual({look:'principal'});
      }
    }
  }
  await page.getByRole('button',{name:'Frente',exact:true}).click();
  await page.getByRole('button',{name:'Ver caminata',exact:true}).click();
  await expect(page.getByRole('button',{name:'Detener animación',exact:true})).toBeVisible();
  await page.locator('#close-experience').click();expect(errors).toEqual([]);
});

for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  test(`Leo's speech stays clear of the floating controls at ${viewport.width}×${viewport.height}`,async({browser})=>{
    const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    try{
      const page=await context.newPage();
      await page.addInitScript(()=>{
        const original=CanvasRenderingContext2D.prototype.drawImage;window.__v8SeatBounds={};
        CanvasRenderingContext2D.prototype.drawImage=function(...args){
          const image=args[0],source=image?.src||image?.dataset?.assetSource||'';
          if(this.canvas.id==='world'&&source.includes('/moments/seated/')&&args.length===9){
            const [,sx,sy,sw,sh,x,y,width,height]=args,m=this.getTransform(),r=this.canvas.getBoundingClientRect();
            const points=[[x,y],[x+width,y],[x,y+height],[x+width,y+height]].map(([px,py])=>({
              x:r.left+(m.a*px+m.c*py+m.e)*r.width/this.canvas.width,
              y:r.top+(m.b*px+m.d*py+m.f)*r.height/this.canvas.height
            }));
            window.__v8SeatBounds[source.includes('/leo-')?'leo':'itza']={
              left:Math.min(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),
              right:Math.max(...points.map(p=>p.x)),bottom:Math.max(...points.map(p=>p.y))
            };
          }
          return original.apply(this,args);
        };
      });
      await enter(page,{position:{x:24,y:33}});
      await page.locator('#world').focus();await page.keyboard.press('e');
      await expect(page.locator('#leo-bubble')).toBeVisible();
      await expect(page.locator('#world-status')).toContainText('Descansando');
      await expect.poll(()=>page.locator('#leo-bubble').evaluate(bubble=>{
        const r=bubble.getBoundingClientRect();let overlap=0;
        for(const hud of document.querySelectorAll('.game-header,.game-footer,#world-status,#game-controls')){
          if(!hud.getClientRects().length)continue;
          const h=hud.getBoundingClientRect();
          overlap+=Math.max(0,Math.min(r.right,h.right)-Math.max(r.left,h.left))*
            Math.max(0,Math.min(r.bottom,h.bottom)-Math.max(r.top,h.top));
        }
        return {overlap,clipped:r.left<0||r.top<0||r.right>innerWidth||r.bottom>innerHeight};
      })).toEqual({overlap:0,clipped:false});
      await expect.poll(()=>page.evaluate(()=>Object.keys(window.__v8SeatBounds).length)).toBe(2);
      const spriteVisibility=await page.evaluate(()=>{
        let overlap=0,clipped=false;
        const hud=[...document.querySelectorAll('.game-header,.game-footer,#world-status')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect());
        for(const r of Object.values(window.__v8SeatBounds)){
          clipped||=r.left<0||r.top<0||r.right>innerWidth||r.bottom>innerHeight;
          for(const h of hud)overlap+=Math.max(0,Math.min(r.right,h.right)-Math.max(r.left,h.left))*Math.max(0,Math.min(r.bottom,h.bottom)-Math.max(r.top,h.top));
        }
        return {overlap,clipped};
      });
      expect(spriteVisibility).toEqual({overlap:0,clipped:false});
    }finally{await context.close();}
  });
}
