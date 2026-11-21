// Actual home-scene captures. No repainting or furniture substitution in QA.
import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-sofa-turn-v14';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],failed=[],screenshots=[];
try{
  for(const [device,width,height,mobile] of [['desktop',1440,1000,false],['phone',390,844,true],['landscape',844,390,true]]){
    for(const look of ['principal','alternativo','boda']){
      const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
      page.on('pageerror',error=>errors.push(error.message));
      page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)failed.push(response.url());});
      await page.addInitScript(look=>localStorage.setItem('oowwww-game-v1',JSON.stringify({position:{x:37,y:53},direction:'down',visited:[],
        outfits:{leo:{look,glasses:false},itza:{look,hair:look==='principal'?'rosa':look==='alternativo'?'rubio':'cafe',glasses:false}},
        leoVoice:{enabled:false},soundEffects:{enabled:false},dayNight:{mode:'day'}})),look);
      await page.goto(base+'/game.html');await page.locator('#start-game').click();
      await page.locator('#world').focus();await page.keyboard.press('e');
      await page.getByRole('button',{name:'Ver la tele',exact:true}).click();
      await expect(page.locator('.home-scene')).toHaveAttribute('data-sofa-facing','tv');
      await page.evaluate(()=>document.fonts.ready);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const name=device+'-'+look+'.png';await page.screenshot({path:output+'/'+name});screenshots.push(name);
      if(!mobile){
        const clip=await page.locator('.home-scene').evaluate(canvas=>{
          const r=canvas.getBoundingClientRect();return {x:r.left+316/480*r.width,y:r.top+143/270*r.height,width:124/480*r.width,height:92/270*r.height};
        });
        const detail='detail-'+look+'.png';await page.screenshot({path:output+'/'+detail,clip});screenshots.push(detail);
      }
      await page.close();
    }
  }
  expect(errors).toEqual([]);expect(failed).toEqual([]);
  await writeFile(output+'/result.json',JSON.stringify({screenshots,errors,failed,
    note:'Real room, TV-facing rear sofa and personalized actors. No personal video was played or captured; only the idle TV is visible. Phone sizes and touch are emulated.'},null,2)+'\n');
  console.log(JSON.stringify({screenshots,errors,failed}));
}finally{await browser.close();}
