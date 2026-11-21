import {chromium} from 'playwright-core';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const out=new URL('../docs/qa-cooking-v15',import.meta.url).pathname;await fs.mkdir(out,{recursive:true});
for(const [name,width,height]of [['desktop',1440,900],['phone',390,844],['landscape',844,390]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('oowwww-game-v1',JSON.stringify({position:{x:37,y:53},direction:'down',visited:[],outfits:{leo:{look:'alternativo',glasses:false},itza:{look:'boda',hair:'rosa',glasses:false}},leoVoice:{enabled:false},soundEffects:{enabled:false}})));
 await page.goto('http://127.0.0.1:5173/game.html');await page.locator('#start-game').click();await page.locator('#world').focus();await page.keyboard.press('e');await page.getByText('Más en casa',{exact:true}).click();await page.getByRole('button',{name:'Cocinar juntos',exact:true}).click();
 await page.locator('[data-cooking-choose=panqueques]').click();await page.screenshot({path:out+'/'+name+'-prepare.png'});
 for(const ingredient of ['harina','leche','fresas'])await page.locator(`[data-cooking-ingredient=${ingredient}]`).click();await page.screenshot({path:out+'/'+name+'-mix.png'});
 if(name==='desktop'){const png=await page.locator('.cooking-scene').evaluate(c=>c.toDataURL().split(',')[1]);await fs.writeFile(out+'/native-mix.png',Buffer.from(png,'base64'));}
 for(let i=0;i<4;i++)await page.locator('[data-cooking-action=stir]').click();for(let i=0;i<3;i++)await page.locator('[data-cooking-action=cook]').click();await page.locator('[data-cooking-action=serve]').click();await page.screenshot({path:out+'/'+name+'-served.png'});
 const boxes=await page.locator('.cooking-actions button,.cooking-back-home,.cooking-book>summary').evaluateAll(els=>els.map(e=>({label:e.textContent,box:JSON.parse(JSON.stringify(e.getBoundingClientRect()))})));console.log(JSON.stringify({name,errors,boxes}));await context.close();
}
await browser.close();
