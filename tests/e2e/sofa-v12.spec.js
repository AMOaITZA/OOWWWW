import {test,expect} from '@playwright/test';

for(const look of ['principal','alternativo','boda'])test(`TV keeps both crossed legs visible on the sofa in ${look}`,async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(look=>{
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position:{x:37,y:53},direction:'down',
      outfits:{leo:{look,glasses:false},itza:{look,hair:'rubio',glasses:false}},leoVoice:{enabled:false},dayNight:{mode:'day'}}));
    window.__tvBodies=[];const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
      if(this.canvas.classList.contains('home-scene')&&args[0]?.dataset?.homePose==='tv'){
        const source=args[0],pixels=source.getContext('2d').getImageData(0,0,32,48);
        window.__tvBodies.push({who:source.dataset.homeCharacter,x:args[1],y:args[2],data:[...pixels.data]});
      }
      return draw.apply(this,args);
    };
  },look);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/game.html');await page.locator('#start-game').click();await page.locator('#world').focus();await page.keyboard.press('e');
  await page.getByRole('button',{name:'Ver la tele',exact:true}).click();
  const samples=await page.locator('.home-scene').evaluate(canvas=>{
    const painted=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    return window.__tvBodies.slice(-2).map(actor=>{
      let opaque=0,visible=0;
      for(let y=39;y<46;y++)for(let x=0;x<32;x++){
        const from=(y*32+x)*4;if(!actor.data[from+3])continue;opaque++;
        const to=((actor.y+y)*canvas.width+actor.x+x)*4;
        if(actor.data.slice(from,from+4).every((value,i)=>painted[to+i]===value))visible++;
      }
      return {who:actor.who,opaque,visible};
    });
  });
  expect(samples.map(sample=>sample.who)).toEqual(['leo','itza']);
  for(const sample of samples){expect(sample.opaque).toBeGreaterThan(50);expect(sample.visible).toBe(sample.opaque);}
  expect(errors).toEqual([]);
});
