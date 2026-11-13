import {test,expect} from '@playwright/test';

test('enter button launches the world without JavaScript errors',async({page})=>{
  const errors=[];
  const failures=[];
  page.on('pageerror',e=>{errors.push(e.message);console.log('OOWWWW PAGEERROR:',e.stack??e.message);});
  page.on('console',m=>{if(m.type()==='error')console.log('OOWWWW CONSOLE ERROR:',m.text());});
  page.on('requestfailed',req=>{if(req.url().includes('/game/'))failures.push(req.url()+' '+req.failure()?.errorText);});
  await page.goto('/game.html');
  const state=await page.evaluate(()=>({
    ready:document.readyState,
    titleHidden:document.querySelector('#title-screen')?.hidden,
    worldHidden:document.querySelector('#game-screen')?.hidden,
    startExists:!!document.querySelector('#start-game'),
    musicExists:!!document.querySelector('#music-audio')
  }));
  console.log('OOWWWW STARTUP STATE',JSON.stringify({state,errors,failures}));
  await page.locator('#start-game').click();
  const after=await page.evaluate(()=>({
    titleHidden:document.querySelector('#title-screen')?.hidden,
    worldHidden:document.querySelector('#game-screen')?.hidden
  }));
  console.log('OOWWWW CLICK RESULT',JSON.stringify({after,errors,failures}));
  expect(after.worldHidden,JSON.stringify({errors,failures})).toBe(false);
  expect(after.titleHidden).toBe(true);
  expect(errors).toEqual([]);
});
