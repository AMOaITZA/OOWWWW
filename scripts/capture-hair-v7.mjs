// Compare the reported bridal views against the V6 renderer without changing
// the original sprite PNGs. Start Vite first; the baseline Git ref is required.
import {chromium} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {basename,dirname,resolve} from 'node:path';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.HAIR_CAPTURE_PATH||'/workspace/work/hair-v7-bride-before-after.png';
const baseline=process.env.HAIR_BEFORE_REF||'78860a3';
const temporary=await mkdtemp(resolve('scripts/.hair-v7-baseline-'));
let browser;
try{
  for(const file of ['hair.js','hair-regions.js','hair-wedding-regions.js'])
    await writeFile(resolve(temporary,file),execFileSync('git',['show',baseline+':game/'+file]));
  browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1024,height:1450}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  // The inspection document has no game loop. Import the exact render helpers
  // into this same-origin canvas page without removing a live game's DOM.
  await page.route(base+'/__hair-inspection',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
  await page.goto(base+'/__hair-inspection');
  await page.evaluate(async({beforeUrl})=>{
    const before=await import(beforeUrl),after=await import('/game/hair.js');
    const {removeGlassesPixels}=await import('/game/glasses.js');
    const load=async url=>{const image=new Image();image.src=url;await image.decode();
      const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
      const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);return ctx.getImageData(0,0,canvas.width,canvas.height);};
    const source=await load('/assets/game/wedding/characters/itza-walk.png');
    const eyes=await load('/assets/game/appearance/eyes-without-glasses.png');
    document.body.replaceChildren();document.body.style='margin:0;padding:16px;background:#fff1dc;color:#2e1f18;font:16px monospace';
    const title=document.createElement('h2');title.textContent='Boda: mechones de frente y bajo el velo';document.body.append(title);
    for(const glasses of [true,false])for(const row of [0,2]){
      const heading=document.createElement('h3');heading.textContent=(row===0?'Frente':'Espalda')+' · '+(glasses?'con lentes':'sin lentes');document.body.append(heading);
      const group=document.createElement('div');group.style='display:flex;gap:20px';document.body.append(group);
      for(const [label,recolor,color] of [['Antes · rubio claro',before.recolorHairPixels,'rubio'],['Después · rubio claro',after.recolorHairPixels,'rubio'],['Después · rosa pastel',after.recolorHairPixels,'rosa'],['Después · café',after.recolorHairPixels,'cafe']]){
        let data=recolor(source,'walk-boda',color);
        if(!glasses)data=removeGlassesPixels({width:source.width,height:source.height,data},'walk-boda',['itza'],eyes);
        const sheet=document.createElement('canvas');sheet.width=source.width;sheet.height=source.height;
        sheet.getContext('2d').putImageData(new ImageData(data,source.width,source.height),0,0);
        const box=document.createElement('div');box.textContent=label;const canvas=document.createElement('canvas');
        canvas.width=192;canvas.height=288;canvas.style='display:block;image-rendering:pixelated';
        const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
        ctx.drawImage(sheet,0,row*48,32,48,0,0,192,288);box.append(canvas);group.append(box);
      }
    }
  },{beforeUrl:'/scripts/'+basename(temporary)+'/hair.js'});
  await mkdir(dirname(output),{recursive:true});await page.screenshot({path:output,fullPage:true});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(JSON.stringify({output,baseline,errors}));
}finally{await browser?.close();await rm(temporary,{recursive:true,force:true});}
