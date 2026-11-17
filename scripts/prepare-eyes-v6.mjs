// Technical packing of the generated no-glasses eye artwork. Source stays intact.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const source=process.argv[2];
if(!source)throw Error('Provide the generated eight-head source PNG');
const src=PNG.sync.read(fs.readFileSync(source));
const output=new PNG({width:72,height:16});
const rectangles=[
  [132,218,202,69],[576,218,202,69],[1156,212,88,75],[1600,212,88,75],
  [135,688,206,70],[579,688,206,70],[1168,688,89,69],[1612,688,89,69]
];
const skin=[[199,135,104],[146,103,89],[211,178,160]];
for(const [index,[sx,sy,sw,sh]] of rectangles.entries()){
  const side=index%4>=2,width=side?8:18,height=6;
  const dx=index%4*18+(side?5:0),dy=Math.floor(index/4)*8+1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(Math.min(src.height-1,sy+Math.floor((y+.5)*sh/height))*src.width+
      Math.min(src.width-1,sx+Math.floor((x+.5)*sw/width)))*4;
    const [r,g,b]=src.data.subarray(i,i+3);let color;
    if(Math.max(r,g,b)<100)color=[30,24,27];
    else if(r>210&&g>210&&b>190)color=[249,237,214];
    else color=skin.reduce((best,c)=>c.reduce((v,n,j)=>v+(n-[r,g,b][j])**2,0)<best.distance?
      {color:c,distance:c.reduce((v,n,j)=>v+(n-[r,g,b][j])**2,0)}:best,{color:skin[0],distance:Infinity}).color;
    output.data.set([...color,255],((dy+y)*output.width+dx+x)*4);
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
