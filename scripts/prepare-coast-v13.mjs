// Technical pixel-grid packing of generated artwork, with bounded palettes.
// Source compositions and drawings are not changed.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const sources=process.argv.slice(2);
if(sources.length!==3)throw new Error('Provide coastal ground, transparent harbor and ocean viewpoint source PNGs.');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function quantize(image,limit){
  const histogram=new Map();
  for(let i=0;i<image.data.length;i+=4)if(image.data[i+3]){
    const rgb=[...image.data.subarray(i,i+3)],key=rgb.join(',');
    const entry=histogram.get(key);if(entry)entry.count++;else histogram.set(key,{rgb,count:1});
  }
  function box(entries){
    const min=[255,255,255],max=[0,0,0];let weight=0;
    for(const e of entries){weight+=e.count;for(let c=0;c<3;c++){min[c]=Math.min(min[c],e.rgb[c]);max[c]=Math.max(max[c],e.rgb[c]);}}
    const ranges=max.map((v,c)=>v-min[c]);return {entries,weight,ranges,score:Math.max(...ranges)*Math.sqrt(weight)};
  }
  const boxes=[box([...histogram.values()])];
  while(boxes.length<limit){
    boxes.sort((a,b)=>b.score-a.score);const chosen=boxes.shift();
    if(chosen.entries.length<2){boxes.push(chosen);break;}
    const channel=chosen.ranges.indexOf(Math.max(...chosen.ranges));
    chosen.entries.sort((a,b)=>a.rgb[channel]-b.rgb[channel]);let weight=0,split=1;
    for(let i=0;i<chosen.entries.length-1;i++){weight+=chosen.entries[i].count;split=i+1;if(weight>=chosen.weight/2)break;}
    boxes.push(box(chosen.entries.slice(0,split)),box(chosen.entries.slice(split)));
  }
  const mapping=new Map();
  for(const b of boxes){
    const mean=[0,1,2].map(c=>Math.round(b.entries.reduce((sum,e)=>sum+e.rgb[c]*e.count,0)/b.weight));
    for(const e of b.entries)mapping.set(e.rgb.join(','),mean);
  }
  for(let i=0;i<image.data.length;i+=4)if(image.data[i+3])image.data.set(mapping.get([...image.data.subarray(i,i+3)].join(',')),i);
  return new Set([...mapping.values()].map(rgb=>rgb.join(','))).size;
}
fs.mkdirSync('assets/game/coast',{recursive:true});
const resources=sources.map((source,index)=>{
  const input=PNG.sync.read(fs.readFileSync(source));
  const id=['ground','harbor','view'][index],width=[1920,256,640][index],height=[512,256,400][index];
  const output=new PNG({width,height});
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const sx=Math.min(input.width-1,Math.floor((x+.5)*input.width/width));
    const sy=Math.min(input.height-1,Math.floor((y+.5)*input.height/height));
    const from=(sy*input.width+sx)*4,to=(y*width+x)*4;
    if(index!==1||input.data[from+3]>=128)output.data.set([...input.data.subarray(from,from+3),255],to);
  }
  const paletteColors=quantize(output,index===1?128:192),destination='assets/game/coast/'+id+'.png';
  fs.writeFileSync(destination,PNG.sync.write(output));
  return {id,path:destination,size:[width,height],paletteColors,sha256:sha(destination),
    source:path.basename(source),sourceSize:[input.width,input.height],sourceSha256:sha(source)};
});
const provenance={generator:'image_gen.imagegen',packer:'scripts/prepare-coast-v13.mjs',
  notes:'Generated coastal extension and transparent terminal/pier/boat; ocean viewpoint edited with image_gen from the existing lakeside scene. Nearest-neighbor sampling, alpha normalization and median-cut palette only. Characters are composed at runtime.',resources};
fs.writeFileSync('docs/COAST-V13-GENERATION.json',JSON.stringify(provenance,null,2)+'\n');
console.log(JSON.stringify(provenance,null,2));
