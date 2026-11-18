// Technical packing only: the generated two-pose artwork stays unchanged.
// Uniform nearest-neighbour reduction, binary alpha and one shared palette.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {basename} from 'node:path';
import {PNG} from 'pngjs';
const source=process.argv[2];
if(!source)throw new Error('Provide the generated two-frame Ponyo PNG');
const input=PNG.sync.read(fs.readFileSync(source));
if(input.width%2)throw new Error('The sheet must have two equal horizontal cells');
const cell=input.width/2,bounds=[];
for(let frame=0;frame<2;frame++){
  let left=cell,top=input.height,right=-1,bottom=-1;
  for(let y=0;y<input.height;y++)for(let x=0;x<cell;x++){
    if(input.data[(y*input.width+frame*cell+x)*4+3]<128)continue;
    left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
  }
  if(right<left)throw new Error('Empty Ponyo frame '+frame);
  bounds.push({left,top,width:right-left+1,height:bottom-top+1});
}
const output=new PNG({width:64,height:32}),histogram=new Map(),draws=[];
const scale=Math.min(22/Math.max(...bounds.map(b=>b.width)),28/Math.max(...bounds.map(b=>b.height)));
for(let frame=0;frame<2;frame++){
  const box=bounds[frame],width=Math.round(box.width*scale),height=Math.round(box.height*scale);
  const left=Math.floor((32-width)/2),top=30-height;draws.push({left,top,width,height});
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const sx=frame*cell+box.left+Math.min(box.width-1,Math.floor((x+.5)*box.width/width));
    const sy=box.top+Math.min(box.height-1,Math.floor((y+.5)*box.height/height));
    const from=(sy*input.width+sx)*4,to=((top+y)*64+frame*32+left+x)*4;
    if(input.data[from+3]<128)continue;
    const rgb=[...input.data.subarray(from,from+3)],key=rgb.join(',');
    output.data.set([...rgb,255],to);
    const entry=histogram.get(key);if(entry)entry.count++;else histogram.set(key,{rgb,count:1});
  }
}
function bucket(entries){
  const low=[255,255,255],high=[0,0,0];let count=0;
  for(const entry of entries){count+=entry.count;for(let c=0;c<3;c++){
    low[c]=Math.min(low[c],entry.rgb[c]);high[c]=Math.max(high[c],entry.rgb[c]);
  }}
  const ranges=high.map((v,c)=>v-low[c]);
  return {entries,count,ranges,score:Math.max(...ranges)*Math.sqrt(count)};
}
const buckets=[bucket([...histogram.values()])];
while(buckets.length<64){
  buckets.sort((a,b)=>b.score-a.score);const selected=buckets.shift();
  if(selected.entries.length<2){buckets.push(selected);break;}
  const channel=selected.ranges.indexOf(Math.max(...selected.ranges));
  selected.entries.sort((a,b)=>a.rgb[channel]-b.rgb[channel]);
  let weight=0,split=1;
  for(let i=0;i<selected.entries.length-1;i++){
    weight+=selected.entries[i].count;split=i+1;if(weight>=selected.count/2)break;
  }
  buckets.push(bucket(selected.entries.slice(0,split)),bucket(selected.entries.slice(split)));
}
const palette=buckets.map(({entries,count})=>[0,1,2].map(c=>Math.round(entries.reduce((sum,e)=>sum+e.rgb[c]*e.count,0)/count)));
for(let index=0;index<output.data.length;index+=4){
  if(!output.data[index+3])continue;
  const original=output.data.subarray(index,index+3);let closest=palette[0],distance=Infinity;
  for(const color of palette){const next=color.reduce((sum,v,c)=>sum+(v-original[c])**2,0);
    if(next<distance){distance=next;closest=color;}}
  output.data.set(closest,index);
}
const path='assets/game/moments/ponyo.png';
fs.mkdirSync('assets/game/moments',{recursive:true});fs.writeFileSync(path,PNG.sync.write(output,{filterType:0,deflateLevel:9}));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const colors=new Set();let opaque=0;
for(let i=0;i<output.data.length;i+=4)if(output.data[i+3]){opaque++;colors.add([...output.data.subarray(i,i+3)].join(','));}
const provenance={generator:'image_gen.imagegen',source:basename(source),sourceSha256:sha(source),
  references:'Four user-supplied photos of Ponyo; existing cat-duo sprite as style reference.',
  subject:'Ponyo: dilute tortoiseshell gray kitten, muted tan forehead/chest patches, pale chin, green-gold eyes.',
  frames:['sitting, eyes open','same pose, happy blink'],sourceSize:[input.width,input.height],sourceBounds:bounds,
  path,size:[64,32],frameSize:[32,32],nativeDraw:draws,paletteColors:colors.size,opaquePixels:opaque,
  alpha:'binary 0/255; source threshold 128',sha256:sha(path),packer:'scripts/prepare-ponyo-v10.mjs',
  note:'Only technical uniform scaling, centering, alpha threshold and a shared bounded palette. The generated source is preserved unchanged.'};
fs.writeFileSync('docs/PONYO-V10-GENERATION.json',JSON.stringify(provenance,null,2)+'\n');
console.log(JSON.stringify(provenance));
