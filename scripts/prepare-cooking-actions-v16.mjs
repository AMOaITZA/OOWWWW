// Repose the native sleeve, elbow and hand together, one pixel column at a time.
// The same six outfit rows and side-view proportions are used in the dining room.
import {readFileSync,writeFileSync} from 'node:fs';
import {PNG} from 'pngjs';

const base=new URL('../assets/game/home/seated-bodies.png',import.meta.url);
const output=new URL('../assets/game/cooking/actions.png',import.meta.url);
const source=PNG.sync.read(readFileSync(base));
const sheet=new PNG({width:128,height:288});
const elbows=[14,14,16,18,18,17],palms=[23,24,25,26,26,26];
const raises=[0,-3,1,-1];
for(let row=0;row<6;row++){
  for(let pose=0;pose<raises.length;pose++){
    for(let x=0;x<32;x++){
      const progress=Math.max(0,Math.min(1,(x-elbows[row])/(palms[row]-elbows[row])));
      const lift=Math.round(raises[pose]*progress);
      for(let y=22;y<=35;y++){
        const from=((row*48+y)*source.width+x)*4;
        if(!source.data[from+3])continue;
        const dy=y>=31?y+lift:y;
        const to=((row*48+dy)*sheet.width+pose*32+x)*4;
        sheet.data.set(source.data.subarray(from,from+4),to);
      }
    }
  }
}
writeFileSync(output,PNG.sync.write(sheet));
