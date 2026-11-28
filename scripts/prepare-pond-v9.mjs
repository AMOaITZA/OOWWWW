// Technical packing of the generated garden pond: binary alpha, native grid,
// uniform nearest-neighbour sizing and a bounded 48-colour sprite palette.
// The generated source remains intact.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {basename} from 'node:path';
import {PNG} from 'pngjs';
const source=process.argv[2];
if(!source)throw new Error('Provide the generated pond source PNG');
const input=PNG.sync.read(fs.readFileSync(source));
let left=input.width,top=input.height,right=-1,bottom=-1;
for(let y=0;y<input.height;y++)for(let x=0;x<input.width;x++){
  if(input.data[(y*input.width+x)*4+3]<128)continue;
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
}
if(right<left)throw new Error('The generated pond is empty');
const width=144,height=96,output=new PNG({width,height});
const scale=Math.min((width-4)/(right-left+1),(height-4)/(bottom-top+1));
const drawWidth=Math.round((right-left+1)*scale),drawHeight=Math.round((bottom-top+1)*scale);
const dx=Math.floor((width-drawWidth)/2),dy=Math.floor((height-drawHeight)/2);
const histogram=new Map();
for(let y=0;y<drawHeight;y++)for(let x=0;x<drawWidth;x++){
  const sx=Math.min(right,left+Math.floor((x+.5)*(right-left+1)/drawWidth));
  const sy=Math.min(bottom,top+Math.floor((y+.5)*(bottom-top+1)/drawHeight));
  const sourceIndex=(sy*input.width+sx)*4,targetIndex=((dy+y)*width+dx+x)*4;
  if(input.data[sourceIndex+3]<128)continue;
  const rgb=[...input.data.subarray(sourceIndex,sourceIndex+3)],key=rgb.join(',');
  const entry=histogram.get(key);if(entry)entry.count++;else histogram.set(key,{rgb,count:1});
  output.data.set([...rgb,255],targetIndex);
}
const box=entries=>{
  const minimum=[255,255,255],maximum=[0,0,0];let weight=0;
  for(const entry of entries){weight+=entry.count;for(let c=0;c<3;c++){
    minimum[c]=Math.min(minimum[c],entry.rgb[c]);maximum[c]=Math.max(maximum[c],entry.rgb[c]);
  }}
  const ranges=maximum.map((value,c)=>value-minimum[c]);
  return {entries,weight,ranges,score:Math.max(...ranges)*Math.sqrt(weight)};
};
const boxes=[box([...histogram.values()])];
while(boxes.length<48){
  boxes.sort((a,b)=>b.score-a.score);const selected=boxes.shift();
  if(selected.entries.length<2){boxes.push(selected);break;}
  const channel=selected.ranges.indexOf(Math.max(...selected.ranges));
  selected.entries.sort((a,b)=>a.rgb[channel]-b.rgb[channel]);
  let accumulated=0,split=1;
  for(let i=0;i<selected.entries.length-1;i++){
    accumulated+=selected.entries[i].count;split=i+1;
    if(accumulated>=selected.weight/2)break;
  }
  boxes.push(box(selected.entries.slice(0,split)),box(selected.entries.slice(split)));
}
const palette=boxes.map(({entries,weight})=>[0,1,2].map(channel=>Math.round(
  entries.reduce((sum,entry)=>sum+entry.rgb[channel]*entry.count,0)/weight)));
for(let index=0;index<output.data.length;index+=4){
  if(!output.data[index+3])continue;
  const original=output.data.subarray(index,index+3);
  let best=palette[0],distance=Infinity;
  for(const color of palette){const next=color.reduce((sum,value,channel)=>sum+(value-original[channel])**2,0);
    if(next<distance){distance=next;best=color;}}
  output.data.set(best,index);
}
const path='assets/game/ambient/pond.png';
fs.mkdirSync('assets/game/ambient',{recursive:true});
fs.writeFileSync(path,PNG.sync.write(output,{filterType:0,deflateLevel:9,deflateStrategy:0}));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let water=0,waterLeft=width,waterTop=height,waterRight=-1,waterBottom=-1;
const colors=new Set();
for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,[r,g,b,a]=output.data.subarray(i,i+4);if(!a)continue;
  colors.add([r,g,b].join(','));
  if(b>r+8&&g>r+2){water++;waterLeft=Math.min(waterLeft,x);waterTop=Math.min(waterTop,y);waterRight=Math.max(waterRight,x);waterBottom=Math.max(waterBottom,y);}
}
const provenance={generator:'image_gen.imagegen',source:basename(source),sourceSha256:sha(source),
  packer:'scripts/prepare-pond-v9.mjs',path,size:[width,height],sha256:sha(path),
  sourceBounds:[left,top,right-left+1,bottom-top+1],nativeDraw:[dx,dy,drawWidth,drawHeight],
  paletteColors:colors.size,alpha:'binary 0/255; generated source alpha threshold 128',
  water:{criterion:'b > r + 8 && g > r + 2',pixels:water,bounds:[waterLeft,waterTop,waterRight,waterBottom]},
  note:'One generated cutout garden pond. Source unchanged. Stones, reeds, flowers and lily pads surround unobstructed cool teal water; palette is separate from the legacy ground palette.'};
fs.writeFileSync('docs/POND-V9-GENERATION.json',JSON.stringify(provenance,null,2)+'\n');
console.log(JSON.stringify(provenance));
