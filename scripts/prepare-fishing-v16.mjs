// Pack the generated fishing poses around the native side-profile neck.
// All coordinates below are relative to a 362-by-362 source cell.
import {readFileSync,writeFileSync} from 'node:fs';
import {PNG} from 'pngjs';
const source=PNG.sync.read(readFileSync(process.argv[2]));
if(source.width!==1448||source.height!==1086)throw new Error('Expected the four-column by three-row fishing illustration.');
const native=PNG.sync.read(readFileSync('assets/game/fishing/poses.png'));
const colors=new Map();
for(let i=0;i<native.data.length;i+=4){
  if(!native.data[i+3])continue;
  const color=[...native.data.subarray(i,i+3)];
  colors.set(color.join(','),color);
}
const palette=[...colors.values()];
function closest(pixel){
  let best,smallest=Infinity;
  for(const color of palette){
    const distance=color.reduce((sum,value,index)=>sum+(value-pixel[index])**2,0);
    if(distance<smallest){smallest=distance;best=color;}
  }
  return best;
}
const cell=362,width=56,height=64,atlas=new PNG({width:4*width,height:3*height});
// A thin gap separates each guide ponytail from the shoulder. Remove it
// down to the tip before replacing the guide head with the player's head.
const poses=[
  {neckX:219,neckY:179,hairEdge:164,hairBottom:220},
  {neckX:215,neckY:179,hairEdge:162,hairBottom:218},
  {neckX:194,neckY:191,hairEdge:145,hairBottom:231},
  {neckX:183,neckY:178,hairEdge:129,hairBottom:219},
];
for(let row=0;row<3;row++)for(const [col,pose] of poses.entries()){
  const scale=34/(353-pose.neckY);
  for(let y=27;y<=61;y++)for(let x=0;x<width;x++){
    const sx=Math.round(pose.neckX+(x-24)/scale),sy=Math.round(pose.neckY+(y-27)/scale);
    if(sx<0||sx>=cell||sy<pose.neckY||sy>=cell||sy<pose.hairBottom&&sx<pose.hairEdge)continue;
    const index=((row*cell+sy)*source.width+col*cell+sx)*4;
    if(source.data[index+3]<160)continue;
    const target=((row*height+y)*atlas.width+col*width+x)*4;
    atlas.data.set([...closest(source.data.subarray(index,index+3)),255],target);
  }
}
writeFileSync('assets/game/fishing/poses-v16.png',PNG.sync.write(atlas));
