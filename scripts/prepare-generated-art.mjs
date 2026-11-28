// Production packing of imagegen sources: per-cell crop, uniform nearest-neighbour
// resampling, binary alpha, reference skin palette and bounded shared palettes.
// Originals are never overwritten. Input paths are passed explicitly.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {dirname} from 'node:path';
import pngjs from 'pngjs';
const {PNG}=pngjs;
const skin=[[199,135,104],[146,103,89],[211,178,160]];
const read=p=>PNG.sync.read(fs.readFileSync(p));
function bounds(p,left,top,width,height){
 let x0=left+width,y0=top+height,x1=left,y1=top;
 for(let y=top;y<top+height;y++)for(let x=left;x<left+width;x++)if(p.data[(y*p.width+x)*4+3]>=160){x0=Math.min(x0,x);x1=Math.max(x1,x+1);y0=Math.min(y0,y);y1=Math.max(y1,y+1);}
 if(x1<=x0||y1<=y0)throw Error('Empty generated frame');return {x:x0,y:y0,w:x1-x0,h:y1-y0};
}
function quantize(out,max,skinRemap=false){
 const histogram=new Map();
 for(let i=0;i<out.data.length;i+=4){
  if(out.data[i+3]<160){out.data.fill(0,i,i+4);continue;}out.data[i+3]=255;
  let rgb=[...out.data.subarray(i,i+3)];const [r,g,b]=rgb;
  if(skinRemap&&r-g>25&&g-b>12&&g>70&&b>40&&r>140&&r<250){
   rgb=(r+g+b)/3>190?skin[2]:r<180?skin[1]:skin[0];
  }else rgb=rgb.map(v=>Math.min(255,Math.round(v/8)*8));
  out.data.set(rgb,i);const key=rgb.join(',');histogram.set(key,(histogram.get(key)||0)+1);
 }
 const protectedColors=skinRemap?skin:[];
 const palette=[...protectedColors,...[...histogram].sort((a,b)=>b[1]-a[1]).map(([s])=>s.split(',').map(Number)).filter(c=>!protectedColors.some(p=>p.every((v,i)=>v===c[i])))].slice(0,max);
 const nearest=new Map();for(const key of histogram.keys()){
  const c=key.split(',').map(Number);let best=palette[0],dist=Infinity;
  for(const p of palette){const d=p.reduce((s,v,i)=>s+(v-c[i])**2,0);if(d<dist){best=p;dist=d;}}nearest.set(key,best);
 }
 for(let i=0;i<out.data.length;i+=4)if(out.data[i+3])out.data.set(nearest.get([...out.data.subarray(i,i+3)].join(',')),i);
}
function copySample(src,dest,box,dx,dy,w,h){
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const sx=box.x+Math.min(box.w-1,Math.floor((x+.5)*box.w/w));
  const sy=box.y+Math.min(box.h-1,Math.floor((y+.5)*box.h/h));
  const from=(sy*src.width+sx)*4,to=((dy+y)*dest.width+dx+x)*4;
  dest.data.set(src.data.subarray(from,from+4),to);
 }
}
function sheet(source,dest,cols,rows,fw,fh,maxWidth,maxHeight,remap=true){
 const src=read(source),out=new PNG({width:cols*fw,height:rows*fh}),boxes=[];
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const l=Math.round(col*src.width/cols),t=Math.round(row*src.height/rows);
  boxes.push(bounds(src,l,t,Math.round((col+1)*src.width/cols)-l,Math.round((row+1)*src.height/rows)-t));
 }
 const scale=Math.min(maxWidth/Math.max(...boxes.map(b=>b.w)),maxHeight/Math.max(...boxes.map(b=>b.h)));
 boxes.forEach((b,i)=>{const w=Math.round(b.w*scale),h=Math.round(b.h*scale),x=i%cols*fw+Math.floor((fw-w)/2),y=Math.floor(i/cols)*fh+fh-1-h;copySample(src,out,b,x,y,w,h);});
 quantize(out,128,remap);fs.writeFileSync(dest,PNG.sync.write(out));return {source,sourceSha:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),dest,size:[out.width,out.height],scale,boxes};
}
const [bg,leo,itza,castle,seated,arch,weddingSeated]=process.argv.slice(2);if(!seated)throw Error('Expected five generated source paths');
const log=[];
log.push(sheet(leo,'assets/game/characters/leo/look-02.png',6,3,32,48,29,44));
log.push(sheet(itza,'assets/game/characters/itza/look-02.png',6,3,32,48,29,44));
log.push(sheet(seated,'assets/game/moments/pair-bench-sit-v2.png',2,1,80,64,76,59));
const cs=read(castle),cb=bounds(cs,0,0,cs.width,cs.height),co=new PNG({width:336,height:224});
const scale=Math.min(312/cb.w,204/cb.h),cw=Math.round(cb.w*scale),ch=Math.round(cb.h*scale);
copySample(cs,co,cb,Math.floor((336-cw)/2),224-10-ch,cw,ch);quantize(co,128);fs.writeFileSync('assets/game/wedding/castle-v2.png',PNG.sync.write(co));log.push({source:castle,dest:'assets/game/wedding/castle-v2.png',box:cb,scale,size:[336,224]});
const bs=read(bg),bo=new PNG({width:480,height:270});copySample(bs,bo,{x:0,y:0,w:bs.width,h:bs.height},0,0,480,270);quantize(bo,192);fs.writeFileSync('assets/game/wedding/cinematic-background.png',PNG.sync.write(bo));log.push({source:bg,dest:'assets/game/wedding/cinematic-background.png',size:[480,270]});
console.log(log.map(x=>({dest:x.dest,size:x.size,scale:x.scale})));

if(arch){
 const a=read(arch),box=bounds(a,0,0,a.width,a.height),out=new PNG({width:80,height:96});
 const scale=Math.min(72/box.w,88/box.h),w=Math.round(box.w*scale),h=Math.round(box.h*scale);
 copySample(a,out,box,Math.floor((80-w)/2),96-4-h,w,h);quantize(out,96);
 fs.writeFileSync('assets/game/wedding/arch-v2.png',PNG.sync.write(out));
 log.push({source:arch,dest:'assets/game/wedding/arch-v2.png',box,size:[80,96],scale});
 console.log('Packed clean floral arch 80x96');
}

if(weddingSeated)log.push(sheet(weddingSeated,'assets/game/wedding/pair-bench-v2.png',2,1,64,48,60,44));

const logPath=process.env.ART_BUILD_LOG||'work/generated-art-build.json';
fs.mkdirSync(dirname(logPath),{recursive:true});
fs.writeFileSync(logPath,JSON.stringify(log,null,2));
