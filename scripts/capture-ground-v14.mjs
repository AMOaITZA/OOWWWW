// Evidence from the real game after the unified ground is installed.
import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-unified-ground-v14';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],failed=[],screenshots=[];
try{
  for(const [id,mode,width,height,mobile]of[['day','day',1440,900,false],['night','night',1440,900,false],['phone','day',390,844,true]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)failed.push([response.status(),response.url()]);});
    await page.addInitScript(mode=>localStorage.setItem('oowwww-game-v1',JSON.stringify({position:{x:60,y:79},direction:'down',visited:[],
      outfits:{leo:{look:'principal',glasses:false},itza:{look:'principal',hair:'rosa',glasses:false}},
      leoVoice:{enabled:false},soundEffects:{enabled:false},dayNight:{mode,cycleStartedAt:Date.now()}})),mode);
    await page.goto(base+'/game.html');await page.locator('#start-game').click();
    await expect(page.locator('#world')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:output+'/world-seam-'+id+'.png'});screenshots.push('world-seam-'+id+'.png');
    await page.close();
  }
  expect(errors).toEqual([]);expect(failed).toEqual([]);
  await fs.writeFile(output+'/result.json',JSON.stringify({screenshots,errors,failed,
    note:'Real game at the former boundary y1280, with ordinary arrival coordinates and actual day/night lighting. Mobile emulated.'},null,2)+'\n');
  console.log(JSON.stringify({screenshots,errors,failed}));
}finally{await browser.close();}
