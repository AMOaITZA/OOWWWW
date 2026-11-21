// Reproducible QA contact sheets using the same pure pixel renderers as the
// wardrobe/world. PNG sheets are only packed for inspection; source art stays intact.
import fs from 'node:fs/promises';
import {PNG} from 'pngjs';
import {chromium} from '@playwright/test';
import {recolorHairPixels} from '../game/hair.js';
import {removeGlassesPixels} from '../game/glasses.js';
const output=process.env.APPEARANCE_CAPTURE_PATH||'docs/qa-v8';
await fs.mkdir(output,{recursive:true});
const read=async path=>PNG.sync.read(await fs.readFile(path));
const patches=await read('assets/game/appearance/eyes-without-glasses.png');
const colors=['negro','cafe','rosa','rubio'];
const looks=['principal','alternativo','boda'];
const paths=who=>['assets/game/characters/'+who+'/look-01.png','assets/game/characters/'+who+'/look-02.png','assets/game/wedding/characters/'+who+'-walk.png'];
function imageRow(source,variants,cellWidth=32){
  const cells=variants.flatMap(({data,rows=[0]})=>rows.flatMap(row=>Array.from({length:source.width/cellWidth},(_,frame)=>({data,row,frame}))));
  const packed=new PNG({width:cells.length*cellWidth,height:48});
  for(const [cell,{data,row,frame}] of cells.entries())for(let y=0;y<48;y++)for(let x=0;x<cellWidth;x++){
    const from=((row*48+y)*source.width+frame*cellWidth+x)*4;
    packed.data.set(data.subarray(from,from+4),(y*packed.width+cell*cellWidth+x)*4);
  }
  return 'data:image/png;base64,'+PNG.sync.write(packed).toString('base64');
}
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{
  const page=await browser.newPage({viewport:{width:1780,height:900}});
  const capture=async(name,title,note,rows)=>{
    await page.setContent('<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:22px;background:#fff1dc;color:#332119;font:16px monospace}h1{font-size:25px}h3{margin:16px 0 5px}img{display:block;image-rendering:pixelated;background:#ead0a7}section{break-inside:avoid}</style><h1>'+title+'</h1><p>'+note+'</p>'+rows.map(({title,src,scale=3})=>'<section><h3>'+title+'</h3><img src="'+src+'" style="zoom:'+scale+'"></section>').join(''));
    await page.screenshot({path:output+'/'+name,fullPage:true});
  };
  for(const glasses of [true,false]){
    const rows=[];
    for(const [look,path] of paths('itza').entries()){
      const source=await read(path),profile='walk-'+looks[look];
      for(const color of colors){let data=recolorHairPixels(source,profile,color);if(!glasses)data=removeGlassesPixels({...source,data},profile,['itza'],patches);
        rows.push({title:looks[look]+' · '+color,src:imageRow(source,[{data,rows:[0,1,2]}])});}
    }
    await capture('itza-all-animation-frames-'+(glasses?'glasses':'no-glasses')+'.png','Itza · animaciones completas · '+(glasses?'con lentes':'sin lentes'),'Cada fila: frente 1–6 | lado 1–6 | espalda 1–6. Tres conjuntos y cuatro colores.',rows);
  }
  const seats=[];
  for(const look of looks){const source=await read('assets/game/moments/seated/itza-'+look+'.png'),profile='seat-'+look;
    for(const color of colors){const data=recolorHairPixels(source,profile,color),off=removeGlassesPixels({...source,data},profile,['itza'],patches);
      seats.push({title:look+' · '+color+' · con lentes (2) / sin lentes (2)',src:imageRow(source,[{data},{data:off}]),scale:4});}}
  await capture('itza-all-seated-frames.png','Itza · todas las animaciones sentada','La misma apariencia se conserva al caminar y sentarse.',seats);
  const pairRows=[];
  for(const [look,path] of paths('leo').entries()){const source=await read(path),profile='walk-'+looks[look];
    pairRows.push({title:'Leo · '+looks[look]+' · con lentes F/L/E (18) / sin lentes F/L/E (18)',src:imageRow(source,[{data:source.data,rows:[0,1,2]},{data:removeGlassesPixels(source,profile,['leo'],patches),rows:[0,1,2]}]),scale:1.5});}
  for(const profile of ['idle','vows','kiss','hug','celebrate','wedding-bench-v2']){
    const source=await read(profile==='wedding-bench-v2'?'assets/game/wedding/pair-bench-v2.png':'assets/game/wedding/characters/'+profile+'.png');
    const data=recolorHairPixels(source,profile,'rubio');
    pairRows.push({title:profile+' · ambos con lentes / ambos sin lentes',src:imageRow(source,[{data},{data:removeGlassesPixels({...source,data},profile,['leo','itza'],patches)}],64),scale:3});}
  await capture('leo-and-ceremony-frames.png','Leo y ceremonia · revisión de todos los cuadros','Leo: tres atuendos, seis cuadros por dirección. Ceremonia: todas las poses; pelo rubio de Itza.',pairRows);
  console.log(JSON.stringify({output,files:4,walkingCells:432,seatedCells:48,sourceArtChanged:false}));
}finally{await browser.close();}
