// Original, authored pixel UI illustrations. These are new SVG game graphics,
// rendered at 64×64 with no external art or edits to existing images.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {chromium} from '@playwright/test';
import {PNG} from 'pngjs';
const output='assets/game/fishing';fs.mkdirSync(output,{recursive:true});
const ink='#30252d',white='#fff0dc';
const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const poly=(points,c)=>`<polygon points="${points}" fill="${c}"/>`;
function body(base,shade,light){
  return poly('10,21 22,21 22,23 25,23 25,26 27,26 27,30 24,30 24,31 8,31 8,30 5,30 5,26 7,26 7,23 10,23',ink)+
    rect(9,22,14,8,base)+rect(11,24,10,5,light)+rect(8,24,3,5,shade)+rect(21,24,3,5,shade)+
    rect(6,27,8,3,base)+rect(18,27,8,3,base)+rect(7,27,5,1,light)+rect(19,27,5,1,light)+
    rect(13,28,1,2,shade)+rect(18,28,1,2,shade);
}
function face(base,shade,light){
  return poly('8,9 24,9 24,10 26,10 26,13 27,13 27,20 25,20 25,23 7,23 7,21 5,21 5,13 6,13 6,10 8,10',ink)+
    poly('8,10 24,10 24,12 25,12 25,20 23,20 23,22 9,22 9,20 7,20 7,13 8,13',base)+
    rect(8,13,2,6,shade)+rect(23,13,2,7,shade)+rect(10,10,8,1,light);
}
function eye(x,y,iris='#6c93a1',dark=false){
  return rect(x,y,4,4,ink)+(dark?rect(x+2,y+1,1,1,white):
    rect(x+1,y,2,3,white)+rect(x+2,y+1,1,2,iris)+rect(x+2,y+1,1,1,ink));
}
function bow(color,shade){return rect(11,22,3,2,ink)+rect(18,22,3,2,ink)+rect(14,23,4,1,ink)+
  rect(11,22,3,1,color)+rect(18,22,3,1,color)+rect(15,22,2,2,shade);}
