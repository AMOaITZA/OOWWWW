// Start current Vite first; BASELINE_URL optionally serves the previous revision.
import {chromium} from '@playwright/test';
import {mkdir,readFile} from 'node:fs/promises';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-world-v4';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const versions=[...(process.env.BASELINE_URL?[['before',process.env.BASELINE_URL]]:[]),['after',process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173']];
const places=JSON.parse(await readFile(new URL('../game/data/places.json',import.meta.url),'utf8'));
const errors=[];
async function enter(url,position,outfits,mobile=false){
  const page=await browser.newPage({viewport:mobile?{width:375,height:812}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(({position,outfits})=>{
    Math.random=()=>.15;
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',outfits,visited:[]}));
  },{position,outfits});
  await page.goto(url+'/game.html');await page.locator('#start-game').click();
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(450);
  return page;
}
const main={leo:{look:'principal'},itza:{look:'principal'}};
for(const [version,url] of versions){
  for(const place of places.filter(place=>place.kind!=='wedding')){
    const page=await enter(url,{x:place.arrival[0],y:place.arrival[1]},main);
    await page.locator('#world').screenshot({path:`${output}/${version}-${place.id}-desktop.png`});
    await page.close();
  }
  for(const [name,outfits] of [['look1',main],['green-bridal',{leo:{look:'alternativo'},itza:{look:'boda'}}],['wedding',{leo:{look:'boda'},itza:{look:'boda'}}]]){
    const page=await enter(url,{x:24,y:33},outfits);
    if(name==='look1')await page.locator('#world').screenshot({path:`${output}/${version}-standing-desktop.png`});
    await page.keyboard.press('e');await page.waitForTimeout(700);
    await page.locator('#world').screenshot({path:`${output}/${version}-bench-${name}-desktop.png`});
    await page.close();
  }
  const page=await enter(url,{x:24,y:33},{leo:{look:'alternativo'},itza:{look:'boda'}},true);
  const point=await page.locator('#world').evaluate(canvas=>{
    const r=canvas.getBoundingClientRect();
    return {x:(24*16-Number(canvas.dataset.cameraX))*r.width/480,
      y:(31*16-10-Number(canvas.dataset.cameraY))*r.height/270};
  });
  await page.locator('#world').tap({position:point});await page.waitForTimeout(700);
  await page.screenshot({path:`${output}/${version}-bench-mobile.png`});await page.close();
}
await browser.close();console.log(JSON.stringify({output,errors}));if(errors.length)process.exitCode=1;
