// Technical packing only: generated sprites are sampled at native size,
// cropped to their seated bodies and stored with binary alpha.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';

const source=process.argv[2]||'/workspace/generated_images/exec-ad07c2a4-c410-4b0f-92b5-49304ddcc09c.png';
const bytes=await readFile(source),image=PNG.sync.read(bytes);
if(image.width!==1024||image.height!==1536)throw new Error('Expected the 4 × 6 generated atlas');
const packed=new PNG({width:128,height:288}),full=new PNG({width:128,height:288});
const regions=[];
for(let row=0;row<6;row++)for(let column=0;column<4;column++){
  let left=256,top=256,right=-1,bottom=-1;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(image.data[((row*256+y)*image.width+column*256+x)*4+3]>=128){
    left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
  }
  const width=right-left+1,height=bottom-top+1,scale=Math.min(30/width,44/height);
  const w=Math.round(width*scale),h=Math.round(height*scale),dx=Math.round((32-w)/2),dy=46-h;
  regions.push({row,column,source:{x:column*256+left,y:row*256+top,width,height},native:{x:dx,y:dy,width:w,height:h}});
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const sx=column*256+left+Math.min(width-1,Math.floor((x+.5)*width/w));
    const sy=row*256+top+Math.min(height-1,Math.floor((y+.5)*height/h));
    const from=(sy*image.width+sx)*4,nx=dx+x,ny=dy+y;
    if(image.data[from+3]<128)continue;
    const to=((row*48+ny)*packed.width+column*32+nx)*4;
    full.data.set([...image.data.subarray(from,from+3),255],to);
    if(ny<22)continue;
    // Personalized heads/hair come from the existing character renderer.
    // Remove generated long hair instead of leaving black strands behind.
    if(row>=3&&((column>=2&&ny<36)||(column<2&&nx<=13&&ny<38)))continue;
    packed.data.set([...image.data.subarray(from,from+3),255],to);
  }
}
const histogram=new Map();
for(let i=0;i<packed.data.length;i+=4)if(packed.data[i+3]){
  const rgb=[...packed.data.subarray(i,i+3)],key=rgb.join(',');
  const value=histogram.get(key)||{rgb,count:0};value.count++;histogram.set(key,value);
}
let buckets=[[...histogram.values()]];
while(buckets.length<125){
  let best=-1,spread=-1,axis=0;
  for(let b=0;b<buckets.length;b++)if(buckets[b].length>1)for(let channel=0;channel<3;channel++){
    const values=buckets[b].map(item=>item.rgb[channel]),range=Math.max(...values)-Math.min(...values);
    if(range>spread){best=b;spread=range;axis=channel;}
  }
  if(best<0)break;
  const colors=buckets.splice(best,1)[0].sort((a,b)=>a.rgb[axis]-b.rgb[axis]);
  const total=colors.reduce((sum,item)=>sum+item.count,0);let acc=0,index=1;
  for(;index<colors.length;index++){acc+=colors[index-1].count;if(acc>=total/2)break;}
  buckets.push(colors.slice(0,index),colors.slice(index));
}
const palette=[[199,135,104],[146,103,89],[211,178,160],...buckets.map(bucket=>{
  const total=bucket.reduce((sum,item)=>sum+item.count,0);
  return [0,1,2].map(channel=>Math.round(bucket.reduce((sum,item)=>sum+item.rgb[channel]*item.count,0)/total));
})];
for(let i=0;i<packed.data.length;i+=4)if(packed.data[i+3]){
  let best=palette[0],distance=Infinity;
  for(const color of palette){const d=color.reduce((sum,value,channel)=>sum+(value-packed.data[i+channel])**2,0);if(d<distance){best=color;distance=d;}}
  packed.data.set(best,i);
}
const destination='assets/game/home/seated-bodies.png';await mkdir('assets/game/home',{recursive:true});
const output=PNG.sync.write(packed);await writeFile(destination,output);
await writeFile('/workspace/work/home-bodies-v11-full-reference.png',PNG.sync.write(full));
await writeFile('docs/HOME-BODIES-V11-GENERATION.json',JSON.stringify({
  generator:'image_gen.imagegen',source,sourceSha256:createHash('sha256').update(bytes).digest('hex'),
  path:destination,size:[128,288],cell:[32,48],columns:['side idle','side eating','back idle','back relaxed'],
  rows:['leo-principal','leo-alternativo','leo-boda','itza-principal','itza-alternativo','itza-boda'],
  notes:'Only generated seated bodies are packed. Personalized heads and long hair are composed at runtime from the existing walking renderer. No facial patch is baked into this resource.',
  sha256:createHash('sha256').update(output).digest('hex'),regions
},null,2)+'\n');
console.log(JSON.stringify({destination,size:[128,288],colors:new Set(Array.from({length:packed.width*packed.height},(_,n)=>packed.data[n*4+3]?[...packed.data.subarray(n*4,n*4+3)].join(','):null).filter(Boolean)).size}));
