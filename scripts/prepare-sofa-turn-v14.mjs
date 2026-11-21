// Technical packing only: a local generated furniture edit is sampled onto
// the room's native grid. The original room PNG remains byte-for-byte intact.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {PNG} from 'pngjs';
const source=process.argv[2];
if(!source)throw new Error('Provide the image_gen edit with the sofa facing the TV.');
const basePath='assets/game/home/interior.png';
const base=PNG.sync.read(fs.readFileSync(basePath)),edited=PNG.sync.read(fs.readFileSync(source));
const box={x:316,y:150,width:124,height:84};
const patch=new PNG({width:box.width,height:box.height});
const palette=[...new Set(Array.from({length:base.width*base.height},(_,i)=>[...base.data.subarray(i*4,i*4+3)].join(',')))].map(key=>key.split(',').map(Number));
const nearest=new Map();
for(let y=0;y<box.height;y++)for(let x=0;x<box.width;x++){
  const sx=Math.min(edited.width-1,Math.floor((box.x+x+.5)*edited.width/base.width));
  const sy=Math.min(edited.height-1,Math.floor((box.y+y+.5)*edited.height/base.height));
  const from=(sy*edited.width+sx)*4,to=(y*box.width+x)*4;
  const rgb=[...edited.data.subarray(from,from+3)],key=rgb.join(',');
  let mapped=nearest.get(key);
  if(!mapped){
    let distance=Infinity;
    for(const color of palette){const next=color.reduce((sum,n,c)=>sum+(n-rgb[c])**2,0);if(next<distance){distance=next;mapped=color;}}
    nearest.set(key,mapped);
  }
  patch.data.set([...mapped,255],to);
}
const output='assets/game/home/sofa-back-patch.png';fs.writeFileSync(output,PNG.sync.write(patch));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const colors=new Set(Array.from({length:patch.width*patch.height},(_,i)=>[...patch.data.subarray(i*4,i*4+3)].join(','))).size;
const provenance={generator:'image_gen.imagegen',source:path.basename(source),sourceSha256:sha(source),
  sourceSize:[edited.width,edited.height],base:basePath,baseSha256:sha(basePath),
  output,sha256:sha(output),nativeSize:[patch.width,patch.height],roomRegion:box,paletteColors:colors,
  packer:'scripts/prepare-sofa-turn-v14.mjs',
  note:'The edited sofa faces upward toward the TV. Its rear upholstered back is on the lower edge. Only this rectangular furniture region is replaced at runtime; the original room and every pixel outside it are preserved. Native nearest-neighbor sampling uses the existing room palette.'};
fs.writeFileSync('docs/SOFA-TURN-V14-GENERATION.json',JSON.stringify(provenance,null,2)+'\n');
console.log(JSON.stringify(provenance,null,2));
