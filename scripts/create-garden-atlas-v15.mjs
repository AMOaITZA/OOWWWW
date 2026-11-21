// New pixel artwork, authored in the game's native palette. No photographs or
// existing character pixels are modified by this resource builder.
import {writeFileSync,mkdirSync} from 'node:fs';
import {PNG} from 'pngjs';
const out=new PNG({width:96,height:128});
function dot(x,y,color){if(x<0||y<0||x>=96||y>=128)return;const i=(y*96+x)*4;const rgb=color.match(/\w\w/g).map(h=>parseInt(h,16));out.data.set([...rgb,255],i);}
function rect(x,y,w,h,color){for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)dot(px,py,color);}
const greens=['596D42','779150','A2AF69'],colors=[['B26A83','E1A0AD','F3CCD0'],['77688E','A696B7','D1C4DB'],['AA8344','DEB35D','F5D68B']];
function leaf(x,y,sign=1){rect(x,y,sign>0?5:4,2,greens[0]);rect(x+(sign>0?1:-1),y-1,3,2,greens[1]);dot(x+(sign>0?3:0),y-1,greens[2]);}
function bloom(x,y,species){
  const [dark,base,light]=colors[species];
  if(species===1){
    rect(x-1,y-7,3,11,dark);for(let i=0;i<4;i++){rect(x-3+(i%2),y-6+i*3,5,2,base);dot(x-2+(i%2),y-6+i*3,light);}
  }else{
    rect(x-2,y-5,5,10,dark);rect(x-5,y-2,11,5,dark);rect(x-3,y-4,7,8,base);rect(x-4,y-3,9,7,base);
    rect(x-3,y-3,3,2,light);rect(x+2,y,2,3,light);rect(x-1,y-1,3,3,species===2?'8C6340':'E7BE69');dot(x,y,'F9DF9C');
  }
}
for(let species=0;species<3;species++){
  const ox=species*32;
  for(let stage=0;stage<3;stage++){
    const oy=stage*32,top=stage===0?19:stage===1?11:10;
    rect(ox+15,oy+top,2,29-top,greens[0]);rect(ox+16,oy+top,1,28-top,greens[1]);
    leaf(ox+10,oy+22,-1);leaf(ox+17,oy+18,1);
    if(stage===0){rect(ox+14,oy+17,4,3,greens[1]);dot(ox+16,oy+16,greens[2]);}
    if(stage===1){rect(ox+14,oy+8,4,5,colors[species][0]);rect(ox+15,oy+8,3,3,colors[species][1]);dot(ox+16,oy+7,colors[species][2]);}
    if(stage===2){bloom(ox+16,oy+10,species);if(species!==1){rect(ox+8,oy+15,1,11,greens[0]);bloom(ox+8,oy+15,species);}}
  }
  const oy=96;
  rect(ox+14,oy+10,1,12,greens[0]);rect(ox+20,oy+9,1,14,greens[0]);rect(ox+9,oy+13,1,11,greens[0]);
  leaf(ox+15,oy+16,1);leaf(ox+7,oy+19,-1);
  bloom(ox+10,oy+11,species);bloom(ox+21,oy+9,species);bloom(ox+16,oy+6,species);
  rect(ox+9,oy+22,15,2,'BFA07A');rect(ox+10,oy+24,13,6,'8A8C78');rect(ox+11,oy+23,11,6,'D1D0B1');rect(ox+12,oy+24,3,4,'EEE6C8');rect(ox+12,oy+30,9,1,'8B9278');
}
mkdirSync('assets/game/garden',{recursive:true});writeFileSync('assets/game/garden/flowers.png',PNG.sync.write(out));
