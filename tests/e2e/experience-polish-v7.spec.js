import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

const places=JSON.parse(readFileSync(new URL('../../game/data/places.json',import.meta.url),'utf8'));
const sizes=[{name:'desktop',width:1440,height:1000},{name:'mobile',width:375,height:812},{name:'landscape',width:812,height:375}];

async function enter(browser,baseURL,place,size,errors){
  const page=await browser.newPage({baseURL,viewport:{width:size.width,height:size.height},
    isMobile:size.name!=='desktop',hasTouch:size.name!=='desktop',reducedMotion:'reduce'});
  page.on('pageerror',error=>errors.push(place.id+': '+error.message));
  await page.addInitScript(position=>{
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',visited:[],
      outfits:{leo:{look:'principal'},itza:{look:'principal',hair:'negro'}},
      leoVoice:{enabled:false},dayNight:{mode:'day',cycleStartedAt:Date.now()}}));
  },{x:place.arrival[0],y:place.arrival[1]});
  await page.goto('/game.html');await page.locator('#start-game').click();
  await page.locator('#world').focus();await page.keyboard.press('e');
  return page;
}

for(const size of sizes){
  test(`all thirteen experience windows stay readable, closeable and reusable on ${size.name}`,async({browser,baseURL})=>{
    test.setTimeout(120000);
    const errors=[];
    for(const place of places)await test.step(place.id,async()=>{
      const page=await enter(browser,baseURL,place,size,errors);
      try{
        const panel=page.locator('.experience-panel'),body=page.locator('#experience-content');
        const close=page.locator('#close-experience'),art=page.locator('.experience-hero-art');
        await expect(panel).toBeVisible();await expect(panel).toHaveAttribute('data-experience',place.id);
        await expect(page.locator('#experience-title')).not.toBeEmpty();
        await expect.poll(()=>art.evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true);
        const dimensions=await panel.evaluate(element=>{
          const bounds=element.getBoundingClientRect(),content=document.getElementById('experience-content');
          const close=document.getElementById('close-experience').getBoundingClientRect();
          return {left:bounds.left,right:bounds.right,top:bounds.top,bottom:bounds.bottom,
            overflow:document.documentElement.scrollWidth-innerWidth,
            bodyOverflow:content.scrollWidth-content.clientWidth,bodyHeight:content.clientHeight,
            closeTop:close.top,closeBottom:close.bottom,closeLeft:close.left,closeRight:close.right};
        });
        expect(dimensions.left).toBeGreaterThanOrEqual(-1);expect(dimensions.right).toBeLessThanOrEqual(size.width+1);
        expect(dimensions.top).toBeGreaterThanOrEqual(-1);expect(dimensions.bottom).toBeLessThanOrEqual(size.height+1);
        expect(dimensions.overflow).toBeLessThanOrEqual(1);expect(dimensions.bodyOverflow).toBeLessThanOrEqual(1);
        expect(dimensions.bodyHeight).toBeGreaterThan(40);
        expect(dimensions.closeTop).toBeGreaterThanOrEqual(0);expect(dimensions.closeBottom).toBeLessThanOrEqual(size.height);
        expect(dimensions.closeLeft).toBeGreaterThanOrEqual(0);expect(dimensions.closeRight).toBeLessThanOrEqual(size.width);
        await expect(body).not.toBeEmpty();
        const before=await close.boundingBox();
        await body.evaluate(element=>{element.scrollTop=element.scrollHeight;});
        const after=await close.boundingBox();
        expect(Math.abs(before.y-after.y)).toBeLessThan(1);
        await page.keyboard.press('Escape');await expect(page.locator('#experience')).toBeHidden();
        await expect(page.locator('#world')).toBeFocused();
        await page.keyboard.press('e');await expect(panel).toBeVisible();
        await expect.poll(()=>body.evaluate(element=>element.scrollTop)).toBe(0);
        await close.click();await expect(page.locator('#experience')).toBeHidden();
      }finally{await page.close();}
    });
    expect(errors).toEqual([]);
  });
}
