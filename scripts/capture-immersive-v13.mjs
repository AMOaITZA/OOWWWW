// Capture real, personalized scenes. There is no injected progress or media.
import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
import {HAWAII_ZONES} from '../game/hawaii.js';
import {COAST_LAYOUT} from '../game/coast-layout.js';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-immersive-v13';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],failed=[],screenshots=[],danceFrames=[];
const point=tuple=>({x:tuple[0],y:tuple[1]});
async function enter(page,position,{look='principal',hair='rosa',reduced=true}={}){
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)failed.push([response.status(),response.url()]);});
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await page.addInitScript(({position,look,hair})=>{
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',outfits:{leo:{look,glasses:false},itza:{look,hair,glasses:false}},
      visited:[],leoVoice:{enabled:false},soundEffects:{enabled:false},dayNight:{mode:'day',cycleStartedAt:Date.now()}}));
  },{position,look,hair});
  await page.goto(base+'/game.html');await page.locator('#start-game').click();await page.evaluate(()=>document.fonts.ready);
}
async function interact(page){await page.locator('#world').focus();await page.keyboard.press('e');}
async function shot(page,name){await page.screenshot({path:output+'/'+name+'.png'});screenshots.push(name+'.png');}
async function zone(page,id){
  await page.locator('[data-hawaii-destination="'+id+'"]').click();const destination=HAWAII_ZONES.find(zone=>zone.id===id).arrival;
  await expect.poll(async()=>({x:Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-x')),
    y:Number(await page.locator('.hawaii-map').getAttribute('data-hawaii-y'))}),{timeout:15000}).toEqual(destination);
}
async function board(page){await interact(page);await page.getByRole('button',{name:'Subir al barco · Hawái',exact:true}).click();await expect(page.locator('.hawaii-map')).toBeVisible();}
try{
  const harbor=await browser.newPage({viewport:{width:1440,height:1000}});
  await enter(harbor,point(COAST_LAYOUT.hawaiiArrival));await interact(harbor);await shot(harbor,'harbor-physical-desktop');await harbor.close();
  const shore=await browser.newPage({viewport:{width:1440,height:1000}});
  await enter(shore,point(COAST_LAYOUT.shoreArrival));await shot(shore,'coast-blanket-desktop');await shore.close();
  for(const [name,width,height,mobile] of [['desktop',1440,1000,false],['phone',390,844,true],['landscape',844,390,true]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
    await enter(page,point(COAST_LAYOUT.shoreArrival),{look:'boda',hair:'rubio'});await interact(page);
    await expect(page.locator('#world')).toHaveAttribute('data-coast-view','true');
    await page.getByRole('button',{name:'Ver fuegos artificiales',exact:true}).click();
    await page.getByRole('button',{name:'Pedir un deseo',exact:true}).click();
    await expect(page.locator('#world')).toHaveAttribute('data-coast-particles','54');
    await shot(page,'coast-fireworks-'+name);await page.close();
  }
  const dance=await browser.newPage({viewport:{width:1440,height:1000}});
  await dance.clock.install();await enter(dance,point(COAST_LAYOUT.hawaiiArrival),{reduced:false});await board(dance);
  await shot(dance,'hawai-fullscreen-desktop');await zone(dance,'dance');
  await dance.getByRole('button',{name:'Bailar con Leo',exact:true}).click();
  await dance.clock.pauseAt(await dance.evaluate(()=>Date.now()+100));
  const crop=await dance.locator('.hawaii-map').evaluate(source=>{
    const rect=source.getBoundingClientRect();
    const x=(275-Number(source.dataset.cameraX))/source.width*rect.width+rect.left;
    const y=(228-Number(source.dataset.cameraY))/source.height*rect.height+rect.top;
    return {x:Math.round(x-145),y:Math.round(y-178),width:290,height:190};
  });
  for(let index=0;index<8;index++){
    for(let step=0;step<180;step++){
      if(Number(await dance.locator('.hawaii-map').getAttribute('data-dance-frame'))===index)break;
      await dance.clock.runFor(16);
    }
    await expect(dance.locator('.hawaii-map')).toHaveAttribute('data-dance-frame',String(index));
    const phase=await dance.locator('.hawaii-map').getAttribute('data-dance-phase');
    const path='dance-frame-'+String(index).padStart(2,'0')+'.png';
    await dance.screenshot({path:output+'/'+path,clip:crop});danceFrames.push({frame:index,phase,path});
  }
  // Technical contact sheet: unaltered screenshot crops arranged in order.
  const strip=new PNG({width:crop.width*8,height:crop.height});
  for(const [index,entry] of danceFrames.entries()){
    const frame=PNG.sync.read(await readFile(output+'/'+entry.path));
    PNG.bitblt(frame,strip,0,0,frame.width,frame.height,index*crop.width,0);
  }
  await writeFile(output+'/dance-eight-frames.png',PNG.sync.write(strip));
  screenshots.push('dance-eight-frames.png');await dance.close();
  await writeFile(output+'/dance-frames.json',JSON.stringify({frames:danceFrames,crop,
    note:'Eight screenshots of the actual moving game, frozen on each rendered dance frame.'},null,2)+'\n');
  for(const [name,width,height] of [['phone',390,844],['landscape',844,390]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
    await enter(page,point(COAST_LAYOUT.hawaiiArrival));await board(page);await zone(page,'giraffe');
    await page.getByRole('button',{name:'Acariciar a la jirafa',exact:true}).click();await shot(page,'hawai-jirafa-'+name);await page.close();
  }
  expect(errors).toEqual([]);expect(failed).toEqual([]);
  await writeFile(output+'/result.json',JSON.stringify({screenshots,danceFrames,errors,failed,
    note:'Real game UI and ordinary arrival seeds; reduced motion freezes decorative coast effects. No personal video was played or captured.'},null,2)+'\n');
  console.log(JSON.stringify({screenshots,danceFrames: danceFrames.length,errors,failed}));
}finally{await browser.close();}
