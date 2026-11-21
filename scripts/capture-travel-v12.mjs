// Capture the actual game, with an ordinary arrival position and no won rewards.
import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {HAWAII_ZONES} from '../game/hawaii.js';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-travel-v12';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],failed=[],screenshots=[];
async function seed(page,position,reduced=true){
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failed.push([r.status(),r.url()]);});
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await page.addInitScript(position=>localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',visited:[],
    outfits:{leo:{look:'principal',glasses:false},itza:{look:'principal',hair:'rosa',glasses:false}},
    leoVoice:{enabled:false},soundEffects:{enabled:false},dayNight:{mode:'day',cycleStartedAt:Date.now()}})),position);
  await page.goto(base+'/game.html');await page.locator('#start-game').click();
  await page.locator('#world').focus();await page.keyboard.press('e');await page.evaluate(()=>document.fonts.ready);
}
async function shot(page,name,selector){
  if(selector)await page.locator(selector).screenshot({path:output+'/'+name+'.png'});
  else{await page.locator('#experience-content').evaluate(el=>{el.scrollTop=0;});await page.screenshot({path:output+'/'+name+'.png'});}
  screenshots.push(name+'.png');
}
async function zone(page,id){
  await page.locator('[data-hawaii-destination="'+id+'"]').click();const point=HAWAII_ZONES.find(z=>z.id===id).arrival;
  await expect.poll(async()=>({x:Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-x')),
    y:Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-y'))}),{timeout:12000}).toEqual(point);
}
try{
  const desktop=await browser.newPage({viewport:{width:1440,height:1000}});
  await seed(desktop,{x:76,y:42});await shot(desktop,'hawai-map-desktop');
  await zone(desktop,'dance');await desktop.getByRole('button',{name:'Bailar con Leo',exact:true}).click();
  await shot(desktop,'hawai-dance-desktop','.hawaii-stage');
  await zone(desktop,'bar');await desktop.locator('button[data-hawaii-drink="coco"]').click();
  await shot(desktop,'hawai-bar-desktop','.hawaii-stage');
  await desktop.locator('.hawaii-interaction').screenshot({path:output+'/hawai-drinks-menu.png'});screenshots.push('hawai-drinks-menu.png');
  await zone(desktop,'giraffe');await desktop.getByRole('button',{name:'Acariciar a la jirafa',exact:true}).click();
  await shot(desktop,'hawai-giraffe-desktop','.hawaii-stage');
  await desktop.close();
  const phone=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await seed(phone,{x:76,y:42});await zone(phone,'giraffe');await phone.getByRole('button',{name:'Acariciar a la jirafa',exact:true}).tap();
  await shot(phone,'hawai-giraffe-phone');await phone.setViewportSize({width:844,height:390});await shot(phone,'hawai-landscape');await phone.close();
  for(const [name,width,height,mobile] of [['desktop',1440,1000,false],['phone',390,844,true],['landscape',844,390,true]]){
    const page=await browser.newPage({viewport:{width,height},hasTouch:mobile,isMobile:mobile});
    await seed(page,{x:58,y:34});await page.getByRole('button',{name:'Sentarnos juntos',exact:true}).click();
    await page.getByRole('button',{name:'Ver fuegos artificiales',exact:true}).click();await page.getByRole('button',{name:'Pedir un deseo',exact:true}).click();
    await expect(page.locator('.lakeside-scene')).toHaveAttribute('data-active-particles','54');
    await shot(page,'lake-fireworks-'+name);if(name==='desktop')await shot(page,'lake-fireworks-scene','.lakeside-stage');await page.close();
  }
  expect(errors).toEqual([]);expect(failed).toEqual([]);
  await fs.writeFile(output+'/travel-result.json',JSON.stringify({screenshots,errors,failed,
    note:'Actual game flows, personalized looks, ordinary arrival seeds. Reduced motion freezes decorative effects for reproducible screenshots; active animations are exercised by browser tests.'},null,2)+'\n');
  console.log(JSON.stringify({screenshots,errors,failed}));
}finally{await browser.close();}
