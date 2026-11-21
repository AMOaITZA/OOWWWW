// Real browser captures, including a short native-motion recording.
// Start Vite first. No artwork is redrawn or composited for the evidence.
import {chromium} from '@playwright/test';
import {mkdir,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-ambience-v9';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],views=[];
const scenes=[
  ['pond-day',50,34,'day'],['cherry-petals',40,36,'day'],['pond-night',50,34,'night'],['lantern-night',55,43,'night']
];
async function seed(page,position,mode){
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(({position,mode})=>{
    Math.random=()=>.3;
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',visited:['carta'],
      outfits:{leo:{look:'principal'},itza:{look:'principal',hair:'rosa',glasses:false}},
      leoVoice:{enabled:false},dayNight:{mode,cycleStartedAt:Date.now()}}));
  },{position,mode});
  await page.goto(base+'/game.html');await page.locator('#start-game').click();
  await page.locator('#world').waitFor({state:'visible'});await page.waitForTimeout(350);
}
try{
  for(const [name,x,y,mode] of scenes){
    const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
    await seed(page,{x,y},mode);await page.screenshot({path:output+'/'+name+'-desktop.png'});
    views.push({name,viewport:[1440,900],stats:await page.locator('#world').evaluate(c=>({...c.dataset}))});
    if(name==='pond-day'){
      await page.locator('#help-button').click();await page.waitForTimeout(100);
      await page.screenshot({path:output+'/experience-entry.png'});
      await page.locator('#close-experience').click();await page.waitForTimeout(70);
      await page.screenshot({path:output+'/experience-exit.png'});
    }
    await page.close();
  }
  for(const [name,width,height] of [['phone',390,844],['landscape',844,390]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
    await seed(page,{x:50,y:34},'day');await page.screenshot({path:output+'/pond-'+name+'.png'});
    views.push({name,viewport:[width,height],stats:await page.locator('#world').evaluate(c=>({...c.dataset}))});
    await page.close();
  }
  const context=await browser.newContext({viewport:{width:960,height:600},reducedMotion:'no-preference'});
  const videoPage=await context.newPage();await seed(videoPage,{x:50,y:34},'day');
  const frames=await mkdtemp(join(tmpdir(),'oowwww-v9-capture-'));
  try{
    // Capture real frames at ten samples per second. System FFmpeg packs them;
    // this does not depend on Playwright's separately downloaded FFmpeg wrapper.
    for(let frame=0;frame<65;frame++){
      const started=Date.now();
      if(frame===18)await videoPage.locator('#help-button').click();
      if(frame===25)await videoPage.locator('#close-experience').click();
      if(frame===33)await videoPage.locator('#day-night-night').click();
      await videoPage.screenshot({path:join(frames,String(frame).padStart(3,'0')+'.png')});
      await videoPage.waitForTimeout(Math.max(0,100-(Date.now()-started)));
    }
    execFileSync(process.env.ART_FFMPEG_PATH||'/usr/bin/ffmpeg',['-y','-loglevel','error','-framerate','10',
      '-i',join(frames,'%03d.png'),'-c:v','libvpx-vp9','-crf','30','-b:v','0','-pix_fmt','yuv420p',
      output+'/ambience-preview.webm']);
  }finally{await rm(frames,{recursive:true,force:true});await context.close();}
}finally{await browser.close();}
await writeFile(output+'/metrics.json',JSON.stringify({views,errors},null,2)+'\n');
console.log(JSON.stringify({output,views:views.length,errors}));if(errors.length)process.exitCode=1;
