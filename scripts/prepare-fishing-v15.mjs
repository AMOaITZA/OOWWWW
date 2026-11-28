// Repair the technical extraction of the existing generated fishing artwork.
// Keep complete shoulder/elbow/hand contours, and reject fragments belonging
// to sprites that crossed a source-cell boundary. No game faces are redrawn.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {PNG} from 'pngjs';
const sourcePath=process.argv[2];
if(!sourcePath)throw new Error('Provide the original generated fishing pose sheet.');
const source=PNG.sync.read(fs.readFileSync(sourcePath));
const previous=JSON.parse(fs.readFileSync('docs/FISHING-V14-GENERATION.json','utf8'));
const frequency=new Map();
for(const file of ['assets/game/characters/itza/look-01.png','assets/game/characters/itza/look-02.png','assets/game/wedding/characters/itza-walk.png']){
  const png=PNG.sync.read(fs.readFileSync(file));
  for(let i=0;i<png.data.length;i+=4)if(png.data[i+3]>=128){const key=[...png.data.subarray(i,i+3)].join(',');frequency.set(key,(frequency.get(key)||0)+1);}
}
const palette=[...frequency].sort((a,b)=>b[1]-a[1]).slice(0,128).map(([color])=>color.split(',').map(Number));
function nearest(rgb){let best=palette[0],distance=Infinity;for(const color of palette){const d=color.reduce((sum,n,c)=>sum+(n-rgb[c])**2,0);if(d<distance){distance=d;best=color;}}return best;}
function mainComponent(rect){
  const seen=new Set(),components=[];
  for(let y=rect.y;y<rect.y+rect.height;y++)for(let x=rect.x;x<rect.x+rect.width;x++){
    const key=y*source.width+x;if(seen.has(key)||source.data[key*4+3]<180)continue;
    const queue=[key],points=[];seen.add(key);
    while(queue.length){
      const at=queue.pop();points.push(at);const ax=at%source.width,ay=Math.floor(at/source.width);
      for(const [nx,ny] of [[ax-1,ay],[ax+1,ay],[ax,ay-1],[ax,ay+1]]){
        if(nx<rect.x||nx>=rect.x+rect.width||ny<rect.y||ny>=rect.y+rect.height)continue;
        const next=ny*source.width+nx;
        if(seen.has(next)||source.data[next*4+3]<180)continue;
        seen.add(next);queue.push(next);
      }
    }
    components.push(points);
  }
  components.sort((a,b)=>b.length-a.length);return new Set(components[0]);
}
function bodyPixel(row,column,x,y){
  if(y>=42)return true;
  // Casual legs begin above row42 and stride left of the shoulder. Keeping
  // that narrow shoulder mask through the knees used to sever the left leg.
  if(row<2&&y>=33)return true;
  if(y>=22&&x>=14)return true;
  if(column===0)return x>=15&&y>=22&&y<=31;
  if(column===1)return x>=16&&y>=19&&y<=30;
  if(column===2)return x>=22&&y>=12&&y<=28;
  if(y<3||y>28)return false;
  // Follow the raised forearm down to the elbow and shoulder. A vertical
  // x>=29 cut left the hand floating, even though the source arm was whole.
  const edge=y<=8?31:y<=11?29:y<=14?28:y<=17?27:25;
  return x>=edge;
}
const poses=new PNG({width:160,height:168});
for(const {row,column,source:rect} of previous.regions){
  const connected=mainComponent(rect);
  for(let y=0;y<55;y++)for(let x=0;x<36;x++){
    const sx=rect.x+Math.min(rect.width-1,Math.floor((x+.5)*rect.width/36));
    const sy=rect.y+Math.min(rect.height-1,Math.floor((y+.5)*rect.height/55));
    const at=sy*source.width+sx,nx=x+2;
    if(!connected.has(at)||!bodyPixel(row,column,nx,y))continue;
    poses.data.set([...nearest([...source.data.subarray(at*4,at*4+3)]),255],((row*56+y)*poses.width+column*40+nx)*4);
  }
  // The anatomical crop can detach the tip of the original generated hair.
  // Retain the complete body component after cropping as well as before it.
  const seen=new Set(),components=[];
  for(let y=0;y<56;y++)for(let x=0;x<40;x++){
    const key=y*40+x,alpha=poses.data[((row*56+y)*poses.width+column*40+x)*4+3];
    if(!alpha||seen.has(key))continue;
    const queue=[[x,y]],points=[];seen.add(key);
    while(queue.length){
      const [ax,ay]=queue.pop();points.push(ay*40+ax);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=ax+dx,ny=ay+dy,next=ny*40+nx;
        if(nx<0||nx>=40||ny<0||ny>=56||seen.has(next)||!poses.data[((row*56+ny)*poses.width+column*40+nx)*4+3])continue;
        seen.add(next);queue.push([nx,ny]);
      }
    }
    components.push(points);
  }
  components.sort((a,b)=>b.length-a.length);
  for(const fragment of components.slice(1))for(const at of fragment){
    const x=at%40,y=Math.floor(at/40);poses.data.fill(0,((row*56+y)*poses.width+column*40+x)*4,((row*56+y)*poses.width+column*40+x)*4+4);
  }
}
const output='assets/game/fishing/poses.png';fs.writeFileSync(output,PNG.sync.write(poses));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
fs.writeFileSync('docs/FISHING-V15-GENERATION.json',JSON.stringify({
  generator:'image_gen.imagegen',source:path.basename(sourcePath),sourceSha256:hash(sourcePath),
  packer:'scripts/prepare-fishing-v15.mjs',path:output,sha256:hash(output),size:[160,168],frame:[40,56],
  actorCanvas:[40,64],bodyOffsetY:6,
  note:'Repacks the original generated full bodies, retaining shoulders and complete arms, rejecting disconnected neighboring fragments. Native personalized faces and hair remain unchanged.'
},null,2)+'\n');
console.log('Repacked 12 complete connected fishing bodies.');
