// Start Vite first. Captures exercise the real renderer and accessible controls.
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-expansion-v6';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[];
async function enter({position={x:14,y:42},look='principal',hair='rosa',glasses=true,mobile=false}={}){
  const page=await browser.newPage({viewport:mobile?{width:375,height:812}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(({position,look,hair,glasses})=>{
    Math.random=()=>.15;
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',outfits:{leo:{look:'principal',glasses},itza:{look,hair,glasses}},visited:[],leoVoice:{enabled:false},dayNight:{mode:'day',cycleStartedAt:Date.now()}}));
  },{position,look,hair,glasses});
  await page.goto(base+'/game.html');await page.locator('#start-game').click();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(150);
  return page;
}
async function interact(page){await page.locator('#world').focus();await page.keyboard.press('e');}
for(const [slug,look,hair] of [['alternate-brown','alternativo','cafe'],['alternate-pink','alternativo','rosa'],['alternate-blonde','alternativo','rubio'],['wedding-blonde','boda','rubio']]){
  const page=await enter({look,hair});await interact(page);await page.locator('.wardrobe-preview').waitFor();
  await page.getByRole('button',{name:'Lado',exact:true}).click();
  await page.locator('.wardrobe-layout').screenshot({path:`${output}/hair-${slug}-profile.png`});await page.close();
}
{
  const page=await enter({glasses:false});await interact(page);await page.locator('.wardrobe-preview').waitFor();
  await page.locator('.wardrobe-layout').screenshot({path:`${output}/itza-no-glasses-desktop.png`});
  await page.getByRole('button',{name:'Leo',exact:true}).click();
  await page.locator('.wardrobe-layout').screenshot({path:`${output}/leo-no-glasses-desktop.png`});await page.close();
}
for(const [name,position] of [['inicio',{x:30,y:8}],['castle',{x:105,y:54}]]){
  const page=await enter({position});await page.locator('#world').screenshot({path:`${output}/trees-${name}-desktop.png`});await page.close();
}
for(const mobile of [false,true]){
  const label=mobile?'mobile':'desktop';
  const secret=await enter({position:{x:12,y:20},mobile});await interact(secret);await secret.locator('.secret-quiz').waitFor();
  await secret.locator('.secret-options button').first().click();await secret.screenshot({path:`${output}/secret-${label}.png`});await secret.close();
  const recorder=await enter({position:{x:98,y:23},mobile});await interact(recorder);await recorder.locator('.voice-recorder').waitFor();
  await recorder.screenshot({path:`${output}/recorder-${label}.png`});await recorder.close();
}
await browser.close();console.log(JSON.stringify({output,errors}));if(errors.length)process.exitCode=1;
