// Technical packing of the generated no-glasses eye artwork. Source stays intact.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const source=process.argv[2];
if(!source)throw Error('Provide the generated eight-head source PNG');
const src=PNG.sync.read(fs.readFileSync(source));
const output=new PNG({width:72,height:16});
// Sample the actual natural eyes separately. Cropping a whole face band would
// also retain head-hair at its outer edges, which could resemble frame arms.
const rectangles=[
  [[149,232,60,53],[258,232,62,53]],[[593,244,60,29],[702,244,62,29]],
  [[1173,216,64,62]],[[1618,244,65,25]],
  [[147,697,60,53],[260,697,62,53]],[[591,709,60,27],[704,709,62,27]],
  [[1178,697,65,57]],[[1622,709,65,27]]
];
const skin=[[199,135,104],[146,103,89],[211,178,160]];
for(const [index,eyes] of rectangles.entries()){
  const side=index%4>=2,width=side?8:18,height=6;
  const dx=index%4*18+(side?5:0),dy=Math.floor(index/4)*8+1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)output.data.set([...skin[0],255],((dy+y)*output.width+dx+x)*4);
  for(const [eye,[sx,sy,sw,sh]] of eyes.entries()){
   const eyeHeight=index%4%2===1?2:4,eyeX=side?2:3+eye*8,eyeY=index%4%2===1?2:1;
   for(let y=0;y<eyeHeight;y++)for(let x=0;x<4;x++){
    const i=(Math.min(src.height-1,sy+Math.floor((y+.5)*sh/eyeHeight))*src.width+
      Math.min(src.width-1,sx+Math.floor((x+.5)*sw/4)))*4;
    const [r,g,b]=src.data.subarray(i,i+3);let color;
    if(Math.max(r,g,b)<100)color=[30,24,27];
    else if(r>210&&g>210&&b>190)color=[249,237,214];
    else color=skin.reduce((best,c)=>c.reduce((v,n,j)=>v+(n-[r,g,b][j])**2,0)<best.distance?
      {color:c,distance:c.reduce((v,n,j)=>v+(n-[r,g,b][j])**2,0)}:best,{color:skin[0],distance:Infinity}).color;
    output.data.set([...color,255],((dy+eyeY+y)*output.width+dx+eyeX+x)*4);
   }
  }
}
const dest='assets/game/appearance/eyes-without-glasses.png';
fs.mkdirSync('assets/game/appearance',{recursive:true});
fs.writeFileSync(dest,PNG.sync.write(output,{filterType:0,deflateLevel:9,deflateStrategy:0}));
const hash=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
fs.writeFileSync('docs/EYES-V6-GENERATION.json',JSON.stringify({generator:'image_gen.imagegen',source:source.split('/').at(-1),
  sourceSha256:hash(source),packer:'scripts/prepare-eyes-v6.mjs',path:dest,size:[72,16],sha256:hash(dest),
  note:'Eight eye patches from generated heads: Itza and Leo, front/profile, open/blink. Original character sheets remain intact.'},null,2)+'\n');
console.log(dest);
