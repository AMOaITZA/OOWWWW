// Real home-scene screenshots; no repainting or substituted furniture.
import{chromium,expect}from'@playwright/test';
import{mkdir,writeFile}from'node:fs/promises';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173',output=process.env.ART_CAPTURE_DIR||'docs/qa-sofa-v12';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],failed=[];
try{
 for(const[device,width,height,mobile]of[['desktop',1440,1000,false],['phone',390,844,true]])for(const look of ['principal','alternativo','boda']){
  const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
  page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)failed.push(response.url());});
  await page.addInitScript(look=>localStorage.setItem('oowwww-game-v1',JSON.stringify({position:{x:37,y:53},direction:'down',
   outfits:{leo:{look,glasses:false},itza:{look,hair:look==='alternativo'?'rosa':look==='boda'?'negro':'rubio',glasses:false}},leoVoice:{enabled:false},dayNight:{mode:'day'}})),look);
  await page.goto(base+'/game.html');await page.locator('#start-game').click();await page.locator('#world').focus();await page.keyboard.press('e');
  await page.getByRole('button',{name:'Ver la tele',exact:true}).click();await expect(page.locator('.home-scene')).toHaveAttribute('data-activity','tv');
  await page.locator('#experience-content').evaluate(body=>{body.scrollTop=0;});
  await page.screenshot({path:output+'/'+device+'-'+look+'.png'});
  if(!mobile){
   const clip=await page.locator('.home-scene').evaluate(canvas=>{const r=canvas.getBoundingClientRect();return{x:r.left+320/480*r.width,y:r.top+148/270*r.height,width:125/480*r.width,height:85/270*r.height};});
   await page.screenshot({path:output+'/sofa-detail-'+look+'.png',clip});
  }
  await page.close();
 }
}finally{await browser.close();}
await writeFile(output+'/result.json',JSON.stringify({errors,failed},null,2)+'\n');
if(errors.length||failed.length)throw new Error(JSON.stringify({errors,failed}));
console.log('Six native home scenes and three actual sofa details captured.');
