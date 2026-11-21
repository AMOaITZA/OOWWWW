// Native nearest-neighbour packing and bounded palette of generated kitchen art.
import fs from 'node:fs';
import {PNG} from 'pngjs';
const source=process.argv[2];if(!source)throw new Error('Provide generated kitchen image.');
const input=PNG.sync.read(fs.readFileSync(source));
function quantize(png,limit){
 const histogram=new Map();for(let i=0;i<png.data.length;i+=4){if(!png.data[i+3])continue;const rgb=[...png.data.subarray(i,i+3)],key=rgb.join(',');const e=histogram.get(key);if(e)e.count++;else histogram.set(key,{rgb,count:1});}
 const box=entries=>{const min=[255,255,255],max=[0,0,0];let weight=0;for(const e of entries){weight+=e.count;for(let c=0;c<3;c++){min[c]=Math.min(min[c],e.rgb[c]);max[c]=Math.max(max[c],e.rgb[c]);}}const ranges=max.map((n,c)=>n-min[c]);return {entries,weight,ranges,score:Math.max(...ranges)*Math.sqrt(weight)};};
 const boxes=[box([...histogram.values()])];while(boxes.length<limit){boxes.sort((a,b)=>b.score-a.score);const b=boxes.shift();if(b.entries.length<2){boxes.push(b);break;}const c=b.ranges.indexOf(Math.max(...b.ranges));b.entries.sort((a,b)=>a.rgb[c]-b.rgb[c]);let n=0,k=1;for(let i=0;i<b.entries.length-1;i++){n+=b.entries[i].count;k=i+1;if(n>=b.weight/2)break;}boxes.push(box(b.entries.slice(0,k)),box(b.entries.slice(k)));}
 const colors=new Map();for(const b of boxes){const rgb=[0,1,2].map(c=>Math.round(b.entries.reduce((sum,e)=>sum+e.rgb[c]*e.count,0)/b.weight));for(const e of b.entries)colors.set(e.rgb.join(','),rgb);}for(let i=0;i<png.data.length;i+=4)if(png.data[i+3])png.data.set(colors.get([...png.data.subarray(i,i+3)].join(',')),i);
}
const out=new PNG({width:640,height:400});
for(let y=0;y<400;y++)for(let x=0;x<640;x++){
 const si=(Math.min(input.height-1,Math.floor((y+.5)*input.height/400))*input.width+Math.min(input.width-1,Math.floor((x+.5)*input.width/640)))*4,di=(y*640+x)*4;
 for(let c=0;c<3;c++)out.data[di+c]=Math.round(input.data[si+c]/17)*17;out.data[di+3]=255;
}
quantize(out,192);
fs.writeFileSync('assets/game/cooking/kitchen.png',PNG.sync.write(out));
