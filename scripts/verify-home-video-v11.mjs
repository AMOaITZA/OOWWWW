// Creates an original test clip only when no personal video exists, verifies
// the real player, and removes the fixture in finally. Never replaces a user file.
import {chromium,expect} from '@playwright/test';
import {access,mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';

const fixture=resolve('assets/game/home/videos/nuestro-video.mp4');
const webm=resolve('assets/game/home/videos/nuestro-video.webm');
for(const path of [fixture,webm]){
  try{await access(path);throw new Error('Personal TV video already exists; fixture verification will not replace it: '+path);}
  catch(error){if(error.code!=='ENOENT')throw error;}
}
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-home-video-v11';
let created=false,browser,result;
try{
  created=true;
  execFileSync(process.env.ART_FFMPEG_PATH||'/usr/bin/ffmpeg',['-y','-loglevel','error',
    '-f','lavfi','-i','testsrc2=size=160x90:rate=15','-f','lavfi','-i','sine=frequency=440:sample_rate=22050',
    '-t','8','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-c:a','aac','-b:a','32k','-movflags','+faststart',fixture]);
  console.log('Temporary TV fixture created.');
  browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'}),errors=[],failed=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().includes('/assets/game/')&&response.status()>=400)failed.push(response.url());});
  await page.addInitScript(()=>{
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position:{x:37,y:53},direction:'down',visited:[],
      outfits:{leo:{look:'principal'},itza:{look:'principal',hair:'rosa',glasses:false}},
      leoVoice:{enabled:false},dayNight:{mode:'day'}}));
    window.__homeVideoPlays=0;window.__homeVideoFrames=0;window.__homePausedIds=[];
    const play=HTMLMediaElement.prototype.play,pause=HTMLMediaElement.prototype.pause,draw=CanvasRenderingContext2D.prototype.drawImage;
    HTMLMediaElement.prototype.play=function(...args){if(this.classList.contains('home-video-source'))window.__homeVideoPlays++;return play.apply(this,args);};
    HTMLMediaElement.prototype.pause=function(...args){if(this.id)window.__homePausedIds.push(this.id);return pause.apply(this,args);};
    CanvasRenderingContext2D.prototype.drawImage=function(...args){if(this.canvas.classList.contains('home-scene')&&args[0] instanceof HTMLVideoElement)window.__homeVideoFrames++;return draw.apply(this,args);};
  });
  await page.goto(base+'/game.html');await page.locator('#start-game').click();
  await page.locator('#world').focus();await page.keyboard.press('e');
  await page.getByRole('button',{name:'Ver la tele',exact:true}).click();
  const video=page.locator('.home-video-source'),play=page.getByRole('button',{name:'Reproducir video',exact:true});
  await expect(play).toBeEnabled();await expect(video).not.toHaveAttribute('src',/.+/);
  expect(await page.evaluate(()=>window.__homeVideoPlays)).toBe(0);
  await play.click();
  await expect.poll(()=>video.evaluate(element=>!element.paused&&element.currentTime>.15)).toBe(true);
  await expect.poll(()=>page.evaluate(()=>window.__homeVideoFrames)).toBeGreaterThan(0);
  expect(await page.evaluate(()=>window.__homePausedIds)).toContain('music-audio');
  const hash=()=>page.locator('.home-scene').evaluate(canvas=>{
    const data=canvas.getContext('2d').getImageData(352,80,42,29).data;let hash=0;
    for(const value of data)hash=(Math.imul(hash,31)+value)|0;return hash;
  });
  const first=await hash();
  await page.getByRole('button',{name:'Pausar video',exact:true}).click();
  await page.locator('.home-video-progress').evaluate(element=>{element.value='500';element.dispatchEvent(new Event('input',{bubbles:true}));});
  await expect.poll(()=>video.evaluate(element=>!element.seeking&&element.currentTime>3.8)).toBe(true);
  await expect.poll(hash).not.toBe(first);
  await page.getByRole('slider',{name:'Volumen del video',exact:true}).evaluate(element=>{element.value='37';element.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.getByRole('button',{name:'Silenciar video',exact:true}).click();
  expect(await video.evaluate(element=>({muted:element.muted,volume:element.volume}))).toEqual({muted:true,volume:.37});
  await page.locator('#experience-content').evaluate(element=>{element.scrollTop=0;});
  await mkdir(output,{recursive:true});await page.screenshot({path:output+'/video-in-the-tv.png'});
  await page.getByRole('button',{name:'Comer juntos',exact:true}).click();
  await expect(video).not.toHaveAttribute('src',/.+/);expect(await video.evaluate(element=>element.paused)).toBe(true);
  await page.getByRole('button',{name:'Ver la tele',exact:true}).click();
  expect(await page.evaluate(()=>window.__homeVideoPlays)).toBe(1);
  await page.getByRole('button',{name:'Reproducir video',exact:true}).click();
  await expect.poll(()=>video.evaluate(element=>element.currentTime)).toBeGreaterThan(3.8);
  await page.getByRole('button',{name:'Pausar video',exact:true}).click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('oowwww-game-v1')).home.video);
  expect(saved.position).toBeGreaterThan(3.8);expect(saved.volume).toBe(.37);expect(saved.muted).toBe(true);
  const handle=await video.elementHandle();await page.locator('#close-experience').click();
  expect(await handle.evaluate(element=>element.paused&&!element.getAttribute('src'))).toBe(true);
  expect(errors).toEqual([]);expect(failed).toEqual([]);
  result={noAutoplay:true,videoFramesPainted:await page.evaluate(()=>window.__homeVideoFrames),videoPixelsChanged:true,
    position:saved.position,volume:saved.volume,muted:saved.muted,stoppedOnSwitch:true,stoppedOnClose:true,errors,failed};
}finally{
  await browser?.close();if(created)await rm(fixture,{force:true});
}
await writeFile(output+'/result.json',JSON.stringify({...result,fixtureRemoved:true},null,2)+'\n');
console.log(JSON.stringify({...result,fixtureRemoved:true}));
