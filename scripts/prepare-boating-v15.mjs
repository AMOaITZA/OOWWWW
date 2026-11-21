// Technical nearest-neighbour packing of the generated archipelago and hulls.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const [mapFile,boatFile]=process.argv.slice(2);
if(!mapFile||!boatFile)throw new Error('Provide generated map and transparent boat atlas.');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function quantize(png,limit){
 const histogram=new Map();for(let i=0;i<png.data.length;i+=4){if(!png.data[i+3])continue;const rgb=[...png.data.subarray(i,i+3)],key=rgb.join(',');const e=histogram.get(key);if(e)e.count++;else histogram.set(key,{rgb,count:1});}
 const box=entries=>{const min=[255,255,255],max=[0,0,0];let weight=0;for(const e of entries){weight+=e.count;for(let c=0;c<3;c++){min[c]=Math.min(min[c],e.rgb[c]);max[c]=Math.max(max[c],e.rgb[c]);}}const ranges=max.map((n,c)=>n-min[c]);return {entries,weight,ranges,score:Math.max(...ranges)*Math.sqrt(weight)};};
 const boxes=[box([...histogram.values()])];while(boxes.length<limit){boxes.sort((a,b)=>b.score-a.score);const b=boxes.shift();if(b.entries.length<2){boxes.push(b);break;}const c=b.ranges.indexOf(Math.max(...b.ranges));b.entries.sort((a,b)=>a.rgb[c]-b.rgb[c]);let n=0,k=1;for(let i=0;i<b.entries.length-1;i++){n+=b.entries[i].count;k=i+1;if(n>=b.weight/2)break;}boxes.push(box(b.entries.slice(0,k)),box(b.entries.slice(k)));}
 const colors=new Map();for(const b of boxes){const rgb=[0,1,2].map(c=>Math.round(b.entries.reduce((sum,e)=>sum+e.rgb[c]*e.count,0)/b.weight));for(const e of b.entries)colors.set(e.rgb.join(','),rgb);}for(let i=0;i<png.data.length;i+=4)if(png.data[i+3])png.data.set(colors.get([...png.data.subarray(i,i+3)].join(',')),i);
}
const mapSource=PNG.sync.read(fs.readFileSync(mapFile)),map=new PNG({width:768,height:512});
for(let y=0;y<512;y++)for(let x=0;x<768;x++){
 const sx=Math.floor((x+.5)*mapSource.width/768),sy=Math.floor((y+.5)*mapSource.height/512),from=(sy*mapSource.width+sx)*4;
 map.data.set([...mapSource.data.subarray(from,from+3),255],(y*768+x)*4);
}
quantize(map,192);
const boatSource=PNG.sync.read(fs.readFileSync(boatFile)),boats=new PNG({width:384,height:128}),regions=[];
for(let cell=0;cell<3;cell++){
 let left=Infinity,top=Infinity,right=-1,bottom=-1;
 for(let y=0;y<boatSource.height;y++)for(let x=Math.floor(cell*boatSource.width/3);x<Math.floor((cell+1)*boatSource.width/3);x++)if(boatSource.data[(y*boatSource.width+x)*4+3]>=180){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 const width=right-left+1,height=bottom-top+1,scale=118/Math.max(width,height),w=Math.round(width*scale),h=Math.round(height*scale),ox=Math.floor((128-w)/2),oy=Math.floor((128-h)/2);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const from=((top+Math.floor((y+.5)*height/h))*boatSource.width+left+Math.floor((x+.5)*width/w))*4,to=((oy+y)*boats.width+cell*128+ox+x)*4;
  if(boatSource.data[from+3]>=180)boats.data.set([...boatSource.data.subarray(from,from+3),255],to);
 }
 regions.push({cell,x:ox,y:oy,width:w,height:h});
}
quantize(boats,128);fs.mkdirSync('assets/game/boating',{recursive:true});
fs.writeFileSync('assets/game/boating/archipelago.png',PNG.sync.write(map));fs.writeFileSync('assets/game/boating/boats.png',PNG.sync.write(boats));
fs.writeFileSync('docs/BOATING-V15-GENERATION.json',JSON.stringify({generator:'image_gen.imagegen',packer:'scripts/prepare-boating-v15.mjs',resources:[['assets/game/boating/archipelago.png',mapFile],['assets/game/boating/boats.png',boatFile]].map(([path,source])=>({path,sha256:hash(path),sourceSha256:hash(source)})),regions},null,2)+'\n');
console.log('Packed native archipelago 768×512 and hulls 384×128.');