function bear(golden=false){
  const base=golden?'#d4a64e':'#a97450',shade=golden?'#a77639':'#805238',light=golden?'#f2d48d':'#d3a376';
  return body(base,shade,light)+rect(5,7,6,6,ink)+rect(22,7,6,6,ink)+
    rect(6,8,4,4,base)+rect(23,8,4,4,base)+rect(7,9,2,2,light)+rect(24,9,2,2,light)+
    face(base,shade,light)+rect(10,3,12,6,ink)+rect(11,4,10,4,'#3f3540')+
    rect(11,7,10,1,shade)+rect(8,8,16,2,ink)+
    rect(9,12,5,1,ink)+rect(18,12,5,1,ink)+eye(10,14,'#6f98ad',golden)+eye(18,14,'#6f98ad',golden)+
    poly('11,17 21,17 21,18 23,18 23,21 21,21 21,22 11,22 11,21 9,21 9,19 11,19',light)+
    rect(14,17,4,2,ink)+rect(15,19,2,1,shade)+rect(13,20,6,1,ink)+
    rect(10,19,1,1,shade)+rect(21,19,1,1,shade)+bow('#443542','#2c222a');
}
function bonnie(){
  const base='#9a83b0',shade='#715c90',light='#cbb8d4';
  return body(base,shade,light)+poly('8,2 10,2 10,1 13,1 13,9 12,11 7,11 7,4 8,4',ink)+
    poly('20,1 23,1 23,2 25,2 25,5 24,5 24,11 19,11 19,3 20,3',ink)+
    rect(9,3,3,7,base)+rect(20,2,3,8,base)+rect(10,4,1,5,'#dba8c2')+rect(21,3,1,6,'#dba8c2')+
    face(base,shade,light)+rect(10,12,4,1,shade)+rect(19,12,4,1,shade)+
    eye(10,14,'#a45c89')+eye(19,14,'#a45c89')+
    poly('11,18 22,18 22,21 20,21 20,22 12,22 12,21 10,21 10,19 11,19',light)+
    rect(14,18,4,2,'#715179')+rect(15,20,2,1,shade)+rect(13,21,6,1,ink)+
    rect(15,21,2,1,white)+bow('#c36978','#9c435e');
}
function chica(){
  const base='#e7c665',shade='#c59b47',light='#f8e5a1',orange='#df9350';
  return body(base,shade,light)+poly('12,8 12,3 14,3 14,5 16,5 16,2 18,2 18,5 21,5 21,8',ink)+
    rect(13,4,1,4,base)+rect(16,3,1,5,light)+rect(18,6,2,3,base)+
    face(base,shade,light)+rect(9,12,5,1,'#8e6239')+rect(18,12,5,1,'#8e6239')+
    eye(10,14,'#906c99')+eye(19,14,'#906c99')+
    poly('12,17 21,17 21,18 23,18 23,20 21,20 21,22 11,22 11,20 10,20 10,18 12,18',ink)+
    rect(12,18,9,2,orange)+rect(13,20,7,1,'#b66c3d')+rect(13,18,6,1,'#f5b671')+
    poly('10,22 22,22 21,25 21,28 11,28 11,25',white)+
    rect(14,24,2,1,'#c47d92')+rect(17,24,2,1,'#c47d92')+rect(15,25,3,1,'#c47d92')+rect(16,26,1,1,'#c47d92')+
    rect(7,28,6,2,orange)+rect(19,28,6,2,orange)+rect(8,28,3,1,'#f5b671')+rect(20,28,3,1,'#f5b671');
}
function foxy(){
  const base='#c97c63',shade='#9f544b',light='#f2ca9a';
  return poly('6,24 4,24 4,23 2,23 2,26 3,26 3,29 8,29 8,26',ink)+rect(3,24,3,3,light)+
    body(base,shade,light)+poly('5,4 7,4 7,5 10,5 12,11 6,13 4,8 4,5',ink)+
    poly('22,10 24,5 27,4 29,4 29,9 27,13',ink)+
    poly('6,6 8,7 10,11 6,11',base)+poly('24,10 26,6 28,6 27,11',base)+
    rect(6,7,2,3,'#e3a09a')+rect(26,7,1,3,'#e3a09a')+
    face(base,shade,light)+rect(5,15,3,4,base)+rect(25,15,3,4,base)+
    rect(7,11,8,1,ink)+rect(9,12,6,5,ink)+rect(10,12,3,1,'#57414d')+
    rect(8,10,2,1,ink)+rect(21,12,3,1,shade)+eye(19,14,'#d2b66a')+
    poly('11,18 20,18 20,17 23,17 23,18 25,18 25,21 22,21 22,22 12,22 12,21 10,21 10,19 11,19',light)+
    rect(17,17,5,2,ink)+rect(15,20,7,1,ink)+rect(18,20,2,1,white)+rect(11,19,1,1,shade)+
    rect(11,23,3,1,'#dfb598')+rect(18,23,3,1,'#dfb598');
}
const designs=[['freddy',bear()],['bonnie',bonnie()],['chica',chica()],['foxy',foxy()],['golden-freddy',bear(true)]];
const browser=await chromium.launch({executablePath:process.env.ART_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const records=[];
try{
  const page=await browser.newPage({viewport:{width:64,height:64},deviceScaleFactor:1});
  for(const [id,art] of designs){
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="64" height="64" shape-rendering="crispEdges">${art}</svg>`;
    const svgPath=output+'/'+id+'.svg',pngPath=output+'/'+id+'.png';fs.writeFileSync(svgPath,svg+'\n');
    await page.setContent('<!doctype html><style>html,body{margin:0;width:64px;height:64px;background:transparent;overflow:hidden}svg{display:block}</style>'+svg);
    await page.screenshot({path:pngPath,omitBackground:true});
    const png=PNG.sync.read(fs.readFileSync(pngPath)),colors=new Set();let opaque=0;
    for(let i=0;i<png.data.length;i+=4){const a=png.data[i+3];if(a!==0&&a!==255)throw new Error('Intermediate alpha: '+id);if(a){opaque++;colors.add([...png.data.subarray(i,i+3)].join(','));}}
    const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    records.push({id,path:pngPath,svg:svgPath,size:[64,64],paletteColors:colors.size,opaquePixels:opaque,sha256:sha(pngPath)});
  }
}finally{await browser.close();}
const provenance={generator:'authored SVG pixel game icon',source:'Original SVG geometry in scripts/prepare-plushes-v10.mjs',
  note:'New, friendly pixel UI interpretations of the five named FNAF plush collectibles. No downloaded art and no edited existing image. Image-generation attempts were rejected by automatic output moderation, so the final icons are honestly attributed to authored SVG game graphics.',
  renderer:'Chromium screenshot of authored SVG at native64×64, transparent background, crispEdges',
  packer:'scripts/prepare-plushes-v10.mjs',assets:records};
fs.writeFileSync('docs/PLUSHES-V10-GENERATION.json',JSON.stringify(provenance,null,2)+'\n');
console.log(JSON.stringify(provenance));
