// Technical packing of generated headless dance bodies. Character heads are
// composed from the personalized source sheets at runtime, never painted here.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';

const source=process.argv[2]||'/workspace/generated_images/exec-aa573502-91a8-43e9-9585-a2e8880a2cf8.png';
const bytes=fs.readFileSync(source),input=PNG.sync.read(bytes);
const output=new PNG({width:320,height:336}),regions=[];
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const skin=[['#8F5E46'],['#AD7759'],['#C58F6D'],['#DDA583'],['#E6B592']].map(([hex])=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
const peach=(r,g,b)=>r>g+24&&g>b+18&&g>95&&b>53&&g/r>.5;
const green=(r,g,b)=>g>150&&g>r+70&&g>b+70;
const nearest=(rgb,palette)=>palette.reduce((best,next)=>{
  const distance=next.reduce((sum,n,c)=>sum+(n-rgb[c])**2,0);
  return distance<best.distance?{rgb:next,distance}:best;
},{rgb:palette[0],distance:Infinity}).rgb;

const rowBounds=[0,184,365,545,716,880,1024];
for(let row=0;row<6;row++)for(let column=0;column<8;column++){
  const x0=Math.round(column*input.width/8),x1=Math.round((column+1)*input.width/8);
  const y0=rowBounds[row],y1=rowBounds[row+1];
  let left=x1,right=-1,top=y1,bottom=-1;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(input.data[(y*input.width+x)*4+3]>=200){
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  let greenLeft=x1,greenRight=-1,greenBottom=-1;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    const at=(y*input.width+x)*4;
    if(input.data[at+3]>=200&&green(...input.data.subarray(at,at+3))){greenLeft=Math.min(greenLeft,x);greenRight=Math.max(greenRight,x);greenBottom=Math.max(greenBottom,y);}
  }
  const neckX=(greenLeft+greenRight)/2,neckY=greenBottom+1;
  if(greenRight<greenLeft||right<left)throw new Error('Cannot locate removable head anchor in row '+row+' frame '+column);
  const scale=Math.min(30/(bottom-neckY+1),37/(right-left+1));
  const native={neckX:20,neckY:24,scale};
  for(let y=0;y<56;y++)for(let x=0;x<40;x++){
    const sx=Math.floor(neckX+(x-20+.5)/scale),sy=Math.floor(neckY+(y-24+.5)/scale);
    if(sx<x0||sx>=x1||sy<y0||sy>=y1)continue;
    const from=(sy*input.width+sx)*4,to=((row*56+y)*320+column*40+x)*4;
    if(input.data[from+3]<200||green(...input.data.subarray(from,from+3)))continue;
    let rgb=[...input.data.subarray(from,from+3)];if(peach(...rgb))rgb=nearest(rgb,skin);
    output.data.set([...rgb,255],to);
  }
  regions.push({row,column,source:{x:left,y:top,width:right-left+1,height:bottom-top+1},neck:{x:neckX,y:neckY},native});
}

// A shared median-cut palette preserves the generated clothing clusters.
const histogram=new Map();
for(let i=0;i<output.data.length;i+=4)if(output.data[i+3]){
  const rgb=[...output.data.subarray(i,i+3)],key=rgb.join(','),entry=histogram.get(key);
  if(entry)entry.count++;else histogram.set(key,{rgb,count:1});
}
function box(entries){
  const min=[255,255,255],max=[0,0,0];let weight=0;
  for(const entry of entries){weight+=entry.count;for(let c=0;c<3;c++){min[c]=Math.min(min[c],entry.rgb[c]);max[c]=Math.max(max[c],entry.rgb[c]);}}
  const range=max.map((n,c)=>n-min[c]);return {entries,weight,range,score:Math.max(...range)*Math.sqrt(weight)};
}
const boxes=[box([...histogram.values()])];
while(boxes.length<128){
  boxes.sort((a,b)=>b.score-a.score);const chosen=boxes.shift();
  if(chosen.entries.length<2){boxes.push(chosen);break;}
  const channel=chosen.range.indexOf(Math.max(...chosen.range));chosen.entries.sort((a,b)=>a.rgb[channel]-b.rgb[channel]);
  let count=0,split=1;
  for(let i=0;i<chosen.entries.length-1;i++){count+=chosen.entries[i].count;split=i+1;if(count>=chosen.weight/2)break;}
  boxes.push(box(chosen.entries.slice(0,split)),box(chosen.entries.slice(split)));
}
const mapping=new Map();
for(const b of boxes){
  const rgb=[0,1,2].map(c=>Math.round(b.entries.reduce((sum,e)=>sum+e.rgb[c]*e.count,0)/b.weight));
  for(const e of b.entries)mapping.set(e.rgb.join(','),rgb);
}
for(let i=0;i<output.data.length;i+=4)if(output.data[i+3])output.data.set(mapping.get([...output.data.subarray(i,i+3)].join(',')),i);
fs.mkdirSync('assets/game/dance',{recursive:true});
const png=PNG.sync.write(output),destination='assets/game/dance/bodies.png';fs.writeFileSync(destination,png);
const provenance={generator:'image_gen.imagegen',source:path.basename(source),sourceSize:[input.width,input.height],sourceSha256:hash(bytes),
  packer:'scripts/prepare-dance-v13.mjs',path:destination,size:[320,336],cell:[40,56],frames:8,rows:['leo-principal','leo-alternativo','leo-boda','itza-principal','itza-alternativo','itza-boda'],
  poses:['partner handhold','open side step','crossed step and raised hand','underarm turn','back twirl','lifted knee finish','sweeping side step','return handhold'],
  priorSources:['exec-c6456618-3907-4bf1-affd-cc82b46e066a.png','exec-0de569b2-ccdd-419d-9b95-0b903ab6157e.png'],
  note:'Original generated modular dance bodies, refined twice with image_gen so hands rise around the full-size head area. Green studio placeholder heads are removed during technical pixel-grid packing. Neck anchors, skin palette matching, binary alpha and shared 128-color palette preserve the drawn limb poses. Personalized heads, hair and eyewear are supplied by the normal renderer.',sha256:hash(png),regions};
fs.writeFileSync('docs/DANCE-V13-GENERATION.json',JSON.stringify(provenance,null,2)+'\n');
console.log(JSON.stringify({destination,regions},null,2));
