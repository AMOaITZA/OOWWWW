// Pack the two imagegen destination sprites without altering the source art.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const source=process.argv[2];
if(!source)throw Error('Pass the generated two-column PNG source');
const image=PNG.sync.read(fs.readFileSync(source)),threshold=200;
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const boxes=Array.from({length:2},(_,column)=>{
  const start=Math.round(column*image.width/2),end=Math.round((column+1)*image.width/2);
  let left=end,top=image.height,right=-1,bottom=-1;
  for(let y=0;y<image.height;y++)for(let x=start;x<end;x++)if(image.data[(y*image.width+x)*4+3]>=threshold){
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  if(right<left)throw Error('Empty generated destination cell');
  if(left<=start||right>=end-1||top<=0||bottom>=image.height-1)throw Error('Generated destination is clipped');
  return {x:left,y:top,width:right-left+1,height:bottom-top+1};
});
const scale=Math.min(144/Math.max(...boxes.map(b=>b.width)),112/Math.max(...boxes.map(b=>b.height)));
const sprites=boxes.map(box=>{
  const out=new PNG({width:160,height:128});
  const width=Math.round(box.width*scale),height=Math.round(box.height*scale),left=Math.floor((160-width)/2),top=120-height;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const sx=box.x+Math.min(box.width-1,Math.floor((x+.5)*box.width/width));
    const sy=box.y+Math.min(box.height-1,Math.floor((y+.5)*box.height/height));
    const si=(sy*image.width+sx)*4,di=((top+y)*160+left+x)*4;
    if(image.data[si+3]<threshold)continue;
    for(let c=0;c<3;c++)out.data[di+c]=Math.min(255,Math.round(image.data[si+c]/8)*8);
    out.data[di+3]=255;
  }
  return out;
});
const histogram=new Map();
for(const sprite of sprites)for(let i=0;i<sprite.data.length;i+=4)if(sprite.data[i+3]){
  const key=[...sprite.data.subarray(i,i+3)].join(',');histogram.set(key,(histogram.get(key)||0)+1);
}
const palette=[...histogram].sort((a,b)=>b[1]-a[1]).slice(0,128).map(([key])=>key.split(',').map(Number));
const lookup=new Map();
for(const key of histogram.keys()){
  const rgb=key.split(',').map(Number);let nearest=palette[0],distance=Infinity;
  for(const color of palette){const d=color.reduce((sum,value,index)=>sum+(value-rgb[index])**2,0);if(d<distance){distance=d;nearest=color;}}
  lookup.set(key,nearest);
}
const records=[];
for(const [index,id] of ['secreto','grabadora'].entries()){
  const sprite=sprites[index];for(let i=0;i<sprite.data.length;i+=4)if(sprite.data[i+3])sprite.data.set(lookup.get([...sprite.data.subarray(i,i+3)].join(',')),i);
  const file='assets/game/architecture/'+id+'.png';fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,PNG.sync.write(sprite,{deflateLevel:9,deflateStrategy:0,filterType:0}));
  records.push({path:file,size:[160,128],sha256:hash(file),sourceCell:index,baseRow:119});
}
fs.writeFileSync('docs/DESTINATIONS-V6-GENERATION.json',JSON.stringify({generator:'image_gen.imagegen',source:path.basename(source),sourceSha256:hash(source),packer:'scripts/prepare-destinations-v6.mjs',alphaThreshold:threshold,sharedPaletteLimit:128,assets:records},null,2)+'\n');
console.log(JSON.stringify(records));
