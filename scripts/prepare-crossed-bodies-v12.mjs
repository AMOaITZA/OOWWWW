// Technical atlas packing: the generated back-view poses are sampled at 32×48,
// their generated heads/hair removed, and colors snapped to the seated palette.
// Personalized heads and hair are composed by game/home-poses.js at runtime.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
const source=process.argv[2]||'/workspace/generated_images/exec-2fe5a5aa-1057-45ef-b811-46912878e340.png';
const bytes=await readFile(source),image=PNG.sync.read(bytes);
if(image.width!==1024||image.height!==1536)throw new Error('Expected a 1024×1536 source');
const old=PNG.sync.read(await readFile('assets/game/home/seated-bodies.png'));
const colors=new Map();for(let i=0;i<old.data.length;i+=4)if(old.data[i+3])colors.set([...old.data.subarray(i,i+3)].join(','),[...old.data.subarray(i,i+3)]);
const palette=[...colors.values()];
const nearest=(r,g,b)=>{let best=palette[0],distance=Infinity;for(const color of palette){const d=(r-color[0])**2+(g-color[1])**2+(b-color[2])**2;if(d<distance){best=color;distance=d;}}return best;};
const target=new PNG({width:64,height:288}),full=new PNG({width:64,height:288}),regions=[];
const rowBounds=[[10,255],[265,510],[520,767],[780,1014],[1022,1254],[1270,1520]];
for(let row=0;row<6;row++)for(let column=0;column<2;column++){
 let left=Infinity,top=Infinity,right=-1,bottom=-1;
 const[y0,y1]=rowBounds[row],x0=column?600:185,x1=column?840:410;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(image.data[(y*image.width+x)*4+3]>=200){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
 const width=right-left+1,height=bottom-top+1;
 regions.push({row,column,source:{x:left,y:top,width,height},native:{x:1,y:2,width:30,height:44}});
 for(let y=0;y<44;y++)for(let x=0;x<30;x++){
  const sx=left+Math.min(width-1,Math.floor((x+.5)*width/30)),sy=top+Math.min(height-1,Math.floor((y+.5)*height/44));
  const at=(sy*image.width+sx)*4,nx=x+1,ny=y+2,to=((row*48+ny)*target.width+column*32+nx)*4;
  if(image.data[at+3]<200)continue;
  const rgb=nearest(...image.data.subarray(at,at+3));full.data.set([...rgb,255],to);
  if(ny<24||(row>=3&&ny<36))continue;
  target.data.set([...rgb,255],to);
 }
}
const path='assets/game/home/seated-crossed.png',output=PNG.sync.write(target);await writeFile(path,output);
await writeFile('/workspace/work/crossed-v12-full-reference.png',PNG.sync.write(full));
await writeFile('docs/SOFA-V12-GENERATION.json',JSON.stringify({generator:'image_gen.imagegen',source,sourceSha256:createHash('sha256').update(bytes).digest('hex'),path,size:[64,288],cell:[32,48],columns:['cross-legged hands on knees','cross-legged relaxed arms'],rows:['leo-principal','leo-alternativo','leo-boda','itza-principal','itza-alternativo','itza-boda'],notes:'Generated seated backs, visibly folded knees. Generated heads/hair are removed; actual personalized walking heads/hair are composed at runtime. Palette reused from the original seated-body atlas. Front-facing dinner poses remain in their original resource.',sha256:createHash('sha256').update(output).digest('hex'),regions},null,2)+'\n');
console.log(path);
