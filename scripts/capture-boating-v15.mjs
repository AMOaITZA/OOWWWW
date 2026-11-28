import {chromium} from '@playwright/test';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-boating-v15';
const fs=await import('node:fs/promises');await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const [name,width,height] of [['desktop',1440,900],['phone',390,844],['landscape',844,390],['phone-320',320,740]]){
 const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:name!=='desktop'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>localStorage.setItem('oowwww-game-v1',JSON.stringify({position:{x:24,y:94},direction:'down',visited:[],outfits:{leo:{look:'boda',glasses:false},itza:{look:'boda',hair:'rubio',glasses:false}},leoVoice:{enabled:false},soundEffects:{enabled:false},dayNight:{mode:'day'}})));
 await page.goto(base+'/game.html');await page.locator('#start-game').click();await page.locator('#world').focus();await page.keyboard.press('e');await page.getByRole('button',{name:'Pasear en barca',exact:true}).click();await page.locator('.boating-map').waitFor();await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${output}/${name}-muelle.png`});
 await page.locator('[data-boat-destination=cerezo]').click();await page.waitForFunction(()=>document.querySelector('.boating-trip')?.dataset.boatIsland==='cerezo'&&!document.querySelector('.boating-trip')?.dataset.boatDestination);await page.screenshot({path:`${output}/${name}-cerezo.png`});
 await page.locator('.boating-open-gift').click();await page.screenshot({path:`${output}/${name}-gift.png`});
 console.log(JSON.stringify({name,errors,boat:await page.locator('.boating-map').evaluate(c=>({...c.dataset})),save:await page.evaluate(()=>JSON.parse(localStorage.getItem('oowwww-game-v1')).boating)}));await page.close();
}
await browser.close();
