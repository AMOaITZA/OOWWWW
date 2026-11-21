// Technical pixel-grid packing. New fishing poses keep their generated limbs;
// the original personalized game head is composed by fishing-scene.js.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {PNG} from 'pngjs';
const [poseSource,sceneSource]=process.argv.slice(2);
if(!poseSource||!sceneSource)throw new Error('Provide transparent fishing poses and pond scenery.');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const source=PNG.sync.read(fs.readFileSync(poseSource)),cellW=source.width/4,cellH=source.height/3;
const frequency=new Map();
for(const file of ['assets/game/characters/itza/look-01.png','assets/game/characters/itza/look-02.png','assets/game/wedding/characters/itza-walk.png']){
 const p=PNG.sync.read(fs.readFileSync(file));for(let i=0;i<p.data.length;i+=4)if(p.data[i+3]>=128){
  const key=[...p.data.subarray(i,i+3)].join(',');frequency.set(key,(frequency.get(key)||0)+1);
 }
}
const palette=[...frequency].sort((a,b)=>b[1]-a[1]).slice(0,128).map(([key])=>key.split(',').map(Number));
function nearest(rgb,colors=palette){let best=colors[0],distance=Infinity;for(const color of colors){const d=color.reduce((sum,n,c)=>sum+(n-rgb[c])**2,0);if(d<distance){distance=d;best=color;}}return best;}
const poses=new PNG({width:160,height:168}),regions=[];
for(let row=0;row<3;row++)for(let column=0;column<4;column++){
 let left=Infinity,top=Infinity,right=-1,bottom=-1;
 for(let y=Math.floor(row*cellH);y<Math.floor((row+1)*cellH);y++)for(let x=Math.floor(column*cellW);x<Math.floor((column+1)*cellW);x++)if(source.data[(y*source.width+x)*4+3]>=180){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
 const width=right-left+1,height=bottom-top+1;
 regions.push({row,column,source:{x:left,y:top,width,height},native:{x:2,y:0,width:36,height:55}});
 for(let y=0;y<55;y++)for(let x=0;x<36;x++){
  const sx=left+Math.min(width-1,Math.floor((x+.5)*width/36)),sy=top+Math.min(height-1,Math.floor((y+.5)*height/55));
  const at=(sy*source.width+sx)*4,nx=x+2,ny=y,to=((row*56+ny)*poses.width+column*40+nx)*4;
  if(source.data[at+3]<180)continue;
  // Guided head/hair are omitted. Distinct raised hands remain above the neck.
  const arm=(column===3&&nx>=29&&ny>=3)||(column===2&&nx>=29&&ny>=19)||(column===1&&nx>=29&&ny>=22);
  if(ny<27&&!arm)continue;
  if(nx<12&&ny<43)continue;
  poses.data.set([...nearest([...source.data.subarray(at,at+3)]),255],to);
 }
}
function quantize(image,limit){
 const histogram=new Map();for(let i=0;i<image.data.length;i+=4){const rgb=[...image.data.subarray(i,i+3)],key=rgb.join(',');const found=histogram.get(key);if(found)found.count++;else histogram.set(key,{rgb,count:1});}
 function box(entries){const min=[255,255,255],max=[0,0,0];let weight=0;for(const e of entries){weight+=e.count;for(let c=0;c<3;c++){min[c]=Math.min(min[c],e.rgb[c]);max[c]=Math.max(max[c],e.rgb[c]);}}const ranges=max.map((n,c)=>n-min[c]);return {entries,weight,ranges,score:Math.max(...ranges)*Math.sqrt(weight)};}
 const boxes=[box([...histogram.values()])];while(boxes.length<limit){boxes.sort((a,b)=>b.score-a.score);const b=boxes.shift();if(b.entries.length<2){boxes.push(b);break;}const c=b.ranges.indexOf(Math.max(...b.ranges));b.entries.sort((a,b)=>a.rgb[c]-b.rgb[c]);let weight=0,split=1;for(let i=0;i<b.entries.length-1;i++){weight+=b.entries[i].count;split=i+1;if(weight>=b.weight/2)break;}boxes.push(box(b.entries.slice(0,split)),box(b.entries.slice(split)));}
 const map=new Map();for(const b of boxes){const rgb=[0,1,2].map(c=>Math.round(b.entries.reduce((sum,e)=>sum+e.rgb[c]*e.count,0)/b.weight));for(const e of b.entries)map.set(e.rgb.join(','),rgb);}for(let i=0;i<image.data.length;i+=4)image.data.set(map.get([...image.data.subarray(i,i+3)].join(',')),i);
}
const scenerySource=PNG.sync.read(fs.readFileSync(sceneSource)),scenery=new PNG({width:640,height:400});
for(let y=0;y<400;y++)for(let x=0;x<640;x++){
 const sx=Math.min(scenerySource.width-1,Math.floor((x+.5)*scenerySource.width/640)),sy=Math.min(scenerySource.height-1,Math.floor((y+.5)*scenerySource.height/400));
 scenery.data.set([...scenerySource.data.subarray((sy*scenerySource.width+sx)*4,(sy*scenerySource.width+sx)*4+3),255],(y*640+x)*4);
}
quantize(scenery,192);fs.mkdirSync('assets/game/fishing',{recursive:true});
fs.writeFileSync('assets/game/fishing/poses.png',PNG.sync.write(poses));fs.writeFileSync('assets/game/fishing/scene.png',PNG.sync.write(scenery));
const resources=[['poses','assets/game/fishing/poses.png',poseSource],['background','assets/game/fishing/scene.png',sceneSource]].map(([id,file,source])=>({id,path:file,sha256:hash(file),source:path.basename(source),sourceSha256:hash(source)}));
fs.writeFileSync('docs/FISHING-V14-GENERATION.json',JSON.stringify({generator:'image_gen.imagegen',packer:'scripts/prepare-fishing-v14.mjs',posesSize:[160,168],frame:[40,56],backgroundSize:[640,400],rows:['principal','alternativo','boda'],columns:['waiting','casting','reeling','caught'],note:'Generated fishing bodies and scenery. Exact game heads, hair and glasses are composed at runtime using the shared anatomical mask. Existing user plush icons remain unchanged.',resources,regions},null,2)+'\n');
console.log('Packed fishing poses and scenery.');
