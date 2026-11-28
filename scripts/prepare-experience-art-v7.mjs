// Technical packing of the generated four-scene atlases. Original sources
// are read only; all final banners are independent, opaque native PNGs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';

const inputs=process.argv.slice(2);
if(inputs.length!==3)throw new Error('Usage: node scripts/prepare-experience-art-v7.mjs atlas-A.png atlas-B.png atlas-C.png');
const groups=[['inicio','carta','galeria','razones'],['playlist','recuerdos','contador','lugares'],['final','armario','secreto','grabadora']];
const W=384,H=128,MAX_COLORS=192;
const sha=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
function sample(source,bounds){
  const output=new PNG({width:W,height:H});
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const sx=bounds.x+Math.min(bounds.width-1,Math.floor((x+.5)*bounds.width/W));
    const sy=bounds.y+Math.min(bounds.height-1,Math.floor((y+.5)*bounds.height/H));
    const a=(sy*source.width+sx)*4,b=(y*W+x)*4;
    source.data.copy(output.data,b,a,a+3);output.data[b+3]=255;
  }
  return output;
}
function quantize(image){
  // Weighted median cut retains dark wood, rose, sage and cream details rather
  // than replacing every rare accent with a frequent parchment background.
  const histogram=new Map();
  for(let i=0;i<image.data.length;i+=4){
    const key=(image.data[i]>>3)*1024+(image.data[i+1]>>3)*32+(image.data[i+2]>>3);
    const item=histogram.get(key)??{key,count:0,sum:[0,0,0]};
    item.count++;for(let c=0;c<3;c++)item.sum[c]+=image.data[i+c];histogram.set(key,item);
  }
  const colors=[...histogram.values()].map(item=>({...item,rgb:item.sum.map(value=>value/item.count)}));
  function box(items){
    const ranges=[0,1,2].map(c=>Math.max(...items.map(v=>v.rgb[c]))-Math.min(...items.map(v=>v.rgb[c])));
    const population=items.reduce((sum,item)=>sum+item.count,0);
    return {items,ranges,population,score:items.length>1?Math.max(...ranges)*Math.sqrt(population):0};
  }
  const boxes=[box(colors)];
  while(boxes.length<MAX_COLORS){
    let index=0;for(let i=1;i<boxes.length;i++)if(boxes[i].score>boxes[index].score)index=i;
    const current=boxes[index];if(!current.score)break;
    const channel=current.ranges.indexOf(Math.max(...current.ranges));
    const sorted=[...current.items].sort((a,b)=>a.rgb[channel]-b.rgb[channel]||a.key-b.key);
    let cumulative=0,split=1;
    for(let i=0;i<sorted.length-1;i++){cumulative+=sorted[i].count;split=i+1;if(cumulative>=current.population/2)break;}
    boxes.splice(index,1,box(sorted.slice(0,split)),box(sorted.slice(split)));
  }
  const palette=boxes.map(current=>[0,1,2].map(c=>Math.round(current.items.reduce((sum,item)=>sum+item.sum[c],0)/current.population)));
  const lookup=new Map();
  for(const color of colors){
    let closest=palette[0],distance=Infinity;
    for(const candidate of palette){const d=candidate.reduce((sum,v,c)=>sum+(v-color.rgb[c])**2,0);if(d<distance){closest=candidate;distance=d;}}
    lookup.set(color.key,closest);
  }
  for(let i=0;i<image.data.length;i+=4){
    const key=(image.data[i]>>3)*1024+(image.data[i+1]>>3)*32+(image.data[i+2]>>3);
    image.data.set(lookup.get(key),i);
  }
  return new Set(palette.map(color=>color.join(','))).size;
}
const records=[];
fs.mkdirSync('assets/game/experiences',{recursive:true});
for(const [group,sourcePath] of inputs.entries()){
  const sourceBuffer=fs.readFileSync(sourcePath),source=PNG.sync.read(sourceBuffer);
  if(Math.abs(source.width/source.height-3)>.02)throw new Error('The atlas must be a 3:1 two-by-two contact sheet: '+sourcePath);
  for(const [index,id] of groups[group].entries()){
    const col=index%2,row=Math.floor(index/2),x=Math.round(col*source.width/2),y=Math.round(row*source.height/2);
    const bounds={x,y,width:Math.round((col+1)*source.width/2)-x,height:Math.round((row+1)*source.height/2)-y};
    const output=sample(source,bounds),colors=quantize(output);
    const file='assets/game/experiences/'+id+'.png',buffer=PNG.sync.write(output,{deflateLevel:9,deflateStrategy:0,filterType:0});
    fs.writeFileSync(file,buffer);
    records.push({id,path:file,size:[W,H],opaque:true,colors,bytes:buffer.length,sha256:sha(buffer),
      source:path.basename(sourcePath),sourceSha256:sha(sourceBuffer),sourceSize:[source.width,source.height],sourceRegion:bounds});
  }
}
fs.writeFileSync('docs/EXPERIENCE-ART-V7-GENERATION.json',JSON.stringify({generator:'image_gen.imagegen',packer:'scripts/prepare-experience-art-v7.mjs',sampling:'uniform nearest-neighbor',paletteCeilingPerBanner:MAX_COLORS,assets:records},null,2)+'\n');
console.log(JSON.stringify(records.map(({id,size,colors,bytes})=>({id,size,colors,bytes}))));
