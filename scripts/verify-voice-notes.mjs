// Integration check with disposable synthetic MP3s. Requires Vite and ffmpeg.
// Existing personal recordings are never overwritten; fixtures are removed.
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir,unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';

const base=process.env.VOICE_NOTE_URL||'http://127.0.0.1:5173';
const folder=new URL('../assets/game/voice-notes/',import.meta.url);
const fixtureNames=['mensaje-01.mp3','mensaje-02.mp3'];
const created=[];let browser;
for(const filename of fixtureNames)
  assert.ok(!existsSync(new URL(filename,folder)),'The fixture name already contains a recording: '+filename);
try{
  await mkdir(folder,{recursive:true});
  for(const [index,filename] of fixtureNames.entries()){
    const path=fileURLToPath(new URL(filename,folder));
    created.push(path);
    execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-n','-f','lavfi','-i',
      'sine=frequency='+(330+index*110)+':duration=4','-c:a','libmp3lame','-q:a','9',path]);
  }
  browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    if(sessionStorage.getItem('__recorder_fixture_seed'))return;
    sessionStorage.setItem('__recorder_fixture_seed','yes');
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position:{x:98,y:23},direction:'down',
      outfits:{leo:{look:'principal'},itza:{look:'principal'}},visited:[]}));
  });
  await page.goto(base+'/game.html');await page.locator('#start-game').click();
  await page.locator('#music-button').click();
  await page.locator('#music-audio').evaluate(audio=>{audio.src='/assets/game/voice-notes/mensaje-02.mp3';});
  await page.locator('#music-play').click();
  await expect.poll(()=>page.locator('#music-audio').evaluate(audio=>audio.paused)).toBe(false);
  await page.locator('#music-close').click();
  await page.locator('#world').focus();await page.keyboard.press('e');
  const recorder=page.locator('.voice-recorder'),audio=recorder.locator('audio');
  await expect(recorder).toBeVisible();await expect(recorder.locator('.recorder-message')).toHaveCount(2);
  await expect(audio).not.toHaveAttribute('src',/.+/);expect(await audio.evaluate(node=>node.paused)).toBe(true);
  await page.getByRole('button',{name:'Mensaje 02',exact:true}).click();
  await expect(audio).not.toHaveAttribute('src',/.+/);expect(await audio.evaluate(node=>node.paused)).toBe(true);
  await page.getByRole('button',{name:'Reproducir mensaje',exact:true}).click();
  await expect.poll(()=>audio.evaluate(node=>node.paused)).toBe(false);
  expect(await page.locator('#music-audio').evaluate(node=>node.paused)).toBe(true);
  await expect.poll(()=>audio.evaluate(node=>node.currentTime)).toBeGreaterThan(.08);
  await page.getByRole('button',{name:'Pausar mensaje',exact:true}).click();
  expect(await audio.evaluate(node=>node.paused)).toBe(true);
  await page.getByRole('slider',{name:'Progreso del mensaje',exact:true}).evaluate(slider=>{slider.value='500';slider.dispatchEvent(new Event('input',{bubbles:true}));});
  const seeked=await audio.evaluate(node=>({at:node.currentTime,duration:node.duration}));
  assert.ok(Math.abs(seeked.at-seeked.duration/2)<.15);
  await page.getByRole('slider',{name:'Volumen de los mensajes',exact:true}).evaluate(slider=>{slider.value='31';slider.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await audio.evaluate(node=>node.volume),.31);
  await page.getByRole('button',{name:'Volver al inicio',exact:true}).click();
  assert.equal(await audio.evaluate(node=>node.currentTime),0);assert.equal(await audio.evaluate(node=>node.paused),true);
  await page.getByRole('button',{name:'Mensaje 01',exact:true}).click();
  await page.getByRole('button',{name:'Reproducir mensaje',exact:true}).click();
  await expect.poll(()=>audio.evaluate(node=>node.currentTime)).toBeGreaterThan(.08);
  const handle=await audio.elementHandle();
  await page.screenshot({path:process.env.VOICE_NOTE_CAPTURE||'/workspace/work/voice-notes-v6-fixture.png'});
  await page.locator('#close-experience').click();
  const closed=await handle.evaluate(node=>({paused:node.paused,src:node.getAttribute('src')}));
  assert.deepEqual(closed,{paused:true,src:null});
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('oowwww-game-v1')).voiceNotes);
  assert.equal(saved.filename,'mensaje-01.mp3');assert.equal(saved.volume,.31);assert.ok(saved.position>0);
  await page.locator('#world').focus();await page.keyboard.press('e');
  await expect(recorder).toBeVisible();await expect(audio).not.toHaveAttribute('src',/.+/);
  assert.equal(await audio.evaluate(node=>node.paused),true);
  await expect(page.getByRole('button',{name:'Mensaje 01',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('slider',{name:'Volumen de los mensajes',exact:true})).toHaveValue('31');
  await page.getByRole('button',{name:'Reproducir mensaje',exact:true}).click();
  await expect.poll(()=>audio.evaluate(node=>node.currentTime)).toBeGreaterThanOrEqual(saved.position-.05);
  await page.locator('#close-experience').click();assert.deepEqual(errors,[]);
  console.log(JSON.stringify({installed:2,noAutoplay:true,musicPaused:true,seek:true,volume:.31,closeReleases:true,resume:true,errors}));
}finally{
  try{await browser?.close();}finally{
    for(const path of created)await unlink(path).catch(error=>{if(error.code!=='ENOENT')throw error;});
  }
}
