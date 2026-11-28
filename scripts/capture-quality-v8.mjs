// Captures real game UI, then catalogs the wardrobe's actual rendered previews.
// Start Vite first. ART_CAPTURE_DIR can point to a temporary baseline folder.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-v8';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],views=[],previews=[];
const sizes=[['desktop',1440,900,false],['phone',390,844,true],['small-phone',320,568,true],['phone-landscape',844,390,true],['tablet',1024,768,true]];
async function enter(page,position={x:30,y:25}){
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(position=>{
    Math.random=()=>.15;
    localStorage.setItem('oowwww-game-v1',JSON.stringify({position,direction:'down',visited:[],
      outfits:{itza:{look:'principal',hair:'rubio',glasses:false},leo:{look:'principal'}},
      leoVoice:{enabled:false},dayNight:{mode:'day',cycleStartedAt:Date.now()}}));
  },position);
  await page.goto(base+'/game.html');await page.locator('#start-game').click();await page.evaluate(()=>document.fonts.ready);
  await page.locator('#world').waitFor({state:'visible'});
}
try{
  for(const [name,width,height,mobile] of sizes){
    const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
    await enter(page);
    const metrics=await page.locator('#world').evaluate(canvas=>{
      const r=canvas.getBoundingClientRect();return {source:[canvas.width,canvas.height],bounds:{x:r.x,y:r.y,width:r.width,height:r.height},
        viewport:[innerWidth,innerHeight],overflow:[document.documentElement.scrollWidth-innerWidth,document.documentElement.scrollHeight-innerHeight]};
    });
    const path=output+'/'+name+'-world.png';await page.screenshot({path});views.push({name,path,metrics});
    if(name==='phone'){
      await page.locator('#day-night-night').click();await page.locator('#world').evaluate(async()=>{await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
      await page.screenshot({path:output+'/phone-night.png'});
    }
    await page.locator('#help-button').click();await page.locator('.experience-panel').waitFor({state:'visible'});
    await page.screenshot({path:output+'/'+name+'-experience.png'});await page.close();
  }
  for(const [name,width,height] of [['phone',390,844],['phone-landscape',844,390]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    await page.addInitScript(()=>{
      const original=CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage=function(...args){
        const image=args[0],profile=image?.dataset?.hairProfile||image?.dataset?.appearanceProfile||'';
        if(this.canvas.id==='world'&&(profile.startsWith('seat-')||image?.src?.includes('/moments/seated/')))window.__v8SeatedDrawn=true;
        return original.apply(this,args);
      };
    });
    await enter(page,{x:24,y:33});await page.locator('#world').focus();await page.keyboard.press('e');
    await page.waitForFunction(()=>window.__v8SeatedDrawn===true);
    await page.screenshot({path:output+'/'+name+'-speech.png'});await page.close();
  }
  const wardrobe=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await enter(wardrobe,{x:14,y:42});await wardrobe.locator('#world').focus();await wardrobe.keyboard.press('e');
  await wardrobe.locator('.wardrobe-preview').waitFor({state:'visible'});
  for(const [look,label] of [['principal','Conjunto original'],['alternativo','Segundo conjunto'],['boda','Vestido de novia']]){
    await wardrobe.getByRole('group',{name:'Conjuntos completos',exact:true}).getByRole('button',{name:label,exact:true}).click();
    for(const direction of ['Frente','Lado','Espalda']){
      await wardrobe.getByRole('button',{name:direction,exact:true}).click();
      for(const color of ['Negro','Café','Rosa pastel','Rubio claro']){
        await wardrobe.getByRole('group',{name:'Color de cabello de Itza',exact:true}).getByRole('button',{name:color,exact:true}).click();
        for(const glasses of ['Con lentes','Sin lentes']){
          await wardrobe.getByRole('group',{name:'Lentes de Itza',exact:true}).getByRole('button',{name:glasses,exact:true}).click();
          const image=await wardrobe.locator('.wardrobe-preview').evaluate(canvas=>canvas.toDataURL());
          previews.push({look,direction,color,glasses,image});
        }
      }
    }
  }
  await wardrobe.screenshot({path:output+'/wardrobe-desktop.png'});await wardrobe.close();
  const catalog=await browser.newPage({viewport:{width:1580,height:1100}});
  await catalog.route(base+'/__v8-preview-catalog',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="es"><head><meta charset="UTF-8"><title>Itza · revisión V8</title></head><body></body></html>'}));
  await catalog.goto(base+'/__v8-preview-catalog');
  await catalog.evaluate(async previews=>{
    document.body.style='margin:0;padding:20px;background:#fff1dc;color:#2e1f18;font:14px monospace';
    const heading=document.createElement('h1');heading.textContent='Itza · tres conjuntos, cuatro colores, con y sin lentes';document.body.append(heading);
    const subtitle=document.createElement('p');subtitle.textContent='Vistas del probador real. Ocho columnas: negro, café, rosa pastel y rubio claro; con lentes / sin lentes.';document.body.append(subtitle);
    for(let row=0;row<previews.length;row+=8){
      const title=document.createElement('h2');title.textContent=previews[row].look+' · '+previews[row].direction;title.style='font-size:16px;margin:18px 0 6px';document.body.append(title);
      const group=document.createElement('div');group.style='display:grid;grid-template-columns:repeat(8,1fr);gap:8px';document.body.append(group);
      for(const preview of previews.slice(row,row+8)){
        const figure=document.createElement('figure');figure.style='margin:0;padding:6px;background:#edd3ad;border:1px solid #ac8a61';
        const image=new Image();image.src=preview.image;image.style='width:100%;height:auto;image-rendering:pixelated;display:block';
        const label=document.createElement('figcaption');label.textContent=preview.color+' · '+preview.glasses;label.style='font-size:12px;text-align:center;padding-top:6px';
        figure.append(image,label);group.append(figure);await image.decode();
      }
    }
  },previews);
  await catalog.screenshot({path:output+'/itza-all-looks-colors-glasses.png',fullPage:true});await catalog.close();
}finally{await browser.close();}
await writeFile(output+'/metrics.json',JSON.stringify({views,previewCount:previews.length,errors},null,2)+'\n');
console.log(JSON.stringify({output,views:views.length,previewCount:previews.length,errors}));if(errors.length)process.exitCode=1;
