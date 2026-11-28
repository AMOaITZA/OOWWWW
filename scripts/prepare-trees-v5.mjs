// Pack generated tree art at the native world scale; source image stays intact.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {PNG} from 'pngjs';
const source=process.argv[2];
if(!source)throw new Error('Pass the generated four-column source PNG');
const src=PNG.sync.read(fs.readFileSync(source));
const names=['cerezo','jacaranda','roble','abedul'];
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const opaque=(i)=>{
  const [r,g,b,a]=src.data.subarray(i,i+4);
  // Remove saturated fringe pixels from the generated transparent perimeter.
  return a>=200&&!(r>180&&g<80&&(b<100||b>150));
};
const images=names.map((name,col)=>{
  const left=Math.round(col*src.width/4),right=Math.round((col+1)*src.width/4);
  let minX=right,minY=src.height,maxX=-1,maxY=-1;
  for(let y=0;y<src.height;y++)for(let x=left;x<right;x++)if(opaque((y*src.width+x)*4)){
    minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  }
  if(maxX<minX)throw new Error('Empty generated tree '+name);
  const w=maxX-minX+1,h=maxY-minY+1,scale=Math.min(60/w,99/h);
  const width=Math.round(w*scale),height=Math.round(h*scale),dx=Math.floor((64-width)/2),dy=111-height;
  const out=new PNG({width:64,height:112});
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const sx=minX+Math.min(w-1,Math.floor((x+.5)*w/width));
    const sy=minY+Math.min(h-1,Math.floor((y+.5)*h/height));
    const i=(sy*src.width+sx)*4,d=((dy+y)*64+dx+x)*4;
    if(!opaque(i))continue;
    out.data.set(src.data.subarray(i,i+3),d);out.data[d+3]=255;
  }
  return {name,out,sourceBounds:[minX,minY,w,h]};
});
// Weighted median-cut provides one economical palette shared by all species.
const hist=new Map();
for(const {out} of images)for(let i=0;i<out.data.length;i+=4)if(out.data[i+3]){
  const color=[...out.data.subarray(i,i+3)].map(v=>Math.min(255,Math.round(v/8)*8));
  const key=color.join(',');hist.set(key,(hist.get(key)||0)+1);
}
const points=[...hist].map(([key,count])=>({rgb:key.split(',').map(Number),count}));
const ranges=box=>[0,1,2].map(channel=>Math.max(...box.map(p=>p.rgb[channel]))-Math.min(...box.map(p=>p.rgb[channel])));
const boxes=[points];
while(boxes.length<48){
  let target=-1,best=-1,channel=0;
  for(let i=0;i<boxes.length;i++)if(boxes[i].length>1){
    const span=ranges(boxes[i]),largest=Math.max(...span),score=largest*Math.sqrt(boxes[i].reduce((sum,p)=>sum+p.count,0));
    if(score>best){target=i;best=score;channel=span.indexOf(largest);}
  }
  if(target<0)break;
  const box=boxes.splice(target,1)[0].sort((a,b)=>a.rgb[channel]-b.rgb[channel]);
  const total=box.reduce((sum,p)=>sum+p.count,0);let used=0,split=1;
  for(let i=0;i<box.length-1;i++){used+=box[i].count;if(used>=total/2){split=i+1;break;}}
  boxes.push(box.slice(0,split),box.slice(split));
}
const palette=boxes.map(box=>{
  const total=box.reduce((sum,p)=>sum+p.count,0);
  return [0,1,2].map(c=>Math.round(box.reduce((sum,p)=>sum+p.rgb[c]*p.count,0)/total));
});
const nearest=new Map();
for(const {out} of images)for(let i=0;i<out.data.length;i+=4)if(out.data[i+3]){
  const rgb=[...out.data.subarray(i,i+3)],key=rgb.join(',');
  if(!nearest.has(key)){
    let best=palette[0],distance=Infinity;
    for(const p of palette){const d=p.reduce((sum,v,c)=>sum+(v-rgb[c])**2,0);if(d<distance){best=p;distance=d;}}
    nearest.set(key,best);
  }
  out.data.set(nearest.get(key),i);
}
fs.mkdirSync('assets/game/trees',{recursive:true});fs.mkdirSync('docs',{recursive:true});
const records=images.map(({name,out,sourceBounds})=>{
  const file='assets/game/trees/'+name+'.png';
  fs.writeFileSync(file,PNG.sync.write(out,{deflateLevel:9,deflateStrategy:0,filterType:0}));
  return {path:file,size:[64,112],sourceBounds,sha256:hash(file)};
});
fs.writeFileSync('docs/TREES-V5-GENERATION.json',JSON.stringify({generator:'image_gen.imagegen',source:path.basename(source),sourceSha256:hash(source),packer:'scripts/prepare-trees-v5.mjs',paletteLimit:48,alphaThreshold:200,assets:records},null,2)+'\n');
console.log(JSON.stringify(records.map(({path,size})=>({path,size}))));
