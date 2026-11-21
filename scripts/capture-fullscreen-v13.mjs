import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-fullscreen-v13';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],failed=[],screenshots=[];
async function open(page,position){
  page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failed.push(r.url());});
  await page.addInitScript(position=>localStorage.setItem('oowwww-game-v1',JSON.stringify({position,
    outfits:{leo:{look:'principal',glasses:false},itza:{look:'principal',hair:'rosa',glasses:false}},visited:[],
    leoVoice:{enabled:false},soundEffects:{enabled:false}})),position);
  await page.goto(base+'/game.html');await page.locator('#start-game').click();
  await page.locator('#world').focus();await page.keyboard.press('e');await page.evaluate(()=>document.fonts.ready);
}
async function shot(page,name){
  // The camera responds to activity changes in Resize/MutationObserver. Give
  // the compositor its two paint frames before collecting visual evidence.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:output+'/'+name+'.png'});screenshots.push(name+'.png');
}
try{
  for(const [name,width,height] of [['desktop',1440,1000],['phone',390,844],['landscape',844,390]]){
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce',hasTouch:name!=='desktop'});
    await open(page,{x:37,y:53});
    for(const [id,label] of [['eat','Comer juntos'],['tv','Ver la tele'],['sleep','Dormir juntos']]){
      await page.getByRole('button',{name:label,exact:true}).click();await shot(page,'home-'+id+'-'+name);
    }
    await page.close();
  }
  for(const [name,position,width,height] of [['letter-desktop',{x:45,y:21},1440,1000],['wedding-phone',{x:105,y:54},390,844],['fishing-phone',{x:50,y:34},390,844]]){
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    await open(page,position);await shot(page,name);await page.close();
  }
  expect(errors).toEqual([]);expect(failed).toEqual([]);
  await fs.writeFile(output+'/result.json',JSON.stringify({screenshots,errors,failed},null,2)+'\n');
  console.log(JSON.stringify({screenshots,errors,failed}));
}finally{await browser.close();}
