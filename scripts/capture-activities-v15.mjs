import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {COAST_LAYOUT} from '../game/coast-layout.js';

const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-activities-v15';
const cookingOnly=process.env.ART_CAPTURE_ACTIVITY==='cooking';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],failed=[],screenshots=[];
const layouts=[['desktop',1440,900],['phone',390,844],['compact-phone',320,740],['landscape',844,390]];
async function enter(page,{position={x:37,y:53},motion='reduce',fishing,outfits={leo:{look:'alternativo',glasses:false},itza:{look:'boda',hair:'rosa',glasses:false}}}={}){
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)failed.push([response.status(),response.url()]);});
  await page.emulateMedia({reducedMotion:motion});
  await page.addInitScript(({position,fishing,outfits})=>localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',visited:[],outfits,fishing,
    leoVoice:{enabled:false},soundEffects:{enabled:false},dayNight:{mode:'day'}})),{position,fishing,outfits});
  await page.goto(base+'/game.html');await page.locator('#start-game').click();await page.evaluate(()=>document.fonts.ready);
}
async function interact(page){await page.locator('#world').focus();await page.keyboard.press('e');}
async function houseActivity(page,label){await interact(page);await page.getByText('Más en casa',{exact:true}).click();await page.getByRole('button',{name:label,exact:true}).click();}
async function shot(page,name){await page.screenshot({path:output+'/'+name+'.png'});screenshots.push(name+'.png');}
try{
  for(const [name,width,height]of layouts){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:name!=='desktop'});
    const page=await context.newPage();await enter(page);await houseActivity(page,'Cocinar juntos');
    await page.locator('[data-cooking-choose="panqueques"]').click();
    for(const id of ['harina','leche','fresas'])await page.locator(`[data-cooking-ingredient="${id}"]`).click();
    for(let i=0;i<4;i++)await page.locator('[data-cooking-action="stir"]').click();
    for(let i=0;i<3;i++)await page.locator('[data-cooking-action="cook"]').click();
    await page.locator('[data-cooking-action="serve"]').click();await expect(page.locator('.cooking-room')).toHaveAttribute('data-cooking-stage','served');
    await shot(page,'cooking-shared-'+name);
    if(cookingOnly){await context.close();continue;}
    await page.getByRole('button',{name:'Abrir cámara Canon',exact:true}).click();
    await page.getByRole('combobox',{name:'Pose para la foto',exact:true}).selectOption('frente');
    await page.locator('.retro-camera-shutter').click();await expect(page.locator('.retro-camera-status')).toContainText('Foto guardada');
    await expect(page.locator('.retro-camera')).not.toHaveAttribute('data-shutter','flash');await shot(page,'canon-camera-'+name);
    await page.getByRole('button',{name:'Ver nuestro álbum',exact:true}).click();
    await expect(page.locator('.photo-album-card')).toHaveCount(1);
    await expect.poll(()=>page.locator('.photo-album-card img').evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true);
    await shot(page,'memory-album-'+name);await page.locator('#close-experience').click();
    await houseActivity(page,'Cuidar el huerto');
    await page.locator('.garden-primary').click();await expect(page.locator('.garden-primary')).toHaveText('Regar las flores');
    await page.locator('.garden-primary').click();await expect(page.locator('.garden-primary')).toHaveText('Recoger flores',{timeout:15000});
    await shot(page,'garden-grown-'+name);await page.locator('.garden-primary').click();
    await page.locator('.garden-decor-toggle').click();await page.locator('[data-garden-decoration="cosmos"]').click();
    await page.getByRole('button',{name:'Ver el florero en casa',exact:true}).click();
    await expect(page.locator('.home-scene')).toHaveAttribute('data-flower-decoration','cosmos');await shot(page,'home-grown-vase-'+name);
    await context.close();

    const boatContext=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:name!=='desktop'}),boat=await boatContext.newPage();
    await enter(boat,{position:{x:COAST_LAYOUT.hawaiiArrival[0],y:COAST_LAYOUT.hawaiiArrival[1]}});await interact(boat);
    await boat.getByRole('button',{name:'Pasear en barca',exact:true}).click();await expect(boat.locator('.boating-map')).toBeVisible();
    await shot(boat,'boating-departure-'+name);await boat.locator('[data-boat-destination="cerezo"]').click();
    await expect(boat.locator('.boating-open-gift')).toBeVisible({timeout:12000});await boat.locator('.boating-open-gift').click();
    await expect(boat.locator('.boating-message')).toBeVisible();await shot(boat,'island-keepsake-'+name);await boatContext.close();
  }
  for(const [name,width,height]of cookingOnly?[]:[layouts[0],layouts[1]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:name!=='desktop'}),page=await context.newPage();
    const collection=Object.fromEntries(['freddy','bonnie','chica','foxy','golden-freddy'].map(id=>[id,1]));
    await enter(page,{position:{x:50,y:34},motion:'no-preference',fishing:{collection,casts:5,catches:5},outfits:{leo:{look:'alternativo',glasses:false},itza:{look:'boda',hair:'negro',glasses:true}}});
    await interact(page);
    await page.locator('.fishing-action').click();await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','bite');
    await expect(page.locator('.fishing-game')).toHaveAttribute('data-phase','missed');await shot(page,'fishing-missed-wedding-'+name);await context.close();
  }
  expect(errors).toEqual([]);expect(failed).toEqual([]);
  await fs.writeFile(output+(cookingOnly?'/result-cooking.json':'/result.json'),JSON.stringify({screenshots,errors,failed,note:cookingOnly?'Responsive cooking framing refreshed in all four sizes after serving a complete recipe.':'All four activities use actual controls. Flowers are planted, watered and harvested; a vase is displayed at home. Recipe is cooked and served. A Canon portrait is saved to IndexedDB and shown in the album. The boat rows to an island gift. Fishing uses the exact wedding/black-hair/glasses-on missed-cast case with an existing complete collection.'},null,2)+'\n');
  console.log(JSON.stringify({screenshots:screenshots.length,errors,failed}));
}finally{await browser.close();}
