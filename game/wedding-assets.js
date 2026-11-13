import manifest from './data/assets.json';

// Los assets definitivos se encuentran en assets/game/wedding/*.png.
// Si todavía no se han copiado, usamos sprites generados a partir del
// aspecto actual de los personajes y dibujos de respaldo, sin bloquear el juego.
const cache=new Map();
let loading=null;
export const weddingImage=key=>cache.get(key)||null;
const px=(ctx,x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
const canvas=(w,h)=>{
  const c=document.createElement('canvas');c.width=w;c.height=h;
  c.getContext('2d').imageSmoothingEnabled=false;
  return c;
};
async function image(url){
  return new Promise(resolve=>{
    const img=new Image();img.decoding='async';
    img.onload=()=>resolve(img);
    img.onerror=()=>resolve(null);
    img.src=url;
  });
}
function flower(ctx,x,y,r=4){
  px(ctx,x-r,y-1,2*r,2,'#669274');
  for(const [dx,dy] of [[-r,0],[r,0],[0,-r],[0,r]]){
    px(ctx,x+dx-2,y+dy-2,5,5,'#df99a7');
    px(ctx,x+dx,y+dy,2,2,'#fae1c5');
  }
  px(ctx,x-2,y-2,5,5,'#fff0d3');
}
function makeCastle(){
  const c=canvas(264,154),ctx=c.getContext('2d');
  const cream='#f6dbbf',rose='#cf8ca1',dark='#865765',gold='#eec68d';
  // Torreones, ventanas, crestas, flores, puerta y escalera.
  for(const x of [13,211]){
    px(ctx,x,33,40,102,cream);
    px(ctx,x-5,30,50,12,rose);
    px(ctx,x+5,17,30,13,'#f0b0bd');
    px(ctx,x+14,7,12,11,rose);
    px(ctx,x+18,1,4,9,gold);
    px(ctx,x+13,61,14,34,dark);
    px(ctx,x+16,64,8,28,'#ffdf9f');
    px(ctx,x-2,135,45,8,'#b78287');
  }
  px(ctx,37,45,190,91,cream);
  for(let i=0;i<10;i++){px(ctx,40+i*18,36,12,13,'#f7d8be');}
  px(ctx,39,47,187,8,'#b97a8e');
  px(ctx,44,119,178,12,'#e9bda5');
  px(ctx,87,38,91,14,rose);
  px(ctx,106,26,53,13,cream);
  px(ctx,120,10,26,16,rose);
  px(ctx,129,2,8,8,gold);
  for(const x of [72,174]){
    px(ctx,x,64,17,39,dark);
    px(ctx,x+3,67,11,34,'#ffdfae');
    px(ctx,x+8,65,2,35,cream);
    px(ctx,x-3,99,23,5,gold);
  }
  px(ctx,111,67,43,62,dark);px(ctx,116,75,33,54,'#9b6270');
  px(ctx,120,78,25,48,'#f5c78a');px(ctx,131,76,3,50,'#fff2d5');
  px(ctx,105,61,55,8,gold);px(ctx,111,55,43,7,rose);
  px(ctx,111,133,43,6,'#f0cbb8');px(ctx,103,139,59,6,'#d8a7a0');
  px(ctx,98,145,69,5,'#f6d7c8');
  for(const [x,y] of [[58,99],[205,103],[92,55],[170,53],[132,46],[43,126],[221,126]]){
    flower(ctx,x,y,6);flower(ctx,x+8,y+4,3);
    px(ctx,x-4,y+10,5,7,'#6b8c69');
  }
  for(let i=0;i<8;i++){flower(ctx,56+i*21,121,3);}
  return c;
}
function makeArch(){
  const c=canvas(64,86),ctx=c.getContext('2d');
  const cream='#fbe5cb',rose='#d991a3';
  for(const x of [8,49]){
    px(ctx,x,22,7,61,cream);px(ctx,x-3,76,13,8,'#d2a7a7');
  }
  px(ctx,13,13,40,7,cream);px(ctx,19,6,26,10,'#e6bec0');
  px(ctx,10,16,46,5,rose);
  for(let i=0;i<8;i++)flower(ctx,8+i*6,12+Math.abs(3.5-i)*2,4);
  return c;
}
function makeFlower(){
  const c=canvas(32,40),ctx=c.getContext('2d');
  px(ctx,8,24,17,14,'#e6c4b5');px(ctx,5,23,22,5,'#ac7f7e');
  for(let i=0;i<8;i++)flower(ctx,8+(i*19)%19,15+(i*7)%12,4);
  return c;
}
function makeRoof(){
  const c=canvas(280,86),ctx=c.getContext('2d');
  px(ctx,7,61,266,13,'#f7ddcb');
  for(let x=13;x<272;x+=20)px(ctx,x,52,13,14,'#cf91a3');
  for(const x of [15,232]){
    px(ctx,x,33,33,24,'#f7d8c5');px(ctx,x-7,28,47,9,'#d58ea2');
    px(ctx,x+2,17,28,11,'#ebbbc0');px(ctx,x+8,8,16,12,'#d58ea2');
    px(ctx,x+14,1,4,9,'#eec68d');
  }
  px(ctx,125,24,35,41,'#ffe2c5');px(ctx,120,20,45,6,'#d18e9f');
  px(ctx,132,8,22,13,'#f1b4c1');px(ctx,142,1,4,8,'#f1c37d');
  for(let i=0;i<12;i++)flower(ctx,17+i*21,69,3);
  return c;
}
function makeBench(){
  const c=canvas(68,68),ctx=c.getContext('2d');
  px(ctx,8,33,52,13,'#f7d8cb');px(ctx,10,17,48,11,'#b98593');
  px(ctx,11,29,46,8,'#f3c6b1');
  px(ctx,13,42,6,20,'#af7882');px(ctx,48,42,6,20,'#af7882');
  flower(ctx,8,25,4);flower(ctx,59,26,4);flower(ctx,32,13,4);
  return c;
}
function makeEffect(kind){
  const c=canvas(96,16),ctx=c.getContext('2d');
  for(let f=0;f<6;f++){
    const x=f*16+8,y=8-(f%3);
    if(kind==='hearts'){
      px(ctx,x-4,y-3,3,3,'#eb819c');px(ctx,x+1,y-3,3,3,'#eb819c');
      px(ctx,x-5,y,10,4,'#f4a0b5');
      px(ctx,x-3,y+4,6,2,'#e68a9f');px(ctx,x-1,y+6,2,2,'#c77890');
    }else{
      px(ctx,x-1,y-5,2,10,'#ffe8ac');px(ctx,x-5,y-1,10,2,'#fff0bd');
      px(ctx,x-2,y-2,4,4,'#fff9dc');
    }
  }
  return c;
}
function makeWalk(source,who){
  const c=canvas(192,144),ctx=c.getContext('2d');
  for(let row=0;row<3;row++)for(let col=0;col<6;col++){
    const x=col*32,y=row*48;
    if(source)ctx.drawImage(source,x,y,32,48,x,y,32,48);
    else {
      px(ctx,x+8,y+4,16,16,'#221f29');px(ctx,x+10,y+12,12,9,'#b58271');
      px(ctx,x+8,y+22,16,20,'#29242f');
    }
    // Añadimos la ropa formal a la silueta existente.
    if(who==='leo'){
      px(ctx,x+8,y+25,16,15,'#252127');px(ctx,x+13,y+25,6,10,'#fff2d7');
      px(ctx,x+15,y+25,2,12,'#cba16f');px(ctx,x+7,y+36,8,7,'#252127');
      px(ctx,x+17,y+36,8,7,'#252127');px(ctx,x+21,y+26,2,3,'#bf5665');
    }else{
      px(ctx,x+8,y+25,16,8,'#fff0d5');
      px(ctx,x+6,y+32,20,9,'#ffe1c2');
      px(ctx,x+4,y+38,24,6,'#fff0d5');
      px(ctx,x+13,y+26,7,3,'#eac4b3');
    }
  }
  return c;
}
function makePair(sheetLeo,sheetItza,kind){
  const frames={idle:2,vows:4,kiss:3,hug:2,celebrate:3,bench:2}[kind];
  const c=canvas(frames*64,48),ctx=c.getContext('2d');
  for(let f=0;f<frames;f++){
    const at=f*64;
    const leo=kind==='vows'&&f>0?16:kind==='kiss'?15+(f===0?0:3):kind==='hug'?15:kind==='celebrate'?16:14;
    const itza=kind==='vows'&&f>0?31:kind==='kiss'?28-(f===0?0:2):kind==='hug'?27:kind==='celebrate'?29:30;
    const bounce=kind==='celebrate'&&f===1?3:0;
    ctx.drawImage(sheetLeo,0,0,32,48,at+leo-10,-bounce,32,48);
    ctx.drawImage(sheetItza,0,0,32,48,at+itza-10,-bounce,32,48);
    if(kind==='vows'||kind==='kiss')px(ctx,at+29,30,6,3,'#d5a17f');
    if(kind==='hug')px(ctx,at+28,29,10,4,'#cb9882');
    if(kind==='celebrate'){
      flower(ctx,at+14+f*7,8+f%2,2);flower(ctx,at+46-f*6,9+f,2);
    }
    if(kind==='bench'){
      px(ctx,at+4,33,56,6,'#9d6776');
      px(ctx,at+6,39,7,7,'#a8797c');px(ctx,at+51,39,7,7,'#a8797c');
    }
  }
  return c;
}
async function load(){
  const [leo,itza]=await Promise.all([
    image('/assets/game/characters/leo/look-01.png'),
    image('/assets/game/characters/itza/look-01.png')
  ]);
  const leoWedding=makeWalk(leo,'leo'),itzaWedding=makeWalk(itza,'itza');
  const fallback={
    'leo-walk':leoWedding,'itza-walk':itzaWedding,
    castle:makeCastle(),roof:makeRoof(),arch:makeArch(),flower:makeFlower(),
    bench:makeBench(),emblem:makeEffect('hearts'),
    idle:makePair(leoWedding,itzaWedding,'idle'),
    vows:makePair(leoWedding,itzaWedding,'vows'),
    kiss:makePair(leoWedding,itzaWedding,'kiss'),
    hug:makePair(leoWedding,itzaWedding,'hug'),
    celebrate:makePair(leoWedding,itzaWedding,'celebrate'),
    'wedding-bench':makePair(leoWedding,itzaWedding,'bench'),
    hearts:makeEffect('hearts'),sparkles:makeEffect('sparkles')
  };
  for(const [name,resource] of Object.entries(fallback))cache.set(name,resource);
  // Los diecinueve gráficos definitivos se empaquetan en una hoja indexada
  // de 720×342. Sus rectángulos se recortan sin suavizado y luego se exponen
  // con las mismas claves que usaban los respaldos: no rompe las cinemáticas.
  const atlas=await image(manifest.wedding?.atlas||'/assets/game/wedding/atlas.png');
  if(atlas&&atlas.naturalWidth===720&&atlas.naturalHeight===342){
    const regions={
      castle:[0,0,264,154],'itza-walk':[264,0,192,144],
      'leo-walk':[456,0,192,144],roof:[0,154,280,86],
      arch:[280,154,64,86],bench:[344,154,68,68],
      vows:[412,154,256,48],idle:[0,240,128,48],
      kiss:[128,240,192,48],hug:[320,240,128,48],
      'wedding-bench':[448,240,128,48],
      flower:[576,240,32,40],emblem:[608,240,24,24],
      vines:[632,240,40,40],petalPath:[672,240,48,48],
      celebrate:[0,288,192,48],awning:[192,288,56,38],
      hearts:[248,288,96,16],sparkles:[344,288,96,16]
    };
    for(const [name,[sx,sy,w,h]] of Object.entries(regions)){
      const c=canvas(w,h),ctx=c.getContext('2d');
      ctx.drawImage(atlas,sx,sy,w,h,0,0,w,h);
      cache.set(name,c);
    }
    return;
  }
  // Si los PNG definitivos del paquete ya están en el repositorio, reemplazan
  // los respaldos. Una imagen ausente nunca impide abrir el juego.
  const urls={
    'leo-walk':'/assets/game/wedding/leo-look-wedding.png',
    'itza-walk':'/assets/game/wedding/itza-look-wedding.png',
    castle:'/assets/game/wedding/castle.png',
    roof:'/assets/game/wedding/roof.png',
    arch:'/assets/game/wedding/arch.png',
    flower:'/assets/game/wedding/flower.png',
    bench:'/assets/game/wedding/bench.png',
    emblem:'/assets/game/wedding/emblem.png',
    idle:'/assets/game/wedding/pair-wedding-idle.png',
    vows:'/assets/game/wedding/pair-wedding-vows.png',
    kiss:'/assets/game/wedding/pair-wedding-kiss.png',
    hug:'/assets/game/wedding/pair-wedding-hug.png',
    celebrate:'/assets/game/wedding/pair-wedding-celebrate.png',
    hearts:'/assets/game/wedding/hearts.png',
    sparkles:'/assets/game/wedding/sparkles.png',
    'wedding-bench':'/assets/game/wedding/pair-wedding-bench.png'
  };
  // No efectuamos solicitudes para recursos que no se han proporcionado aún:
  // el mapa y las animaciones originales permanecen funcionales.
  // El catálogo de archivos definitivos solo se intenta cargar cuando
  // existe la primera imagen PNG y el servidor declara el MIME correcto.
  // Así evitamos decenas de peticiones 404 en una instalación sin el paquete.
  let installed=false;
  try{
    const response=await fetch(urls.castle,{method:'HEAD'});
    installed=response.ok&&/image\/png/i.test(response.headers.get('content-type')||'');
  }catch{}
  if(installed)await Promise.all(Object.entries(urls).map(async([key,url])=>{
    const im=await image(url);if(im)cache.set(key,im);
  }));
}
export function loadWeddingImages(){
  if(!loading)loading=load().catch(error=>{console.warn('[OOWWWW] Boda: recursos de respaldo',error);});
  return loading;
}
