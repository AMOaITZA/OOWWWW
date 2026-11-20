import {test,expect} from '@playwright/test';
import {existsSync} from 'node:fs';
const installed=existsSync(new URL('../../assets/game/home/videos/nuestro-video.mp4',import.meta.url))||
  existsSync(new URL('../../assets/game/home/videos/nuestro-video.webm',import.meta.url));
test('the installed personal video plays in the TV and releases media on activity change and close',async({page})=>{
  test.skip(!installed,'No personal video installed; the missing-file state is covered separately.');
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position:{x:37,y:53},outfits:{leo:{look:'boda'},itza:{look:'boda',hair:'rosa',glasses:false}},visited:[],leoVoice:{enabled:false},soundEffects:{enabled:false}}));
    window.__personalVideoFrames=0;
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
      if(this.canvas.classList.contains('home-scene')&&args[0] instanceof HTMLVideoElement)window.__personalVideoFrames++;
      return draw.apply(this,args);
    };
  });
  await page.goto('/game.html');await page.locator('#start-game').click();
  await page.locator('#world').focus();await page.keyboard.press('e');
  await page.getByRole('button',{name:'Ver la tele',exact:true}).click();
  await page.getByText('Controles de la tele',{exact:true}).click();
  const video=page.locator('.home-video-source');
  await expect(video).not.toHaveAttribute('src',/.+/);
  await page.getByRole('button',{name:'Silenciar video',exact:true}).click();
  await page.getByRole('button',{name:'Reproducir video',exact:true}).click();
  await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeGreaterThan(.3);
  await expect.poll(()=>page.evaluate(()=>window.__personalVideoFrames)).toBeGreaterThan(5);
  expect(await video.evaluate(v=>v.muted)).toBe(true);
  await page.getByRole('button',{name:'Pausar video',exact:true}).click();
  await page.getByText('Controles de la tele',{exact:true}).click();
  await page.getByRole('button',{name:'Comer juntos',exact:true}).click();
  await expect(video).not.toHaveAttribute('src',/.+/);
  await page.getByRole('button',{name:'Ver la tele',exact:true}).click();
  expect(await video.evaluate(v=>v.paused)).toBe(true);
  await page.getByText('Controles de la tele',{exact:true}).click();
  await page.getByRole('button',{name:'Reproducir video',exact:true}).click();
  await expect.poll(()=>video.evaluate(v=>v.paused)).toBe(false);
  const handle=await video.elementHandle();
  await page.locator('#close-experience').click();
  expect(await handle.evaluate(v=>v.paused&&!v.getAttribute('src'))).toBe(true);
  expect(errors).toEqual([]);
});
