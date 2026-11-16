// Production packing of generated V4 images. No original personal content is modified.
import fs from 'node:fs';
import {dirname,basename} from 'node:path';
import crypto from 'node:crypto';
import pngjs from 'pngjs';
const {PNG}=pngjs,config=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const pngOptions={deflateLevel:9,deflateStrategy:0,filterType:0},threshold=200;
const skin=[[199,135,104],[146,103,89],[211,178,160]],records=[];
const read=path=>PNG.sync.read(fs.readFileSync(path));
const hash=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
function bounds(p,l,t,w,h){let x0=l+w,y0=t+h,x1=l,y1=t;for(let y=t;y<t+h;y++)for(let x=l;x<l+w;x++)if(p.data[(y*p.width+x)*4+3]>=threshold){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);}if(x1<=x0||y1<=y0)throw Error('Empty cell');return {x:x0,y:y0,w:x1-x0,h:y1-y0};}
function sample(src,out,b,dx,dy,w,h){for(let y=0;y<h;y++)for(let x=0;x<w;x++){const sx=b.x+Math.min(b.w-1,Math.floor((x+.5)*b.w/w)),sy=b.y+Math.min(b.h-1,Math.floor((y+.5)*b.h/h));out.data.set(src.data.subarray((sy*src.width+sx)*4,(sy*src.width+sx)*4+4),((dy+y)*out.width+dx+x)*4);}}
function quantize(images,max,protectedColors=[],remapSkin=false){
 const hist=new Map();
 for(const out of images)for(let i=0;i<out.data.length;i+=4){
  if(out.data[i+3]<threshold){out.data.fill(0,i,i+4);continue;}out.data[i+3]=255;
  let rgb=[...out.data.subarray(i,i+3)];const [r,g,b]=rgb;
  if(remapSkin&&r>140&&r<250&&g>70&&b>40&&r-g>25&&g-b>12&&r-g>=1.35*(g-b))rgb=r<180?skin[1]:g/r>.73?skin[2]:skin[0];
  else rgb=rgb.map(v=>Math.min(255,Math.round(v/8)*8));
  out.data.set(rgb,i);const k=rgb.join(',');hist.set(k,(hist.get(k)||0)+1);
 }
 const protectedKeys=new Set(protectedColors.map(c=>c.join(',')));
 const palette=[...protectedColors,...[...hist].sort((a,b)=>b[1]-a[1]).filter(([k])=>!protectedKeys.has(k)).map(([k])=>k.split(',').map(Number))].slice(0,max);
 const lut=new Map();for(const key of hist.keys()){const c=key.split(',').map(Number);let best=palette[0],distance=Infinity;for(const p of palette){const d=p.reduce((s,v,j)=>s+(v-c[j])**2,0);if(d<distance){best=p;distance=d;}}lut.set(key,best);}
 for(const out of images)for(let i=0;i<out.data.length;i+=4)if(out.data[i+3])out.data.set(lut.get([...out.data.subarray(i,i+3)].join(',')),i);
}
function save(source,path,out,contract){const previous=fs.existsSync(path)?hash(path):null;fs.mkdirSync(dirname(path),{recursive:true});fs.writeFileSync(path,PNG.sync.write(out,pngOptions));records.push({path,size:[out.width,out.height],source:basename(source),sourceSha256:hash(source),sha256:hash(path),replacesSha256:previous,...contract});}
function grid(source,cols,rows,fw,fh,maxW,maxH,bottomMargin){const src=read(source),out=new PNG({width:cols*fw,height:rows*fh}),boxes=[];for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x=Math.round(col*src.width/cols),y=Math.round(row*src.height/rows);boxes.push(bounds(src,x,y,Math.round((col+1)*src.width/cols)-x,Math.round((row+1)*src.height/rows)-y));}const scale=Math.min(maxW/Math.max(...boxes.map(b=>b.w)),maxH/Math.max(...boxes.map(b=>b.h)));boxes.forEach((b,i)=>{const w=Math.round(b.w*scale),h=Math.round(b.h*scale);sample(src,out,b,i%cols*fw+Math.floor((fw-w)/2),Math.floor(i/cols)*fh+fh-bottomMargin-h,w,h);});return out;}
for(const who of ['leo','itza']){
 const source=config[who+'Main'],out=grid(source,6,3,32,48,29,44,1);quantize([out],128,skin,true);save(source,'assets/game/characters/'+who+'/look-01.png',out,{frames:18});
 const sittingSource=config[who+'Seated'],atlas=grid(sittingSource,6,1,32,48,29,44,1);quantize([atlas],128,skin,true);
 for(const [index,look] of ['principal','alternativo','boda'].entries()){
  const out=new PNG({width:64,height:48});for(let y=0;y<48;y++)out.data.set(atlas.data.subarray((y*192+index*64)*4,(y*192+index*64+64)*4),y*64*4);
  save(sittingSource,'assets/game/moments/seated/'+who+'-'+look+'.png',out,{frames:2});
 }
}
const buildingSource=config.architecture,buildingAtlas=grid(buildingSource,5,2,160,128,144,112,8);
quantize([buildingAtlas],128,[[240,216,176],[208,152,160],[112,144,112],[152,96,72],[224,184,112],[120,152,160]]);
for(const [index,id] of ['inicio','carta','galeria','razones','playlist','recuerdos','contador','lugares','final','armario'].entries()){
 const out=new PNG({width:160,height:128}),sx=index%5*160,sy=Math.floor(index/5)*128;
 for(let y=0;y<128;y++)out.data.set(buildingAtlas.data.subarray(((sy+y)*800+sx)*4,((sy+y)*800+sx+160)*4),y*160*4);
 save(buildingSource,'assets/game/architecture/'+id+'.png',out,{frames:1});
}
const benchSource=config.bench,bs=read(benchSource),b=bounds(bs,0,0,bs.width,bs.height),bench=new PNG({width:56,height:32}),scale=Math.min(52/b.w,28/b.h),bw=Math.round(b.w*scale),bh=Math.round(b.h*scale);
sample(bs,bench,b,Math.floor((56-bw)/2),32-2-bh,bw,bh);quantize([bench],48);save(benchSource,'assets/game/moments/bench-seat-v4.png',bench,{frames:1});
const terrainSource=config.ground,gs=read(terrainSource),groundSmall=new PNG({width:960,height:640});sample(gs,groundSmall,{x:0,y:0,w:gs.width,h:gs.height},0,0,960,640);
quantize([groundSmall],64,[[232,168,168],[248,216,184],[248,232,200],[136,168,104],[112,144,88],[192,200,112]]);
const ground=new PNG({width:1920,height:1280});sample(groundSmall,ground,{x:0,y:0,w:960,h:640},0,0,1920,1280);save(terrainSource,'assets/game/world/ground-v4.png',ground,{opaque:true,pixelGrid:2});
fs.writeFileSync('docs/WORLD-V4-GENERATION.json',JSON.stringify({generator:'image_gen.imagegen',packer:'scripts/prepare-world-v4.mjs',assets:records},null,2)+'\n');console.log(records.map(r=>({path:r.path,size:r.size})));
