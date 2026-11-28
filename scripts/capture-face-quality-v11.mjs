// Real runtime composition: personalized walking heads + generated seated bodies.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-magic-v11';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[];
try{
  const page=await browser.newPage({viewport:{width:1190,height:1000}});
  page.on('pageerror',error=>errors.push(error.message));
  await page.route(base+'/__face-quality-v11',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="es"><meta charset="utf-8"><body></body></html>'}));
  await page.goto(base+'/__face-quality-v11');
  for(const who of ['itza','leo']){
    const count=await page.evaluate(async who=>{
      const assets=await import('/game/assets.js'),poses=await import('/game/home-poses.js');
      await assets.prepareWorldAssets();
      document.body.replaceChildren();document.body.style='margin:0;padding:20px;background:#fff1dc;color:#3b2924;font:14px monospace';
      const title=document.createElement('h1');title.textContent=who==='itza'?'Itza · cabello, lentes y cuerpos sentados':'Leo · lentes y cuerpos sentados';document.body.append(title);
      const description=document.createElement('p');description.textContent='Composición real: tres conjuntos, comer de lado / tele de espaldas, dos fotogramas y lentes activados/desactivados.';document.body.append(description);
      const colors=who==='itza'?['negro','cafe','rosa','rubio']:['negro'];let count=0;
      for(const look of ['principal','alternativo','boda'])for(const pose of ['eat','tv'])for(const frame of [0,1]){
        const heading=document.createElement('h2');heading.textContent=look+' · '+(pose==='eat'?'comer':'tele')+' · cuadro '+frame;heading.style='font-size:16px;margin:16px 0 7px';document.body.append(heading);
        const row=document.createElement('div');row.style='display:flex;gap:10px';document.body.append(row);
        for(const color of colors)for(const glasses of [true,false]){
          const outfits={itza:{look,hair:color,glasses},leo:{look,glasses}};
          const box=document.createElement('figure');box.style='margin:0;width:130px;text-align:center;background:#efd8b6;padding:4px;border:1px solid #b39872';
          const canvas=document.createElement('canvas');canvas.width=32;canvas.height=48;canvas.style='display:block;margin:auto;width:96px;height:144px;image-rendering:pixelated';
          const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
          poses.drawHomeActor(ctx,{who,pose,frame,x:0,y:0,outfits,
            getCharacterImage:url=>assets.outfitImage(url,outfits),getRawImage:assets.assetImage,getPoseImage:assets.assetImage});
          const caption=document.createElement('figcaption');caption.textContent=color+' · '+(glasses?'lentes':'sin lentes');caption.style='font-size:12px;line-height:1.4';
          box.append(canvas,caption);row.append(box);count++;
        }
      }
      return count;
    },who);
    await page.screenshot({path:output+'/'+who+'-all-personalized-seated-v11.png',fullPage:true});
    console.log(JSON.stringify({who,cells:count}));
  }
}finally{await browser.close();}
await writeFile(output+'/face-quality-v11-errors.json',JSON.stringify({errors},null,2)+'\n');
if(errors.length)throw new Error(errors.join('\n'));
