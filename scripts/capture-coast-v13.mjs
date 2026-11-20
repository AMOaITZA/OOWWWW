// Same #world canvas before and after the shoreline interaction.
import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {COAST_LAYOUT} from '../game/coast-layout.js';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const directory=process.env.ART_CAPTURE_DIR||'docs/qa-coast-v13';
await fs.mkdir(directory,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],failed=[];
try{
  for(const [name,width,height,mobile] of [['desktop',1440,1000,false],['phone',390,844,true],['landscape',844,390,true]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.url().includes('/assets/game/')&&response.status()>=400)failed.push(response.url());});
    await page.addInitScript(position=>{
      localStorage.setItem('oowwww-game-v1',JSON.stringify({position:{x:position[0],y:position[1]},visited:[],
        outfits:{leo:{look:'alternativo',glasses:false},itza:{look:'boda',hair:'rosa',glasses:false}},
        leoVoice:{enabled:false},soundEffects:{enabled:false},dayNight:{mode:'day'}}));
    },COAST_LAYOUT.shoreArrival);
    await page.goto(base+'/game.html');await page.locator('#start-game').click();await page.evaluate(()=>document.fonts.ready);
    await expect(page.locator('.coast-hud')).toBeVisible();
    if(name==='desktop')await page.screenshot({path:directory+'/shore-in-world.png'});
    await page.getByRole('button',{name:'Sentarnos juntos',exact:true}).click();
    await page.getByRole('button',{name:'Ver fuegos artificiales',exact:true}).click();
    await page.getByRole('button',{name:'Pedir un deseo',exact:true}).click();
    await expect(page.locator('#world')).toHaveAttribute('data-coast-view','true');
    await page.screenshot({path:directory+'/coast-'+name+'.png'});
    await page.getByRole('button',{name:'Levantarnos',exact:true}).click();
    await expect(page.locator('#world')).toHaveAttribute('data-coast-view','false');await page.close();
  }
  expect(errors).toEqual([]);expect(failed).toEqual([]);
  await fs.writeFile(directory+'/result.json',JSON.stringify({errors,failed,sameWorldCanvas:true,mobileEmulated:true},null,2)+'\n');
}finally{await browser.close();}
