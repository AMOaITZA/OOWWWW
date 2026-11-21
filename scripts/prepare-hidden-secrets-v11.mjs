// Technical atlas packing only: source art is preserved. Three generated cells
// become native pixel-grid cutouts with a shared, bounded chest palette.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {basename} from 'node:path';
import {PNG} from 'pngjs';
const source=process.argv[2];
if(!source)throw new Error('Provide the generated transparent three-item atlas');
const input=PNG.sync.read(fs.readFileSync(source)),cellWidth=Math.floor(input.width/3);
const hash=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const boxes=[];
for(let cell=0;cell<3;cell++){
  let left=(cell+1)*cellWidth,top=input.height,right=-1,bottom=-1;
  for(let y=0;y<input.height;y++)for(let x=cell*cellWidth;x<(cell+1)*cellWidth;x++){
    if(input.data[(y*input.width+x)*4+3]<128)continue;
    left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
  }
  if(right<left)throw new Error('Empty generated cell '+cell);
  boxes.push({x:left,y:top,width:right-left+1,height:bottom-top+1});
}
function quantize(image,limit){
  const histogram=new Map();
  for(let i=0;i<image.data.length;i+=4)if(image.data[i+3]){
    const rgb=[...image.data.subarray(i,i+3)],key=rgb.join(','),found=histogram.get(key);
    if(found)found.count++;else histogram.set(key,{rgb,count:1});
  }
  function box(entries){
    const min=[255,255,255],max=[0,0,0];let weight=0;
    for(const entry of entries){weight+=entry.count;for(let c=0;c<3;c++){
      min[c]=Math.min(min[c],entry.rgb[c]);max[c]=Math.max(max[c],entry.rgb[c]);}}
    const ranges=max.map((n,c)=>n-min[c]);return {entries,weight,ranges,score:Math.max(...ranges)*Math.sqrt(weight)};
  }
  const colors=[box([...histogram.values()])];
  while(colors.length<limit){
    colors.sort((a,b)=>b.score-a.score);const selected=colors.shift();
    if(selected.entries.length<2){colors.push(selected);break;}
    const channel=selected.ranges.indexOf(Math.max(...selected.ranges));
    selected.entries.sort((a,b)=>a.rgb[channel]-b.rgb[channel]);let weight=0,split=1;
    for(let i=0;i<selected.entries.length-1;i++){weight+=selected.entries[i].count;split=i+1;if(weight>=selected.weight/2)break;}
    colors.push(box(selected.entries.slice(0,split)),box(selected.entries.slice(split)));
  }
  const palette=colors.map(({entries,weight})=>[0,1,2].map(c=>Math.round(entries.reduce((sum,e)=>sum+e.rgb[c]*e.count,0)/weight)));
  for(let i=0;i<image.data.length;i+=4)if(image.data[i+3]){
    let best=palette[0],distance=Infinity;
    for(const rgb of palette){const next=rgb.reduce((sum,n,c)=>sum+(n-image.data[i+c])**2,0);if(next<distance){distance=next;best=rgb;}}
    image.data.set(best,i);
  }
  return new Set(palette.map(rgb=>rgb.join(','))).size;
}
function sample(output,box,frame,scale){
  const width=Math.round(box.width*scale),height=Math.round(box.height*scale);
  const left=frame*32+Math.floor((32-width)/2),top=31-height;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const sx=box.x+Math.min(box.width-1,Math.floor((x+.5)*box.width/width));
    const sy=box.y+Math.min(box.height-1,Math.floor((y+.5)*box.height/height));
    const from=(sy*input.width+sx)*4,to=((top+y)*output.width+left+x)*4;
    if(input.data[from+3]>=128)output.data.set([...input.data.subarray(from,from+3),255],to);
  }
  return {x:left,y:top,width,height};
}
const chest=new PNG({width:64,height:32}),note=new PNG({width:32,height:32});
const scale=Math.min(28/Math.max(boxes[0].width,boxes[1].width),29/Math.max(boxes[0].height,boxes[1].height));
const chestDraws=[sample(chest,boxes[0],0,scale),sample(chest,boxes[1],1,scale)];
const noteDraw=sample(note,boxes[2],0,Math.min(21/boxes[2].width,20/boxes[2].height));
const chestColors=quantize(chest,64),noteColors=quantize(note,48);
fs.mkdirSync('assets/game/secrets',{recursive:true});
const resources=[['chest',chest,chestColors,chestDraws],['note',note,noteColors,[noteDraw]]].map(([id,png,paletteColors,draws])=>{
  const path='assets/game/secrets/'+id+'.png';fs.writeFileSync(path,PNG.sync.write(png));
  return {id,path,size:[png.width,png.height],frame:[32,32],paletteColors,draws,sha256:hash(path)};
});
const provenance={generator:'image_gen.imagegen',source:basename(source),sourceSha256:hash(source),
  originalSource:'exec-1daffab6-3c03-49c6-877d-1c2bb41f3723.png',
  note:'Generated closed chest, matching open chest and sealed letter. A second image_gen background-removal edit created true empty alpha; technical packing keeps original artwork and normalizes alpha to 0/255.',
  packer:'scripts/prepare-hidden-secrets-v11.mjs',sourceSize:[input.width,input.height],sourceRegions:boxes,resources};
fs.writeFileSync('docs/HIDDEN-SECRETS-V11-GENERATION.json',JSON.stringify(provenance,null,2)+'\n');
console.log(JSON.stringify(provenance));
