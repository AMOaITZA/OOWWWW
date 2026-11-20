import {test,expect} from '@playwright/test';

test('the taller coastal overview keeps native pixels and accurate taps after phone rotation',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.route('**/__coast-map-v13',route=>route.fulfill({contentType:'text/html',body:`<!doctype html>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/game/styles.css">
    <body><button id="map-button">Mapa</button><canvas id="world" width="195" height="422"></canvas>
    <section id="map-panel" class="map-panel" hidden role="dialog" aria-modal="true" aria-label="Mapa">
      <div class="map-paper"><button id="close-map">Cerrar</button><canvas id="overview"></canvas><div id="map-destinations"></div></div>
    </section></body>`}));
  await page.goto('/__coast-map-v13');
  await page.evaluate(async()=>{
    const {createMap}=await import('/game/map.js');
    window.__coastMap=createMap({places:[],decor:[],pair:{x:78,y:94},save:{visited:[]},
      getActivities:()=>[{id:'mirador',name:'Orilla de los deseos',kind:'lakeside',tile:[78,94],arrival:[78,94]}],
      onNavigate:(x,y,spot)=>{window.__coastNavigation={x,y,id:spot?.id};}});
    window.__coastMap.open();
  });
  const canvas=page.locator('#overview');
  await expect(canvas).toHaveAttribute('width','360');await expect(canvas).toHaveAttribute('height','336');
  for(const size of [{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(size);
    const geometry=await canvas.evaluate(element=>{
      const style=getComputedStyle(element),rect=element.getBoundingClientRect();
      const left=parseFloat(style.borderLeftWidth),top=parseFloat(style.borderTopWidth);
      return {left:rect.left+left,top:rect.top+top,width:element.clientWidth,height:element.clientHeight};
    });
    expect(Math.abs(geometry.width/geometry.height-360/336)).toBeLessThan(.01);
    expect(geometry.height).toBeLessThan(size.height*.53);
    expect(await canvas.evaluate(element=>[...element.getContext('2d').getImageData(110*3,106*3,1,1).data]))
      .toEqual([99,159,160,255]);
    await page.mouse.click(geometry.left+78*3/360*geometry.width,geometry.top+94*3/336*geometry.height);
    expect(await page.evaluate(()=>window.__coastNavigation)).toEqual({x:78,y:94,id:'mirador'});
    await page.locator('#map-button').click();
  }
});
