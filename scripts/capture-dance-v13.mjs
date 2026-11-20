// Actual runtime compositor, not an artist's mock-up. Start Vite first.
import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const base=process.env.ART_CAPTURE_URL||'http://127.0.0.1:5173';
const output=process.env.ART_CAPTURE_DIR||'docs/qa-dance-v13';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route(base+'/__dance-v13',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
  await page.goto(base+'/__dance-v13');
  const data=await page.evaluate(async()=>{
    const assets=await import('/game/assets.js'),dance=await import('/game/dance.js');
    await assets.prepareWorldAssets();
    const canvas=document.createElement('canvas');canvas.width=960;canvas.height=672;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#FCEDD7';ctx.fillRect(0,0,960,672);
    const cases=[['principal','rosa',false],['alternativo','rubio',false],['boda','cafe',false],
      ['principal','negro',true],['alternativo','rosa',true],['boda','rubio',true]];
    const hashes=[],ready=[];
    for(let row=0;row<cases.length;row++){
      const [look,hair,glasses]=cases[row],outfits={leo:{look,glasses},itza:{look,hair,glasses}};
      await assets.prepareOutfit(outfits);
      for(let frame=0;frame<8;frame++){
        ctx.fillStyle=row%2?'#F0DFC8':'#E7D2BB';ctx.fillRect(frame*120,row*112+20,120,92);
        ctx.fillStyle='#5C483B';ctx.font='8px monospace';ctx.fillText(look+' '+hair,frame*120+3,row*112+9);
        ctx.fillText('frame '+frame+' '+(glasses?'con':'sin'),frame*120+3,row*112+18);
        const result=dance.drawDancingPair(ctx,{x:frame*120+60,y:row*112+99,time:(frame+.5)*.3,outfits,
          getCharacterImage:url=>assets.outfitImage(url,outfits),getRawImage:assets.assetImage,getDanceImage:assets.assetImage});
        ready.push(result.ready);hashes.push(canvas.toDataURL().length);
      }
    }
    const enlarged=document.createElement('canvas');enlarged.width=1920;enlarged.height=1344;
    enlarged.getContext('2d').imageSmoothingEnabled=false;enlarged.getContext('2d').drawImage(canvas,0,0,1920,1344);
    document.body.style='margin:0;background:#fcf1dd';document.body.append(enlarged);
    const frames=[];
    for(let index=0;index<16;index++){
      const small=document.createElement('canvas');small.width=120;small.height=84;
      const sc=small.getContext('2d');sc.imageSmoothingEnabled=false;sc.fillStyle='#94B77B';sc.fillRect(0,0,120,84);
      const outfits={leo:{look:'boda',glasses:false},itza:{look:'boda',hair:'rosa',glasses:false}};
      dance.drawDancingPair(sc,{x:60,y:70,time:(index+.5)*.3,outfits,getCharacterImage:url=>assets.outfitImage(url,outfits),getRawImage:assets.assetImage,getDanceImage:assets.assetImage});
      frames.push(small.toDataURL());
    }
    return {ready,frames,matrix:enlarged.toDataURL()};
  });
  expect(data.ready.every(Boolean)).toBe(true);expect(errors).toEqual([]);
  await fs.writeFile(output+'/dance-poses.png',Buffer.from(data.matrix.split(',')[1],'base64'));
  const frameDir='/workspace/work/dance-v13-frames';await fs.mkdir(frameDir,{recursive:true});
  for(let i=0;i<data.frames.length;i++)await fs.writeFile(frameDir+'/'+String(i).padStart(2,'0')+'.png',Buffer.from(data.frames[i].split(',')[1],'base64'));
  execFileSync(process.env.ART_FFMPEG_PATH||'/usr/bin/ffmpeg',['-y','-loglevel','error','-framerate','10/3','-i',frameDir+'/%02d.png','-vf','scale=480:336:flags=neighbor,split[a][b];[a]palettegen=reserve_transparent=0[p];[b][p]paletteuse=dither=none','-loop','0',output+'/partner-dance.gif']);
  await fs.writeFile(output+'/result.json',JSON.stringify({composedCases:data.ready.length,ready:data.ready.every(Boolean),errors,frames:16,note:'Actual personalized dance compositor, both partners take a turn over two loops. Eight generated limb silhouettes per costume; no walking frames are used as bodies.'},null,2)+'\n');
}finally{await browser.close();}
