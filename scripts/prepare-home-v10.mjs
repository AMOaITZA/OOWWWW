// Technical packing of two generated house images. Source art stays intact.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {basename} from 'node:path';
import {PNG} from 'pngjs';
const [exteriorSource,interiorSource]=process.argv.slice(2);
if(!exteriorSource||!interiorSource)throw new Error('Provide generated exterior and interior PNGs');
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

function boundedPalette(png,maxColors){
  const histogram=new Map();
  for(let i=0;i<png.data.length;i+=4){
    if(!png.data[i+3])continue;
    const rgb=[...png.data.subarray(i,i+3)],key=rgb.join(',');
    const entry=histogram.get(key);if(entry)entry.count++;else histogram.set(key,{rgb,count:1});
  }
  const box=entries=>{
    let weight=0;const min=[255,255,255],max=[0,0,0];
    for(const {rgb,count} of entries){weight+=count;for(let c=0;c<3;c++){min[c]=Math.min(min[c],rgb[c]);max[c]=Math.max(max[c],rgb[c]);}}
    const ranges=max.map((value,c)=>value-min[c]);
    return {entries,weight,ranges,score:Math.max(...ranges)*Math.sqrt(weight)};
  };
  const boxes=[box([...histogram.values()])];
  while(boxes.length<maxColors){
    boxes.sort((a,b)=>b.score-a.score);const selected=boxes.shift();
    if(selected.entries.length<2){boxes.push(selected);break;}
    const channel=selected.ranges.indexOf(Math.max(...selected.ranges));
    selected.entries.sort((a,b)=>a.rgb[channel]-b.rgb[channel]);
    let weight=0,split=1;
    for(let i=0;i<selected.entries.length-1;i++){weight+=selected.entries[i].count;split=i+1;if(weight>=selected.weight/2)break;}
    boxes.push(box(selected.entries.slice(0,split)),box(selected.entries.slice(split)));
  }
  const palette=boxes.map(({entries,weight})=>[0,1,2].map(c=>Math.round(entries.reduce((sum,e)=>sum+e.rgb[c]*e.count,0)/weight)));
  const remap=new Map();
  for(const {rgb} of histogram.values()){
    let best=palette[0],distance=Infinity;
    for(const color of palette){const next=color.reduce((sum,value,c)=>sum+(value-rgb[c])**2,0);if(next<distance){distance=next;best=color;}}
    remap.set(rgb.join(','),best);
  }
  for(let i=0;i<png.data.length;i+=4)if(png.data[i+3])png.data.set(remap.get([...png.data.subarray(i,i+3)].join(',')),i);
  return new Set([...remap.values()].map(rgb=>rgb.join(','))).size;
}
function pack(source,path,width,height,{transparent=false,maxColors}={}){
  const input=PNG.sync.read(fs.readFileSync(source));
  let left=0,top=0,right=input.width-1,bottom=input.height-1;
  if(transparent){
    left=input.width;top=input.height;right=-1;bottom=-1;
    for(let y=0;y<input.height;y++)for(let x=0;x<input.width;x++)if(input.data[(y*input.width+x)*4+3]>=128){
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
  }
  const output=new PNG({width,height});
  const scale=transparent?Math.min((width-4)/(right-left+1),(height-4)/(bottom-top+1)):1;
  const drawWidth=transparent?Math.round((right-left+1)*scale):width;
  const drawHeight=transparent?Math.round((bottom-top+1)*scale):height;
  const dx=Math.floor((width-drawWidth)/2),dy=Math.floor((height-drawHeight)/2);
  for(let y=0;y<drawHeight;y++)for(let x=0;x<drawWidth;x++){
    const sx=Math.min(right,left+Math.floor((x+.5)*(right-left+1)/drawWidth));
    const sy=Math.min(bottom,top+Math.floor((y+.5)*(bottom-top+1)/drawHeight));
    const from=(sy*input.width+sx)*4,to=((dy+y)*width+dx+x)*4;
    if(transparent&&input.data[from+3]<128)continue;
    output.data.set([...input.data.subarray(from,from+3),255],to);
  }
  const paletteColors=boundedPalette(output,maxColors);
  fs.mkdirSync('assets/game/home',{recursive:true});
  fs.writeFileSync(path,PNG.sync.write(output,{filterType:0,deflateLevel:9,deflateStrategy:0}));
  return {path,size:[width,height],source:basename(source),sourceSha256:sha(source),sha256:sha(path),
    sourceBounds:[left,top,right-left+1,bottom-top+1],nativeDraw:[dx,dy,drawWidth,drawHeight],paletteColors,
    alpha:transparent?'binary 0/255, generated alpha threshold 128':'opaque 255'};
}
const exterior=pack(exteriorSource,'assets/game/home/exterior.png',160,128,{transparent:true,maxColors:128});
const interior=pack(interiorSource,'assets/game/home/interior.png',480,270,{maxColors:192});
const provenance={generator:'image_gen.imagegen',packer:'scripts/prepare-home-v10.mjs',resources:[exterior,interior],
  note:'Two generated cozy cottage resources. No people or text baked into the room. Original generated sources preserved; technical nearest-neighbour grid packing, alpha normalization and median-cut palette reduction only.',
  interiorAnchors:{bed:{bounds:[44,67,92,132],pillows:[50,88,78,24],heads:[[55,91],[95,91]],blanketTop:119},
    dining:{tableTop:[191,175,79,42],chairs:[[163,175,31,62],[270,175,32,62]],characters:[[165,169],[272,169]],tableForeground:[191,183,79,36]},
    sofa:{bounds:[322,157,116,74],characters:[[350,157],[389,157]],front:[325,207,114,25]},tv:{screen:[351,79,44,31]}}};
fs.writeFileSync('docs/HOME-V10-GENERATION.json',JSON.stringify(provenance,null,2)+'\n');
console.log(JSON.stringify(provenance));
