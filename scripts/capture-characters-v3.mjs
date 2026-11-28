// Start current Vite first. BASELINE_URL optionally serves the previous revision.
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-characters-v3';
await mkdir(output,{recursive:true});
const browser=await chromium.launch(process.env.ART_CHROMIUM_PATH?{executablePath:process.env.ART_CHROMIUM_PATH,args:['--no-sandbox']}:{headless:true});
const versions=[...(process.env.BASELINE_URL?[['before',process.env.BASELINE_URL]]:[]),['after',process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173']];
const errors=[];
async function enter(page,url,position,outfits){
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({position,outfits})=>{Math.random=()=>.15;localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',outfits,visited:[]}));},{position,outfits});
 await page.goto(url+'/game.html');await page.locator('#start-game').click();await page.evaluate(()=>document.fonts.ready);
}
for(const [version,url] of versions)for(const mobile of [false,true]){
 const label=mobile?'mobile':'desktop',options={viewport:mobile?{width:375,height:812}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'};
 for(const [name,look] of [['look1','principal'],['wedding-look','boda']]){
  const page=await browser.newPage(options);await enter(page,url,{x:30,y:25},{leo:{look},itza:{look}});
  await page.screenshot({path:`${output}/${version}-${name}-${label}.png`});await page.close();
 }
 const page=await browser.newPage(options);await enter(page,url,{x:105,y:54},{leo:{look:'boda'},itza:{look:'boda'}});
 await page.keyboard.press('e');await page.locator('.wedding-cinema').waitFor({state:'visible'});
 for(let chapter=1;chapter<=6;chapter++){
  await page.locator('.wedding-cinema').screenshot({path:`${output}/${version}-chapter-${chapter}-${label}.png`});
  if(chapter===1)await page.screenshot({path:`${output}/${version}-ceremony-${label}.png`});
  if(chapter<6)await page.getByRole('button',{name:'Siguiente',exact:true}).click();
 }
 await page.close();
}
await browser.close();console.log(JSON.stringify({output,errors}));if(errors.length)process.exitCode=1;
