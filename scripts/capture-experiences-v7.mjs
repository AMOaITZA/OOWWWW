// Start Vite first. Every capture opens a real destination through the world.
import {chromium} from '@playwright/test';
import {mkdir,readFile} from 'node:fs/promises';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-experiences-v7';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const places=JSON.parse(await readFile(new URL('../game/data/places.json',import.meta.url),'utf8'));
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],captures=[];
try{
  for(const mobile of [false,true])for(const place of places){
    const page=await browser.newPage({viewport:mobile?{width:375,height:812}:{width:1440,height:1000},
      isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
    page.on('pageerror',error=>errors.push(place.id+': '+error.message));
    await page.addInitScript(position=>{
      Math.random=()=>.15;
      localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',visited:[],
        outfits:{leo:{look:'principal'},itza:{look:'principal',hair:'negro'}},
        leoVoice:{enabled:false},dayNight:{mode:'day',cycleStartedAt:Date.now()}}));
    },{x:place.arrival[0],y:place.arrival[1]});
    await page.goto(base+'/game.html');await page.locator('#start-game').click();
    await page.locator('#world').focus();await page.keyboard.press('e');
    await page.locator('.experience-panel').waitFor({state:'visible'});
    await page.locator('.experience-hero-art').evaluate(image=>image.decode());
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('#experience-content').evaluate(async body=>{
      const bounds=body.getBoundingClientRect();
      await Promise.all([...body.querySelectorAll('img')].filter(image=>{
        const r=image.getBoundingClientRect();return !image.hidden&&r.bottom>bounds.top&&r.top<bounds.bottom;
      }).map(image=>image.decode().catch(()=>{})));
    });
    const path=`${output}/${place.id}-${mobile?'mobile':'desktop'}.png`;
    await page.locator('.experience-panel').screenshot({path});captures.push(path);
    await page.close();
  }
}finally{await browser.close();}
console.log(JSON.stringify({output,captures:captures.length,errors}));if(errors.length)process.exitCode=1;
