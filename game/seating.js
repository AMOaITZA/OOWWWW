// Seating is made from two independent outfit sprites and one native-sized
// bench. No clothing is baked into a shared couple illustration.
const characterCache=new WeakMap(),benchCache=new WeakMap();
export const BENCH_VISIBLE={x:2,y:2,width:52,height:28};
export const BENCH_SCALE=1;
export const BENCH_WIDTH=52;
export const BENCH_HEIGHT=28;
const defaultFrames=[{x:1,y:3,width:30,height:44},{x:1,y:3,width:30,height:44}];

export function opaqueFrameBounds({data,width,height},frameCount=2){
  const frameWidth=width/frameCount;
  if(!Number.isInteger(frameWidth))throw new Error('La hoja sentada requiere celdas completas');
  return Array.from({length:frameCount},(_,frame)=>{
    let left=frameWidth,top=height,right=-1,bottom=-1;
    for(let y=0;y<height;y++)for(let x=0;x<frameWidth;x++){
      if(data[(y*width+frame*frameWidth+x)*4+3]<128)continue;
      left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
    }
    if(right<left)throw new Error('La hoja sentada contiene un fotograma vacío');
    return {x:left,y:top,width:right-left+1,height:bottom-top+1};
  });
}
function pixelsFor(image){
  if(image.data)return image;
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  if(!width||!height||typeof document==='undefined')return null;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  context.drawImage(image,0,0);return context.getImageData(0,0,width,height);
}
function framesFor(image){
  if(!image||typeof image!=='object')return {frames:defaultFrames,frameWidth:32};
  if(characterCache.has(image))return characterCache.get(image);
  const width=image.naturalWidth||image.width;
  let frames=defaultFrames;
  try{const pixels=pixelsFor(image);if(pixels)frames=opaqueFrameBounds(pixels);}catch{}
  const result={frames,frameWidth:width?width/2:32};characterCache.set(image,result);return result;
}

export function seatedCharacterGeometry(image,frame,x,groundY){
  const {frames,frameWidth}=framesFor(image),index=((frame%frames.length)+frames.length)%frames.length;
  const source=frames[index];
  return {source:{x:index*frameWidth+source.x,y:source.y,width:source.width,height:source.height},
    x:Math.round(x-source.width/2),y:Math.round(groundY-source.height),
    width:source.width,height:source.height,scale:1,
    anchor:{x:Math.round(x),y:Math.round(groundY-source.height+Math.min(10,source.height*.25))}};
}
export function seatedPairGeometry(characters,frame,x,groundY){
  if(!characters?.length||characters.some(character=>!character.image))return null;
  const actors=characters.map(character=>({...character,
    pose:seatedCharacterGeometry(character.image,frame,x+(character.who==='leo'?-13:13),groundY)}));
  const left=Math.min(...actors.map(actor=>actor.pose.x)),top=Math.min(...actors.map(actor=>actor.pose.y));
  const right=Math.max(...actors.map(actor=>actor.pose.x+actor.pose.width));
  const bottom=Math.max(...actors.map(actor=>actor.pose.y+actor.pose.height));
  return {actors,x:left,y:top,width:right-left,height:bottom-top,
    anchor:(actors.find(actor=>actor.who==='leo')||actors[0]).pose.anchor};
}
export function drawSeatedCharacters(ctx,pose){
  if(!pose)return;
  for(const actor of pose.actors){
    const p=actor.pose,s=p.source;
    ctx.drawImage(actor.image,s.x,s.y,s.width,s.height,p.x,p.y,p.width,p.height);
  }
}
function benchSource(image){
  if(!image||typeof image!=='object')return BENCH_VISIBLE;
  if(benchCache.has(image))return benchCache.get(image);
  let source=BENCH_VISIBLE;
  try{const pixels=pixelsFor(image);if(pixels)source=opaqueFrameBounds(pixels,1)[0];}catch{}
  benchCache.set(image,source);return source;
}
export function benchGeometry(x,groundY,image){
  const source=benchSource(image);
  return {x:Math.round(x-source.width/2),y:Math.round(groundY-source.height),width:source.width,height:source.height};
}
export function drawBench(ctx,image,x,groundY){
  const source=benchSource(image),b=benchGeometry(x,groundY,image);
  ctx.drawImage(image,source.x,source.y,source.width,source.height,b.x,b.y,b.width,b.height);
  return b;
}
