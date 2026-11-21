// Real game UI evidence for the fishing quest, Ponyo and the three home scenes.
import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-finale-v10';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const key='oowwww-game-v1',errors=[],failed=[],evidence=[];
const outfits={leo:{look:'principal',glasses:true},itza:{look:'principal',hair:'rosa',glasses:false}};
function observe(page){
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().includes('/assets/game/')&&response.status()>=400)failed.push([response.status(),response.url()]);});
}
async function seed(page,position,fishing){
  observe(page);
  await page.addInitScript(({key,position,fishing,outfits})=>localStorage.setItem(key,JSON.stringify({
    position,direction:'down',outfits,visited:[],fishing,leoVoice:{enabled:false},
    dayNight:{mode:'day',cycleStartedAt:Date.now()}
  })),{key,position,fishing,outfits});
  await page.goto(base+'/game.html');await page.locator('#start-game').click();
  await page.evaluate(()=>document.fonts.ready);
}
async function interact(page){await page.locator('#world').focus();await page.keyboard.press('e');}
async function capture(page,name){
  await page.locator('#experience-content').evaluate(body=>{body.scrollTop=0;});
  await page.evaluate(()=>new Promise(requestAnimationFrame));
  await page.screenshot({path:output+'/'+name+'.png'});
  evidence.push(name);
}
async function captureCollection(page,name){
  await page.locator('.fishing-collection').scrollIntoViewIfNeeded();
  await page.screenshot({path:output+'/'+name+'.png'});evidence.push(name);
}
let completed;
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await seed(page,{x:50,y:34});await interact(page);await expect(page.locator('.fishing-game')).toBeVisible();
  await capture(page,'fishing-desktop-start');
  for(let count=1;count<=5;count++){
    await page.locator('.fishing-action').click();await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','bite');
    if(count===1)await capture(page,'fishing-desktop-bite');
    await page.locator('.fishing-action').click();await expect(page.locator('.fishing-game')).toHaveAttribute('data-collected',String(count));
    if(count===1)await capture(page,'fishing-desktop-first-plush');
  }
  await capture(page,'fishing-desktop-complete');
  await captureCollection(page,'fishing-desktop-collection');
  completed=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  await page.locator('#close-experience').click();await page.locator('#map-button').click();
  await page.getByRole('button',{name:'Ponyo · Acariciar',exact:true}).click();
  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).position,key),{timeout:20000}).toEqual({x:71,y:50});
  await interact(page);await expect(page.locator('#leo-bubble')).toContainText('ponyo ponyo que divertida es');
  await page.screenshot({path:output+'/ponyo-desktop.png'});evidence.push('ponyo-desktop');await page.close();
  for(const [name,width,height,mobile] of [['desktop',1440,1000,false],['phone',390,844,true]]){
    const home=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
    await seed(home,{x:37,y:53},completed.fishing);await interact(home);await expect(home.locator('.home-scene')).toBeVisible();
    for(const [activity,label] of [['eat','Comer juntos'],['sleep','Dormir juntos'],['tv','Ver la tele']]){
      await home.getByRole('group',{name:'Actividades de la casita',exact:true}).getByRole('button',{name:label,exact:true}).click();
      await expect(home.locator('.home-scene')).toHaveAttribute('data-activity',activity);
      await capture(home,'home-'+activity+'-'+name);
    }
    if(mobile){
      await home.setViewportSize({width:844,height:390});await capture(home,'home-tv-landscape');
    }
    await home.close();
  }
  const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await seed(phone,{x:50,y:34},completed.fishing);await interact(phone);await capture(phone,'fishing-phone-complete');
  await captureCollection(phone,'fishing-phone-collection');await phone.close();
}finally{await browser.close();}
await writeFile(output+'/result.json',JSON.stringify({evidence,fishing:completed?.fishing,outfits,errors,failed},null,2)+'\n');
console.log(JSON.stringify({output,captures:evidence.length,errors,failed}));
if(errors.length||failed.length)process.exitCode=1;
