// Pack imagegen-produced character art into the game's existing contracts.
// This replaces the old character pixels, including every character region
// of the wedding atlas. Scenery regions and personal/classic content stay intact.
import fs from 'node:fs';
import {dirname} from 'node:path';
import crypto from 'node:crypto';
import pngjs from 'pngjs';
const {PNG}=pngjs;
const config=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const threshold=200;
const skin=[[199,135,104],[146,103,89],[211,178,160]];
const read=path=>PNG.sync.read(fs.readFileSync(path));
const hash=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const records=[];
const pngOptions={deflateLevel:9,deflateStrategy:0,filterType:0};
const previousManifestPath='docs/CHARACTERS-V3-GENERATION.json';
const previousManifest=fs.existsSync(previousManifestPath)?JSON.parse(fs.readFileSync(previousManifestPath,'utf8')):null;
const previousRecords=new Map((previousManifest?.assets||[]).map(record=>[record.key,record]));
function bbox(p,x0,y0,w,h){
 let left=x0+w,top=y0+h,right=x0,bottom=y0;
 for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)if(p.data[(y*p.width+x)*4+3]>=threshold){
  left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);
 }
 if(right<=left||bottom<=top)throw Error('Empty source cell');
 return {x:left,y:top,w:right-left,h:bottom-top};
}
function finish(out){
 const histogram=new Map();
 for(let i=0;i<out.data.length;i+=4){
  if(out.data[i+3]<threshold){out.data.fill(0,i,i+4);continue;}
  out.data[i+3]=255;
  let rgb=[...out.data.subarray(i,i+3)], [r,g,b]=rgb;
  // Cream fabric has a yellower hue than skin; do not recolour dresses/shirts.
  if(r>140&&r<250&&g>70&&b>40&&r-g>25&&g-b>12&&r-g>=1.35*(g-b))
   rgb=r<180?skin[1]:g/r>.73?skin[2]:skin[0];
  else rgb=rgb.map(v=>Math.min(255,Math.round(v/8)*8));
  out.data.set(rgb,i);const key=rgb.join(',');histogram.set(key,(histogram.get(key)||0)+1);
 }
 const protectedKeys=new Set(skin.map(c=>c.join(',')));
 const palette=[...skin,...[...histogram].sort((a,b)=>b[1]-a[1]).filter(([k])=>!protectedKeys.has(k)).map(([k])=>k.split(',').map(Number))].slice(0,128);
 const nearest=new Map();for(const key of histogram.keys()){
  const c=key.split(',').map(Number);let chosen=palette[0],distance=Infinity;
  for(const p of palette){const d=p.reduce((s,v,j)=>s+(v-c[j])**2,0);if(d<distance){chosen=p;distance=d;}}
  nearest.set(key,chosen);
 }
 for(let i=0;i<out.data.length;i+=4)if(out.data[i+3])out.data.set(nearest.get([...out.data.subarray(i,i+3)].join(',')),i);
}
function pack(key,path,cols,rows,fw,fh,maxW,maxH){
 const source=config[key];if(!source)throw Error('Missing source '+key);
 const input=read(source),boxes=[];
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const x=Math.round(col*input.width/cols),y=Math.round(row*input.height/rows);
  boxes.push(bbox(input,x,y,Math.round((col+1)*input.width/cols)-x,Math.round((row+1)*input.height/rows)-y));
 }
 const scale=Math.min(maxW/Math.max(...boxes.map(b=>b.w)),maxH/Math.max(...boxes.map(b=>b.h)));
 const out=new PNG({width:cols*fw,height:rows*fh});
 boxes.forEach((box,index)=>{
  const w=Math.round(box.w*scale),h=Math.round(box.h*scale);
  const dx=index%cols*fw+Math.floor((fw-w)/2),dy=Math.floor(index/cols)*fh+fh-1-h;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const sx=box.x+Math.min(box.w-1,Math.floor((x+.5)*box.w/w)),sy=box.y+Math.min(box.h-1,Math.floor((y+.5)*box.h/h));
   out.data.set(input.data.subarray((sy*input.width+sx)*4,(sy*input.width+sx)*4+4),((dy+y)*out.width+dx+x)*4);
  }
 });
 finish(out);const previous=previousRecords.has(key)?previousRecords.get(key).replacesSha256:fs.existsSync(path)?hash(path):null;fs.mkdirSync(dirname(path),{recursive:true});fs.writeFileSync(path,PNG.sync.write(out,pngOptions));
 records.push({key,path,size:[out.width,out.height],frames:cols*rows,source:source.split('/').at(-1),sourceSha256:hash(source),sha256:hash(path),replacesSha256:previous});
 return out;
}
pack('leo-main','assets/game/characters/leo/look-01.png',6,3,32,48,29,44);
pack('itza-main','assets/game/characters/itza/look-01.png',6,3,32,48,29,44);
const sheets={};
for(const who of ['leo','itza'])sheets[who+'-walk']=pack(who+'-wedding','assets/game/wedding/characters/'+who+'-walk.png',6,3,32,48,29,44);
for(const [key,count] of Object.entries({idle:2,vows:4,kiss:3,hug:2,celebrate:3}))
 sheets[key]=pack(key,'assets/game/wedding/characters/'+key+'.png',count,1,64,48,60,44);
sheets['wedding-bench']=read('assets/game/wedding/pair-bench-v2.png');
const regions={'itza-walk':[264,0,192,144],'leo-walk':[456,0,192,144],
 vows:[412,154,256,48],idle:[0,240,128,48],kiss:[128,240,192,48],hug:[320,240,128,48],
 'wedding-bench':[448,240,128,48],celebrate:[0,288,192,48]};
const atlasPath='assets/game/wedding/atlas.png',oldAtlasHash=previousManifest?.atlas?.replacesSha256||hash(atlasPath),atlas=read(atlasPath);
for(const [key,[x0,y0,w,h]] of Object.entries(regions)){
 const sheet=sheets[key];if(sheet.width!==w||sheet.height!==h)throw Error('Atlas contract mismatch '+key);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)atlas.data.set(sheet.data.subarray((y*w+x)*4,(y*w+x)*4+4),((y0+y)*atlas.width+x0+x)*4);
}
fs.writeFileSync(atlasPath,PNG.sync.write(atlas,pngOptions));
const anchors={};
for(const key of ['idle','vows','kiss','hug','celebrate','wedding-bench']){
 const sheet=sheets[key],feet=[],x=[];
 for(let i=0;i<sheet.width/64;i++){
  const box=bbox(sheet,i*64,0,64,48);feet.push(box.y+box.h);x.push(64-(2*(box.x-i*64)+box.w));
 }
 anchors[key]={feet,x};
}
anchors['wedding-bench-v2']=anchors['wedding-bench'];
fs.writeFileSync('game/data/character-frames.json',JSON.stringify(anchors,null,2)+'\n');
fs.writeFileSync('docs/CHARACTERS-V3-GENERATION.json',JSON.stringify({generator:'image_gen.imagegen',packer:'scripts/prepare-character-v3.mjs',reference:'pair-bench-v2',skin,assets:records,atlas:{path:atlasPath,sha256:hash(atlasPath),replacesSha256:oldAtlasHash,replacedRegions:Object.keys(regions)}},null,2)+'\n');
console.log(JSON.stringify({files:records.map(r=>r.path),anchors},null,2));
